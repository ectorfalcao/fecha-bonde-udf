// Etapa 11: mapa real (RF11, RN08, US07). Rota pelas ruas (OSRM), posição no trajeto, GPS do motorista
// compartilhado neste navegador e a tela da viagem. A rede NUNCA é acessada: o buscador é falso.
import test, { beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import * as R from "../js/rotas.js";
import * as P from "../js/posicoes.js";
import { carregarLeaflet } from "../js/mapaReal.js";
import { iniciarViagem, concluirViagem } from "../js/viagens.js";
import { telaViagemAtiva } from "../js/viagemAtiva.js";
import { localPorId } from "../js/caronas.js";
import { iniciarDados, obter } from "../js/dados.js";
import { salvar, carregar } from "../js/store.js";
import { instalarAmbiente, achar, botao, textoDe } from "./dom-falso.mjs";

const navOriginal = Object.getOwnPropertyDescriptor(globalThis, "navigator");
const usarGeo = (geo) => Object.defineProperty(globalThis, "navigator", { value: { geolocation: geo }, configurable: true, writable: true });
beforeEach(() => { P.pararCompartilhamento(); instalarAmbiente(); iniciarDados(); });
afterEach(() => { P.pararCompartilhamento(); if (navOriginal) Object.defineProperty(globalThis, "navigator", navOriginal); });

const saida = () => new Date(obter("caronas", "c1").dataHoraSaida).getTime();
const iniciarC1 = () => iniciarViagem("c1", "u1", { agora: new Date(saida() - 5 * 60000) });
const semLixo = (n) => { const t = textoDe(n); for (const re of [/\[object/, /undefined/, /null/, /false/, /NaN/]) assert.doesNotMatch(t, re); };

// Geolocalização falsa: guarda os callbacks para o teste "mover" o aparelho.
function geoFalso() {
  const g = { ok: null, erro: null, limpo: null, watchPosition(ok, erro) { g.ok = ok; g.erro = erro; return 7; }, clearWatch(id) { g.limpo = id; } };
  g.mover = (lat, lng, accuracy = 12) => g.ok({ coords: { latitude: lat, longitude: lng, accuracy } });
  return g;
}

// ---------- rota ----------
test("rotaDoOsrm: converte [lng, lat] em [lat, lng], km e minutos; resposta ruim vira null", () => {
  const r = R.rotaDoOsrm({ code: "Ok", routes: [{ distance: 18400, duration: 1500, geometry: { coordinates: [[-48.0, -15.84], [-47.95, -15.82], [-47.9, -15.8]] } }] });
  assert.deepEqual(r.pontos[0], [-15.84, -48.0]);
  assert.equal(r.distanciaKm, 18.4);
  assert.equal(r.duracaoMin, 25);
  assert.equal(r.fonte, "osrm");
  for (const ruim of [null, {}, { code: "NoRoute" }, { code: "Ok", routes: [{ geometry: { coordinates: [[1, 2]] } }] }]) assert.equal(R.rotaDoOsrm(ruim), null);
});

test("pontoNaRota: começo, fim, meio pelo comprimento (não pelo número de pontos) e limites", () => {
  const pontos = [[0, 0], [0, 1], [0, 3]];                 // trechos de ~1 e ~2 unidades
  assert.deepEqual(R.pontoNaRota(pontos, 0), [0, 0]);
  assert.deepEqual(R.pontoNaRota(pontos, 1), [0, 3]);
  const meio = R.pontoNaRota(pontos, 0.5);                 // metade do comprimento total = 1,5
  assert.ok(Math.abs(meio[1] - 1.5) < 1e-6, String(meio));
  assert.deepEqual(R.pontoNaRota(pontos, -3), [0, 0]);
  assert.deepEqual(R.pontoNaRota(pontos, 9), [0, 3]);
  assert.equal(R.pontoNaRota([], 0.5), null);
});

test("buscarRota: pede ao OSRM só as coordenadas da lista, guarda a rota e não pede de novo", async () => {
  const pedidos = [];
  const buscar = async (url) => { pedidos.push(url); return { ok: true, json: async () => ({ code: "Ok", routes: [{ distance: 9000, duration: 900, geometry: { coordinates: [[-47.97681, -15.82356], [-47.8998, -15.80255]] } }] }) }; };
  const r = await R.buscarRota("guara", "campus", { buscar });
  assert.equal(r.fonte, "osrm");
  const g = localPorId("guara"), u = localPorId("campus");
  assert.ok(pedidos[0].startsWith(`${R.URL_OSRM}${g.lng},${g.lat};${u.lng},${u.lat}`), pedidos[0]);
  await R.buscarRota("guara", "campus", { buscar });
  assert.equal(pedidos.length, 1, "a segunda vez vem do armazenamento");
  assert.ok(carregar("rotas", {})["guara>campus"]);
});

test("buscarRota: erro, resposta ruim ou sem rede viram linha reta (e não são guardados)", async () => {
  for (const buscar of [async () => { throw new Error("offline"); }, async () => ({ ok: false }), async () => ({ ok: true, json: async () => ({ code: "NoRoute" }) }), null]) {
    const r = await R.buscarRota("guara", "campus", { buscar });
    assert.equal(r.fonte, "reta");
    assert.equal(r.pontos.length, 2);
  }
  assert.equal(carregar("rotas", {})["guara>campus"], undefined);
  assert.equal(await R.buscarRota("x", "campus", { buscar: async () => ({ ok: false }) }), null);
});

test("buscarRota: serviço lento é abandonado pelo tempo limite", async () => {
  const lento = (_, { signal }) => new Promise((_, rej) => signal?.addEventListener("abort", () => rej(new Error("abortado"))));
  const r = await R.buscarRota("guara", "campus", { buscar: lento, tempoLimiteMs: 20 });
  assert.equal(r.fonte, "reta");
});

// ---------- posição ----------
test("posicaoDoVeiculo: GPS recente vence; antigo ou ausente cai para a estimativa rotulada", () => {
  const agora = new Date("2030-01-01T18:10:00Z"), estimada = { lat: 1, lng: 2, progresso: 0.3 };
  const recente = { lat: 5, lng: 6, precisao: 10, em: "2030-01-01T18:09:30Z" };
  assert.deepEqual(P.posicaoDoVeiculo({ gps: recente, estimada, agora }), { lat: 5, lng: 6, precisao: 10, fonte: "gps", em: recente.em });
  const velho = { ...recente, em: "2030-01-01T18:00:00Z" };
  assert.deepEqual(P.posicaoDoVeiculo({ gps: velho, estimada, agora }), { lat: 1, lng: 2, fonte: "estimada", gpsAntigo: true });
  assert.deepEqual(P.posicaoDoVeiculo({ gps: null, estimada, agora }), { lat: 1, lng: 2, fonte: "estimada", gpsAntigo: false });
  const futuro = { ...recente, em: "2030-01-01T19:00:00Z" };           // relógio errado não vale como GPS
  assert.equal(P.posicaoDoVeiculo({ gps: futuro, estimada, agora }).fonte, "estimada");
});

test("compartilhar GPS: grava a posição (no máximo a cada 3 s), parar limpa a leitura e apaga a posição", () => {
  const geo = geoFalso();
  assert.deepEqual(P.iniciarCompartilhamento("c1", { geo }), { ok: true });
  assert.ok(P.compartilhando("c1"));
  geo.mover(-15.81, -47.95);
  assert.equal(P.posicaoGpsDe("c1").lat, -15.81);
  geo.mover(-15.70, -47.90);                                            // logo em seguida: ignorada
  assert.equal(P.posicaoGpsDe("c1").lat, -15.81);
  P.pararCompartilhamento("c1");
  assert.equal(geo.limpo, 7);
  assert.equal(P.posicaoGpsDe("c1"), null);
  assert.equal(P.compartilhando("c1"), false);
});

test("compartilhar GPS: sem geolocalização avisa; permissão negada para e avisa o motivo", () => {
  assert.deepEqual(P.iniciarCompartilhamento("c1", { geo: undefined }), { ok: false, motivo: "Este navegador não oferece localização." });
  const geo = geoFalso();
  let motivo = "";
  P.iniciarCompartilhamento("c1", { geo, aoErro: (m) => { motivo = m; } });
  geo.erro({ code: 1 });
  assert.equal(motivo, "permissão de localização negada");
  assert.equal(P.compartilhando("c1"), false);
});

test("RN08: concluir a viagem para o GPS e apaga a última posição", () => {
  iniciarC1();
  const geo = geoFalso();
  P.iniciarCompartilhamento("c1", { geo });
  geo.mover(-15.81, -47.95);
  concluirViagem("c1", "u1", { agora: new Date(saida() + 40 * 60000) });
  assert.equal(P.posicaoGpsDe("c1"), null);
  assert.equal(P.compartilhando("c1"), false);
});

test("o mapa real não é carregado fora do navegador (testes ficam com o esquema)", async () => {
  assert.equal(await carregarLeaflet(), null);
});

// ---------- tela ----------
test("tela da viagem: só o motorista tem o botão de GPS; sem geolocalização, explica", () => {
  iniciarC1();
  salvar("sessao", "u2");
  assert.equal(botao(telaViagemAtiva(), "Compartilhar minha localização (GPS)"), null);
  salvar("sessao", "u1");
  usarGeo(undefined);
  const t = telaViagemAtiva();
  const b = botao(t, "Compartilhar minha localização (GPS)");
  assert.ok(b);
  assert.equal(b.getAttribute("aria-pressed"), "false");
  b.click();
  assert.match(textoDe(t), /Este navegador não oferece localização/);
  semLixo(t);
});

test("tela da viagem: motorista compartilha e a passageira (mesmo navegador) vê o GPS em vez da estimativa", () => {
  iniciarC1();
  const geo = geoFalso();
  usarGeo(geo);
  salvar("sessao", "u1");
  const m = telaViagemAtiva();
  botao(m, "Compartilhar minha localização (GPS)").click();
  assert.ok(botao(m, "Parar de compartilhar minha localização"));
  assert.match(textoDe(m), /está sendo compartilhada/);
  geo.mover(-15.81, -47.95);

  salvar("sessao", "u2");
  const p = telaViagemAtiva();
  assert.match(textoDe(p), /posição do veículo pelo GPS do motorista, atualizada às \d{2}:\d{2}:\d{2}/);
  assert.match(textoDe(p), /Você está vendo o GPS do motorista/);
  semLixo(p);

  salvar("sessao", "u1");
  botao(telaViagemAtiva(), "Parar de compartilhar minha localização").click();
  salvar("sessao", "u2");
  assert.match(textoDe(telaViagemAtiva()), /posição estimada do veículo, \d+% do trajeto/);
});
