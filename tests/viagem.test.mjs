import test, { beforeEach } from "node:test";
import assert from "node:assert/strict";
import * as V from "../js/viagem.js";
import * as O from "../js/viagens.js";
import * as S from "../js/solicitacoes.js";
import * as N from "../js/notificacoes.js";
import { rotuloStatus } from "../js/grupos.js";
import { modoDemo, definirModoDemo } from "../js/demo.js";
import { filtrarCaronas } from "../js/caronas.js";
import { iniciarDados, listar, obter, inserir, vagasDisponiveis } from "../js/dados.js";
import { instalarAmbiente } from "./dom-falso.mjs";

const MIN = 60000;
const perfil = (id, extra = {}) => ({ id, nome: `Pessoa ${id}`, email: `${id}@aluno.udf.edu.br`, curso: "ADS", turno: "Noturno", genero: "feminino", telefone: "(61) 90000-0009", telefoneVerificado: true, fotoNome: "f.jpg", cnhNome: "", passageiro: true, motorista: false, emailVerificado: true, termosUsoEm: "x", termosConvivenciaEm: "2030-01-01T00:00:00.000Z", ...extra });
const novo = (id) => inserir("usuarios", perfil(id));
const daCarona = (c, p) => listar("solicitacoes").find((s) => s.caronaId === c && s.passageiroId === p);
const saida = (id) => new Date(obter("caronas", id).dataHoraSaida);
const rel = (id, min) => new Date(saida(id).getTime() + min * MIN);       // instante relativo à saída

beforeEach(() => { instalarAmbiente(); iniciarDados(); });

// ---------- regras puras ----------
const c0 = { id: "c", status: "aberta", dataHoraSaida: new Date(2030, 0, 10, 18, 30).toISOString() };
const em = (min) => new Date(new Date(c0.dataHoraSaida).getTime() + min * MIN);

test("RN08: a janela de início abre 15 minutos antes da saída", () => {
  assert.equal(V.JANELA_INICIO_MIN, 15);
  assert.equal(V.inicioLiberadoEm(c0).getTime(), em(-15).getTime());
});
test("podeIniciarViagem: bloqueia antes da janela, libera dentro e depois da saída", () => {
  const antes = V.podeIniciarViagem(c0, { agora: em(-16) });
  assert.deepEqual([antes.ok, antes.codigo], [false, "janela"]);
  assert.match(antes.motivo, /15 minutos/);
  assert.deepEqual(V.podeIniciarViagem(c0, { agora: em(-15) }), { ok: true, usouDemo: false });
  assert.deepEqual(V.podeIniciarViagem(c0, { agora: em(-5) }), { ok: true, usouDemo: false });
  assert.deepEqual(V.podeIniciarViagem(c0, { agora: em(90) }), { ok: true, usouDemo: false });
});
test("modo demonstração libera antes da janela e registra que foi usado", () => {
  assert.deepEqual(V.podeIniciarViagem(c0, { agora: em(-600), demo: true }), { ok: true, usouDemo: true });
  assert.deepEqual(V.podeIniciarViagem(c0, { agora: em(-5), demo: true }), { ok: true, usouDemo: false });   // dentro da janela não precisa
});
test("podeIniciarViagem: só carona aberta", () => {
  for (const status of ["em_andamento", "concluida", "cancelada"]) assert.equal(V.podeIniciarViagem({ ...c0, status }, { agora: em(0), demo: true }).codigo, "estado", status);
});
test("podeConcluirViagem: só em andamento", () => {
  assert.equal(V.podeConcluirViagem({ ...c0, status: "em_andamento" }).ok, true);
  for (const status of ["aberta", "concluida", "cancelada"]) assert.equal(V.podeConcluirViagem({ ...c0, status }).codigo, "estado", status);
});
test("planoAoIniciar: confirmadas embarcam; pendentes e lista de espera são encerradas", () => {
  const sols = [["a", "confirmada"], ["b", "pendente"], ["c", "espera"], ["d", "recusada"], ["e", "cancelada"]].map(([id, status]) => ({ id, caronaId: "c", status }))
    .concat([{ id: "z", caronaId: "outra", status: "pendente" }]);
  const p = V.planoAoIniciar(c0, sols);
  assert.deepEqual(p.embarcam.map((s) => s.id), ["a"]);
  assert.deepEqual(p.paraEncerrar.map((s) => s.id), ["b", "c"]);
});
test("rotuloStatus conhece o estado da viagem e o encerramento pelo sistema", () => {
  assert.match(rotuloStatus({ status: "confirmada" }, { status: "em_andamento" }), /em andamento/);
  assert.match(rotuloStatus({ status: "confirmada" }, { status: "concluida" }), /concluída/);
  assert.match(rotuloStatus({ status: "confirmada" }, { status: "aberta" }), /Confirmada/);
  assert.match(rotuloStatus({ status: "cancelada", canceladaPor: "sistema" }), /viagem já começou/);
  assert.match(rotuloStatus({ status: "confirmada" }), /Confirmada/);      // sem carona: comportamento antigo
});
test("modo demonstração: desligado por padrão e persistente", () => {
  assert.equal(modoDemo(), false);
  assert.equal(definirModoDemo(true), true);
  assert.equal(modoDemo(), true);
  definirModoDemo(false);
  assert.equal(modoDemo(), false);
});

