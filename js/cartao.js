import { el, moeda } from "./componentes.js";
import { obter, vagasDisponiveis, listar } from "./dados.js";
import { chegadaEstimada, tempoViagemMin } from "./caronas.js";
import { mediaDe, textoMedia } from "./avaliacao.js";

const hora = (d) => new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(new Date(d));
const dia = (d) => new Intl.DateTimeFormat("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" }).format(new Date(d));

// Etapa 9.2: a carona desenhada como linha de transporte. Partida (círculo vazado) e destino (círculo
// verde-petróleo) com os horários grandes à direita; os pontos são decorativos, o texto diz tudo.
export function percurso(c, meio = `≈ ${tempoViagemMin(c.origemId, c.destinoId)} min de viagem`) {
  const ponto = (tipo) => el("span", { class: `ponto ${tipo}`, "aria-hidden": "true" });
  return el("div", { class: "percurso" },
    ponto("origem"), el("span", { class: "lugar" }, c.origem),
    el("span", { class: "hora" }, el("small", {}, `saída · ${dia(c.dataHoraSaida)}`), el("time", { datetime: c.dataHoraSaida }, hora(c.dataHoraSaida))),
    el("span", { class: "traco", "aria-hidden": "true" }), el("span", { class: "nota" }, meio),
    ponto("destino"), el("span", { class: "lugar" }, c.destino),
    el("span", { class: "hora" }, el("small", {}, "chegada"), el("time", {}, hora(chegadaEstimada(c)))));
}

// Título da rota para leitor de tela e navegação por títulos + o percurso visível.
export const topoCarona = (c, nivel = "h3") => [el(nivel, { class: "sr-only" }, `${c.origem} → ${c.destino}`), percurso(c)];

const selos = (c) => {
  const lista = [c.recorrente && "Repete toda semana", c.apenasMulheres && "Só para mulheres"].filter(Boolean);
  return lista.length > 0 && el("p", { class: "selos" }, lista.map((t) => el("span", { class: "selo neutro" }, t)));
};

export function cartaoCarona(c, { distanciaKm = null, acao = null } = {}) {
  const motorista = obter("usuarios", c.motoristaId), vagas = vagasDisponiveis(c);
  // Ordem de leitura (proposta da Etapa 9): percurso e horários, se dá para ir, com quem e quanto, detalhes.
  const linhas = [
    ["Vagas", vagas > 0 ? `${vagas} de ${c.vagasTotal}` : "Lotada (você pode entrar na lista de espera)"],
    ["Motorista", `${motorista?.nome ?? "—"} · ${textoMedia(mediaDe(c.motoristaId, listar("avaliacoes")))}`], // RF14: reputação ajuda a escolher
    ["Contribuição", moeda(c.valor), "valor"],
    distanciaKm != null && ["Distância da partida", `${distanciaKm.toFixed(1).replace(".", ",")} km em linha reta`],
    c.regras && ["Regras", c.regras]
  ].filter(Boolean);
  return el("li", { class: "carona" },
    el("h3", { class: "sr-only" }, `${c.origem} → ${c.destino}`),
    percurso(c, `≈ ${tempoViagemMin(c.origemId, c.destinoId)} min · tolerância de ${c.toleranciaMin ?? 0} min`),
    selos(c),
    el("dl", {}, linhas.flatMap(([t, v, cls]) => [el("dt", {}, t), el("dd", { class: cls }, v)])),
    acao);
}
