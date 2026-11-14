// Operação do pagamento (RF12, Etapa 8.5): aplica as regras de pagamento.js sobre os dados e avisa o motorista.
import { listar, obter, inserir } from "./dados.js";
import { notificar } from "./notificacoes.js";
import { moeda } from "./componentes.js";
import { podePagar } from "./pagamento.js";

export function pagar(caronaId, passageiroId, { agora = new Date() } = {}) {
  const carona = obter("caronas", caronaId);
  const v = podePagar({ carona, passageiroId, solicitacoes: listar("solicitacoes"), pagamentos: listar("pagamentos") });
  if (!v.ok) return v;
  const registro = inserir("pagamentos", {
    caronaId, passageiroId, motoristaId: carona.motoristaId, valor: v.valor,
    metodo: "pix", simulado: true, pagoEm: agora.toISOString()
  });
  if (!registro) return { ok: false, motivo: "Não foi possível gravar no armazenamento do navegador.", codigo: "gravacao" };
  const nome = obter("usuarios", passageiroId)?.nome ?? "Um passageiro";
  notificar(carona.motoristaId, `${nome} pagou ${moeda(v.valor)} (simulado) da viagem ${carona.origem} → ${carona.destino}.`);
  return { ok: true, pagamento: registro };
}
