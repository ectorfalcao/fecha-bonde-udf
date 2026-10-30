import test, { beforeEach } from "node:test";
import assert from "node:assert/strict";
import * as ChatRegras from "../js/chat.js";
import { listarMensagens, enviarMensagem } from "../js/mensagens.js";
import { telaChat } from "../js/chatTela.js";
import { iniciarDados, listar, obter, inserir, atualizar } from "../js/dados.js";
import { salvar } from "../js/store.js";
import { instalarAmbiente, achar, acharTodos, botao, textoDe } from "./dom-falso.mjs";

const H = 3600000;
const MIN = 60000;

// Polyfill defensivo para EventTarget global no ambiente de testes em Node
if (typeof globalThis.addEventListener !== "function") {
  const ouvintesGlobais = new Map();
  globalThis.addEventListener = (tipo, fn) => {
    if (!ouvintesGlobais.has(tipo)) ouvintesGlobais.set(tipo, new Set());
    ouvintesGlobais.get(tipo).add(fn);
  };
  globalThis.removeEventListener = (tipo, fn) => {
    ouvintesGlobais.get(tipo)?.delete(fn);
  };
  globalThis.dispatchEvent = (ev) => {
    ouvintesGlobais.get(ev.type)?.forEach((fn) => fn(ev));
    return true;
  };
}

