// Roteador por hash (#/buscar). Funciona em hospedagem estática e sem recarregar a página.
const rotas = new Map();
let raiz, aoMudar, primeira = true;

export const registrar = (caminho, rota) => rotas.set(caminho, rota);
export const caminhoAtual = () => location.hash.replace(/^#/, "") || "/";

function renderizar() {
  const caminho = caminhoAtual();
  const rota = rotas.get(caminho) ?? rotas.get("*");
  raiz.replaceChildren(rota.render());
  document.title = `${rota.titulo} · Fecha Bonde UDF`;
  if (!primeira) raiz.focus(); // leitor de tela anuncia a nova tela; teclado recomeça do conteúdo
  primeira = false;
  aoMudar?.(caminho);
}

export function iniciar(elementoRaiz, callback) {
  raiz = elementoRaiz; aoMudar = callback;
  addEventListener("hashchange", renderizar);
  renderizar();
}
