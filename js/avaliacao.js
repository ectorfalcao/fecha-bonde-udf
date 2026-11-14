// Regras da avaliação mútua (RF14, RN10, US10; Etapa 8.6) como funções PURAS: sem DOM, sem storage.
// Premissas (Etapa 8): o passageiro avalia o motorista (os demais passageiros, opcional);
// o motorista avalia cada passageiro; dá para avaliar depois; a média só conta avaliações feitas.
// Escala de 1 a 5 (premissa: a documentação não define a escala).

export const NOTA_MIN = 1, NOTA_MAX = 5, TAMANHO_MAX_COMENTARIO = 300;

const nao = (motivo, codigo) => ({ ok: false, motivo, codigo });
const confirmados = (carona, sols) => sols.filter((s) => s.caronaId === carona.id && s.status === "confirmada").map((s) => s.passageiroId);
export const participantes = (carona, sols) => [carona.motoristaId, ...confirmados(carona, sols)];

export const avaliacaoDe = (caronaId, avaliadorId, avaliadoId, avaliacoes) =>
  avaliacoes.find((a) => a.caronaId === caronaId && a.avaliadorId === avaliadorId && a.avaliadoId === avaliadoId) ?? null;

// Quem esta pessoa avalia nesta viagem, se é obrigatório e se já avaliou.
export function quemAvaliar(carona, usuarioId, sols, avaliacoes = []) {
  if (carona?.status !== "concluida" || !participantes(carona, sols).includes(usuarioId)) return [];
  const item = (avaliadoId, papel, obrigatorio) => ({ avaliadoId, papel, obrigatorio, feita: avaliacaoDe(carona.id, usuarioId, avaliadoId, avaliacoes) });
  if (carona.motoristaId === usuarioId) return confirmados(carona, sols).map((id) => item(id, "passageiro", true));
  return [item(carona.motoristaId, "motorista", true),
    ...confirmados(carona, sols).filter((id) => id !== usuarioId).map((id) => item(id, "passageiro", false))];
}

export function podeAvaliar({ carona, avaliadorId, avaliadoId, solicitacoes = [], avaliacoes = [] }) {
  if (!carona) return nao("Carona não encontrada.", "nao_encontrada");
  if (carona.status !== "concluida") return nao("A avaliação é liberada depois que a viagem é concluída.", "estado");
  const grupo = participantes(carona, solicitacoes);
  if (!grupo.includes(avaliadorId)) return nao("Só quem participou da viagem pode avaliar.", "permissao");
  if (avaliadorId === avaliadoId || !grupo.includes(avaliadoId)) return nao("Esta pessoa não pode ser avaliada por você nesta viagem.", "permissao");
  if (avaliacaoDe(carona.id, avaliadorId, avaliadoId, avaliacoes)) return nao("Você já avaliou esta pessoa nesta viagem.", "feita");
  return { ok: true };
}

export function validarAvaliacao(nota, comentario) {
  const n = Number(nota), texto = String(comentario ?? "").trim();
  if (!Number.isInteger(n) || n < NOTA_MIN || n > NOTA_MAX) return nao(`Escolha uma nota de ${NOTA_MIN} a ${NOTA_MAX}.`, "nota");
  if (texto.length > TAMANHO_MAX_COMENTARIO) return nao(`O comentário pode ter até ${TAMANHO_MAX_COMENTARIO} caracteres.`, "comentario");
  return { ok: true, nota: n, comentario: texto };
}

// Média só com avaliações feitas; sem nenhuma, devolve null (a tela diz "sem avaliações", nunca "0").
export function mediaDe(usuarioId, avaliacoes) {
  const notas = avaliacoes.filter((a) => a.avaliadoId === usuarioId).map((a) => a.nota);
  return notas.length ? { media: notas.reduce((x, y) => x + y, 0) / notas.length, total: notas.length } : null;
}
export const textoMedia = (m) => (m ? `★ ${m.media.toFixed(1).replace(".", ",")} (${m.total} ${m.total > 1 ? "avaliações" : "avaliação"})` : "sem avaliações");
