import test, { beforeEach } from "node:test";
import assert from "node:assert/strict";
import * as G from "../js/grupos.js";
import * as S from "../js/solicitacoes.js";
import * as N from "../js/notificacoes.js";
import { iniciarDados, listar, obter, inserir, atualizar, vagasDisponiveis } from "../js/dados.js";
import { instalarAmbiente } from "./dom-falso.mjs";

const H = 3600000, depois = (h) => new Date(Date.now() + h * H).toISOString();
const perfil = (id, genero = "feminino", extra = {}) => ({ id, nome: `Pessoa ${id}`, email: `${id}@aluno.udf.edu.br`, curso: "ADS", turno: "Noturno", genero, telefone: "(61) 90000-0009", telefoneVerificado: true, fotoNome: "f.jpg", cnhNome: "", passageiro: true, motorista: false, emailVerificado: true, termosUsoEm: "x", termosConvivenciaEm: "2030-01-01T00:00:00.000Z", ...extra });
const novo = (id, genero, extra) => inserir("usuarios", perfil(id, genero, extra));
const sols = (s) => listar("solicitacoes").find((x) => x.id === s)?.status;
const daCarona = (c, p) => listar("solicitacoes").find((s) => s.caronaId === c && s.passageiroId === p);

beforeEach(() => { instalarAmbiente(); iniciarDados(); });

// ---------- regras puras ----------
const c0 = { id: "c", vagasTotal: 2, status: "aberta", motoristaId: "m", dataHoraSaida: depois(24) };
const s = (id, status, criadaEm, extra = {}) => ({ id, caronaId: "c", passageiroId: `p-${id}`, status, criadaEm, ...extra });

