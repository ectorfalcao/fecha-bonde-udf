// Renderiza as telas com um DOM falso e simula cliques. NÃO substitui o teste manual no navegador.
import test, { beforeEach } from "node:test";
import assert from "node:assert/strict";
import { instalarAmbiente, botao, achar, acharTodos, textoDe, dialogoAberto, esperar } from "./dom-falso.mjs";
import { el } from "../js/componentes.js";
import { iniciarDados, listar, obter, atualizar } from "../js/dados.js";
import { salvar } from "../js/store.js";
import { naoLidas } from "../js/notificacoes.js";
import { cancelarCarona } from "../js/solicitacoes.js";
import { telaBuscar } from "../js/buscar.js";
import { telaMinhasCaronas } from "../js/minhas.js";
import { telaInicio } from "../js/inicio.js";
import { telaAcesso } from "../js/acesso.js";
import { telaPerfil } from "../js/perfil.js";
import { telaOferecer } from "../js/oferecer.js";

const entrar = (id) => salvar("sessao", id);
const semLixo = (n, nome) => { const t = textoDe(n); for (const re of [/\[object/, /undefined/, /null/, /false/, /NaN/]) assert.doesNotMatch(t, re, `${nome}: texto indevido ${re} na tela`); };
const aceitarDialogo = async (rotulo) => { const d = dialogoAberto(); assert.ok(d, "diálogo deveria estar aberto"); botao(d, rotulo).click(); await esperar(); };

beforeEach(() => { instalarAmbiente(); iniciarDados(); });

test("detector: valor que não é nó vira texto visível (o bug do [object HTMLElement])", () => {
  assert.match(textoDe(el("ul", {}, [[el("li", {}, "a")]])), /\[object/);
});

test("Buscar: cartões sem lixo de texto; mostra situação e botão conforme o caso", () => {
  entrar("u2");
  const t = telaBuscar();
  semLixo(t, "Buscar");
  assert.match(textoDe(t), /carona\(s\) encontrada\(s\)/);
  assert.match(textoDe(t), /Confirmada/);                          // u2 já está em c1
  assert.ok(botao(t, "Solicitar vaga: Guará"), "botão de solicitar em c2");
});

test("RF03/RF07: solicitar vaga abre os termos, aceita e registra a solicitação", async () => {
  entrar("u2");
  const t = telaBuscar();
  botao(t, "Solicitar vaga: Guará").click();
  await esperar();
  assert.match(textoDe(dialogoAberto()), /Termos de convivência/);
  await aceitarDialogo("Aceitar");
  assert.match(textoDe(t), /Solicitação enviada ao motorista/);
  assert.equal(listar("solicitacoes").find((s) => s.caronaId === "c2" && s.passageiroId === "u2").status, "pendente");
  assert.ok(obter("usuarios", "u2").termosConvivenciaEm, "aceite gravado");
  assert.match(textoDe(t), /Aguardando aprovação/);
  semLixo(t, "Buscar depois de solicitar");
});

test("RN03: recusar os termos não cria solicitação", async () => {
  entrar("u2");
  const t = telaBuscar();
  botao(t, "Solicitar vaga: Guará").click();
  await esperar();
  await aceitarDialogo("Cancelar");
  assert.match(textoDe(t), /RN03/);
  assert.equal(listar("solicitacoes").filter((s) => s.caronaId === "c2").length, 0);
});

test("RF07: motorista vê o pedido, aprova, e a passageira vê a confirmação e o aviso", async () => {
  entrar("u2");
  atualizar("usuarios", "u2", { termosConvivenciaEm: new Date().toISOString() });
  const b = telaBuscar(); botao(b, "Solicitar vaga: Guará").click(); await esperar();

  entrar("u3");
  const m = telaMinhasCaronas();
  assert.match(textoDe(m), /Aguardando sua aprovação/);
  assert.match(textoDe(m), /Júlia Santos/);
  botao(m, "Aprovar Júlia Santos").click();
  assert.match(textoDe(m), /foi aprovado/);
  assert.match(textoDe(m), /Confirmados/);
  semLixo(m, "Minhas caronas (motorista)");

  entrar("u2");
  const p = telaMinhasCaronas();
  assert.match(textoDe(p), /Confirmada/);
  assert.match(textoDe(p), /Sua vaga na carona .* foi aprovada/);
  assert.ok(naoLidas("u2") >= 1);
  botao(p, "Marcar todos como lidos").click();
  assert.equal(naoLidas("u2"), 0);
  semLixo(p, "Minhas caronas (passageira)");
});

test("RF09: passageira cancela pela tela e o motorista é avisado", async () => {
  entrar("u2");
  const p = telaMinhasCaronas();
  botao(p, "Cancelar solicitação de Águas Claras").click();
  await esperar();
  await aceitarDialogo("Cancelar solicitação");
  assert.equal(obter("solicitacoes", "s1").status, "cancelada");
  assert.match(textoDe(p), /Solicitação cancelada/);
  assert.ok(naoLidas("u1") >= 1);
});

test("RF09: motorista cancela a carona pela tela", async () => {
  entrar("u1");
  const m = telaMinhasCaronas();
  botao(m, "Cancelar carona Águas Claras").click();
  await esperar();
  await aceitarDialogo("Cancelar carona");
  assert.equal(obter("caronas", "c1").status, "cancelada");
  assert.equal(obter("solicitacoes", "s1").status, "cancelada");
  assert.match(textoDe(m), /Carona cancelada/);
});

test("Início: não lista caronas canceladas nem vencidas", () => {
  entrar("u1");
  cancelarCarona("c2", "u3");
  atualizar("caronas", "c1", { dataHoraSaida: new Date(Date.now() - 3600000).toISOString() });
  const t = telaInicio();
  assert.doesNotMatch(textoDe(t), /Guará →/);
  assert.doesNotMatch(textoDe(t), /Águas Claras →/);
  semLixo(t, "Início");
});

for (const [nome, usuario, tela] of [["Acesso (sem sessão)", null, telaAcesso], ["Perfil", "u1", telaPerfil], ["Oferecer", "u1", telaOferecer], ["Início", "u1", telaInicio]])
  test(`${nome}: nenhum texto indevido ("null", "undefined", "[object")`, () => {
    if (usuario) entrar(usuario);
    semLixo(tela(), nome);
  });
