import { iniciarDados } from "./dados.js";
import { registrar, iniciar } from "./router.js";
import { telaInicio } from "./inicio.js";
import { telaAmbiente } from "./ambiente.js";
import { telaPendente } from "./pendente.js";
import { telaAcesso } from "./acesso.js";
import { telaPerfil } from "./perfil.js";
import { telaBuscar } from "./buscar.js";
import { telaOferecer } from "./oferecer.js";
import { el, aviso, linkBotao } from "./componentes.js";

const pend = (titulo, texto, etapa, reqs) => ({ titulo, exigeLogin: true, render: telaPendente({ titulo, texto, etapa, reqs }) });

// Itens da navegação inferior (RNF09: tarefas principais a 1 toque da tela inicial)
const NAV = [
  ["/", "Início", { titulo: "Início", render: telaInicio }],
  ["/buscar", "Buscar", { titulo: "Buscar carona", exigeLogin: true, render: telaBuscar }],
  ["/oferecer", "Oferecer", { titulo: "Oferecer carona", exigeLogin: true, render: telaOferecer }],
  ["/caronas", "Caronas", pend("Minhas caronas", "Solicitações, lista de espera e cancelamento.", "Etapa 7", "RF07, RF08, RF09, RN06")],
  ["/perfil", "Perfil", { titulo: "Perfil", exigeLogin: true, render: telaPerfil }]
];
NAV.forEach(([caminho, , rota]) => registrar(caminho, rota));
registrar("/acesso", { titulo: "Acesso", render: telaAcesso });
registrar("/ambiente", { titulo: "Verificação do ambiente", render: telaAmbiente });
registrar("*", { titulo: "Página não encontrada", render: () => el("div", {}, el("h2", {}, "Página não encontrada"), aviso("erro", "Este endereço não existe no aplicativo."), linkBotao("Voltar ao início", "#/")) });

const nav = document.getElementById("nav-principal");
const lista = el("ul", {}, NAV.map(([caminho, rotulo]) => el("li", {}, el("a", { href: `#${caminho}` }, rotulo))));
nav.append(lista);

iniciarDados();
iniciar(document.getElementById("conteudo"), (caminho) => {
  lista.querySelectorAll("a").forEach((a) =>
    a.getAttribute("href") === `#${caminho === "/acesso" ? "/perfil" : caminho}` ? a.setAttribute("aria-current", "page") : a.removeAttribute("aria-current"));
});