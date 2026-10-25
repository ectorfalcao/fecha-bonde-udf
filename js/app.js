import { iniciarDados } from "./dados.js";
import { registrar, iniciar } from "./router.js";
import { telaInicio } from "./inicio.js";
import { telaAmbiente } from "./ambiente.js";
import { telaPendente } from "./pendente.js";
import { el, aviso, linkBotao } from "./componentes.js";

const pend = (titulo, texto, etapa, reqs) => ({ titulo, render: telaPendente({ titulo, texto, etapa, reqs }) });

// Itens da navegação inferior (RNF09: tarefas principais a 1 toque da tela inicial)
const NAV = [
  ["/", "Início", { titulo: "Início", render: telaInicio }],
  ["/buscar", "Buscar", pend("Buscar carona", "Busca por raio, turno e horário, com filtro só para mulheres.", "Etapa 6", "RF06, RN05")],
  ["/oferecer", "Oferecer", pend("Oferecer carona", "Publicação de carona e rotas recorrentes pelo motorista.", "Etapa 6", "RF04, RF05, RN04")],
  ["/caronas", "Caronas", pend("Minhas caronas", "Solicitações, lista de espera e cancelamento.", "Etapa 7", "RF07, RF08, RF09, RN06")],
  ["/perfil", "Perfil", pend("Perfil", "Acesso com e-mail institucional, perfil, veículo e aceite dos termos.", "Etapa 5", "RF01, RF02, RF03, RN01, RN02, RN03")]
];
NAV.forEach(([caminho, , rota]) => registrar(caminho, rota));
registrar("/ambiente", { titulo: "Verificação do ambiente", render: telaAmbiente });
registrar("*", { titulo: "Página não encontrada", render: () => el("div", {}, el("h2", {}, "Página não encontrada"), aviso("erro", "Este endereço não existe no aplicativo."), linkBotao("Voltar ao início", "#/")) });

const nav = document.getElementById("nav-principal");
const lista = el("ul", {}, NAV.map(([caminho, rotulo]) => el("li", {}, el("a", { href: `#${caminho}` }, rotulo))));
nav.append(lista);

iniciarDados();
iniciar(document.getElementById("conteudo"), (caminho) => {
  lista.querySelectorAll("a").forEach((a) =>
    a.getAttribute("href") === `#${caminho}` ? a.setAttribute("aria-current", "page") : a.removeAttribute("aria-current"));
});