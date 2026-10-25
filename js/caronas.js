// Regras de caronas (RF04, RF05, RF06, RN04, RN05) como funções PURAS: sem DOM, sem storage.
import { TURNOS, CAPACIDADE_MAX } from "./regras.js";

export const CAMPUS_ID = "campus";
// Coordenadas APROXIMADAS, só para demonstrar o filtro de raio. Não servem para navegação.
// Regiões vêm das respostas da pesquisa de validação (seção 5 da documentação).
export const LOCAIS = [
  { id: "campus", nome: "UDF Campus Sede (Asa Sul)", lat: -15.830, lng: -47.910 },
  { id: "aguas-claras", nome: "Águas Claras", lat: -15.834, lng: -48.027 },
  { id: "guara", nome: "Guará", lat: -15.819, lng: -47.978 },
  { id: "taguatinga", nome: "Taguatinga", lat: -15.833, lng: -48.057 },
  { id: "cruzeiro-novo", nome: "Cruzeiro Novo", lat: -15.793, lng: -47.938 },
  { id: "jardim-botanico", nome: "Jardim Botânico", lat: -15.876, lng: -47.800 },
  { id: "paranoa", nome: "Paranoá", lat: -15.774, lng: -47.779 },
  { id: "planaltina-df", nome: "Planaltina (DF)", lat: -15.620, lng: -47.650 },
  { id: "planaltina-go", nome: "Planaltina de Goiás", lat: -15.453, lng: -47.614 },
  { id: "valparaiso", nome: "Valparaíso de Goiás", lat: -16.065, lng: -47.975 }
];
export const localPorId = (id) => LOCAIS.find((l) => l.id === id) ?? null;
export const localPorNome = (n) => LOCAIS.find((l) => l.nome === n) ?? null;

export const TOLERANCIAS = [5, 10, 15, 20];
export const DIAS_SEMANA = [[1, "Seg"], [2, "Ter"], [3, "Qua"], [4, "Qui"], [5, "Sex"], [6, "Sáb"]];
export const MAX_DIAS_SERIE = 182; // ~1 semestre. Premissa: a documentação não traz o calendário acadêmico (RF05).

export function distanciaKm(a, b) { // fórmula de haversine (linha reta)
  const rad = (x) => (x * Math.PI) / 180, R = 6371;
  const dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
export const turnoDaHora = (h) => (h < 12 ? "Matutino" : h < 18 ? "Vespertino" : "Noturno");

// Premissa: trânsito urbano ~30 km/h e trajeto 30% mais longo que a linha reta.
export function tempoViagemMin(origemId, destinoId) {
  const a = localPorId(origemId), b = localPorId(destinoId);
  return a && b ? Math.max(10, Math.round(((distanciaKm(a, b) * 1.3) / 30) * 60)) : 30;
}
export const chegadaEstimada = (c) => new Date(new Date(c.dataHoraSaida).getTime() + tempoViagemMin(c.origemId, c.destinoId) * 60000);

const parseData = (s) => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s ?? "")); return m ? { y: +m[1], m: +m[2], d: +m[3] } : null; };
const parseHora = (s) => { const m = /^(\d{2}):(\d{2})$/.exec(String(s ?? "")); return m && +m[1] < 24 && +m[2] < 60 ? { h: +m[1], mi: +m[2] } : null; };
export function dataHoraDe(data, hora) {
  const d = parseData(data), t = parseHora(hora);
  return d && t ? new Date(d.y, d.m - 1, d.d, t.h, t.mi) : null;
}

// RF05: uma carona por data em que cai um dos dias da semana escolhidos.
export function gerarOcorrencias({ data, dataFim, dias, hora }) {
  const ini = parseData(data), fim = parseData(dataFim), t = parseHora(hora);
  if (!ini || !fim || !t) return [];
  const fimData = new Date(fim.y, fim.m - 1, fim.d), saidas = [];
  for (const d = new Date(ini.y, ini.m - 1, ini.d); d <= fimData; d.setDate(d.getDate() + 1))
    if (dias.includes(d.getDay())) saidas.push(new Date(d.getFullYear(), d.getMonth(), d.getDate(), t.h, t.mi).toISOString());
  return saidas;
}

