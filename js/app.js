import { iniciarDados } from "./dados.js";
import { registrar, iniciar, caminhoBase } from "./router.js";
import { telaInicio } from "./inicio.js";
import { telaAmbiente } from "./ambiente.js";
import { telaAcesso } from "./acesso.js";
import { telaPerfil } from "./perfil.js";
import { telaBuscar } from "./buscar.js";
import { telaOferecer } from "./oferecer.js";
import { telaMinhasCaronas } from "./minhas.js";
import { telaViagemAtiva } from "./viagemAtiva.js";
import { telaChat } from "./chatTela.js";
import { telaPagamento } from "./pagamentoTela.js";
import { telaAvaliacao } from "./avaliacaoTela.js";
import { telaHistorico } from "./historicoTela.js";
import { usuarioAtual, acessoLiberado } from "./sessao.js";
import { listar } from "./dados.js";
import { viagensAtivasDe } from "./viagem.js";
import { naoLidas } from "./notificacoes.js";
import { modoDemo } from "./demo.js";
import { el, estadoVazio, linkBotao, avatar, icone } from "./componentes.js";

// Itens da navegação principal (RNF09: tarefas principais a 1 toque da tela inicial)
const NAV = [
  ["/", "Início", "inicio", { titulo: "Início", render: telaInicio }],
  ["/buscar", "Buscar", "busca", { titulo: "Buscar carona", exigeLogin: true, render: telaBuscar }],
  ["/oferecer", "Oferecer", "oferecer", { titulo: "Oferecer carona", exigeLogin: true, render: telaOferecer }],
  ["/caronas", "Caronas", "carro", { titulo: "Minhas caronas", exigeLogin: true, render: telaMinhasCaronas }],
  ["/perfil", "Perfil", "usuario", { titulo: "Perfil", exigeLogin: true, render: telaPerfil }]
];
NAV.forEach(([caminho, , , rota]) => registrar(caminho, rota));
registrar("/acesso", { titulo: "Acesso", render: telaAcesso });
registrar("/viagem", { titulo: "Viagem em andamento", exigeLogin: true, render: telaViagemAtiva });
registrar("/chat", { titulo: "Chat do grupo", exigeLogin: true, render: telaChat });
registrar("/pagamento", { titulo: "Pagamento", exigeLogin: true, render: telaPagamento });
registrar("/avaliacao", { titulo: "Avaliação da viagem", exigeLogin: true, render: telaAvaliacao });
registrar("/historico", { titulo: "Histórico e extrato", exigeLogin: true, render: telaHistorico });
registrar("/ambiente", { titulo: "Verificação do ambiente", render: telaAmbiente });
registrar("*", { titulo: "Página não encontrada", render: () => el("div", {},
  estadoVazio({ titulo: "Página não encontrada", texto: "Este endereço não existe no aplicativo.", nomeIcone: "pin", acao: linkBotao("Voltar ao início", "#/", "", "inicio") })) });

// Telas internas acendem o item "pai" da navegação
const PAI = { "/acesso": "/perfil", "/viagem": "/caronas", "/chat": "/caronas", "/pagamento": "/caronas", "/avaliacao": "/caronas", "/historico": "/caronas" };

const nav = document.getElementById("nav-principal");
const lista = el("ul", {}, NAV.map(([caminho, rotulo, nomeIcone]) =>
  el("li", {}, el("a", { href: `#${caminho}` }, el("span", { class: "nav-icone" }, icone(nomeIcone, { tamanho: 22 })), el("span", { class: "nav-rotulo" }, rotulo)))));
nav.append(lista);

// Contador de avisos novos no item "Caronas" (RF07 a RF09: notificações simuladas).
// O número é visual; o leitor de tela ouve "Caronas, 2 aviso(s) novo(s)".
const linkCaronas = lista.querySelector('a[href="#/caronas"]');
const atualizarAvisos = () => {
  const u = usuarioAtual(), n = u ? naoLidas(u.id) : 0;
  linkCaronas.querySelector(".contador")?.remove();
  if (n) linkCaronas.append(el("span", { class: "contador", "aria-hidden": "true" }, n > 99 ? "99+" : String(n)));
  n ? linkCaronas.setAttribute("aria-label", `Caronas, ${n} aviso(s) novo(s)`) : linkCaronas.removeAttribute("aria-label");
};
addEventListener("avisos-alterados", atualizarAvisos);

// Área de ações do topo: quem está conectado (leva ao Perfil) ou "Entrar".
// Etapa 10: é aqui que o futuro sino de notificações entra (botaoIcone + contador, em componentes.js).
const acoesTopo = document.getElementById("topo-acoes");
const atualizarTopo = () => {
  const u = usuarioAtual();
  const logado = u && acessoLiberado(u);
  const primeiroNome = (u?.nome || u?.email || "").split(/[\s@]/)[0];
  acoesTopo.replaceChildren(logado
    ? el("a", { class: "usuario-chip", href: "#/perfil", "aria-label": `Seu perfil: ${u.nome || u.email}` }, avatar(u.nome || u.email, "sm"), el("span", { class: "nome" }, primeiroNome))
    : caminhoBase() !== "/acesso" ? linkBotao("Entrar", "#/acesso", "claro", "usuario") : "");
};

// Faixa "viagem em andamento" (Etapa 8.2): em qualquer tela, leva à viagem, onde fica o botão de emergência (RN11).
const faixa = el("div", { class: "faixa-viagem" });
document.querySelector("main").before(faixa);
const atualizarFaixa = () => {
  const u = usuarioAtual();
  const ativas = u && acessoLiberado(u) ? viagensAtivasDe(u.id, listar("caronas"), listar("solicitacoes")) : [];
  const mostrar = ativas.length > 0 && caminhoBase() !== "/viagem";
  faixa.hidden = !mostrar;
  faixa.replaceChildren(...(mostrar ? [el("div", { class: "faixa", role: "status" },
    el("p", {}, el("span", { class: "pulso", "aria-hidden": "true" }), el("span", {}, el("strong", {}, "Viagem em andamento. "), "O botão de emergência fica na tela da viagem.")),
    linkBotao("Abrir viagem e emergência", "#/viagem", "claro", "sirene"))] : []));
};
addEventListener("viagem-alterada", atualizarFaixa);
addEventListener("sessao-alterada", () => { atualizarAvisos(); atualizarFaixa(); atualizarTopo(); });

// Modo demonstração (Etapa 8.1): quando ligado, o cabeçalho avisa em qualquer tela.
const seloDemo = document.querySelector(".selo-demo");
const textoSelo = seloDemo?.textContent ?? "";
const atualizarSelo = () => {
  if (!seloDemo) return;
  seloDemo.textContent = modoDemo() ? "MODO DEMONSTRAÇÃO LIGADO" : textoSelo;
  seloDemo.classList.toggle("ligado", modoDemo());
};
addEventListener("demo-alterado", atualizarSelo);
atualizarSelo();

iniciarDados();
iniciar(document.getElementById("conteudo"), (caminho) => {
  atualizarAvisos();
  atualizarFaixa();
  atualizarTopo();
  lista.querySelectorAll("a").forEach((a) =>
    a.getAttribute("href") === `#${PAI[caminho] ?? caminho}` ? a.setAttribute("aria-current", "page") : a.removeAttribute("aria-current"));
});
