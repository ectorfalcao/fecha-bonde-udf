// Lista de avisos (RF07 a RF09: notificações simuladas dentro do app). Etapa 10.
// Componente único: usado em Caronas e pronto para o painel do futuro sino de notificações
// (mesma marcação e estilos; não lido = marcador âmbar + selo "Nova", nunca só a cor).
import { el, selo, dataHora } from "./componentes.js";

export const listaAvisos = (avisos, { limite = 8 } = {}) =>
  el("ul", { class: "lista-avisos" }, avisos.slice(0, limite).map((n) =>
    el("li", { class: n.lida ? "lido" : "nao-lido" },
      el("span", { class: "marcador", "aria-hidden": "true" }),
      el("div", {},
        el("p", {}, !n.lida && selo("Nova"), n.texto),
        el("small", { class: "nota" }, el("time", { datetime: n.criadaEm }, dataHora(n.criadaEm)))))));
