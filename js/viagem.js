// Ciclo de vida da viagem (Etapa 8.1) como funções PURAS: sem DOM, sem storage.
// Estados da carona: aberta -> em_andamento -> concluida ; aberta -> cancelada.
// Premissa (diagrama de atividades): o MOTORISTA inicia e conclui a viagem.
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

// Viagens em andamento em que a pessoa participa: como motorista ou como passageira confirmada.
export const viagensAtivasDe = (usuarioId, caronas, sols) =>
  caronas.filter((c) => c.status === "em_andamento" && (c.motoristaId === usuarioId || sols.some((s) => s.caronaId === c.id && s.passageiroId === usuarioId && s.status === "confirmada")))
    .sort((a, b) => String(a.iniciadaEm).localeCompare(String(b.iniciadaEm)));