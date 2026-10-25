// Modo demonstração (Etapa 8.1): ferramenta de TESTE, sempre visível quando ligada (selo no cabeçalho).
// Libera o início da viagem fora da janela de 15 minutos, para testar sem esperar o relógio.
import { carregar, salvar } from "./store.js";

export const modoDemo = () => carregar("modoDemo", false) === true;
export function definirModoDemo(ligado) {
  const ok = salvar("modoDemo", Boolean(ligado));
  globalThis.dispatchEvent?.(new Event("demo-alterado"));
  return ok;
}
