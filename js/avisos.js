// Lista de notificações (RF07 a RF09 e avisos de viagem, pagamento e avaliação: simulados dentro do app).
// Usada pelo centro de notificações (sino no topo). Não lida = marcador âmbar + selo "Nova", nunca só a cor.
// aoMarcar (opcional): mostra, em cada não lida, o botão para marcá-la como lida.
import { el, selo, dataHora, comIcone } from "./componentes.js";

export const listaAvisos = (avisos, { limite = Infinity, aoMarcar = null } = {}) =>
  el("ul", { class: "lista-avisos" }, avisos.slice(0, limite).map((n) =>
    el("li", { class: n.lida ? "lido" : "nao-lido" },
      el("span", { class: "marcador", "aria-hidden": "true" }),
      el("div", {},
        el("p", {}, !n.lida && selo("Nova"), n.texto),
        el("small", { class: "nota" }, el("time", { datetime: n.criadaEm }, dataHora(n.criadaEm))),
        !n.lida && aoMarcar && el("button", { type: "button", class: "botao discreto marcar-lida", "aria-label": `Marcar como lida: ${n.texto}`, onclick: () => aoMarcar(n) },
          comIcone("check", "Marcar como lida"))))));