test("RN06: status inicial depende de vaga livre; só 'confirmada' ocupa vaga", () => {
  assert.equal(G.statusInicial(c0, [s("1", "confirmada"), s("2", "pendente")]), "pendente");
  assert.equal(G.statusInicial(c0, [s("1", "confirmada"), s("2", "confirmada")]), "espera");
  assert.equal(G.vagasLivres(c0, [s("1", "confirmada"), s("2", "pendente"), s("3", "espera")]), 1);
});
test("RF08: fila por ordem de chegada e posição", () => {
  const l = [s("b", "espera", "2030-01-01T10:00:02Z"), s("a", "espera", "2030-01-01T10:00:01Z"), s("x", "pendente", "2030-01-01T09:00:00Z")];
  assert.deepEqual(G.filaOrdenada(c0, l).map((x) => x.id), ["a", "b"]);
  assert.equal(G.posicaoNaFila(l[0], c0, l), 2);
  assert.equal(G.posicaoNaFila(l[2], c0, l), 0);
});
const usu = { id: "p", passageiro: true, genero: "feminino", termosConvivenciaEm: "x" };
const ctxVazio = { usuario: usu, motoristaDe: () => ({ genero: "feminino" }), passageirosConfirmados: () => [] };
const pode = (o) => G.podeSolicitar({ carona: c0, usuario: usu, solicitacoes: [], ctx: ctxVazio, ...o });
test("RF07: podeSolicitar recusa carona indisponível, própria, sem papel e perfil incompleto", () => {
  assert.equal(pode({ carona: { ...c0, status: "cancelada" } }).codigo, "indisponivel");
  assert.equal(pode({ carona: { ...c0, dataHoraSaida: depois(-1) } }).codigo, "indisponivel");
  assert.equal(pode({ carona: { ...c0, motoristaId: "p" } }).codigo, "propria");
  assert.equal(pode({ usuario: { ...usu, passageiro: false } }).codigo, "papel");
  assert.equal(pode({ pendencias: ["foto de perfil"] }).codigo, "perfil");
  assert.equal(pode({}).ok, true);
});
test("RN03: sem aceite dos termos de convivência não solicita", () => assert.equal(pode({ usuario: { ...usu, termosConvivenciaEm: undefined } }).codigo, "termos"));
test("RN05: grupo só para mulheres", () => {
  const so = { ...c0, apenasMulheres: true };
  assert.equal(pode({ carona: so }).ok, true);
  assert.equal(pode({ carona: so, usuario: { ...usu, genero: "masculino" } }).codigo, "genero");
  assert.equal(pode({ carona: so, usuario: { ...usu, genero: "outro" } }).codigo, "genero");
  assert.equal(pode({ carona: so, ctx: { ...ctxVazio, passageirosConfirmados: () => [{ genero: "masculino" }] } }).codigo, "genero");
});
test("duplicada e recusada; cancelada anterior permite nova", () => {
  const mine = (status) => [{ caronaId: "c", passageiroId: "p", status }];
  assert.equal(pode({ solicitacoes: mine("pendente") }).codigo, "duplicada");
  assert.equal(pode({ solicitacoes: mine("espera") }).codigo, "duplicada");
  assert.equal(pode({ solicitacoes: mine("recusada") }).codigo, "recusada");
  assert.equal(pode({ solicitacoes: mine("cancelada") }).ok, true);
});
test("podeAprovar: só pendente, carona aberta e com vaga", () => {
  assert.equal(G.podeAprovar(c0, [], s("1", "pendente")).ok, true);
  assert.equal(G.podeAprovar(c0, [], s("1", "espera")).codigo, "estado");
  assert.equal(G.podeAprovar({ ...c0, status: "cancelada" }, [], s("1", "pendente")).codigo, "indisponivel");
  assert.equal(G.podeAprovar(c0, [s("a", "confirmada"), s("b", "confirmada")], s("1", "pendente")).codigo, "lotada");
});
test("RF09: motorista cancela só com 2 h de antecedência", () => {
  const agora = new Date();
  assert.equal(G.podeCancelarCarona({ ...c0, dataHoraSaida: depois(1) }, agora).codigo, "antecedencia");
  assert.equal(G.podeCancelarCarona({ ...c0, dataHoraSaida: depois(3) }, agora).ok, true);
  assert.equal(G.podeCancelarCarona({ ...c0, status: "cancelada" }, agora).codigo, "estado");
});
test("RN06: planoDeFila manda pendentes à espera quando lota e chama a fila quando abre vaga", () => {
  const lotada = [s("a", "confirmada"), s("b", "confirmada"), s("p", "pendente")];
  assert.deepEqual(G.planoDeFila(c0, lotada).paraEspera.map((x) => x.id), ["p"]);
  const aberta = [s("a", "confirmada"), s("f1", "espera", "1"), s("f2", "espera", "2")];
  assert.deepEqual(G.planoDeFila(c0, aberta).paraPendente.map((x) => x.id), ["f1"]);    // 1 vaga livre -> 1 chamado
  assert.deepEqual(G.planoDeFila({ ...c0, status: "cancelada" }, aberta), { paraEspera: [], paraPendente: [] });
});
test("rotuloStatus distingue cancelamento pelo motorista", () => {
  assert.match(G.rotuloStatus({ status: "cancelada", canceladaPor: "motorista" }), /motorista/);
  assert.match(G.rotuloStatus({ status: "confirmada" }), /Confirmada/);
});

