import { el, moeda, dataHora } from "./componentes.js";
import { obter, vagasDisponiveis } from "./dados.js";
import { chegadaEstimada } from "./caronas.js";

const hora = (d) => new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(d);

export function cartaoCarona(c, { distanciaKm = null, acao = null } = {}) {
  const motorista = obter("usuarios", c.motoristaId), vagas = vagasDisponiveis(c);
  const linhas = [
    ["Saída", `${dataHora(c.dataHoraSaida)} (tolerância de ${c.toleranciaMin ?? 0} min)`],
    ["Chegada estimada", hora(chegadaEstimada(c))],
    ["Motorista", motorista?.nome ?? "—"],
    ["Vagas", vagas > 0 ? `${vagas} de ${c.vagasTotal}` : "Lotada (você pode entrar na lista de espera)"],
    ["Contribuição", moeda(c.valor), "valor"],
    distanciaKm != null && ["Distância da partida", `${distanciaKm.toFixed(1).replace(".", ",")} km em linha reta`],
    c.recorrente && ["Recorrência", "Repete semanalmente"],
    c.apenasMulheres && ["Grupo", "Só para mulheres"],
    c.regras && ["Regras", c.regras]
  ].filter(Boolean);
  return el("li", { class: "carona" },
    el("h3", {}, `${c.origem} → ${c.destino}`),
    el("dl", {}, linhas.flatMap(([t, v, cls]) => [el("dt", {}, t), el("dd", { class: cls }, v)])),
    acao);
}