// Regras do Chat de Grupo Condicionado (RF10, RN07, US06, UC14) como funções PURAS: sem DOM, sem storage.
// A sala é liberada exclusivamente para membros confirmados (motorista e passageiras/os confirmados)
// e é arquivada automaticamente 2 horas após a conclusão da viagem (RN07).

export const JANELA_ARQUIVAMENTO_CHAT_H = 2; // RN07: desativada e arquivada 2 horas após encerramento da viagem
export const TAMANHO_MAX_MENSAGEM = 500;

const nao = (motivo, codigo) => ({ ok: false, motivo, codigo });

// Retorna os IDs de usuários com acesso autorizado ao chat da carona
export function membrosDoChat(carona, solicitacoes = []) {
  if (!carona) return [];
  const confirmados = solicitacoes
    .filter((s) => s.caronaId === carona.id && s.status === "confirmada")
    .map((s) => s.passageiroId);
  return Array.from(new Set([carona.motoristaId, ...confirmados]));
}

// RF10: validação estrita de acesso à sala
export function podeAcessarChat({ carona, usuarioId, solicitacoes = [] }) {
  if (!carona) return nao("Carona não encontrada.", "nao_encontrada");
  if (carona.status === "cancelada") return nao("Esta carona foi cancelada.", "cancelada");

  const eMotorista = carona.motoristaId === usuarioId;
  const minhaSolicitacao = solicitacoes.find(
    (s) => s.caronaId === carona.id && s.passageiroId === usuarioId
  );

  if (!eMotorista && !minhaSolicitacao) {
    return nao("Você não faz parte do grupo desta carona.", "permissao");
  }

  if (!eMotorista) {
    if (minhaSolicitacao.status === "pendente") {
      return nao("O chat será liberado assim que o motorista aprovar sua solicitação (RF10).", "aguardando");
    }
    if (minhaSolicitacao.status === "espera") {
      return nao("Você está na lista de espera. O chat só é liberado para membros confirmados (RF10).", "espera");
    }
    if (minhaSolicitacao.status !== "confirmada") {
      return nao("Apenas membros confirmados podem acessar o chat do grupo (RF10).", "permissao");
    }
  }

  return { ok: true, papel: eMotorista ? "motorista" : "passageiro" };
}

// RN07: estado do chat (ativo vs. arquivado após 2 horas da conclusão)
export function estadoDoChat(carona, agora = new Date()) {
  if (!carona) return { status: "inexistente", podeEnviar: false, motivo: "Carona não encontrada." };
  if (carona.status === "cancelada") {
    return { status: "desativado", podeEnviar: false, motivo: "Esta carona foi cancelada." };
  }

  if (carona.status === "concluida" && carona.concluidaEm) {
    const dataFim = new Date(carona.concluidaEm).getTime();
    const dataLimite = dataFim + JANELA_ARQUIVAMENTO_CHAT_H * 3600000;
    const momento = agora instanceof Date ? agora.getTime() : new Date(agora).getTime();

    if (momento > dataLimite) {
      return {
        status: "arquivado",
        podeEnviar: false,
        motivo: `Chat arquivado automaticamente ${JANELA_ARQUIVAMENTO_CHAT_H} horas após o encerramento da viagem (RN07).`,
        expirouEm: new Date(dataLimite).toISOString()
      };
    }
  }

  return { status: "ativo", podeEnviar: true, motivo: null };
}

// Validação de conteúdo de mensagem individual
export function validarMensagem(texto) {
  const limpo = String(texto ?? "").trim();
  if (!limpo) return nao("Digite uma mensagem antes de enviar.", "vazia");
  if (limpo.length > TAMANHO_MAX_MENSAGEM) {
    return nao(`A mensagem não pode ultrapassar ${TAMANHO_MAX_MENSAGEM} caracteres.`, "tamanho");
  }
  return { ok: true, textoLimpo: limpo };
}
