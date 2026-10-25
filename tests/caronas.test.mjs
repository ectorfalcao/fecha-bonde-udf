import test, { beforeEach } from "node:test";
import assert from "node:assert/strict";
import * as C from "../js/caronas.js";
import { TURNOS } from "../js/regras.js";
import { iniciarDados, listar, obter } from "../js/dados.js";
import { instalarAmbiente } from "./dom-falso.mjs";

const AGORA = new Date(2030, 0, 1, 8, 0);                 // terça, 01/01/2030 08:00
const saida = (dias, h, m = 0) => new Date(2030, 0, 1 + dias, h, m).toISOString();
const veiculo = { capacidade: 3 };
const base = { origem: "aguas-claras", destino: "campus", data: "2030-01-10", hora: "18:30", tolerancia: "10", vagas: "2", valor: "7,50", turno: "Noturno", apenasMulheres: false, recorrente: false, dias: [], dataFim: "" };
const validar = (d, extra = {}) => C.validarOferta({ ...base, ...d }, { veiculo, motorista: { genero: "masculino" }, agora: AGORA, ...extra });

test("distanciaKm: zero no mesmo ponto e ordem de grandeza plausível", () => {
  const campus = C.localPorId("campus"), ac = C.localPorId("aguas-claras");
  assert.equal(C.distanciaKm(campus, campus), 0);
  const d = C.distanciaKm(campus, ac);
  assert.ok(d > 8 && d < 16, `distância ${d}`);
  assert.ok(Math.abs(d - C.distanciaKm(ac, campus)) < 1e-9);
});
test("turnoDaHora e tempo de viagem (mínimo 10 min; desconhecido = 30)", () => {
  assert.deepEqual([5, 11, 12, 17, 18, 23].map(C.turnoDaHora), ["Matutino", "Matutino", "Vespertino", "Vespertino", "Noturno", "Noturno"]);
  assert.ok(C.tempoViagemMin("aguas-claras", "campus") >= 10);
  assert.equal(C.tempoViagemMin("campus", "campus"), 10);
  assert.equal(C.tempoViagemMin("x", "y"), 30);
});
test("dataHoraDe valida data e hora", () => {
  assert.equal(C.dataHoraDe("2030-01-10", "18:30").getHours(), 18);
  assert.equal(C.dataHoraDe("10/01/2030", "18:30"), null);
  assert.equal(C.dataHoraDe("2030-01-10", "25:00"), null);
});
test("RF05: gera uma carona por data nos dias escolhidos", () => {
  const s = C.gerarOcorrencias({ data: "2030-01-07", dataFim: "2030-01-20", dias: [1, 3], hora: "07:00" });   // seg e qua
  assert.equal(s.length, 4);
  assert.deepEqual(s.map((x) => new Date(x).getDay()), [1, 3, 1, 3]);
  assert.ok(s.every((x) => new Date(x).getHours() === 7));
  assert.deepEqual(C.gerarOcorrencias({ data: "x", dataFim: "2030-01-20", dias: [1], hora: "07:00" }), []);
  assert.deepEqual(C.gerarOcorrencias({ data: "2030-01-07", dataFim: "2030-01-07", dias: [3], hora: "07:00" }), []);
});

test("RF04: oferta válida não gera erros (valor aceita vírgula e 0)", () => {
  assert.deepEqual(validar({}), {});
  assert.deepEqual(validar({ valor: "0" }), {});
});
test("RF04: trajeto precisa ter origem, destino distintos e o campus em uma ponta", () => {
  assert.ok(validar({ origem: "" }).origem);
  assert.ok(validar({ destino: "" }).destino);
  assert.ok(validar({ origem: "campus", destino: "campus" }).destino);
  assert.match(validar({ origem: "guara", destino: "taguatinga" }).destino, /campus/);
  assert.deepEqual(validar({ origem: "campus", destino: "guara" }), {});
});
test("RF04: saída no passado, data e hora ausentes", () => {
  assert.ok(validar({ data: "2029-12-31" }).data);
  assert.ok(validar({ data: "" }).data);
  assert.ok(validar({ hora: "" }).hora);
});
test("RN04: vagas entre 1 e a capacidade do veículo (máx. 4)", () => {
  assert.ok(validar({ vagas: "0" }).vagas);
  assert.ok(validar({ vagas: "4" }).vagas);          // veículo só comporta 3
  assert.ok(validar({ vagas: "" }).vagas);
  assert.ok(validar({ vagas: "1.5" }).vagas);
  assert.deepEqual(validar({ vagas: "3" }), {});
  assert.ok(C.validarOferta({ ...base, vagas: "5" }, { veiculo: { capacidade: 9 }, motorista: {}, agora: AGORA }).vagas);
});
test("valor: de 0 a 999", () => {
  for (const v of ["", "-1", "1000", "abc"]) assert.ok(validar({ valor: v }).valor, v);
});
test("turno e tolerância precisam ser válidos", () => {
  assert.ok(validar({ turno: "" }).turno);
  assert.ok(validar({ tolerancia: "7" }).tolerancia);
});
test("RN05: só motorista do gênero feminino cria carona só para mulheres", () => {
  assert.ok(validar({ apenasMulheres: true }).apenasMulheres);
  assert.deepEqual(validar({ apenasMulheres: true }, { motorista: { genero: "feminino" } }), {});
  assert.ok(validar({ apenasMulheres: true }, { motorista: { genero: "outro" } }).apenasMulheres);
});
test("RF05: recorrência exige dias, data final válida e no máximo 182 dias", () => {
  assert.ok(validar({ recorrente: true, dias: [], dataFim: "2030-02-10" }).dias);
  assert.ok(validar({ recorrente: true, dias: [1] }).dataFim);
  assert.match(validar({ recorrente: true, dias: [1], dataFim: "2030-01-05" }).dataFim, /posterior/);
  assert.match(validar({ recorrente: true, dias: [1], dataFim: "2030-12-31" }).dataFim, /182/);
  assert.deepEqual(validar({ recorrente: true, dias: [1], dataFim: "2030-03-10" }), {});
});

