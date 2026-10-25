// Operações da Etapa 7: aplicam as regras de grupos.js sobre os dados e geram os avisos.
import { listar, obter, inserir, atualizar } from "./dados.js";
import { pendenciasDe } from "./sessao.js";
import { notificar } from "./notificacoes.js";
import { podeSolicitar, podeAprovar, podeCancelarCarona, planoDeFila, posicaoNaFila, ATIVAS } from "./grupos.js";

const ERRO_GRAVAR = { ok: false, motivo: "Não foi possível gravar no armazenamento do navegador.", codigo: "gravacao" };
const NAO_ENCONTRADA = { ok: false, motivo: "Solicitação não encontrada.", codigo: "permissao" };
const agoraISO = () => new Date().toISOString();
const rotaDe = (c) => `${c.origem} → ${c.destino}`;
const nomeDe = (id) => obter("usuarios", id)?.nome || "Um passageiro";

export const contextoDados = (usuario) => ({
  usuario,
  motoristaDe: (c) => obter("usuarios", c.motoristaId),
  passageirosConfirmados: (c) => listar("solicitacoes").filter((s) => s.caronaId === c.id && s.status === "confirmada").map((s) => obter("usuarios", s.passageiroId)).filter(Boolean)
});

function acomodarFila(caronaId) {
  const carona = obter("caronas", caronaId);
  if (!carona) return;
  const plano = planoDeFila(carona, listar("solicitacoes"));
  for (const s of plano.paraEspera)
    if (atualizar("solicitacoes", s.id, { status: "espera" })) notificar(s.passageiroId, `A carona ${rotaDe(carona)} lotou. Você entrou na lista de espera.`);
  for (const s of plano.paraPendente)
    if (atualizar("solicitacoes", s.id, { status: "pendente", promovidaEm: agoraISO() })) {
      notificar(s.passageiroId, `Abriu uma vaga na carona ${rotaDe(carona)}. Sua solicitação foi enviada ao motorista para aprovação.`);
      notificar(carona.motoristaId, `${nomeDe(s.passageiroId)} saiu da lista de espera e aguarda sua aprovação na carona ${rotaDe(carona)}.`);
    }
}

// RF07 / RF08 / RN03 / RN06
export function solicitar(caronaId, passageiroId) {
  const carona = obter("caronas", caronaId), usuario = obter("usuarios", passageiroId);
  if (!carona || !usuario) return { ok: false, motivo: "Carona ou usuário não encontrado.", codigo: "indisponivel" };
  const v = podeSolicitar({ carona, usuario, solicitacoes: listar("solicitacoes"), pendencias: pendenciasDe(usuario), ctx: contextoDados(usuario) });
  if (!v.ok) return v;
  const reg = inserir("solicitacoes", { caronaId, passageiroId, status: v.status, criadaEm: agoraISO(), aceiteTermosEm: usuario.termosConvivenciaEm });
  if (!reg) return ERRO_GRAVAR;
  const posicao = v.status === "espera" ? posicaoNaFila(reg, carona, listar("solicitacoes")) : 0;
  notificar(carona.motoristaId, v.status === "pendente"
    ? `${usuario.nome} solicitou uma vaga na carona ${rotaDe(carona)}.`
    : `${usuario.nome} entrou na lista de espera da carona ${rotaDe(carona)}.`);
  return { ok: true, status: v.status, posicao };
}

const doMotorista = (solId, motoristaId) => {
  const s = obter("solicitacoes", solId), c = s && obter("caronas", s.caronaId);
  return s && c && c.motoristaId === motoristaId ? { s, c } : null;
};

export function aprovar(solId, motoristaId) {
  const x = doMotorista(solId, motoristaId);
  if (!x) return NAO_ENCONTRADA;
  const v = podeAprovar(x.c, listar("solicitacoes"), x.s);
  if (!v.ok) return v;
  if (!atualizar("solicitacoes", x.s.id, { status: "confirmada", respondidaEm: agoraISO() })) return ERRO_GRAVAR;
  notificar(x.s.passageiroId, `Sua vaga na carona ${rotaDe(x.c)} foi aprovada.`);
  acomodarFila(x.c.id); // se lotou, os demais pendentes vão para a lista de espera (RN06)
  return { ok: true };
}

export function recusar(solId, motoristaId) {
  const x = doMotorista(solId, motoristaId);
  if (!x) return NAO_ENCONTRADA;
  if (x.c.status !== "aberta") return { ok: false, motivo: "A carona não está aberta.", codigo: "indisponivel" };
  if (x.s.status !== "pendente") return { ok: false, motivo: "Só é possível recusar solicitações pendentes.", codigo: "estado" };
  if (!atualizar("solicitacoes", x.s.id, { status: "recusada", respondidaEm: agoraISO() })) return ERRO_GRAVAR;
  notificar(x.s.passageiroId, `O motorista recusou sua solicitação na carona ${rotaDe(x.c)}.`);
  acomodarFila(x.c.id);
  return { ok: true };
}

// RF09 (passageiro): libera a vaga, avisa o motorista e chama o próximo da fila.
export function cancelarSolicitacao(solId, passageiroId) {
  const s = obter("solicitacoes", solId), c = s && obter("caronas", s.caronaId);
  if (!s || !c || s.passageiroId !== passageiroId) return NAO_ENCONTRADA;
  if (!ATIVAS.includes(s.status)) return { ok: false, motivo: "Esta solicitação já não está ativa.", codigo: "estado" };
  if (c.status === "em_andamento" || c.status === "concluida") return { ok: false, motivo: "A viagem já começou: a solicitação não pode mais ser cancelada pelo aplicativo.", codigo: "viagem" };
  if (!atualizar("solicitacoes", s.id, { status: "cancelada", canceladaEm: agoraISO(), canceladaPor: "passageiro" })) return ERRO_GRAVAR;
  notificar(c.motoristaId, `${nomeDe(passageiroId)} cancelou a participação na carona ${rotaDe(c)}.`);
  acomodarFila(c.id);
  return { ok: true };
}

// RF09 (motorista): avisa todos os passageiros com solicitação ativa.
export function cancelarCarona(caronaId, motoristaId, agora = new Date()) {
  const c = obter("caronas", caronaId);
  if (!c || c.motoristaId !== motoristaId) return { ok: false, motivo: "Carona não encontrada.", codigo: "permissao" };
  const v = podeCancelarCarona(c, agora);
  if (!v.ok) return v;
  const afetadas = listar("solicitacoes").filter((s) => s.caronaId === c.id && ATIVAS.includes(s.status));
  if (!atualizar("caronas", c.id, { status: "cancelada", canceladaEm: agoraISO() })) return ERRO_GRAVAR;
  for (const s of afetadas)
    if (atualizar("solicitacoes", s.id, { status: "cancelada", canceladaEm: agoraISO(), canceladaPor: "motorista" }))
      notificar(s.passageiroId, `O motorista cancelou a carona ${rotaDe(c)}.`);
  return { ok: true, avisados: afetadas.length };
}