// RF04 / RN04 / RN05: devolve { idDoCampo: mensagem }; vazio = válido.
export function validarOferta(d, { veiculo, motorista, agora = new Date() }) {
  const e = {};
  if (!localPorId(d.origem)) e.origem = "Escolha o ponto de partida.";
  if (!localPorId(d.destino)) e.destino = "Escolha o destino.";
  else if (d.origem === d.destino) e.destino = "Partida e destino devem ser diferentes.";
  else if (d.origem !== CAMPUS_ID && d.destino !== CAMPUS_ID) e.destino = "Uma das pontas da carona precisa ser o campus UDF.";
  const saida = dataHoraDe(d.data, d.hora);
  if (!parseData(d.data)) e.data = "Informe a data.";
  if (!parseHora(d.hora)) e.hora = "Informe o horário de saída.";
  if (saida && saida <= agora) e.data = "A saída precisa estar no futuro.";
  if (!TOLERANCIAS.includes(Number(d.tolerancia))) e.tolerancia = "Escolha a tolerância de atraso.";
  const max = Math.min(CAPACIDADE_MAX, veiculo?.capacidade ?? 0);
  if (!Number.isInteger(Number(d.vagas)) || d.vagas === "" || Number(d.vagas) < 1 || Number(d.vagas) > max)
    e.vagas = `Informe de 1 a ${max} vaga(s): é o limite do seu veículo (RN04).`;
  const valor = Number(String(d.valor ?? "").trim().replace(",", "."));
  if (String(d.valor ?? "").trim() === "" || !Number.isFinite(valor) || valor < 0 || valor > 999) e.valor = "Informe um valor de 0 a 999 (0 = carona gratuita).";
  if (!TURNOS.includes(d.turno)) e.turno = "Escolha o turno.";
  if (d.apenasMulheres && motorista?.genero !== "feminino") e.apenasMulheres = "Só motoristas do gênero feminino podem criar caronas só para mulheres (RN05).";
  if (d.recorrente) {
    if (!d.dias?.length) e.dias = "Escolha ao menos um dia da semana.";
    const ini = parseData(d.data), fim = parseData(d.dataFim);
    if (!fim) e.dataFim = "Informe até quando a carona se repete.";
    else if (ini) {
      const dias = (new Date(fim.y, fim.m - 1, fim.d) - new Date(ini.y, ini.m - 1, ini.d)) / 86400000;
      if (dias < 0) e.dataFim = "A data final deve ser igual ou posterior à data inicial.";
      else if (dias > MAX_DIAS_SERIE) e.dataFim = `O período máximo é de ${MAX_DIAS_SERIE} dias (um semestre).`;
    }
  }
  return e;
}

export const minutosDoDia = (d) => d.getHours() * 60 + d.getMinutes();
export const exclusivaFeminina = (c, ctx) =>
  Boolean(c.apenasMulheres) && ctx.motoristaDe(c)?.genero === "feminino" && ctx.passageirosConfirmados(c).every((p) => p.genero === "feminino");

// RF06 + RN05. ctx injeta o acesso a dados: { usuario, motoristaDe(c), passageirosConfirmados(c) }.
// Premissas: (1) caronas só para mulheres nunca aparecem para quem não é do gênero feminino; (2) turno "Integral" casa com qualquer filtro.
export function filtrarCaronas(caronas, f, ctx, agora = new Date()) {
  const partida = f.partidaId ? localPorId(f.partidaId) : null;
  return caronas
    .filter((c) => c.status === "aberta" && new Date(c.dataHoraSaida) > agora)
    .filter((c) => !c.apenasMulheres || (ctx.usuario?.genero === "feminino" && exclusivaFeminina(c, ctx)))
    .filter((c) => !f.soMulheres || c.apenasMulheres)
    .filter((c) => !f.turno || c.turno === f.turno || c.turno === "Integral")
    .filter((c) => f.chegarAteMin == null || minutosDoDia(chegadaEstimada(c)) <= f.chegarAteMin)
    .map((c) => ({ carona: c, distanciaKm: partida && localPorId(c.origemId) ? distanciaKm(partida, localPorId(c.origemId)) : null }))
    .filter((r) => !f.raioKm || r.distanciaKm == null || r.distanciaKm <= f.raioKm)
    .sort((a, b) => new Date(a.carona.dataHoraSaida) - new Date(b.carona.dataHoraSaida) || (a.distanciaKm ?? 0) - (b.distanciaKm ?? 0));
}
