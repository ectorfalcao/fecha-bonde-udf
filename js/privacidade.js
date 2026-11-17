// Privacidade e dados pessoais (RNF02, RN12; LGPD) como funções PURAS: sem DOM, sem storage. Etapa 10.
// Exclusão da conta = ANONIMIZAÇÃO: o registro da pessoa fica sem nenhum dado pessoal, mas o id continua,
// para não quebrar o histórico e o extrato de quem viajou com ela (pagamentos e caronas concluídas).
import { ATIVAS } from "./grupos.js";

export const NOME_ANONIMO = "Usuário removido";
export const TEXTO_MENSAGEM_REMOVIDA = "Mensagem removida a pedido do autor (LGPD).";
const EM_CURSO = ["aberta", "em_andamento"];

const nao = (motivo, codigo) => ({ ok: false, motivo, codigo });

// Bloqueia enquanto houver compromisso em curso: excluir no meio deixaria motorista ou passageiros sem aviso.
export function podeExcluirConta(usuarioId, { caronas = [], solicitacoes = [] }) {
  const statusDe = (id) => caronas.find((c) => c.id === id)?.status;
  const comoMotorista = caronas.filter((c) => c.motoristaId === usuarioId && EM_CURSO.includes(c.status)).length;
  const comoPassageiro = solicitacoes.filter((s) => s.passageiroId === usuarioId && ATIVAS.includes(s.status) && EM_CURSO.includes(statusDe(s.caronaId))).length;
  const total = comoMotorista + comoPassageiro;
  if (total) return nao(`Antes de excluir a conta, cancele ou conclua suas caronas em curso (${total}). Assim ninguém fica sem aviso.`, "compromissos");
  return { ok: true };
}

// Devolve as coleções alteradas. O que sai e o que fica:
// - usuário: todos os dados pessoais apagados; fica o id e a data da exclusão;
// - veículo, avisos, alertas de emergência e avaliações RECEBIDAS: apagados;
// - mensagens enviadas: texto substituído; avaliações FEITAS: comentário apagado (a nota fica na média de quem foi avaliado);
// - caronas, solicitações e pagamentos: ficam, só com o id (são o histórico de outras pessoas).
export function anonimizar(usuarioId, col, agora = new Date()) {
  return {
    usuarios: col.usuarios.map((u) => (u.id !== usuarioId ? u : {
      id: u.id, nome: NOME_ANONIMO, email: `removido-${u.id}@anonimo.invalid`, curso: "", turno: "", genero: "", telefone: "",
      telefoneVerificado: false, fotoNome: "", cnhNome: "", contatoNome: "", contatoTel: "", chavePix: "",
      motorista: false, passageiro: false, emailVerificado: false, termosUsoEm: null, termosConvivenciaEm: null,
      excluidoEm: agora.toISOString()
    })),
    veiculos: col.veiculos.filter((v) => v.motoristaId !== usuarioId),
    mensagens: col.mensagens.map((m) => (m.remetenteId === usuarioId ? { ...m, texto: TEXTO_MENSAGEM_REMOVIDA, anonimizada: true } : m)),
    avaliacoes: col.avaliacoes.filter((a) => a.avaliadoId !== usuarioId).map((a) => (a.avaliadorId === usuarioId ? { ...a, comentario: "" } : a)),
    notificacoes: col.notificacoes.filter((n) => n.usuarioId !== usuarioId),
    alertas: col.alertas.filter((a) => a.usuarioId !== usuarioId)
  };
}

// Portabilidade/transparência: tudo o que o app guarda sobre a pessoa. Avaliações recebidas vão SEM o autor
// (mesma regra da tela: quem é avaliado não sabe quem deu a nota).
export function dadosDoUsuario(usuarioId, col, agora = new Date()) {
  const usuario = col.usuarios.find((u) => u.id === usuarioId) ?? null;
  return {
    exportadoEm: agora.toISOString(),
    aviso: "Fecha Bonde UDF (protótipo acadêmico): dados fictícios guardados só neste navegador.",
    usuario,
    veiculos: col.veiculos.filter((v) => v.motoristaId === usuarioId),
    caronasComoMotorista: col.caronas.filter((c) => c.motoristaId === usuarioId),
    solicitacoes: col.solicitacoes.filter((s) => s.passageiroId === usuarioId),
    mensagensEnviadas: col.mensagens.filter((m) => m.remetenteId === usuarioId),
    avaliacoesFeitas: col.avaliacoes.filter((a) => a.avaliadorId === usuarioId),
    avaliacoesRecebidas: col.avaliacoes.filter((a) => a.avaliadoId === usuarioId).map(({ avaliadorId, ...resto }) => resto),
    pagamentos: col.pagamentos.filter((p) => p.passageiroId === usuarioId || p.motoristaId === usuarioId),
    avisos: col.notificacoes.filter((n) => n.usuarioId === usuarioId),
    alertasEmergencia: col.alertas.filter((a) => a.usuarioId === usuarioId)
  };
}
