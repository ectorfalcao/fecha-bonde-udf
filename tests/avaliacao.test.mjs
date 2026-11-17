// Etapa 8.6: avaliação mútua (RF14, RN10, US10).
import test, { beforeEach } from "node:test";
import assert from "node:assert/strict";
import * as A from "../js/avaliacao.js";
import { avaliar } from "../js/avaliacoes.js";
import { iniciarViagem, concluirViagem } from "../js/viagens.js";
import { telaAvaliacao } from "../js/avaliacaoTela.js";
import { telaMinhasCaronas } from "../js/minhas.js";
import { cartaoCarona } from "../js/cartao.js";
import { iniciarDados, listar, obter, inserir } from "../js/dados.js";
import { salvar } from "../js/store.js";
import { doUsuario } from "../js/notificacoes.js";
import { instalarAmbiente, achar, acharTodos, botao, textoDe } from "./dom-falso.mjs";

beforeEach(() => { instalarAmbiente(); iniciarDados(); });

const saida = () => new Date(obter("caronas", "c1").dataHoraSaida).getTime();
const concluirC1 = () => {
  iniciarViagem("c1", "u1", { agora: new Date(saida() - 5 * 60000) });
  concluirViagem("c1", "u1", { agora: new Date(saida() + 40 * 60000) });
};
const comSegundaPassageira = () => inserir("solicitacoes", { caronaId: "c1", passageiroId: "u3", status: "confirmada" });
const semLixo = (n) => { const t = textoDe(n); for (const re of [/\[object/, /undefined/, /null/, /false/, /NaN/]) assert.doesNotMatch(t, re); };
const params = (id) => new URLSearchParams({ carona: id });

// ---------- regras puras ----------
const c = { id: "c", motoristaId: "m", status: "concluida" };
const sols = [{ caronaId: "c", passageiroId: "p", status: "confirmada" }, { caronaId: "c", passageiroId: "q", status: "confirmada" }, { caronaId: "c", passageiroId: "x", status: "cancelada" }];
test("quemAvaliar: motorista avalia cada passageiro; passageiro avalia o motorista e, se quiser, os colegas", () => {
  assert.deepEqual(A.quemAvaliar(c, "m", sols).map((i) => [i.avaliadoId, i.obrigatorio]), [["p", true], ["q", true]]);
  assert.deepEqual(A.quemAvaliar(c, "p", sols).map((i) => [i.avaliadoId, i.papel, i.obrigatorio]), [["m", "motorista", true], ["q", "passageiro", false]]);
  assert.deepEqual(A.quemAvaliar(c, "x", sols), []);                        // cancelou: não viajou
  assert.deepEqual(A.quemAvaliar({ ...c, status: "em_andamento" }, "p", sols), []);
  assert.ok(A.quemAvaliar(c, "p", sols, [{ caronaId: "c", avaliadorId: "p", avaliadoId: "m", nota: 5 }])[0].feita);
});
test("podeAvaliar: só depois de concluir, só entre quem viajou, sem se avaliar e uma vez por pessoa", () => {
  const ok = (extra) => A.podeAvaliar({ carona: c, avaliadorId: "p", avaliadoId: "m", solicitacoes: sols, ...extra });
  assert.deepEqual(ok(), { ok: true });
  assert.equal(ok({ carona: { ...c, status: "em_andamento" } }).codigo, "estado");
  assert.equal(ok({ avaliadorId: "x" }).codigo, "permissao");
  assert.equal(ok({ avaliadoId: "p" }).codigo, "permissao");
  assert.equal(ok({ avaliadoId: "x" }).codigo, "permissao");
  assert.equal(ok({ avaliacoes: [{ caronaId: "c", avaliadorId: "p", avaliadoId: "m" }] }).codigo, "feita");
  assert.equal(ok({ carona: null }).codigo, "nao_encontrada");
});
test("validarAvaliacao: nota inteira de 1 a 5; comentário opcional de até 300 caracteres", () => {
  assert.deepEqual(A.validarAvaliacao("4", "  Pontual  "), { ok: true, nota: 4, comentario: "Pontual" });
  for (const n of [0, 6, 3.5, "", undefined, "abc"]) assert.equal(A.validarAvaliacao(n).codigo, "nota", String(n));
  assert.equal(A.validarAvaliacao(5, "x".repeat(301)).codigo, "comentario");
});
test("mediaDe: só conta avaliações feitas; sem nenhuma diz 'sem avaliações', nunca zero", () => {
  assert.equal(A.mediaDe("m", []), null);
  assert.equal(A.textoMedia(null), "sem avaliações");
  const m = A.mediaDe("m", [{ avaliadoId: "m", nota: 5 }, { avaliadoId: "m", nota: 4 }, { avaliadoId: "p", nota: 1 }]);
  assert.deepEqual(m, { media: 4.5, total: 2 });
  assert.equal(A.textoMedia(m), "★ 4,5 (2 avaliações)");
});

// ---------- operação ----------
test("avaliar: grava, avisa a pessoa avaliada sem revelar nota nem autor, e não repete", () => {
  assert.equal(avaliar({ caronaId: "c1", avaliadorId: "u2", avaliadoId: "u1", nota: 5 }).codigo, "estado");
  concluirC1();
  assert.match(doUsuario("u2")[0].texto, /Avalie o motorista em Caronas/);
  const r = avaliar({ caronaId: "c1", avaliadorId: "u2", avaliadoId: "u1", nota: 5, comentario: "Pontual e educado" });
  assert.equal(r.ok, true);
  assert.deepEqual([r.avaliacao.nota, r.avaliacao.comentario], [5, "Pontual e educado"]);
  const aviso = doUsuario("u1")[0].texto;
  assert.match(aviso, /Você recebeu uma avaliação/);
  assert.doesNotMatch(aviso, /Júlia|5/);
  assert.equal(avaliar({ caronaId: "c1", avaliadorId: "u2", avaliadoId: "u1", nota: 1 }).codigo, "feita");
  assert.equal(avaliar({ caronaId: "c1", avaliadorId: "u1", avaliadoId: "u2", nota: 9 }).codigo, "nota");
  assert.equal(listar("avaliacoes").length, 1);
});

// ---------- telas ----------
test("tela Avaliação: passageira avalia o motorista (obrigatório) e a colega (opcional); vira 'avaliou'", () => {
  comSegundaPassageira();
  concluirC1();
  salvar("sessao", "u2");
  const t = telaAvaliacao(params("c1"));
  semLixo(t);
  assert.match(textoDe(t), /Carlos Eduardo.*Motorista · média atual: sem avaliações/);
  assert.match(textoDe(t), /Mariana Costa.*Passageiro\(a\) · opcional/);
  const formCarlos = achar(t, (e) => e.tagName === "FORM");      // o DOM falso não envia o form pelo clique no botão
  formCarlos.dispatchEvent({ type: "submit" });                   // sem nota: erro, nada gravado
  assert.match(textoDe(t), /Escolha uma nota de 1 a 5/);
  assert.equal(listar("avaliacoes").length, 0);
  achar(t, (e) => e.id === "nota-u1-4").checked = true;
  achar(t, (e) => e.id === "comentario-u1").value = "Dirige com cuidado";
  formCarlos.dispatchEvent({ type: "submit" });
  assert.match(textoDe(t), /✔ Você avaliou com nota 4 de 5/);
  assert.match(textoDe(t), /Avaliação de Carlos Eduardo enviada/);
  assert.ok(botao(t, "Enviar avaliação de Mariana Costa"), "a colega continua disponível");
  semLixo(t);
});
test("tela Avaliação: antes de concluir e para quem não viajou mostra o motivo, sem formulário", () => {
  salvar("sessao", "u2");
  assert.match(textoDe(telaAvaliacao(params("c1"))), /liberada depois que a viagem é concluída/);
  concluirC1();
  salvar("sessao", "u3");
  const t = telaAvaliacao(params("c1"));
  assert.match(textoDe(t), /Só quem participou/);
  assert.equal(achar(t, (e) => e.tagName === "FORM"), null);
});
test("Caronas: avaliação pendente com botão; depois de avaliar vira 'Feita'", () => {
  concluirC1();
  salvar("sessao", "u1");
  let t = telaMinhasCaronas();
  assert.match(textoDe(t), /Avaliação⚠ 1 pendente\(s\)/);
  assert.equal(botao(t, "Avaliar").getAttribute("href"), "#/avaliacao?carona=c1");
  avaliar({ caronaId: "c1", avaliadorId: "u1", avaliadoId: "u2", nota: 5 });
  t = telaMinhasCaronas();
  assert.match(textoDe(t), /Avaliação✔ Feita/);
  assert.equal(botao(t, "Avaliar"), null);
  semLixo(t);
});
test("cartão da busca mostra a média do motorista, ou 'sem avaliações'", () => {
  const c2 = obter("caronas", "c2");
  assert.match(textoDe(cartaoCarona(c2)), /Mariana Costa · sem avaliações/);
  inserir("avaliacoes", { caronaId: "x", avaliadorId: "u2", avaliadoId: "u3", nota: 4 });
  assert.match(textoDe(cartaoCarona(c2)), /Mariana Costa · ★ 4,0 \(1 avaliação\)/);
});
