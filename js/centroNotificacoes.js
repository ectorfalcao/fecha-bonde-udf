// Centro de notificações (Etapa 10.3): TODAS as notificações num lugar só.
// Um sino no canto superior direito (com o número de não lidas) abre uma caixa com as notificações:
// em cima as não lidas, embaixo as já lidas. A caixa é o <dialog> nativo (foco preso, Esc fecha e o foco
// volta para o sino); no celular ela sobe de baixo, perto do polegar.
import { el, botaoIcone, abrirDialogo, estadoVazio, comIcone, linkBotao, selo } from "./componentes.js";
import { usuarioAtual } from "./sessao.js";
import { doUsuario, naoLidas, marcarLidas, marcarLida } from "./notificacoes.js";
import { listaAvisos } from "./avisos.js";

const LIMITE_LIDAS = 30; // as lidas mais antigas não somem dos dados; só não entram na caixa

// Sino do topo. O número é visual; o leitor de tela ouve "Notificações: 3 não lida(s)".
export function botaoNotificacoes(u) {
  const b = botaoIcone({ nomeIcone: "sino", rotulo: "Notificações", contador: naoLidas(u.id), onclick: abrirNotificacoes, classe: "sino" });
  b.setAttribute("aria-haspopup", "dialog");
  return b;
}

// Conteúdo da caixa (separado da abertura para poder ser testado). aoMudar redesenha depois de marcar.
export function conteudoNotificacoes(u, aoMudar = () => {}) {
  const todas = doUsuario(u.id);                       // já vem da mais nova para a mais antiga
  const novas = todas.filter((n) => !n.lida), lidas = todas.filter((n) => n.lida);
  if (!todas.length)
    return estadoVazio({ titulo: "Nenhuma notificação", nomeIcone: "sino",
      texto: "Avisos sobre solicitações, viagens, pagamentos e avaliações aparecem aqui. São simulados dentro do app." });
  return el("div", { class: "centro-avisos" },
    el("section", { "aria-labelledby": "h-nao-lidas" },
      el("div", { class: "centro-topo" },
        el("h3", { id: "h-nao-lidas" }, "Não lidas", selo(String(novas.length), novas.length ? "" : "neutro")),
        novas.length > 0 && el("button", { type: "button", class: "botao discreto", onclick: () => { marcarLidas(u.id); aoMudar(); } }, comIcone("check", "Marcar todas como lidas"))),
      novas.length
        ? listaAvisos(novas, { aoMarcar: (n) => { marcarLida(u.id, n.id); aoMudar(); } })
        : el("p", { class: "nota centro-em-dia" }, "Você está em dia: nenhuma notificação nova.")),
    lidas.length > 0 && el("section", { "aria-labelledby": "h-lidas" },
      el("div", { class: "centro-topo" }, el("h3", { id: "h-lidas" }, "Lidas", selo(String(lidas.length), "neutro"))),
      listaAvisos(lidas, { limite: LIMITE_LIDAS }),
      lidas.length > LIMITE_LIDAS && el("p", { class: "nota" }, `Mostrando as ${LIMITE_LIDAS} mais recentes.`)));
}

export function abrirNotificacoes() {
  const u = usuarioAtual();
  if (!u) return null;
  const corpo = el("div", { tabindex: "-1", class: "centro-corpo" });
  // Depois de marcar, o botão clicado some: o foco vai para o corpo da caixa (não se perde no fundo da página).
  const desenhar = () => { corpo.replaceChildren(conteudoNotificacoes(usuarioAtual(), () => { desenhar(); corpo.focus({ preventScroll: true }); })); };
  desenhar();
  let d = null;
  const verCaronas = linkBotao("Ver minhas caronas", "#/caronas", "secundario", "carro");
  verCaronas.addEventListener("click", () => d.close());   // as ações (pagar, avaliar, aprovar) ficam em Caronas
  d = abrirDialogo({ titulo: "Notificações", corpo, variante: "notificacoes", acoes: [verCaronas] });
  return d;
}
