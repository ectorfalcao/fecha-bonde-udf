// Ciclo de vida da viagem (Etapa 8.1) como funções PURAS: sem DOM, sem storage.
// Estados da carona: aberta -> em_andamento -> concluida ; aberta -> cancelada.
// Premissa (diagrama de atividades): o MOTORISTA inicia e conclui a viagem.
import { localPorId, tempoViagemMin } from "./caronas.js";

export const JANELA_INICIO_MIN = 15; // RN08 / US07: a viagem pode ser iniciada (e a posição compartilhada) 15 min antes da saída

const nao = (motivo, codigo) => ({ ok: false, motivo, codigo });
const quando = (d) => new Intl.DateTimeFormat("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }).format(d);

export const inicioLiberadoEm = (carona) => new Date(new Date(carona.dataHoraSaida).getTime() - JANELA_INICIO_MIN * 60000);
export const confirmadas = (carona, sols) => sols.filter((s) => s.caronaId === carona.id && s.status === "confirmada");

// `demo` (modo demonstração) libera o início fora da janela; o resultado registra que foi usado.
export function podeIniciarViagem(carona, { agora = new Date(), demo = false } = {}) {
  if (carona.status === "em_andamento") return nao("A viagem já está em andamento.", "estado");
  if (carona.status !== "aberta") return nao("Só é possível iniciar uma carona aberta.", "estado");
  if (agora < inicioLiberadoEm(carona)) {
    if (!demo) return nao(`O início da viagem é liberado ${JANELA_INICIO_MIN} minutos antes da saída (a partir de ${quando(inicioLiberadoEm(carona))}).`, "janela");
    return { ok: true, usouDemo: true };
  }
  return { ok: true, usouDemo: false };
}

export const podeConcluirViagem = (carona) =>
  carona.status === "em_andamento" ? { ok: true } : nao("Só é possível concluir uma viagem em andamento.", "estado");

// Ao iniciar, quem ainda não foi aprovado (pendente ou na espera) não embarca: a solicitação é encerrada.
export const planoAoIniciar = (carona, sols) => ({
  paraEncerrar: sols.filter((s) => s.caronaId === carona.id && (s.status === "pendente" || s.status === "espera")),
  embarcam: confirmadas(carona, sols)
});

// RF11 (SIMULADO, Etapa 8.4): sem GPS nem servidor, o veículo avança em linha reta da origem ao destino
// na proporção do tempo previsto (tempoViagemMin) desde o início. Antes de iniciar fica na origem; concluída, no destino.
export function posicaoSimulada(carona, agora = new Date()) {
  const a = localPorId(carona.origemId), b = localPorId(carona.destinoId);
  if (!a || !b) return null;
  const duracaoMs = tempoViagemMin(carona.origemId, carona.destinoId) * 60000;
  const inicio = carona.iniciadaEm ? new Date(carona.iniciadaEm).getTime() : NaN;
  const progresso = carona.status === "concluida" ? 1
    : Number.isFinite(inicio) ? Math.min(1, Math.max(0, (agora.getTime() - inicio) / duracaoMs)) : 0;
  return {
    lat: a.lat + (b.lat - a.lat) * progresso,
    lng: a.lng + (b.lng - a.lng) * progresso,
    progresso,
    chegadaPrevista: Number.isFinite(inicio) ? new Date(inicio + duracaoMs) : null
  };
}

// Viagens em andamento em que a pessoa participa: como motorista ou como passageira confirmada.
export const viagensAtivasDe = (usuarioId, caronas, sols) =>
  caronas.filter((c) => c.status === "em_andamento" && (c.motoristaId === usuarioId || sols.some((s) => s.caronaId === c.id && s.passageiroId === usuarioId && s.status === "confirmada")))
    .sort((a, b) => String(a.iniciadaEm).localeCompare(String(b.iniciadaEm)));