const semLixo = (n, contexto) => {
  const t = textoDe(n);
  for (const re of [/\[object/, /undefined/, /null/, /false/, /NaN/]) {
    assert.doesNotMatch(t, re, `${contexto}: texto indevido ${re} encontrado`);
  }
};

beforeEach(() => {
  instalarAmbiente();
  iniciarDados();
});

// ============================================================
// 1. REGRAS PURAS (chat.js)
// ============================================================

test("RN07: janela de arquivamento do chat configurada para 2 horas", () => {
  assert.equal(ChatRegras.JANELA_ARQUIVAMENTO_CHAT_H, 2);
});

test("RF10: membrosDoChat inclui apenas o motorista e passageiros confirmados", () => {
  const carona = { id: "c1", motoristaId: "u1" };
  const sols = [
    { caronaId: "c1", passageiroId: "u2", status: "confirmada" },
    { caronaId: "c1", passageiroId: "u3", status: "pendente" },
    { caronaId: "c1", passageiroId: "u4", status: "espera" },
    { caronaId: "c1", passageiroId: "u5", status: "recusada" },
    { caronaId: "outra", passageiroId: "u6", status: "confirmada" }
  ];
  const membros = ChatRegras.membrosDoChat(carona, sols);
  assert.deepEqual(membros, ["u1", "u2"]);
});

test("RF10: podeAcessarChat libera motorista e passageiro confirmado", () => {
  const carona = { id: "c1", motoristaId: "u1", status: "aberta" };
  const sols = [{ caronaId: "c1", passageiroId: "u2", status: "confirmada" }];

  const resMotorista = ChatRegras.podeAcessarChat({ carona, usuarioId: "u1", solicitacoes: sols });
  assert.deepEqual(resMotorista, { ok: true, papel: "motorista" });

  const resPassageiro = ChatRegras.podeAcessarChat({ carona, usuarioId: "u2", solicitacoes: sols });
  assert.deepEqual(resPassageiro, { ok: true, papel: "passageiro" });
});

test("RF10: podeAcessarChat bloqueia solicitações pendentes, espera ou recusadas", () => {
  const carona = { id: "c1", motoristaId: "u1", status: "aberta" };
  const sols = [
    { caronaId: "c1", passageiroId: "u_pendente", status: "pendente" },
    { caronaId: "c1", passageiroId: "u_espera", status: "espera" },
    { caronaId: "c1", passageiroId: "u_recusada", status: "recusada" }
  ];

  const pendente = ChatRegras.podeAcessarChat({ carona, usuarioId: "u_pendente", solicitacoes: sols });
  assert.equal(pendente.ok, false);
  assert.equal(pendente.codigo, "aguardando");
  assert.match(pendente.motivo, /aprovar/);

  const espera = ChatRegras.podeAcessarChat({ carona, usuarioId: "u_espera", solicitacoes: sols });
  assert.equal(espera.ok, false);
  assert.equal(espera.codigo, "espera");
  assert.match(espera.motivo, /lista de espera/);

  const recusada = ChatRegras.podeAcessarChat({ carona, usuarioId: "u_recusada", solicitacoes: sols });
  assert.equal(recusada.ok, false);
  assert.equal(recusada.codigo, "permissao");

  const estranho = ChatRegras.podeAcessarChat({ carona, usuarioId: "u_estranho", solicitacoes: sols });
  assert.equal(estranho.ok, false);
  assert.equal(estranho.codigo, "permissao");
});

test("RF10: carona cancelada bloqueia acesso ao chat", () => {
  const carona = { id: "c1", motoristaId: "u1", status: "cancelada" };
  const res = ChatRegras.podeAcessarChat({ carona, usuarioId: "u1", solicitacoes: [] });
  assert.equal(res.ok, false);
  assert.equal(res.codigo, "cancelada");
});

test("RN07: estadoDoChat ativo durante carona aberta e em andamento", () => {
  assert.equal(ChatRegras.estadoDoChat({ status: "aberta" }).status, "ativo");
  assert.equal(ChatRegras.estadoDoChat({ status: "aberta" }).podeEnviar, true);
  assert.equal(ChatRegras.estadoDoChat({ status: "em_andamento" }).status, "ativo");
  assert.equal(ChatRegras.estadoDoChat({ status: "em_andamento" }).podeEnviar, true);
});

test("RN07: carona concluída permanece ativa antes de 2h e arquiva após 2h", () => {
  const conclusao = new Date("2030-01-01T12:00:00Z");
  const carona = { status: "concluida", concluidaEm: conclusao.toISOString() };

  // 1 hora após conclusão: ativo
  const em1h = new Date(conclusao.getTime() + 1 * H);
  const estado1h = ChatRegras.estadoDoChat(carona, em1h);
  assert.equal(estado1h.status, "ativo");
  assert.equal(estado1h.podeEnviar, true);

  // Exatamente 2 horas: ativo
  const em2h = new Date(conclusao.getTime() + 2 * H);
  const estado2h = ChatRegras.estadoDoChat(carona, em2h);
  assert.equal(estado2h.status, "ativo");
  assert.equal(estado2h.podeEnviar, true);

  // 2 horas e 1 minuto após: arquivado (RN07)
  const em2h1min = new Date(conclusao.getTime() + 2 * H + 1 * MIN);
  const estadoArquivado = ChatRegras.estadoDoChat(carona, em2h1min);
  assert.equal(estadoArquivado.status, "arquivado");
  assert.equal(estadoArquivado.podeEnviar, false);
  assert.match(estadoArquivado.motivo, /2 horas/);
  assert.match(estadoArquivado.motivo, /RN07/);
});

test("validarMensagem: texto válido, vazio e excesso de tamanho", () => {
  assert.deepEqual(ChatRegras.validarMensagem("  Olá grupo!  "), { ok: true, textoLimpo: "Olá grupo!" });
  assert.equal(ChatRegras.validarMensagem("").codigo, "vazia");
  assert.equal(ChatRegras.validarMensagem("   ").codigo, "vazia");
  assert.equal(ChatRegras.validarMensagem(null).codigo, "vazia");

  const textoLongo = "a".repeat(501);
  const resLongo = ChatRegras.validarMensagem(textoLongo);
  assert.equal(resLongo.ok, false);
  assert.equal(resLongo.codigo, "tamanho");
});

// ============================================================
// 2. OPERAÇÕES (mensagens.js)
// ============================================================

test("listarMensagens retorna mensagens da carona em ordem cronológica", () => {
  const msgs = listarMensagens("c1");
  assert.ok(msgs.length >= 2);
  assert.equal(msgs[0].remetenteId, "u1");
  assert.equal(msgs[1].remetenteId, "u2");
  assert.ok(new Date(msgs[0].criadaEm) <= new Date(msgs[1].criadaEm));
});

test("enviarMensagem grava na coleção e emite evento", () => {
  let eventoDisparado = false;
  const ouvinte = () => { eventoDisparado = true; };
  globalThis.addEventListener("chat-mensagem", ouvinte);

  const res = enviarMensagem({
    caronaId: "c1",
    remetenteId: "u2",
    texto: "Chegando no ponto agora!"
  });

  globalThis.removeEventListener("chat-mensagem", ouvinte);

  assert.equal(res.ok, true);
  assert.equal(res.mensagem.texto, "Chegando no ponto agora!");
  assert.equal(res.mensagem.remetenteId, "u2");
  assert.equal(eventoDisparado, true);

  const todas = listarMensagens("c1");
  assert.ok(todas.some((m) => m.texto === "Chegando no ponto agora!"));
});

test("enviarMensagem bloqueia quem não é membro confirmado", () => {
  const res = enviarMensagem({
    caronaId: "c1",
    remetenteId: "u3", // Mariana não está na carona c1
    texto: "Posso entrar?"
  });
  assert.equal(res.ok, false);
  assert.equal(res.codigo, "permissao");
});

test("enviarMensagem recusa envio se o chat estiver arquivado (RN07)", () => {
  const dataFim = new Date(Date.now() - 3 * H).toISOString();
  atualizar("caronas", "c1", { status: "concluida", concluidaEm: dataFim });

  const res = enviarMensagem({
    caronaId: "c1",
    remetenteId: "u1",
    texto: "Ainda está aberto?"
  });
  assert.equal(res.ok, false);
  assert.equal(res.codigo, "arquivado");
});

// ============================================================
// 3. TELA DO CHAT (chatTela.js)
// ============================================================

test("telaChat: renderiza mensagens para o motorista com identificação e sem lixo", () => {
  salvar("sessao", "u1"); // Carlos Eduardo
  const params = new URLSearchParams("carona=c1");
  const tela = telaChat(params);

  semLixo(tela, "Chat do motorista");
  assert.match(textoDe(tela), /Chat: Águas Claras → UDF Campus Sede/);
  assert.match(textoDe(tela), /Você/);
  assert.match(textoDe(tela), /Júlia Santos/);
  assert.ok(botao(tela, "Enviar"));
});

test("telaChat: renderiza mensagens para a passageira confirmada", () => {
  salvar("sessao", "u2"); // Júlia Santos
  const params = new URLSearchParams("carona=c1");
  const tela = telaChat(params);

  semLixo(tela, "Chat da passageira");
  assert.match(textoDe(tela), /Carlos Eduardo \(Motorista\)/);
  assert.match(textoDe(tela), /Você/);
});

test("telaChat: exibe aviso quando usuário não participa da carona", () => {
  salvar("sessao", "u3"); // Mariana
  const params = new URLSearchParams("carona=c1");
  const tela = telaChat(params);

  semLixo(tela, "Acesso negado no chat");
  assert.match(textoDe(tela), /Você não faz parte do grupo/);
  assert.equal(botao(tela, "Enviar"), null);
});

test("telaChat: exibe aviso de chat arquivado após 2h da conclusão e remove envio", () => {
  salvar("sessao", "u1");
  const dataFim = new Date(Date.now() - 3 * H).toISOString();
  atualizar("caronas", "c1", { status: "concluida", concluidaEm: dataFim });

  const params = new URLSearchParams("carona=c1");
  const tela = telaChat(params);

  semLixo(tela, "Chat arquivado");
  assert.match(textoDe(tela), /arquivado automaticamente 2 horas após/);
  assert.equal(botao(tela, "Enviar"), null, "não deve exibir botão de enviar quando arquivado");
});
