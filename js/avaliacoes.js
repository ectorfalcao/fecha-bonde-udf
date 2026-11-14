// Operação da avaliação (RF14, Etapa 8.6): aplica as regras de avaliacao.js sobre os dados e avisa quem foi avaliado.
import { listar, obter, inserir } from "./dados.js";
import { notificar } from "./notificacoes.js";
import { podeAvaliar, validarAvaliacao } from "./avaliacao.js";

export function avaliar({ caronaId, avaliadorId, avaliadoId, nota, comentario = "", agora = new Date() }) {
  const carona = obter("caronas", caronaId);
  const p = podeAvaliar({ carona, avaliadorId, avaliadoId, solicitacoes: listar("solicitacoes"), avaliacoes: listar("avaliacoes") });
  if (!p.ok) return p;
  const v = validarAvaliacao(nota, comentario);
  if (!v.ok) return v;
  const registro = inserir("avaliacoes", { caronaId, avaliadorId, avaliadoId, nota: v.nota, comentario: v.comentario, criadaEm: agora.toISOString() });
  if (!registro) return { ok: false, motivo: "Não foi possível gravar no armazenamento do navegador.", codigo: "gravacao" };
  // O aviso não diz a nota nem quem deu: evita constrangimento e retaliação entre colegas.
  notificar(avaliadoId, `Você recebeu uma avaliação da viagem ${carona.origem} → ${carona.destino}.`);
  return { ok: true, avaliacao: registro };
}
