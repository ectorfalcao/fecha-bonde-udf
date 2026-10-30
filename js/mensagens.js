// Operações do Chat de Grupo Condicionado (RF10, RN07, US06, UC14).
// Persistência local na coleção "mensagens" com reatividade imediata e sincronização entre abas.
import { listar, obter, inserir } from "./dados.js";
import { podeAcessarChat, estadoDoChat, validarMensagem } from "./chat.js";

const NOME_CANAL = "fechabonde-chat";
let canal = null;
try {
  if (typeof globalThis.BroadcastChannel === "function") {
    canal = new globalThis.BroadcastChannel(NOME_CANAL);
    canal.unref?.();
    canal.onmessage = (ev) => {
      if (ev.data) {
        globalThis.dispatchEvent?.(new CustomEvent("chat-mensagem", { detail: ev.data }));
      }
    };
  }
} catch {
  // Ambientes sem BroadcastChannel continuam com o CustomEvent local
}

const criarEvento = (tipo, detail) => {
  try {
    if (typeof globalThis.CustomEvent === "function") return new globalThis.CustomEvent(tipo, { detail });
  } catch {}
  try {
    if (typeof globalThis.Event === "function") {
      const e = new globalThis.Event(tipo);
      e.detail = detail;
      return e;
    }
  } catch {}
  return { type: tipo, detail };
};

const avisarMensagem = (msg) => {
  try {
    globalThis.dispatchEvent?.(criarEvento("chat-mensagem", msg));
    canal?.postMessage(msg);
  } catch {
    // ignora falhas de broadcast
  }
};

// Retorna todas as mensagens da carona em ordem cronológica
export function listarMensagens(caronaId) {
  return listar("mensagens")
    .filter((m) => m.caronaId === caronaId)
    .sort((a, b) => String(a.criadaEm ?? "").localeCompare(String(b.criadaEm ?? "")));
}

// Envia uma nova mensagem no chat do grupo após todas as validações de autorização e estado
export function enviarMensagem({ caronaId, remetenteId, texto, agora = new Date() }) {
  const carona = obter("caronas", caronaId);
  const remetente = obter("usuarios", remetenteId);
  if (!carona || !remetente) {
    return { ok: false, motivo: "Carona ou usuário não encontrado.", codigo: "nao_encontrado" };
  }

  // RF10: apenas membros confirmados
  const perm = podeAcessarChat({
    carona,
    usuarioId: remetenteId,
    solicitacoes: listar("solicitacoes")
  });
  if (!perm.ok) return perm;

  // RN07: chat bloqueado para envio após 2 horas da conclusão
  const estado = estadoDoChat(carona, agora);
  if (!estado.podeEnviar) {
    return { ok: false, motivo: estado.motivo, codigo: estado.status };
  }

  // Validação do texto
  const valid = validarMensagem(texto);
  if (!valid.ok) return valid;

  const criadaEm = agora instanceof Date ? agora.toISOString() : new Date(agora).toISOString();
  const registro = inserir("mensagens", {
    caronaId,
    remetenteId,
    texto: valid.textoLimpo,
    criadaEm
  });

  if (!registro) {
    return { ok: false, motivo: "Não foi possível gravar no armazenamento do navegador.", codigo: "gravacao" };
  }

  avisarMensagem(registro);
  return { ok: true, mensagem: registro };
}