// ---------- operações sobre os dados ----------
test("RF07: solicitar cria pendente e avisa o motorista", () => {
  novo("p1");
  const r = S.solicitar("c2", "p1");
  assert.deepEqual([r.ok, r.status], [true, "pendente"]);
  assert.equal(daCarona("c2", "p1").status, "pendente");
  assert.equal(N.naoLidas("u3"), 1);
});
test("RN03: operação recusa quem não aceitou os termos", () => {
  novo("p1", "feminino", { termosConvivenciaEm: undefined });
  assert.equal(S.solicitar("c2", "p1").codigo, "termos");
  assert.equal(listar("solicitacoes").length, 1);        // só a fictícia s1
});
test("RN02: perfil incompleto não solicita", () => {
  novo("p1", "feminino", { telefoneVerificado: false });
  assert.equal(S.solicitar("c2", "p1").codigo, "perfil");
});
test("RF07: aprovar atualiza vagas; só o motorista da carona aprova", () => {
  novo("p1"); S.solicitar("c2", "p1");
  const id = daCarona("c2", "p1").id;
  assert.equal(S.aprovar(id, "u1").codigo, "permissao");
  assert.equal(S.aprovar(id, "u3").ok, true);
  assert.equal(vagasDisponiveis(obter("caronas", "c2")), 1);
  assert.equal(S.aprovar(id, "u3").codigo, "estado");
  assert.equal(N.naoLidas("p1"), 1);
});
test("RN06/RF08: ao lotar, pendentes vão para a lista de espera e são avisados", () => {
  for (const p of ["p1", "p2", "p3"]) { novo(p); S.solicitar("c2", p); }
  S.aprovar(daCarona("c2", "p1").id, "u3");
  S.aprovar(daCarona("c2", "p2").id, "u3");
  assert.equal(daCarona("c2", "p3").status, "espera");
  assert.match(N.doUsuario("p3")[0].texto, /lista de espera/);
  const r = (novo("p4"), S.solicitar("c2", "p4"));
  assert.deepEqual([r.status, r.posicao], ["espera", 2]);
});
test("RF08/RF09: cancelamento de confirmada libera vaga e chama o 1º da fila", () => {
  for (const p of ["p1", "p2", "p3", "p4"]) { novo(p); S.solicitar("c2", p); }
  S.aprovar(daCarona("c2", "p1").id, "u3"); S.aprovar(daCarona("c2", "p2").id, "u3");
  assert.deepEqual([daCarona("c2", "p3").status, daCarona("c2", "p4").status], ["espera", "espera"]);
  assert.equal(S.cancelarSolicitacao(daCarona("c2", "p1").id, "p1").ok, true);
  assert.equal(daCarona("c2", "p3").status, "pendente");     // 1º da fila
  assert.equal(daCarona("c2", "p4").status, "espera");
  assert.match(N.doUsuario("p3")[0].texto, /Abriu uma vaga/);
  assert.ok(N.doUsuario("u3").some((n) => /cancelou a participação/.test(n.texto)));
  assert.equal(S.cancelarSolicitacao(daCarona("c2", "p1").id, "p2").codigo, "permissao");
});
test("recusa: quem foi recusado não solicita de novo; quem cancelou solicita", () => {
  novo("p1"); novo("p2");
  S.solicitar("c2", "p1"); S.solicitar("c2", "p2");
  assert.equal(S.recusar(daCarona("c2", "p1").id, "u3").ok, true);
  assert.equal(S.solicitar("c2", "p1").codigo, "recusada");
  S.cancelarSolicitacao(daCarona("c2", "p2").id, "p2");
  assert.equal(S.solicitar("c2", "p2").ok, true);
});
test("RF09: motorista cancela a carona e avisa todos os passageiros ativos", () => {
  for (const p of ["p1", "p2", "p3"]) { novo(p); S.solicitar("c2", p); }
  S.aprovar(daCarona("c2", "p1").id, "u3");
  assert.equal(S.cancelarCarona("c2", "u1").codigo, "permissao");
  const r = S.cancelarCarona("c2", "u3");
  assert.deepEqual([r.ok, r.avisados], [true, 3]);
  assert.equal(obter("caronas", "c2").status, "cancelada");
  assert.ok(["p1", "p2", "p3"].every((p) => daCarona("c2", p).status === "cancelada" && N.naoLidas(p) >= 1));
  assert.equal(S.cancelarCarona("c2", "u3").codigo, "estado");
});
test("RF09: cancelamento com menos de 2 h é bloqueado e nada muda", () => {
  atualizar("caronas", "c2", { dataHoraSaida: depois(1) });
  const r = S.cancelarCarona("c2", "u3");
  assert.deepEqual([r.ok, r.codigo], [false, "antecedencia"]);
  assert.equal(obter("caronas", "c2").status, "aberta");
});
test("avisos: mais recente primeiro, contador e marcar como lidos", () => {
  N.notificar("u1", "um"); N.notificar("u1", "dois"); N.notificar("u2", "outro");
  assert.deepEqual(N.doUsuario("u1").map((n) => n.texto), ["dois", "um"]);
  assert.equal(N.naoLidas("u1"), 2);
  N.marcarLidas("u1");
  assert.deepEqual([N.naoLidas("u1"), N.naoLidas("u2")], [0, 1]);
});
test("falha de gravação é informada, sem quebrar", () => {
  novo("p1");
  const original = globalThis.localStorage.setItem;
  globalThis.localStorage.setItem = () => { throw new Error("cheio"); };
  const r = S.solicitar("c2", "p1");
  globalThis.localStorage.setItem = original;
  assert.deepEqual([r.ok, r.codigo], [false, "gravacao"]);
});
