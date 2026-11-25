// Camada de persistência: todo acesso aos dados passa por aqui.
// Modo local (padrão, testes e sem internet): localStorage deste navegador.
// Modo nuvem (Etapa 12, ligado por usarNuvem): as coleções compartilhadas ficam num cache em memória,
// alimentado pelo Firestore em tempo real; cada gravação envia só os documentos que mudaram.
// O resto do app continua síncrono e não precisa saber de onde vêm os dados.
const PREFIXO = "fechabonde:";

export const COLECOES_NUVEM = ["usuarios", "veiculos", "caronas", "solicitacoes", "mensagens", "notificacoes", "pagamentos", "avaliacoes", "alertas", "posicoes"];
let nuvem = null;            // adaptador: { enviar(chave, antes, depois) }
const cache = new Map();
const copia = (v) => (v == null ? v : JSON.parse(JSON.stringify(v)));
const naNuvem = (chave) => nuvem !== null && COLECOES_NUVEM.includes(chave);
const avisar = (tipo, detail) => globalThis.dispatchEvent?.(detail === undefined ? new Event(tipo) : new CustomEvent(tipo, { detail }));

export const modoNuvem = () => nuvem !== null;
export function usarNuvem(adaptador) { nuvem = adaptador; cache.clear(); }
export function sairDoModoNuvem() { nuvem = null; cache.clear(); }
export const limparNuvem = () => cache.clear();

// JSON com chaves em ordem: compara documentos sem depender da ordem dos campos.
export function estavel(v) {
  if (Array.isArray(v)) return `[${v.map(estavel).join(",")}]`;
  if (v && typeof v === "object") return `{${Object.keys(v).sort().map((k) => `${JSON.stringify(k)}:${estavel(v[k])}`).join(",")}}`;
  return JSON.stringify(v ?? null);
}
const comoMapa = (v) => (Array.isArray(v) ? new Map(v.map((d) => [String(d.id), d])) : new Map(Object.entries(v ?? {})));

// O que mudou entre duas versões de uma coleção (lista com id, ou mapa id -> documento).
export function diferencas(antes, depois) {
  const a = comoMapa(antes), d = comoMapa(depois);
  return {
    gravar: [...d].filter(([id, doc]) => !a.has(id) || estavel(a.get(id)) !== estavel(doc)).map(([id, doc]) => ({ id, doc })),
    apagar: [...a.keys()].filter((id) => !d.has(id))
  };
}

// Devolve true/false: storage bloqueado ou cheio não pode derrubar a tela.
export function salvar(chave, valor) {
  if (naNuvem(chave)) {
    const antes = cache.get(chave);
    cache.set(chave, copia(valor));
    try { nuvem.enviar(chave, antes, copia(valor)); return true; } catch { return false; }
  }
  try {
    localStorage.setItem(PREFIXO + chave, JSON.stringify(valor));
    return true;
  } catch {
    return false;
  }
}

export function carregar(chave, padrao = null) {
  if (naNuvem(chave)) return cache.has(chave) ? copia(cache.get(chave)) : padrao;
  try {
    const bruto = localStorage.getItem(PREFIXO + chave);
    return bruto === null ? padrao : JSON.parse(bruto);
  } catch {
    return padrao; // dado corrompido ou storage bloqueado
  }
}

// Chegada de dados da nuvem. Só avisa as telas se algo mudou de verdade (a confirmação do servidor
// para uma gravação nossa chega igual ao que já está no cache e não redesenha nada).
export function receberDaNuvem(chave, valor) {
  const antes = cache.get(chave);
  cache.set(chave, copia(valor));
  const ordenar = (v) => (Array.isArray(v) ? [...v].sort((x, y) => String(x.id).localeCompare(String(y.id))) : v ?? null);
  if (estavel(ordenar(antes)) === estavel(ordenar(valor))) return false;
  avisar("dados-alterados", { colecao: chave });
  if (chave === "notificacoes") avisar("avisos-alterados");
  if (chave === "caronas" || chave === "solicitacoes") avisar("viagem-alterada");
  if (chave === "posicoes") avisar("posicao-alterada");
  if (chave === "mensagens") {
    const ja = new Set((antes ?? []).map((m) => m.id));
    for (const m of valor) if (!ja.has(m.id)) avisar("chat-mensagem", m);
  }
  return true;
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
