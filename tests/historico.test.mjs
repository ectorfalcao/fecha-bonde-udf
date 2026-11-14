// Etapa 8.7: histórico e extrato (RF13).
import test, { beforeEach } from "node:test";
import assert from "node:assert/strict";
import * as H from "../js/historico.js";
import { pagar } from "../js/pagamentos.js";
import { iniciarViagem, concluirViagem } from "../js/viagens.js";
import { telaHistorico } from "../js/historicoTela.js";
import { telaMinhasCaronas } from "../js/minhas.js";
import { iniciarDados, inserir, obter } from "../js/dados.js";
import { salvar } from "../js/store.js";
import { moeda } from "../js/componentes.js";
import { instalarAmbiente, botao, textoDe } from "./dom-falso.mjs";

beforeEach(() => { instalarAmbiente(); iniciarDados(); });

const saida = () => new Date(obter("caronas", "c1").dataHoraSaida).getTime();
const concluirC1 = () => {
  iniciarViagem("c1", "u1", { agora: new Date(saida() - 5 * 60000) });
  concluirViagem("c1", "u1", { agora: new Date(saida() + 40 * 60000) });
};
const reais = (v) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const tem = (n, trecho) => assert.ok(textoDe(n).includes(trecho), `deveria conter: ${trecho}`); // "R$" quebraria uma regex
const semLixo = (n) => { const t = textoDe(n); for (const re of [/\[object/, /undefined/, /null/, /false/, /NaN/]) assert.doesNotMatch(t, re); };

// ---------- regras puras ----------
const caronas = [
  { id: "a", motoristaId: "m", status: "concluida", concluidaEm: "2030-01-02T10:00:00Z", valor: 10 },
  { id: "b", motoristaId: "m", status: "concluida", concluidaEm: "2030-01-05T10:00:00Z", valor: 0 },
  { id: "c", motoristaId: "x", status: "concluida", concluidaEm: "2030-01-03T10:00:00Z", valor: 6 },
  { id: "d", motoristaId: "m", status: "cancelada", valor: 10 },
  { id: "e", motoristaId: "x", status: "em_andamento", valor: 6 }
];
const sols = [
  { caronaId: "a", passageiroId: "p", status: "confirmada" }, { caronaId: "a", passageiroId: "q", status: "confirmada" },
  { caronaId: "b", passageiroId: "p", status: "confirmada" }, { caronaId: "c", passageiroId: "m", status: "confirmada" },
  { caronaId: "c", passageiroId: "p", status: "cancelada" }, { caronaId: "e", passageiroId: "p", status: "confirmada" }
];
test("historicoDe: só viagens concluídas da pessoa (motorista ou confirmada), da mais recente para a mais antiga", () => {
  assert.deepEqual(H.historicoDe("m", caronas, sols).map((c) => c.id), ["b", "c", "a"]);
  assert.deepEqual(H.historicoDe("p", caronas, sols).map((c) => c.id), ["b", "a"]);   // cancelou "c"; "e" não acabou
  assert.deepEqual(H.historicoDe("z", caronas, sols), []);
});
test("extratoDe: pago e a pagar como passageiro, recebido e a receber como motorista; gratuitas ficam de fora", () => {
  const pagamentos = [{ caronaId: "a", passageiroId: "p", valor: 10 }];
  assert.deepEqual(H.extratoDe("m", caronas, sols, pagamentos), { pago: 0, aPagar: 6, recebido: 10, aReceber: 10 });
  assert.deepEqual(H.extratoDe("p", caronas, sols, pagamentos), { pago: 10, aPagar: 0, recebido: 0, aReceber: 0 });
  assert.deepEqual(H.extratoDe("q", caronas, sols, pagamentos), { pago: 0, aPagar: 10, recebido: 0, aReceber: 0 });
});

// ---------- telas ----------
test("tela Histórico: extrato simulado e viagem com ações; o extrato muda depois de pagar", () => {
  concluirC1();
  salvar("sessao", "u2");
  let t = telaHistorico();
  semLixo(t);
  tem(t, `Você pagou${reais(0)}Você ainda deve${reais(7.5)}`);
  assert.match(textoDe(t), /Viagens concluídas \(1\)/);
  assert.ok(botao(t, `Pagar ${moeda(7.5)}`));
  pagar("c1", "u2");
  t = telaHistorico();
  tem(t, `Você pagou${reais(7.5)}Você ainda deve${reais(0)}`);
  salvar("sessao", "u1");
  tem(telaHistorico(), `Você recebeu${reais(7.5)}A receber${reais(0)}`);
});
test("tela Histórico vazia explica o que vai aparecer, sem valores estranhos", () => {
  salvar("sessao", "u3");
  const t = telaHistorico();
  semLixo(t);
  assert.match(textoDe(t), /Nenhuma viagem concluída ainda/);
  tem(t, `Você pagou${reais(0)}`);
});
test("Caronas mostra só as 3 viagens concluídas mais recentes e leva ao histórico completo", () => {
  for (let i = 0; i < 5; i++)
    inserir("caronas", { id: `h${i}`, motoristaId: "u1", origem: `Origem ${i}`, destino: "Campus", dataHoraSaida: "2030-01-01T10:00:00Z",
      concluidaEm: `2030-01-0${i + 1}T11:00:00Z`, status: "concluida", valor: 0, vagasTotal: 1 });
  salvar("sessao", "u1");
  const t = telaMinhasCaronas();
  for (const i of [4, 3, 2]) tem(t, `Origem ${i}`);
  for (const i of [1, 0]) assert.doesNotMatch(textoDe(t), new RegExp(`Origem ${i}`));
  assert.equal(botao(t, "Ver histórico e extrato (5 viagem(ns))").getAttribute("href"), "#/historico");
  const h = telaHistorico();
  for (let i = 0; i < 5; i++) tem(h, `Origem ${i}`);
});