// RF06 / RN05: filtros. ctx injeta o acesso aos dados.
const motoristas = { m: { id: "m", genero: "feminino" }, h: { id: "h", genero: "masculino" } };
const ctxDe = (usuario, confirmados = {}) => ({ usuario, motoristaDe: (c) => motoristas[c.motoristaId], passageirosConfirmados: (c) => confirmados[c.id] ?? [] });
const carona = (id, extra = {}) => ({ id, motoristaId: "h", origemId: "aguas-claras", destinoId: "campus", turno: "Noturno", dataHoraSaida: saida(1, 18, 30), status: "aberta", apenasMulheres: false, vagasTotal: 2, ...extra });
const ids = (r) => r.map((x) => x.carona.id);
const homem = { id: "p1", genero: "masculino" }, mulher = { id: "p2", genero: "feminino" };

test("RF06: só mostra caronas abertas e futuras, em ordem de saída", () => {
  const lista = [carona("tarde", { dataHoraSaida: saida(2, 18) }), carona("cancelada", { status: "cancelada" }), carona("passada", { dataHoraSaida: saida(-1, 18) }), carona("cedo", { dataHoraSaida: saida(1, 7) })];
  assert.deepEqual(ids(C.filtrarCaronas(lista, {}, ctxDe(homem), AGORA)), ["cedo", "tarde"]);
});
test("RF06: filtro de turno; 'Integral' casa com qualquer turno", () => {
  const lista = [carona("n"), carona("m", { turno: "Matutino" }), carona("i", { turno: "Integral" })];
  assert.deepEqual(ids(C.filtrarCaronas(lista, { turno: "Matutino" }, ctxDe(homem), AGORA)).sort(), ["i", "m"]);
});
test("RF06: raio a partir da partida do passageiro", () => {
  const lista = [carona("perto", { origemId: "aguas-claras" }), carona("longe", { origemId: "planaltina-go" })];
  assert.deepEqual(ids(C.filtrarCaronas(lista, { partidaId: "taguatinga", raioKm: 10 }, ctxDe(homem), AGORA)), ["perto"]);
  assert.equal(C.filtrarCaronas(lista, { partidaId: "taguatinga", raioKm: 0 }, ctxDe(homem), AGORA).length, 2);   // 0 = sem limite
});
test("RF06: horário estimado de chegada", () => {
  const lista = [carona("cedo", { dataHoraSaida: saida(1, 6, 0) }), carona("tarde", { dataHoraSaida: saida(1, 18, 30) })];
  assert.deepEqual(ids(C.filtrarCaronas(lista, { chegarAteMin: 8 * 60 }, ctxDe(homem), AGORA)), ["cedo"]);
});
test("RN05: carona só para mulheres some para quem não é do gênero feminino", () => {
  const lista = [carona("so", { motoristaId: "m", apenasMulheres: true }), carona("geral")];
  assert.deepEqual(ids(C.filtrarCaronas(lista, {}, ctxDe(homem), AGORA)), ["geral"]);
  assert.deepEqual(ids(C.filtrarCaronas(lista, {}, ctxDe({ id: "o", genero: "outro" }), AGORA)), ["geral"]);
  assert.equal(C.filtrarCaronas(lista, {}, ctxDe(mulher), AGORA).length, 2);
});
test("RN05: some também se houver passageiro não feminino confirmado; filtro 'só mulheres'", () => {
  const lista = [carona("so", { motoristaId: "m", apenasMulheres: true }), carona("geral")];
  assert.deepEqual(ids(C.filtrarCaronas(lista, {}, ctxDe(mulher, { so: [homem] }), AGORA)), ["geral"]);
  assert.deepEqual(ids(C.filtrarCaronas(lista, { soMulheres: true }, ctxDe(mulher), AGORA)), ["so"]);
});
test("exclusivaFeminina: motorista masculino nunca é exclusiva", () => {
  assert.equal(C.exclusivaFeminina(carona("x", { apenasMulheres: true, motoristaId: "h" }), ctxDe(mulher)), false);
});

test("dados fictícios (v3) são compatíveis com os filtros e com a RN04", () => {
  instalarAmbiente(); iniciarDados();
  for (const c of listar("caronas")) {
    assert.ok(C.localPorId(c.origemId) && C.localPorId(c.destinoId), c.id);
    assert.ok(TURNOS.includes(c.turno), c.id);
    assert.ok(c.origemId === C.CAMPUS_ID || c.destinoId === C.CAMPUS_ID, c.id);
    assert.ok(c.vagasTotal >= 1 && c.vagasTotal <= obter("veiculos", c.veiculoId).capacidade, c.id);
    assert.equal(c.origem, C.localPorId(c.origemId).nome);
  }
});
