// Operações de privacidade (RNF02, LGPD; Etapa 10): aplicam as regras de privacidade.js sobre os dados.
import { listar, atualizar } from "./dados.js";
import { salvar, remover } from "./store.js";
import { podeExcluirConta, anonimizar, dadosDoUsuario } from "./privacidade.js";

const COLECOES = ["usuarios", "veiculos", "caronas", "solicitacoes", "mensagens", "avaliacoes", "pagamentos", "notificacoes", "alertas"];
const todas = () => Object.fromEntries(COLECOES.map((c) => [c, listar(c)]));

export const exportarDados = (usuarioId) => dadosDoUsuario(usuarioId, todas());

// Revoga o aceite dos termos de convivência: a próxima solicitação pede o aceite de novo (RF03).
export const revogarConvivencia = (usuarioId) => atualizar("usuarios", usuarioId, { termosConvivenciaEm: null });

export function excluirConta(usuarioId, { agora = new Date() } = {}) {
  const col = todas();
  const v = podeExcluirConta(usuarioId, col);
  if (!v.ok) return v;
  const novo = anonimizar(usuarioId, col, agora);
  const ok = Object.entries(novo).every(([nome, lista]) => salvar(nome, lista));
  if (!ok) return { ok: false, motivo: "Não foi possível gravar no armazenamento do navegador.", codigo: "gravacao" };
  remover("sessao");
  globalThis.dispatchEvent?.(new Event("sessao-alterada"));
  globalThis.dispatchEvent?.(new Event("avisos-alterados"));
  return { ok: true };
}
