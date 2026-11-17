import { el, moeda, fatos, avatar, selo } from "./componentes.js";
import { rotuloStatus, situacaoDe } from "./grupos.js";
import { obter, vagasDisponiveis, listar } from "./dados.js";
import { chegadaEstimada, tempoViagemMin } from "./caronas.js";
import { mediaDe, textoMedia } from "./avaliacao.js";
import { icone } from "./icones.js";

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

// Vagas em pontos: cheios = livres, vazios = ocupados. Decorativo (o texto ao lado diz o número).
export const pontosVagas = (livres, total) =>
  el("span", { class: "vagas-pontos", "aria-hidden": "true" },
    Array.from({ length: total }, (_, i) => el("i", { class: i < livres ? "" : "ocupada" })));

// Selos com ícone: repetição semanal e grupo só para mulheres.
export const selosCarona = (c) => {
  const lista = [c.recorrente && ["Repete toda semana", "repetir"], c.apenasMulheres && ["Só para mulheres", "escudo"]].filter(Boolean);
  return lista.length > 0 && el("p", { class: "selos" }, lista.map(([t, i]) => el("span", { class: "selo neutro" }, icone(i, { tamanho: 14 }), t)));
};

// Situação de uma solicitação como selo: ícone + texto + cor (estado nunca só por cor).
const VISUAL = {
  pendente: ["ampulheta", ""], espera: ["fila", ""], confirmada: ["check", "marca"], andamento: ["carro", "escuro"],
  concluida: ["bandeira", "marca"], recusada: ["fechar", "neutro"], cancelada: ["fechar", "neutro"]
};
export const seloSituacao = (s, c) => {
  const [nomeIcone, variante] = VISUAL[situacaoDe(s, c)] ?? ["info", "neutro"];
  return selo(rotuloStatus(s, c), variante, nomeIcone);
};

// Motorista com avatar e reputação (RF14): ajuda a escolher a carona.
export const motoristaComNota = (id) => {
  const m = obter("usuarios", id);
  return el("span", { class: "pessoa" }, avatar(m?.nome, "sm"),
    el("span", { class: "pessoa-texto" }, `${m?.nome ?? "—"} · ${textoMedia(mediaDe(id, listar("avaliacoes")))}`));
};

export function cartaoCarona(c, { distanciaKm = null, acao = null } = {}) {
  const vagas = vagasDisponiveis(c);
  // Ordem de leitura (proposta da Etapa 9): percurso e horários, se dá para ir, com quem e quanto, detalhes.
  const linhas = [
    ["Vagas", vagas > 0 ? [`${vagas} de ${c.vagasTotal}`, pontosVagas(vagas, c.vagasTotal)] : "Lotada (você pode entrar na lista de espera)"],
    ["Contribuição", moeda(c.valor), "valor"],
    ["Motorista", motoristaComNota(c.motoristaId), null, "largo"],
    distanciaKm != null && ["Distância da partida", `${distanciaKm.toFixed(1).replace(".", ",")} km em linha reta`],
    c.regras && ["Regras", c.regras, null, distanciaKm != null ? null : "largo"]
  ];
  return el("li", { class: "carona" },
    el("h3", { class: "sr-only" }, `${c.origem} → ${c.destino}`),
    percurso(c, `≈ ${tempoViagemMin(c.origemId, c.destinoId)} min · tolerância de ${c.toleranciaMin ?? 0} min`),
    selosCarona(c),
    fatos(linhas),
    acao && el("div", { class: "acao-carona" }, acao));
}
