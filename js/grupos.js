// Regras da Etapa 7 (RF07, RF08, RF09, RN03, RN05, RN06) como funções PURAS: sem DOM, sem storage.
// Estados da solicitação: pendente -> confirmada | recusada ; espera -> pendente ; qualquer ativa -> cancelada.
import { exclusivaFeminina } from "./caronas.js";

export const ATIVAS = ["pendente", "confirmada", "espera"];
// Premissa: a documentação diz "antecedência mínima configurada" (RF09) sem valor. Adotamos 2 horas.
export const ANTECEDENCIA_CANCELAR_CARONA_H = 2;

const ROTULOS = {
  pendente: "⏳ Aguardando aprovação do motorista",
  confirmada: "✔ Confirmada",
  espera: "⌛ Na lista de espera",
  recusada: "✖ Recusada pelo motorista",
  cancelada: "✖ Cancelada"
};
export function rotuloStatus(s) {
  if (s.status === "cancelada" && s.canceladaPor === "motorista") return "✖ Carona cancelada pelo motorista";
  return ROTULOS[s.status] ?? s.status;
}

const daCarona = (carona, sols) => sols.filter((s) => s.caronaId === carona.id);
export const vagasLivres = (carona, sols) =>
  Math.max(0, carona.vagasTotal - daCarona(carona, sols).filter((s) => s.status === "confirmada").length);
export const statusInicial = (carona, sols) => (vagasLivres(carona, sols) > 0 ? "pendente" : "espera"); // RN06

// Fila por ordem de chegada (criadaEm). O sort do JS é estável: empates mantêm a ordem de gravação.
export const filaOrdenada = (carona, sols) =>
  daCarona(carona, sols).filter((s) => s.status === "espera").sort((a, b) => String(a.criadaEm ?? "").localeCompare(String(b.criadaEm ?? "")));
export const posicaoNaFila = (sol, carona, sols) => filaOrdenada(carona, sols).findIndex((s) => s.id === sol.id) + 1; // 0 = fora da fila

const nao = (motivo, codigo) => ({ ok: false, motivo, codigo });

// RF07 / RF03 / RN02 / RN03 / RN05. ctx: { usuario, motoristaDe(c), passageirosConfirmados(c) } (o mesmo de filtrarCaronas).
export function podeSolicitar({ carona, usuario, solicitacoes, pendencias = [], ctx, agora = new Date() }) {
  if (!carona || carona.status !== "aberta" || new Date(carona.dataHoraSaida) <= agora) return nao("Esta carona não está mais disponível.", "indisponivel");
  if (carona.motoristaId === usuario.id) return nao("Você é o motorista desta carona.", "propria");
  if (!usuario.passageiro) return nao("Marque \"Quero pegar carona\" no seu perfil para solicitar vagas.", "papel");
  if (pendencias.length) return nao(`Complete o perfil antes de solicitar (RN02). Falta: ${pendencias.join(", ")}.`, "perfil");
  // Premissa (D7): passageira de gênero feminino pode entrar em grupo só para mulheres; "outro" e masculino não.
  if (carona.apenasMulheres && !(usuario.genero === "feminino" && exclusivaFeminina(carona, ctx))) return nao("Esta carona é só para mulheres (RN05).", "genero");
  const minhas = solicitacoes.filter((s) => s.caronaId === carona.id && s.passageiroId === usuario.id);
  if (minhas.some((s) => ATIVAS.includes(s.status))) return nao("Você já tem uma solicitação ativa nesta carona.", "duplicada");
  if (minhas.some((s) => s.status === "recusada")) return nao("O motorista recusou sua solicitação anterior para esta carona.", "recusada");
  if (!usuario.termosConvivenciaEm) return nao("Aceite os termos de convivência antes de solicitar (RN03).", "termos");
  return { ok: true, status: statusInicial(carona, solicitacoes) };
}

export function podeAprovar(carona, solicitacoes, sol) {
  if (carona.status !== "aberta") return nao("A carona não está aberta.", "indisponivel");
  if (sol.status !== "pendente") return nao("Só é possível aprovar solicitações pendentes.", "estado");
  if (vagasLivres(carona, solicitacoes) === 0) return nao("A carona está lotada.", "lotada");
  return { ok: true };
}

// RF09 (motorista): só até X horas antes da saída. Premissa: bloqueia, em vez de só avisar.
export function podeCancelarCarona(carona, agora = new Date()) {
  if (carona.status !== "aberta") return nao("Esta carona já não está aberta.", "estado");
  const horas = (new Date(carona.dataHoraSaida) - agora) / 3600000;
  if (horas < ANTECEDENCIA_CANCELAR_CARONA_H) return nao(`O cancelamento precisa ser feito com pelo menos ${ANTECEDENCIA_CANCELAR_CARONA_H} horas de antecedência.`, "antecedencia");
  return { ok: true };
}

// RN06: depois de qualquer mudança, acomoda a fila.
// - Lotada: pedidos pendentes passam para a lista de espera.
// - Com vaga: os primeiros da fila viram "pendente" (o motorista ainda aprova), sem passar do número de vagas livres.
export function planoDeFila(carona, sols) {
  if (carona.status !== "aberta") return { paraEspera: [], paraPendente: [] };
  const livres = vagasLivres(carona, sols);
  const pendentes = daCarona(carona, sols).filter((s) => s.status === "pendente");
  if (livres === 0) return { paraEspera: pendentes, paraPendente: [] };
  return { paraEspera: [], paraPendente: filaOrdenada(carona, sols).slice(0, Math.max(0, livres - pendentes.length)) };
}
