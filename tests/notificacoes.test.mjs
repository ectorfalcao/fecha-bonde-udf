// Etapa 10.3: centro de notificações. Todas as notificações num lugar só: o sino do topo abre uma caixa
// com as não lidas em cima e as lidas embaixo.
import test, { beforeEach } from "node:test";
import assert from "node:assert/strict";
import * as N from "../js/notificacoes.js";
import { botaoNotificacoes, conteudoNotificacoes, abrirNotificacoes } from "../js/centroNotificacoes.js";
import { telaMinhasCaronas } from "../js/minhas.js";
import { iniciarDados, obter } from "../js/dados.js";
import { salvar } from "../js/store.js";
import { instalarAmbiente, achar, acharTodos, botao, textoDe, dialogoAberto } from "./dom-falso.mjs";

beforeEach(() => { instalarAmbiente(); iniciarDados(); });
const u = (id) => obter("usuarios", id);
const semLixo = (n) => { const t = textoDe(n); for (const re of [/\[object/, /undefined/, /null/, /false/, /NaN/]) assert.doesNotMatch(t, re); };
const ordemDosTextos = (raiz) => acharTodos(raiz, (e) => e.tagName === "LI").map((li) => textoDe(li));

test("marcarLida: marca só aquela notificação e só se for da própria pessoa", () => {
  const a = N.notificar("u1", "um"), b = N.notificar("u1", "dois"), c = N.notificar("u2", "da Júlia");
  N.marcarLida("u1", a.id);
  N.marcarLida("u1", c.id);                                  // não é dele: nada muda
  assert.deepEqual([N.naoLidas("u1"), N.naoLidas("u2")], [1, 1]);
  assert.equal(N.doUsuario("u1").find((n) => n.id === b.id).lida, false);
});

test("sino: mostra o número de não lidas e diz por extenso no nome acessível", () => {
  let s = botaoNotificacoes(u("u1"));
  assert.equal(s.getAttribute("aria-label"), "Notificações");
  assert.equal(achar(s, (e) => e.className === "contador"), null);
  assert.equal(s.getAttribute("aria-haspopup"), "dialog");
  N.notificar("u1", "um"); N.notificar("u1", "dois");
  s = botaoNotificacoes(u("u1"));
  assert.equal(s.getAttribute("aria-label"), "Notificações: 2 não lida(s)");
  assert.equal(textoDe(achar(s, (e) => e.className === "contador")), "2");
});

test("caixa: não lidas em cima, lidas embaixo, cada grupo da mais nova para a mais antiga", () => {
  const velha = N.notificar("u1", "lida antiga");
  N.notificar("u1", "nova antiga");
  const lidaRecente = N.notificar("u1", "lida recente");
  N.notificar("u1", "nova recente");
  N.marcarLida("u1", velha.id); N.marcarLida("u1", lidaRecente.id);
  const c = conteudoNotificacoes(u("u1"));
  semLixo(c);
  const textos = ordemDosTextos(c);
  const pos = (t) => textos.findIndex((x) => x.includes(t));
  assert.ok(pos("nova recente") < pos("nova antiga") && pos("nova antiga") < pos("lida recente") && pos("lida recente") < pos("lida antiga"), textos.join(" | "));
  assert.match(textoDe(c), /Não lidas2.*Lidas2/);
  assert.ok(textos.filter((t) => /Nova/.test(t)).length === 2, "só as não lidas têm o selo Nova");
});

test("caixa: marcar uma como lida a move para baixo; 'marcar todas' esvazia as não lidas", () => {
  const a = N.notificar("u1", "primeira");
  N.notificar("u1", "segunda");
  let redesenhou = 0;
  let c = conteudoNotificacoes(u("u1"), () => { redesenhou++; });
  botao(c, "Marcar como lida: primeira").click();
  assert.equal(redesenhou, 1);
  assert.equal(N.doUsuario("u1").find((n) => n.id === a.id).lida, true);
  c = conteudoNotificacoes(u("u1"));
  assert.equal(botao(c, "Marcar como lida: primeira"), null, "lida não tem mais o botão");
  botao(c, "Marcar todas como lidas").click();
  assert.equal(N.naoLidas("u1"), 0);
  c = conteudoNotificacoes(u("u1"));
  assert.match(textoDe(c), /Você está em dia/);
  assert.equal(botao(c, "Marcar todas como lidas"), null);
});

test("caixa vazia explica o que vai aparecer", () => {
  const c = conteudoNotificacoes(u("u3"));
  assert.match(textoDe(c), /Nenhuma notificação/);
  semLixo(c);
});

test("abrir pelo sino: caixa 'Notificações' com o conteúdo e o atalho para Caronas", () => {
  salvar("sessao", "u1");
  N.notificar("u1", "Júlia solicitou uma vaga");
  botaoNotificacoes(u("u1")).click();
  const d = dialogoAberto();
  assert.ok(d, "a caixa abriu");
  assert.match(d.className, /\bnotificacoes\b/);
  assert.match(textoDe(d), /Notificações.*Não lidas.*Júlia solicitou uma vaga/);
  assert.equal(botao(d, "Ver minhas caronas").getAttribute("href"), "#/caronas");
  botao(d, "Ver minhas caronas").click();
  assert.equal(dialogoAberto(), null, "fecha ao ir para Caronas");
});

test("abrirNotificacoes sem sessão não abre nada", () => {
  assert.equal(abrirNotificacoes(), null);
  assert.equal(dialogoAberto(), null);
});

test("Caronas não mostra mais notificações: elas ficam todas no sino", () => {
  N.notificar("u1", "aviso de teste");
  salvar("sessao", "u1");
  const t = telaMinhasCaronas();
  assert.doesNotMatch(textoDe(t), /aviso de teste/);
  assert.equal(botao(t, "Marcar todos como lidos"), null);
});
