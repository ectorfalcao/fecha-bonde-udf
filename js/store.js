// Camada de persistência: todo acesso ao localStorage passa por aqui.
// Se um dia trocarmos por uma API/banco real, só este arquivo muda.
const PREFIXO = "fechabonde:";

// Devolve true/false: storage bloqueado ou cheio não pode derrubar a tela.
export function salvar(chave, valor) {
  try {
    localStorage.setItem(PREFIXO + chave, JSON.stringify(valor));
    return true;
  } catch {
    return false;
  }
}

export function carregar(chave, padrao = null) {
  try {
    const bruto = localStorage.getItem(PREFIXO + chave);
    return bruto === null ? padrao : JSON.parse(bruto);
  } catch {
    return padrao; // dado corrompido ou storage bloqueado
  }
}

export function remover(chave) {
  try { localStorage.removeItem(PREFIXO + chave); } catch { /* ignora */ }
}

export function localStorageDisponivel() {
  try {
    const teste = PREFIXO + "teste";
    localStorage.setItem(teste, "1");
    localStorage.removeItem(teste);
    return true;
  } catch {
    return false;
  }
}