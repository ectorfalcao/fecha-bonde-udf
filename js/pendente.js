import { el, estadoVazio, linkBotao } from "./componentes.js";

// Tela honesta: mostra o que será construído, em qual etapa e para quais requisitos. Não finge funcionalidade.
export const telaPendente = ({ titulo, texto, etapa, reqs }) => () =>
  el("div", {}, el("h2", {}, titulo),
    estadoVazio({ titulo: `Disponível na ${etapa}`, texto, reqs, acao: linkBotao("Voltar ao início", "#/", "secundario") }));