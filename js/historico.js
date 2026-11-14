// Histórico e extrato (RF13, Etapa 8.7) como funções PURAS: sem DOM, sem storage.
// Histórico = viagens CONCLUÍDAS em que a pessoa foi motorista ou passageira confirmada (canceladas não são viagens).
// Extrato = valores SIMULADOS, calculados dos pagamentos registrados (nada é gravado à parte).
import { situacaoPagamentos } from "./pagamento.js";

export function historicoDe(usuarioId, caronas, solicitacoes) {
  const comoPassageiro = new Set(solicitacoes.filter((s) => s.passageiroId === usuarioId && s.status === "confirmada").map((s) => s.caronaId));
  return caronas
    .filter((c) => c.status === "concluida" && (c.motoristaId === usuarioId || comoPassageiro.has(c.id)))
    .sort((a, b) => String(b.concluidaEm ?? "").localeCompare(String(a.concluidaEm ?? "")));
}

export function extratoDe(usuarioId, caronas, solicitacoes, pagamentos) {
  const e = { pago: 0, aPagar: 0, recebido: 0, aReceber: 0 };
  for (const c of historicoDe(usuarioId, caronas, solicitacoes)) {
    if (!(c.valor > 0)) continue;
    for (const s of situacaoPagamentos(c, solicitacoes, pagamentos)) {
      const valor = s.pagamento?.valor ?? c.valor;
      if (c.motoristaId === usuarioId) e[s.pagamento ? "recebido" : "aReceber"] += valor;
      else if (s.passageiroId === usuarioId) e[s.pagamento ? "pago" : "aPagar"] += valor;
    }
  }
  return e;
}
