// Regras do pagamento (RF12, Etapa 8.5) como funções PURAS: sem DOM, sem storage. Tudo SIMULADO.
// Decisões do grupo: paga-se DEPOIS da viagem concluída (sem estorno: quem cancelou antes nunca pagou)
// e só o PIX fictício funciona; cartão aparece apenas como opção indisponível.
// Pagamentos pendentes não são gravados: são DERIVADOS (confirmado + concluída + valor > 0 + sem registro),
// como as vagas disponíveis (D10).

export const CHAVE_PIX_FICTICIA = "pix-ficticio@fechabonde.exemplo"; // não é uma chave real: nunca use dados reais

const nao = (motivo, codigo) => ({ ok: false, motivo, codigo });

export const pagamentoDe = (caronaId, passageiroId, pagamentos) =>
  pagamentos.find((p) => p.caronaId === caronaId && p.passageiroId === passageiroId) ?? null;

export function podePagar({ carona, passageiroId, solicitacoes = [], pagamentos = [] }) {
  if (!carona) return nao("Carona não encontrada.", "nao_encontrada");
  if (!(carona.valor > 0)) return nao("Esta carona é gratuita: não há pagamento.", "gratuita");
  const minha = solicitacoes.find((s) => s.caronaId === carona.id && s.passageiroId === passageiroId);
  if (minha?.status !== "confirmada") return nao("Só quem fez a viagem como passageiro confirmado paga a contribuição.", "permissao");
  if (carona.status !== "concluida") return nao("O pagamento é liberado depois que o motorista concluir a viagem.", "estado");
  if (pagamentoDe(carona.id, passageiroId, pagamentos)) return nao("O pagamento desta viagem já foi registrado.", "pago");
  return { ok: true, valor: carona.valor };
}

// Texto claramente fictício no lugar do "PIX copia e cola": não segue o padrão do Banco Central, não paga nada.
export const codigoPixFicticio = (carona, passageiroId) =>
  `SIMULADO-FECHABONDE-${carona.id}-${passageiroId}-${carona.valor.toFixed(2)}`.toUpperCase();

// Situação de cada passageiro confirmado de uma carona concluída, para o motorista e para o histórico.
export const situacaoPagamentos = (carona, solicitacoes, pagamentos) =>
  solicitacoes
    .filter((s) => s.caronaId === carona.id && s.status === "confirmada")
    .map((s) => ({ passageiroId: s.passageiroId, pagamento: pagamentoDe(carona.id, s.passageiroId, pagamentos) }));
