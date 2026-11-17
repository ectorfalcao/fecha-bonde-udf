// Componentes de interface reutilizáveis. Nunca usam innerHTML: texto entra como nó de texto (evita XSS).
// Etapa 10: ícones SVG, avatar, cabeçalho de tela, botão de ícone com contador e uma base única de diálogos
// (modal central ou painel lateral), pensada para o futuro centro de notificações.
import { icone } from "./icones.js";
export { icone };

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

// Ícone + texto para botões e links: o texto continua sendo o nome acessível.
export const comIcone = (nome, texto) => [icone(nome), texto];

// Estado nunca só por cor: ícone + palavra + texto.
const AVISO = { info: ["info", "Informação"], alerta: ["atencao", "Atenção"], erro: ["erro", "Erro"], sucesso: ["check", "Pronto"] };
export const aviso = (tipo, texto) => {
  const [nome, rotulo] = AVISO[tipo] ?? AVISO.info;
  return el("div", { class: `aviso ${tipo}`, role: tipo === "erro" ? "alert" : "status" },
    el("span", { class: "aviso-icone" }, icone(nome, { tamanho: 18 })),
    el("p", { class: "aviso-texto" }, el("strong", {}, `${rotulo}: `), el("span", {}, texto)));
};

// variante: "" (âmbar), "neutro", "marca", "sucesso", "perigo", "escuro"
export const selo = (texto, variante = "", nomeIcone = null) =>
  el("span", { class: `selo ${variante}`.trim() }, nomeIcone && icone(nomeIcone, { tamanho: 14 }), texto);

export const linkBotao = (texto, href, variante = "", nomeIcone = null) =>
  el("a", { class: `botao ${variante}`.trim(), href }, nomeIcone && icone(nomeIcone, { tamanho: 18 }), texto);

// Botão só de ícone (topo, barras de ferramentas). O rótulo é o nome acessível; o contador é visual e
// entra no rótulo por extenso. Base pronta para o sino de notificações.
export function botaoIcone({ nomeIcone, rotulo, href = null, onclick = null, contador = 0, classe = "" }) {
  const conteudo = [icone(nomeIcone, { tamanho: 20 }), contador > 0 && el("span", { class: "contador", "aria-hidden": "true" }, contador > 99 ? "99+" : String(contador))];
  const nome = contador > 0 ? `${rotulo}: ${contador} não lida(s)` : rotulo;
  return href
    ? el("a", { class: `botao-icone ${classe}`.trim(), href, "aria-label": nome, title: rotulo }, conteudo)
    : el("button", { type: "button", class: `botao-icone ${classe}`.trim(), "aria-label": nome, title: rotulo, onclick }, conteudo);
}

// Iniciais em círculo. Decorativo: o nome sempre aparece em texto ao lado.
const TONS = 3;
export function avatar(nome, tamanho = "md") {
  const partes = String(nome ?? "").trim().split(/\s+/).filter(Boolean);
  const iniciais = partes.length ? (partes[0][0] + (partes.length > 1 ? partes[partes.length - 1][0] : "")).toUpperCase() : "?";
  const tom = [...String(nome ?? "")].reduce((t, c) => t + c.charCodeAt(0), 0) % TONS;
  return el("span", { class: `avatar avatar-${tamanho}`, "data-tom": String(tom), "aria-hidden": "true" }, iniciais);
}

// Cabeçalho padrão de tela: título (h2), descrição curta e ações à direita.
export const cabecalhoTela = ({ titulo, descricao = null, acoes = null }) =>
  el("header", { class: "tela-cabecalho" },
    el("div", { class: "tela-titulos" }, el("h2", {}, titulo), descricao && el("p", { class: "tela-descricao" }, descricao)),
    acoes && el("div", { class: "tela-acoes" }, acoes));

export const estadoVazio = ({ titulo, texto, acao, reqs, nomeIcone = "rota" }) =>
  el("section", { class: "vazio" },
    el("span", { class: "vazio-arte" }, icone(nomeIcone, { tamanho: 28 })),
    el("h3", {}, titulo), el("p", {}, texto), acao,
    reqs && el("p", { class: "reqs" }, `Requisitos: ${reqs}`));

// Lista de definição padrão: [[rótulo, valor, classeDoValor?, "largo"?], ...]; itens falsos são ignorados.
// Cada par fica num <div> (válido em <dl>) para virar um bloco; a ordem de leitura continua rótulo → valor.
// "largo" ocupa a linha inteira (nomes e textos longos). Etapa 10: substitui as cópias de lista() de cinco telas.
export const fatos = (linhas, variante = "") =>
  el("dl", { class: `fatos ${variante}`.trim() }, linhas.filter(Boolean).map(([t, v, cls, largura]) =>
    el("div", { class: largura ? `fato ${largura}` : "fato" }, el("dt", {}, t), el("dd", { class: cls }, v))));

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
    no: el("div", { class: "campo" }, el("label", { for: id }, rotulo),
      ajuda && el("p", { class: "ajuda", id: `${id}-ajuda` }, ajuda), entrada, erro),
    entrada,
    erro(msg) { erro.hidden = !msg; erro.textContent = msg ? `✖ ${msg}` : ""; entrada.setAttribute("aria-invalid", msg ? "true" : "false"); }
  };
}

// Base única dos diálogos (<dialog> nativo: foco preso, Esc fecha, fundo inerte).
// variante "" = modal central; "lateral" = painel que desliza da direita (ex.: futuro centro de notificações).
let contadorDialogos = 0;
export function abrirDialogo({ titulo, corpo, acoes = [], variante = "", aoFechar = null }) {
  const idTitulo = `dialogo-titulo-${++contadorDialogos}`;
  const d = el("dialog", { "aria-labelledby": idTitulo, class: `dialogo ${variante}`.trim() },
    el("div", { class: "dialogo-topo" },
      el("h2", { id: idTitulo }, titulo),
      el("button", { type: "button", class: "botao-icone discreto", "aria-label": "Fechar janela", title: "Fechar", onclick: () => d.close() }, icone("fechar"))),
    el("div", { class: "dialogo-corpo" }, corpo),
    acoes.length > 0 && el("div", { class: "acoes" }, acoes));
  d.addEventListener("close", () => { aoFechar?.(d.returnValue); d.remove(); });
  document.body.append(d);
  d.showModal();
  return d;
}

// Confirmação: resolve true só se a pessoa aceitar.
export function dialogoConfirmar({ titulo, corpo, aceitar = "Aceitar", recusar = "Cancelar", variante = "" }) {
  return new Promise((resolve) => {
    let d = null;
    d = abrirDialogo({ titulo, corpo, aoFechar: (v) => resolve(v === "sim"), acoes: [
      el("button", { type: "button", class: "botao secundario", onclick: () => d.close("nao") }, recusar),
      el("button", { type: "button", class: `botao ${variante}`.trim(), onclick: () => d.close("sim") }, aceitar)] });
  });
}

// Conteúdo livre (links, botões) e só um botão para fechar. Usado na emergência (Etapa 8.2).
export function dialogoAcoes({ titulo, corpo, fechar = "Fechar" }) {
  let d = null;
  d = abrirDialogo({ titulo, corpo, acoes: [el("button", { type: "button", class: "botao secundario", onclick: () => d.close() }, fechar)] });
  return d;
}
