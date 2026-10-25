// Componentes de interface reutilizáveis. Nunca usam innerHTML: texto entra como nó de texto (evita XSS).
export function el(tag, atributos = {}, ...filhos) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(atributos)) {
    if (v == null || v === false) continue;
    if (k === "class") n.className = v;
    else if (k.startsWith("on")) n.addEventListener(k.slice(2).toLowerCase(), v);
    else n.setAttribute(k, v === true ? "" : v);
  }
  n.append(...filhos.flat().filter((f) => f != null && f !== false));
  return n;
}

const SIMBOLO = { info: "ℹ Info", alerta: "⚠ Atenção", erro: "✖ Erro" }; // estado nunca só por cor
export const aviso = (tipo, texto) =>
  el("div", { class: `aviso ${tipo}`, role: tipo === "erro" ? "alert" : "status" },
    el("strong", {}, SIMBOLO[tipo]), el("span", {}, texto));

export const selo = (texto) => el("span", { class: "selo" }, texto);

export const linkBotao = (texto, href, variante = "") => el("a", { class: `botao ${variante}`.trim(), href }, texto);

export const estadoVazio = ({ titulo, texto, acao, reqs }) =>
  el("section", { class: "vazio" },
    el("h3", {}, titulo), el("p", {}, texto), acao,
    reqs && el("p", { class: "reqs" }, `Requisitos: ${reqs}`));

export const moeda = (v) => (v > 0 ? v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "Gratuita");
export const dataHora = (iso) =>
  new Intl.DateTimeFormat("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