// ---------- operações ----------
test("iniciarViagem: só o motorista da carona; antes da janela é bloqueado e nada muda", () => {
  assert.equal(O.iniciarViagem("c1", "u2", { agora: rel("c1", -5) }).codigo, "permissao");
  assert.equal(O.iniciarViagem("nao-existe", "u1").codigo, "permissao");
  const r = O.iniciarViagem("c1", "u1", { agora: rel("c1", -60), demo: false });
  assert.deepEqual([r.ok, r.codigo], [false, "janela"]);
  assert.equal(obter("caronas", "c1").status, "aberta");
});
test("iniciarViagem dentro da janela: em andamento, registra horário e avisa quem embarca", () => {
  const r = O.iniciarViagem("c1", "u1", { agora: rel("c1", -10), demo: false });
  assert.deepEqual([r.ok, r.embarcaram, r.encerradas, r.usouDemo], [true, 1, 0, false]);
  const c = obter("caronas", "c1");
  assert.equal(c.status, "em_andamento");
  assert.equal(c.iniciadaEmModoDemo, false);
  assert.equal(new Date(c.iniciadaEm).getTime(), rel("c1", -10).getTime());
  assert.match(N.doUsuario("u2")[0].texto, /começou/);          // s1: u2 confirmada
});
test("iniciarViagem pelo modo demonstração fica registrado na carona", () => {
  const r = O.iniciarViagem("c1", "u1", { agora: rel("c1", -600), demo: true });
  assert.deepEqual([r.ok, r.usouDemo], [true, true]);
  assert.equal(obter("caronas", "c1").iniciadaEmModoDemo, true);
});
test("iniciarViagem usa o modo demonstração gravado quando não recebe o parâmetro", () => {
  assert.equal(O.iniciarViagem("c1", "u1", { agora: rel("c1", -600) }).codigo, "janela");
  definirModoDemo(true);
  assert.equal(O.iniciarViagem("c1", "u1", { agora: rel("c1", -600) }).ok, true);
});
test("iniciar sem passageiros confirmados é permitido (a tela avisa)", () => {
  const r = O.iniciarViagem("c2", "u3", { agora: rel("c2", -5) });
  assert.deepEqual([r.ok, r.embarcaram], [true, 0]);
});
test("ao iniciar, pendentes e lista de espera são encerrados pelo sistema e avisados", () => {
  for (const p of ["p1", "p2", "p3", "p4"]) { novo(p); S.solicitar("c2", p); }
  S.aprovar(daCarona("c2", "p1").id, "u3"); S.aprovar(daCarona("c2", "p2").id, "u3");     // lotou: p3 e p4 na espera
  S.cancelarSolicitacao(daCarona("c2", "p1").id, "p1");                                   // p3 vira pendente
  assert.deepEqual([daCarona("c2", "p3").status, daCarona("c2", "p4").status], ["pendente", "espera"]);
  const r = O.iniciarViagem("c2", "u3", { agora: rel("c2", -5) });
  assert.deepEqual([r.embarcaram, r.encerradas], [1, 2]);
  assert.equal(daCarona("c2", "p2").status, "confirmada");
  for (const p of ["p3", "p4"]) {
    const s = daCarona("c2", p);
    assert.deepEqual([s.status, s.canceladaPor], ["cancelada", "sistema"]);
    assert.match(N.doUsuario(p)[0].texto, /não foi atendida/);
  }
});
test("durante a viagem: nada de cancelar, aprovar, recusar ou solicitar", () => {
  novo("p1"); S.solicitar("c2", "p1");
  const pendente = daCarona("c2", "p1").id;
  O.iniciarViagem("c1", "u1", { agora: rel("c1", -5) });
  assert.equal(S.cancelarCarona("c1", "u1").codigo, "estado");
  assert.equal(S.cancelarSolicitacao("s1", "u2").codigo, "viagem");
  assert.equal(obter("solicitacoes", "s1").status, "confirmada");
  assert.equal(S.solicitar("c1", "p1").codigo, "indisponivel");
  O.iniciarViagem("c2", "u3", { agora: rel("c2", -5) });
  assert.equal(S.aprovar(pendente, "u3").ok, false);
  assert.equal(S.recusar(pendente, "u3").ok, false);
});
test("a vaga confirmada continua contando durante e depois da viagem", () => {
  const antes = vagasDisponiveis(obter("caronas", "c1"));
  O.iniciarViagem("c1", "u1", { agora: rel("c1", -5) });
  O.concluirViagem("c1", "u1");
  assert.equal(vagasDisponiveis(obter("caronas", "c1")), antes);
});
test("concluirViagem: só em andamento e só o motorista; grava horário e avisa passageiros", () => {
  assert.equal(O.concluirViagem("c1", "u1").codigo, "estado");                      // ainda aberta
  O.iniciarViagem("c1", "u1", { agora: rel("c1", -5) });
  assert.equal(O.concluirViagem("c1", "u2").codigo, "permissao");
  const fim = rel("c1", 40);
  const r = O.concluirViagem("c1", "u1", { agora: fim });
  assert.deepEqual([r.ok, r.passageiros], [true, 1]);
  const c = obter("caronas", "c1");
  assert.equal(c.status, "concluida");
  assert.equal(new Date(c.concluidaEm).getTime(), fim.getTime());
  assert.match(N.doUsuario("u2")[0].texto, /foi concluída/);
  assert.equal(O.concluirViagem("c1", "u1").codigo, "estado");                      // não conclui duas vezes
});
test("viagem em andamento ou concluída some da busca", () => {
  const visivel = () => filtrarCaronas(listar("caronas"), {}, { usuario: { genero: "masculino" }, motoristaDe: () => ({}), passageirosConfirmados: () => [] }).map((r) => r.carona.id);
  assert.ok(visivel().includes("c1"));
  O.iniciarViagem("c1", "u1", { agora: rel("c1", -5) });
  assert.ok(!visivel().includes("c1"));
  O.concluirViagem("c1", "u1");
  assert.ok(!visivel().includes("c1"));
});
