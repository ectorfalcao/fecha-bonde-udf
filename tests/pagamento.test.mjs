// Etapa 8.5: pagamento SIMULADO (RF12). Pago depois da viagem concluída; só PIX fictício.
import test, { beforeEach } from "node:test";
import assert from "node:assert/strict";
import * as P from "../js/pagamento.js";
import { pagar } from "../js/pagamentos.js";
import { iniciarViagem, concluirViagem } from "../js/viagens.js";
import { telaPagamento } from "../js/pagamentoTela.js";
import { telaMinhasCaronas } from "../js/minhas.js";
import { iniciarDados, listar, obter, atualizar } from "../js/dados.js";
import { salvar } from "../js/store.js";
import { doUsuario } from "../js/notificacoes.js";
import { moeda } from "../js/componentes.js";
import { instalarAmbiente, achar, botao, textoDe } from "./dom-falso.mjs";

beforeEach(() => { instalarAmbiente(); iniciarDados(); });

const saida = () => new Date(obter("caronas", "c1").dataHoraSaida).getTime();
const concluirC1 = () => {
  iniciarViagem("c1", "u1", { agora: new Date(saida() - 5 * 60000) });
  concluirViagem("c1", "u1", { agora: new Date(saida() + 40 * 60000) });
};
const params = (id) => new URLSearchParams({ carona: id });
const semLixo = (n) => { const t = textoDe(n); for (const re of [/\[object/, /undefined/, /null/, /false/, /NaN/]) assert.doesNotMatch(t, re); };

// ---------- regras puras ----------
const base = { id: "c", valor: 8, status: "concluida", motoristaId: "m" };
const sols = [{ caronaId: "c", passageiroId: "p", status: "confirmada" }, { caronaId: "c", passageiroId: "q", status: "cancelada" }];
test("podePagar: passageiro confirmado paga depois da viagem concluída", () => {
  assert.deepEqual(P.podePagar({ carona: base, passageiroId: "p", solicitacoes: sols }), { ok: true, valor: 8 });
});
test("podePagar: bloqueia antes de concluir, carona gratuita, quem não viajou e pagamento repetido", () => {
  for (const status of ["aberta", "em_andamento", "cancelada"])
    assert.equal(P.podePagar({ carona: { ...base, status }, passageiroId: "p", solicitacoes: sols }).codigo, "estado", status);
  assert.equal(P.podePagar({ carona: { ...base, valor: 0 }, passageiroId: "p", solicitacoes: sols }).codigo, "gratuita");
  for (const quem of ["q", "x", "m"]) assert.equal(P.podePagar({ carona: base, passageiroId: quem, solicitacoes: sols }).codigo, "permissao", quem);
  assert.equal(P.podePagar({ carona: base, passageiroId: "p", solicitacoes: sols, pagamentos: [{ caronaId: "c", passageiroId: "p" }] }).codigo, "pago");
  assert.equal(P.podePagar({ carona: null, passageiroId: "p" }).codigo, "nao_encontrada");
});
test("PIX fictício: código e chave deixam claro que não são reais", () => {
  assert.match(P.codigoPixFicticio(base, "p"), /^SIMULADO-FECHABONDE-C-P-8\.00$/);
  assert.match(P.CHAVE_PIX_FICTICIA, /\.exemplo$/);               // domínio reservado: não recebe pagamento
});
test("situacaoPagamentos: lista só confirmados, com o pagamento de quem já pagou", () => {
  const s = P.situacaoPagamentos(base, [...sols, { caronaId: "c", passageiroId: "r", status: "confirmada" }], [{ caronaId: "c", passageiroId: "r", valor: 8 }]);
  assert.deepEqual(s.map((x) => [x.passageiroId, Boolean(x.pagamento)]), [["p", false], ["r", true]]);
});

// ---------- operação ----------
test("pagar: antes de concluir nada é gravado", () => {
  assert.equal(pagar("c1", "u2").codigo, "estado");
  assert.equal(listar("pagamentos").length, 0);
});
test("pagar: registra PIX simulado, avisa o motorista e não deixa pagar duas vezes", () => {
  concluirC1();
  assert.match(doUsuario("u2")[0].texto, /Pague a contribuição \(simulada\) em Caronas/);
  const r = pagar("c1", "u2");
  assert.equal(r.ok, true);
  assert.deepEqual([r.pagamento.valor, r.pagamento.metodo, r.pagamento.simulado, r.pagamento.motoristaId], [7.5, "pix", true, "u1"]);
  assert.match(doUsuario("u1")[0].texto, /Júlia Santos pagou R\$\s?7,50 \(simulado\)/);
  assert.equal(pagar("c1", "u2").codigo, "pago");
  assert.equal(listar("pagamentos").length, 1);
});
test("carona gratuita concluída: aviso sem pedido de pagamento", () => {
  atualizar("caronas", "c1", { valor: 0 });
  concluirC1();
  assert.doesNotMatch(doUsuario("u2")[0].texto, /Pague/);
  assert.equal(pagar("c1", "u2").codigo, "gratuita");
});

// ---------- telas ----------
test("tela Pagamento: só PIX ativo, cartão indisponível, avisos de simulação, e o pagamento vira recibo", () => {
  concluirC1();
  salvar("sessao", "u2");
  const t = telaPagamento(params("c1"));
  semLixo(t);
  assert.match(textoDe(t), /SIMULADO: nenhum dinheiro é movimentado/);
  assert.match(textoDe(t), /SIMULADO-FECHABONDE-C1-U2-7\.50/);
  assert.equal(textoDe(achar(t, (e) => e.className === "valor-grande")), moeda(7.5));   // Etapa 9.4: quanto, em destaque
  assert.equal(textoDe(achar(t, (e) => e.className === "carimbo")), "SIMULADO");
  assert.ok(achar(t, (e) => e.id === "metodo-cartao").hasAttribute("disabled"));
  assert.ok(!achar(t, (e) => e.id === "metodo-pix").hasAttribute("disabled"));
  botao(t, `Simular pagamento de ${moeda(7.5)}`).click();
  assert.match(textoDe(t), /Pagamento simulado de R\$\s?7,50 registrado/);
  assert.equal(botao(t, `Simular pagamento de ${moeda(7.5)}`), null);
  semLixo(t);
});
test("tela Pagamento: antes de concluir e para quem não viajou mostra o motivo, sem botão", () => {
  salvar("sessao", "u2");
  assert.match(textoDe(telaPagamento(params("c1"))), /liberado depois que o motorista concluir/);
  concluirC1();
  salvar("sessao", "u3");
  const t = telaPagamento(params("c1"));
  assert.match(textoDe(t), /Só quem fez a viagem/);
  assert.equal(achar(t, (e) => e.tagName === "BUTTON"), null);
  assert.match(textoDe(telaPagamento(params("nao-existe"))), /Carona não encontrada/);
});
test("Caronas: passageiro vê pendente e o botão Pagar; motorista vê quem pagou", () => {
  concluirC1();
  salvar("sessao", "u2");
  let t = telaMinhasCaronas();
  assert.match(textoDe(t), /Pagamento⚠ Pendente/);
  assert.equal(botao(t, `Pagar ${moeda(7.5)}`).getAttribute("href"), "#/pagamento?carona=c1");
  salvar("sessao", "u1");
  assert.match(textoDe(telaMinhasCaronas()), /Júlia Santos · ⚠ Pendente/);
  pagar("c1", "u2");
  assert.match(textoDe(telaMinhasCaronas()), /Júlia Santos · ✔ Pago/);
  salvar("sessao", "u2");
  t = telaMinhasCaronas();
  assert.match(textoDe(t), /✔ Pago \(simulado\)/);
  assert.equal(botao(t, `Pagar ${moeda(7.5)}`), null);
  semLixo(t);
});
