import { acessoLiberado } from "./sessao.js";

// Roteador por hash (#/buscar). Funciona em hospedagem estática e sem recarregar a página.
const rotas = new Map();
let raiz, aoMudar, primeira = true;

export const registrar = (caminho, rota) => rotas.set(caminho, rota);
export const caminhoAtual = () => location.hash.replace(/^#/, "") || "/";
export const caminhoBase = () => caminhoAtual().split("?")[0] || "/";
export const parametrosRota = () => new URLSearchParams(caminhoAtual().split("?")[1] || "");

function renderizar() {
  const base = caminhoBase();
  const params = parametrosRota();
  const rota = rotas.get(base) ?? rotas.get("*");
  if (rota.exigeLogin && !acessoLiberado()) { location.hash = "#/acesso"; return; } // US01: sem e-mail confirmado e termos, só o acesso
  raiz.replaceChildren(rota.render(params));
  document.title = `${rota.titulo} · Fecha Bonde UDF`;
  // Leitor de tela anuncia a nova tela; teclado recomeça do conteúdo. Etapa 10: sem rolar para baixo do topo fixo;
  // a tela nova começa do alto.
  if (!primeira) { raiz.focus({ preventScroll: true }); globalThis.scrollTo?.(0, 0); }
  primeira = false;
  aoMudar?.(base);
}

export function iniciar(elementoRaiz, callback) {
  raiz = elementoRaiz; aoMudar = callback;
  addEventListener("hashchange", renderizar);
  renderizar();
}