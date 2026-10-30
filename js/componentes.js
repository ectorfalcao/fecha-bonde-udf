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

// Campo de formulário acessível: rótulo ligado, ajuda e erro anunciados (aria-describedby), erro com símbolo.
export function campo({ id, rotulo, tipo = "text", ajuda, valor = "", opcoes, autocomplete, obrigatorio = true, accept, extra = {}, vazio = "Selecione" }) {
  const erro = el("p", { class: "campo-erro", id: `${id}-erro`, hidden: true });
  const base = { id, name: id, required: obrigatorio, autocomplete, accept, "aria-describedby": [ajuda && `${id}-ajuda`, `${id}-erro`].filter(Boolean).join(" "), ...extra };
  const entrada = opcoes
    ? el("select", base, el("option", { value: "" }, vazio), opcoes.map(([v, t]) => el("option", { value: v, selected: v === valor }, t)))
    : el("input", { ...base, type: tipo, value: tipo === "file" ? null : valor });
  return {
    no: el("div", { class: "campo" }, el("label", { for: id }, rotulo), ajuda && el("p", { class: "ajuda", id: `${id}-ajuda` }, ajuda), entrada, erro),
    entrada,
    erro(msg) { erro.hidden = !msg; erro.textContent = msg ? `✖ ${msg}` : ""; entrada.setAttribute("aria-invalid", msg ? "true" : "false"); }
  };
}

// Diálogo modal nativo (<dialog>): foco preso, Esc fecha. Resolve true só se a pessoa aceitar.
export function dialogoConfirmar({ titulo, corpo, aceitar = "Aceitar", recusar = "Cancelar" }) {
  return new Promise((resolve) => {
    const d = el("dialog", { "aria-labelledby": "dialogo-titulo", class: "dialogo" },
      el("h2", { id: "dialogo-titulo" }, titulo), el("div", { class: "dialogo-corpo" }, corpo),
      el("div", { class: "acoes" },
        el("button", { type: "button", class: "botao secundario", onclick: () => d.close("nao") }, recusar),
        el("button", { type: "button", class: "botao", onclick: () => d.close("sim") }, aceitar)));
    d.addEventListener("close", () => { resolve(d.returnValue === "sim"); d.remove(); });
    document.body.append(d);
    d.showModal();
  });
}
// Diálogo modal com conteúdo livre (links, botões) e só um botão para fechar. Usado na emergência (Etapa 8.2).
export function dialogoAcoes({ titulo, corpo, fechar = "Fechar" }) {
  const d = el("dialog", { "aria-labelledby": "dialogo-titulo", class: "dialogo" },
    el("h2", { id: "dialogo-titulo" }, titulo), el("div", { class: "dialogo-corpo" }, corpo),
    el("div", { class: "acoes" }, el("button", { type: "button", class: "botao secundario", onclick: () => d.close() }, fechar)));
  d.addEventListener("close", () => d.remove());
  document.body.append(d);
  d.showModal();
  return d;
}