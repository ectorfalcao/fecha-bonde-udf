import test, { beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import * as E from "../js/emergencia.js";
import { viagensAtivasDe } from "../js/viagem.js";
import { obterLocalizacao, registrarAcionamento } from "../js/alertasEmergencia.js";
import { iniciarViagem } from "../js/viagens.js";
import { telaViagemAtiva } from "../js/viagemAtiva.js";
import { iniciarDados, listar, obter, atualizar } from "../js/dados.js";
import { salvar } from "../js/store.js";
import { instalarAmbiente, achar, acharTodos, botao, textoDe, dialogoAberto, esperar } from "./dom-falso.mjs";

const navOriginal = Object.getOwnPropertyDescriptor(globalThis, "navigator");
const usarGeo = (geo) => Object.defineProperty(globalThis, "navigator", { value: { geolocation: geo }, configurable: true, writable: true });
const geoOk = (lat = -15.83, lng = -47.91, accuracy = 25) => ({ chamadas: 0, getCurrentPosition(ok) { this.chamadas++; ok({ coords: { latitude: lat, longitude: lng, accuracy } }); } });
const geoErro = (code) => ({ chamadas: 0, getCurrentPosition(_, erro) { this.chamadas++; erro({ code }); } });

beforeEach(() => { instalarAmbiente(); iniciarDados(); });
afterEach(() => { if (navOriginal) Object.defineProperty(globalThis, "navigator", navOriginal); });

// ---------- regras puras ----------
test("RF15: contato só vale com nome e telefone válido", () => {
  assert.deepEqual(E.contatoDe({ contatoNome: " Mãe ", contatoTel: "(61) 98888-7777" }), { nome: "Mãe", telefone: "(61) 98888-7777" });
  for (const u of [{ contatoNome: "", contatoTel: "(61) 98888-7777" }, { contatoNome: "Mãe", contatoTel: "123" }, { contatoNome: "Mãe" }, {}, null])
    assert.equal(E.contatoDe(u), null);
});
test("telefoneParaLink: formato internacional ou null", () => {
  assert.equal(E.telefoneParaLink("(61) 98888-7777"), "+5561988887777");
  assert.equal(E.telefoneParaLink("6133334444"), "+556133334444");
  assert.equal(E.telefoneParaLink("+55 61 98888-7777"), "+5561988887777");
  assert.equal(E.telefoneParaLink("123"), null);
  assert.equal(E.telefoneParaLink(""), null);
});
test("US08: ligação direta para a polícia (190)", () => {
  assert.equal(E.NUMERO_POLICIA, "190");
  assert.equal(E.linkTel(E.NUMERO_POLICIA), "tel:190");
});
const ctx = { usuario: { nome: "Júlia Santos" }, carona: { origem: "Águas Claras", destino: "UDF Campus Sede (Asa Sul)" }, motorista: { nome: "Carlos Eduardo" }, veiculo: { modelo: "Chevrolet Onix", cor: "Prata", placa: "FAB1C23" }, agora: new Date(2030, 0, 1, 18, 45) };
test("mensagem de emergência: dados da carona e link de mapa quando há localização", () => {
  const m = E.montarMensagem({ ...ctx, localizacao: { lat: -15.83012, lng: -47.91034, precisao: 24.6 } });
  for (const parte of ["Júlia Santos", "Águas Claras → UDF Campus Sede (Asa Sul)", "Carlos Eduardo", "FAB1C23", "https://www.google.com/maps?q=-15.83012,-47.91034", "precisão de cerca de 25 m", "18:45", "190"])
    assert.ok(m.includes(parte), parte);
  assert.doesNotMatch(m, /indisponível/);
});
test("mensagem de emergência: sem localização diz isso claramente, sem inventar coordenadas", () => {
  const m = E.montarMensagem({ ...ctx, localizacao: null });
  assert.match(m, /Localização indisponível/);
  assert.doesNotMatch(m, /maps/);
});
test("linkSms: codifica o texto; sem telefone válido não gera link", () => {
  const l = E.linkSms("(61) 98888-7777", "Olá\nsocorro & ajuda");
  assert.equal(l, "sms:+5561988887777?body=Ol%C3%A1%0Asocorro%20%26%20ajuda");
  assert.equal(E.linkSms("123", "x"), null);
});
test("viagensAtivasDe: motorista e passageira confirmada; outras pessoas e outros estados não", () => {
  const caronas = [{ id: "a", motoristaId: "m", status: "em_andamento", iniciadaEm: "2" }, { id: "b", motoristaId: "m", status: "aberta" }, { id: "c", motoristaId: "x", status: "em_andamento", iniciadaEm: "1" }, { id: "d", motoristaId: "x", status: "concluida" }];
  const sols = [{ caronaId: "c", passageiroId: "p", status: "confirmada" }, { caronaId: "a", passageiroId: "q", status: "pendente" }, { caronaId: "d", passageiroId: "p", status: "confirmada" }];
  assert.deepEqual(viagensAtivasDe("m", caronas, sols).map((c) => c.id), ["a"]);
  assert.deepEqual(viagensAtivasDe("p", caronas, sols).map((c) => c.id), ["c"]);
  assert.deepEqual(viagensAtivasDe("q", caronas, sols), []);
});

// ---------- localização e registro ----------
test("obterLocalizacao: sucesso, permissão negada, sem suporte e tempo esgotado", async () => {
  assert.deepEqual(await obterLocalizacao({ geo: geoOk(-1, -2, 10) }), { ok: true, lat: -1, lng: -2, precisao: 10 });
  assert.deepEqual(await obterLocalizacao({ geo: geoErro(1) }), { ok: false, motivo: "permissão negada" });
  assert.match((await obterLocalizacao({ geo: null })).motivo, /não oferece localização/);
  const parado = { getCurrentPosition() {} };
  assert.deepEqual(await obterLocalizacao({ geo: parado, timeoutMs: 10 }), { ok: false, motivo: "tempo esgotado" });
});
test("registrarAcionamento guarda a tentativa e NÃO guarda coordenadas", () => {
  registrarAcionamento({ usuarioId: "u1", caronaId: "c1", tipo: "sms", comLocalizacao: true });
  const [a] = listar("alertas");
  assert.deepEqual([a.usuarioId, a.caronaId, a.tipo, a.comLocalizacao], ["u1", "c1", "sms", true]);
  assert.ok(!("lat" in a) && !("lng" in a) && !("localizacao" in a));
  assert.match(a.observacao, /não confirma/);
});

// ---------- tela ----------
const iniciar = () => iniciarViagem("c1", "u1", { agora: new Date(new Date(obter("caronas", "c1").dataHoraSaida).getTime() - 5 * 60000) });
const semLixo = (n) => { const t = textoDe(n); for (const re of [/\[object/, /undefined/, /null/, /false/, /NaN/]) assert.doesNotMatch(t, re); };
const comContato = () => atualizar("usuarios", "u2", { contatoNome: "Mãe da Júlia", contatoTel: "(61) 98888-7777" });

test("sem viagem em andamento não há botão de emergência", () => {
  salvar("sessao", "u1");
  const t = telaViagemAtiva();
  assert.match(textoDe(t), /Nenhuma viagem em andamento/);
  assert.equal(botao(t, "Emergência"), null);
  semLixo(t);
});
test("RN11: motorista e passageira confirmada veem o botão durante a viagem", () => {
  iniciar();
  for (const id of ["u1", "u2"]) {
    salvar("sessao", id);
    const t = telaViagemAtiva();
    assert.ok(botao(t, "Emergência"), id);
    assert.match(textoDe(t), /Chevrolet Onix Prata, placa FAB1C23/);
    semLixo(t);
  }
  salvar("sessao", "u3");                                   // Mariana não participa
  assert.equal(botao(telaViagemAtiva(), "Emergência"), null);
});
test("US08: com contato, abre opções de 190 e SMS e inclui a localização no SMS", async () => {
  iniciar(); comContato(); salvar("sessao", "u2");
  const geo = geoOk(-15.83012, -47.91034, 24); usarGeo(geo);
  botao(telaViagemAtiva(), "Emergência").click();
  const d = dialogoAberto();
  assert.ok(d);
  assert.match(textoDe(d), /não aciona a polícia, não envia nada sozinho/);
  const ligar = achar(d, (e) => e.getAttribute("href") === "tel:190");
  assert.ok(ligar);
  await esperar();
  const sms = achar(d, (e) => (e.getAttribute("href") ?? "").startsWith("sms:+5561988887777?body="));
  assert.ok(sms, "link de SMS para o contato");
  const corpo = decodeURIComponent(sms.getAttribute("href").split("?body=")[1]);
  assert.match(corpo, /Júlia Santos/);
  assert.match(corpo, /maps\?q=-15\.83012,-47\.91034/);
  assert.match(textoDe(d), /Localização obtida/);
  assert.equal(geo.chamadas, 1);
  sms.click();
  assert.match(textoDe(d), /não envia nem confirma o SMS/);
  ligar.click();
  assert.match(textoDe(d), /não faz nem confirma a chamada/);
  assert.deepEqual(listar("alertas").map((a) => [a.tipo, a.comLocalizacao]), [["sms", true], ["ligar190", false]]);
  semLixo(d);
});
test("localização negada: o SMS segue sem ela e a tela explica", async () => {
  iniciar(); comContato(); salvar("sessao", "u2");
  usarGeo(geoErro(1));
  botao(telaViagemAtiva(), "Emergência").click();
  await esperar();
  const d = dialogoAberto();
  assert.match(textoDe(d), /Não foi possível obter a localização \(permissão negada\)/);
  const sms = achar(d, (e) => (e.getAttribute("href") ?? "").startsWith("sms:"));
  assert.match(decodeURIComponent(sms.getAttribute("href")), /Localização indisponível/);
  assert.doesNotMatch(decodeURIComponent(sms.getAttribute("href")), /maps\?q/);
  sms.click();
  assert.equal(listar("alertas")[0].comLocalizacao, false);
});
test("sem contato: só 190, orienta o cadastro no Perfil e não pede localização", async () => {
  iniciar(); salvar("sessao", "u2");
  const geo = geoOk(); usarGeo(geo);
  botao(telaViagemAtiva(), "Emergência").click();
  await esperar();
  const d = dialogoAberto();
  assert.ok(achar(d, (e) => e.getAttribute("href") === "tel:190"));
  assert.equal(acharTodos(d, (e) => (e.getAttribute("href") ?? "").startsWith("sms:")).length, 0);
  assert.match(textoDe(d), /ainda não cadastrou um contato de emergência/);
  assert.ok(achar(d, (e) => e.getAttribute("href") === "#/perfil"));
  assert.equal(geo.chamadas, 0, "não deve pedir a localização sem contato");
});
test("o diálogo fecha pelo botão Fechar", () => {
  iniciar(); salvar("sessao", "u2");
  botao(telaViagemAtiva(), "Emergência").click();
  botao(dialogoAberto(), "Fechar").click();
  assert.equal(dialogoAberto(), null);
});
