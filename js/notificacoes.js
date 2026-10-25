// Avisos SIMULADOS dentro do app (RF07, RF08, RF09). Não há push nem e-mail: ficam no armazenamento local.
import { listar, inserir } from "./dados.js";
import { salvar } from "./store.js";

const avisarMudanca = () => globalThis.dispatchEvent?.(new Event("avisos-alterados"));

export function notificar(usuarioId, texto) {
  const n = inserir("notificacoes", { usuarioId, texto, criadaEm: new Date().toISOString(), lida: false });
  avisarMudanca();
  return n;
}
export const doUsuario = (id) => listar("notificacoes").filter((n) => n.usuarioId === id).reverse().sort((a, b) => String(b.criadaEm).localeCompare(String(a.criadaEm)));
export const naoLidas = (id) => doUsuario(id).filter((n) => !n.lida).length;
export function marcarLidas(id) {
  const ok = salvar("notificacoes", listar("notificacoes").map((n) => (n.usuarioId === id ? { ...n, lida: true } : n)));
  avisarMudanca();
  return ok;
}
