// Etapa 10: privacidade e dados pessoais (RNF02, RN12; LGPD) e chave PIX fictícia do motorista (RF12).
import test, { beforeEach } from "node:test";
import assert from "node:assert/strict";
import * as P from "../js/privacidade.js";
import { excluirConta, exportarDados, revogarConvivencia } from "../js/contas.js";
import { erroChavePix, validarPerfil } from "../js/regras.js";
import { iniciarDados, listar, obter, inserir, atualizar } from "../js/dados.js";
import { salvar, carregar } from "../js/store.js";
import { cancelarCarona, cancelarSolicitacao } from "../js/solicitacoes.js";
import { iniciarViagem, concluirViagem } from "../js/viagens.js";
import { avaliar } from "../js/avaliacoes.js";
import { enviarMensagem } from "../js/mensagens.js";
import { pagar } from "../js/pagamentos.js";
import { mediaDe } from "../js/avaliacao.js";
import { instalarAmbiente, botao, achar, textoDe, dialogoAberto, esperar } from "./dom-falso.mjs";
import { telaPerfil } from "../js/perfil.js";
import { telaViagemAtiva } from "../js/viagemAtiva.js";
import { telaPagamento } from "../js/pagamentoTela.js";
import { telaMinhasCaronas } from "../js/minhas.js";
import { telaAcesso } from "../js/acesso.js";
import { solicitar } from "../js/solicitacoes.js";

beforeEach(() => { instalarAmbiente(); iniciarDados(); });

const saida = () => new Date(obter("caronas", "c1").dataHoraSaida).getTime();
// Carlos (u1) leva Júlia (u2) na c1 até o fim: mensagem, pagamento e avaliações nos dois sentidos.
function viagemCompleta() {
  enviarMensagem({ caronaId: "c1", remetenteId: "u2", texto: "Estou na estação" });
  iniciarViagem("c1", "u1", { agora: new Date(saida() - 5 * 60000) });
  concluirViagem("c1", "u1", { agora: new Date(saida() + 40 * 60000) });
  pagar("c1", "u2");
  avaliar({ caronaId: "c1", avaliadorId: "u2", avaliadoId: "u1", nota: 5, comentario: "Pontual" });
  avaliar({ caronaId: "c1", avaliadorId: "u1", avaliadoId: "u2", nota: 4, comentario: "Educada" });
}

// ---------- regras puras ----------
test("podeExcluirConta: bloqueia com carona em curso (motorista ou passageiro) e libera depois", () => {
  const col = { caronas: listar("caronas"), solicitacoes: listar("solicitacoes") };
  assert.equal(P.podeExcluirConta("u1", col).codigo, "compromissos");          // motorista da c1 aberta
  assert.equal(P.podeExcluirConta("u2", col).codigo, "compromissos");          // confirmada na c1
  assert.match(P.podeExcluirConta("u2", col).motivo, /cancele ou conclua/);
  assert.deepEqual(P.podeExcluirConta("u9", col), { ok: true });
});

test("anonimizar: apaga dados pessoais e mantém o histórico de outras pessoas", () => {
  viagemCompleta();
  const col = Object.fromEntries(["usuarios", "veiculos", "mensagens", "avaliacoes", "notificacoes", "alertas"].map((c) => [c, listar(c)]));
  col.alertas = [{ id: "a1", usuarioId: "u2" }, { id: "a2", usuarioId: "u1" }];
  const novo = P.anonimizar("u2", col, new Date("2026-11-17T12:00:00Z"));
  const u = novo.usuarios.find((x) => x.id === "u2");
  assert.equal(u.nome, P.NOME_ANONIMO);
  assert.match(u.email, /@anonimo\.invalid$/);
  for (const campo of ["curso", "telefone", "genero", "fotoNome", "contatoNome", "contatoTel"]) assert.equal(u[campo], "", campo);
  assert.equal(u.excluidoEm, "2026-11-17T12:00:00.000Z");
  assert.ok(novo.usuarios.find((x) => x.id === "u1").email.startsWith("carlos"), "os outros não mudam");
  assert.ok(novo.mensagens.filter((m) => m.remetenteId === "u2").every((m) => m.texto === P.TEXTO_MENSAGEM_REMOVIDA));
  assert.ok(novo.mensagens.some((m) => m.remetenteId === "u1" && m.texto !== P.TEXTO_MENSAGEM_REMOVIDA));
  assert.equal(novo.avaliacoes.find((a) => a.avaliadorId === "u2").comentario, "", "comentário feito por ela some");
  assert.equal(novo.avaliacoes.find((a) => a.avaliadorId === "u2").nota, 5, "a nota dada ao Carlos continua na média dele");
  assert.equal(novo.avaliacoes.some((a) => a.avaliadoId === "u2"), false, "avaliações recebidas por ela somem");
  assert.equal(novo.notificacoes.some((n) => n.usuarioId === "u2"), false);
  assert.deepEqual(novo.alertas.map((a) => a.id), ["a2"]);
});

test("dadosDoUsuario: reúne o que o app guarda e esconde o autor das avaliações recebidas", () => {
  viagemCompleta();
  const col = Object.fromEntries(["usuarios", "veiculos", "caronas", "solicitacoes", "mensagens", "avaliacoes", "pagamentos", "notificacoes", "alertas"].map((c) => [c, listar(c)]));
  const d = P.dadosDoUsuario("u2", col);
  assert.equal(d.usuario.email, "julia.santos@aluno.udf.edu.br");
  assert.equal(d.solicitacoes.length, 1);
  assert.ok(d.mensagensEnviadas.length >= 2);
  assert.equal(d.pagamentos.length, 1);
  assert.equal(d.avaliacoesRecebidas.length, 1);
  assert.equal("avaliadorId" in d.avaliacoesRecebidas[0], false);
  assert.equal(d.avaliacoesFeitas[0].avaliadoId, "u1");
});

test("erroChavePix: opcional, sem espaços e nunca CPF, CNPJ ou telefone", () => {
  assert.equal(erroChavePix(""), "");
  assert.equal(erroChavePix("carlos@pix.exemplo"), "");
  assert.equal(erroChavePix("chave-aleatoria-123"), "");
  for (const real of ["123.456.789-09", "12345678909", "12.345.678/0001-95", "(61) 90000-0001", "+5561900000001"])
    assert.match(erroChavePix(real.replace(/\s/g, "")), /Não use CPF/, real);
  assert.match(erroChavePix("com espaço"), /sem espaços/);
  assert.match(erroChavePix("x".repeat(78)), /77/);
});

test("validarPerfil: a chave PIX só é validada para motorista", () => {
  const base = { nome: "Ana Lima", fotoNome: "f.jpg", curso: "ADS", turno: "Noturno", genero: "feminino", telefone: "61900000000", passageiro: true };
  const veiculo = { placa: "ABC1D23", modelo: "Onix", cor: "Prata", capacidade: "3" };
  assert.equal(validarPerfil({ ...base, motorista: true, cnhNome: "c.jpg", veiculo, chavePix: "12345678909" }).chavePix !== undefined, true);
  assert.equal(validarPerfil({ ...base, motorista: true, cnhNome: "c.jpg", veiculo, chavePix: "ana@pix.exemplo" }).chavePix, undefined);
  assert.equal(validarPerfil({ ...base, motorista: false, chavePix: "12345678909" }).chavePix, undefined);
});

// ---------- operações ----------
test("excluirConta: recusa com carona em curso e não muda nada", () => {
  salvar("sessao", "u2");
  assert.equal(excluirConta("u2").codigo, "compromissos");
  assert.equal(obter("usuarios", "u2").nome, "Júlia Santos");
  assert.equal(carregar("sessao"), "u2");
});

test("excluirConta: depois de cancelar, anonimiza, encerra a sessão e o e-mail volta a ficar livre", () => {
  salvar("sessao", "u2");
  cancelarSolicitacao("s1", "u2");
  assert.deepEqual(excluirConta("u2"), { ok: true });
  assert.equal(obter("usuarios", "u2").nome, "Usuário removido");
  assert.equal(carregar("sessao"), null);
  assert.equal(listar("usuarios").some((u) => u.email === "julia.santos@aluno.udf.edu.br"), false);
});

test("excluirConta: motorista sai do histórico de quem viajou com ele só pelo nome", () => {
  viagemCompleta();
  cancelarCarona("c2", "u3");
  assert.deepEqual(excluirConta("u1"), { ok: true });
  assert.equal(obter("caronas", "c1").motoristaId, "u1", "a carona continua no histórico da Júlia");
  assert.equal(listar("pagamentos").length, 1, "o pagamento da Júlia continua no extrato dela");
  assert.equal(listar("veiculos").some((v) => v.motoristaId === "u1"), false);
  assert.equal(mediaDe("u1", listar("avaliacoes")), null, "avaliações recebidas por ele somem");
});

test("exportarDados e revogarConvivencia", () => {
  assert.equal(exportarDados("u1").usuario.nome, "Carlos Eduardo");
  atualizar("usuarios", "u2", { termosConvivenciaEm: "2026-01-01T00:00:00.000Z" });
  revogarConvivencia("u2");
  assert.equal(obter("usuarios", "u2").termosConvivenciaEm, null);
  inserir("usuarios", { id: "u9", nome: "X" });
  assert.equal(exportarDados("u9").solicitacoes.length, 0);
});

// ---------- telas (Etapa 10) ----------
const semLixo = (n) => { const t = textoDe(n); for (const re of [/\[object/, /undefined/, /null/, /false/, /NaN/]) assert.doesNotMatch(t, re); };

test("Perfil: reputação (US10), privacidade com consentimentos e chave PIX só para motorista", () => {
  inserir("avaliacoes", { caronaId: "x", avaliadorId: "u2", avaliadoId: "u1", nota: 4 });
  salvar("sessao", "u1");
  const t = telaPerfil();
  semLixo(t);
  assert.match(textoDe(t), /Sua reputação: ★ 4,0 \(1 avaliação\)/);
  assert.match(textoDe(t), /Privacidade e seus dados \(LGPD\)/);
  assert.match(textoDe(t), /Termos de uso aceitos em/);
  assert.ok(botao(t, "Baixar meus dados") && botao(t, "Excluir minha conta"));
  assert.ok(achar(t, (e) => e.id === "chavePix"), "campo da chave PIX no bloco de motorista");
  salvar("sessao", "u2");
  assert.match(textoDe(telaPerfil()), /Sua reputação: sem avaliações ainda/);
});

test("Perfil: excluir conta com carona em curso mostra o motivo e não apaga nada", async () => {
  salvar("sessao", "u2");
  const t = telaPerfil();
  botao(t, "Excluir minha conta").click();
  await esperar();
  botao(dialogoAberto(), "Excluir minha conta").click();
  await esperar();
  assert.match(textoDe(t), /cancele ou conclua suas caronas em curso/);
  assert.equal(obter("usuarios", "u2").nome, "Júlia Santos");
});

test("Acesso: depois da exclusão, avisa que a conta foi excluída", () => {
  assert.match(textoDe(telaAcesso(new URLSearchParams({ excluida: "1" }))), /Sua conta foi excluída/);
  assert.doesNotMatch(textoDe(telaAcesso(new URLSearchParams())), /conta foi excluída/);
});

test("RNF12: passageira vê o telefone do motorista na viagem; o motorista não vê o próprio", () => {
  iniciarViagem("c1", "u1", { agora: new Date(saida() - 5 * 60000) });
  salvar("sessao", "u2");
  const p = telaViagemAtiva();
  assert.match(textoDe(p), /Telefone do motorista\(61\) 90000-0001/);
  assert.equal(achar(p, (e) => e.tagName === "A" && e.getAttribute("href") === "tel:+5561900000001")?.tagName, "A");
  semLixo(p);
  salvar("sessao", "u1");
  assert.doesNotMatch(textoDe(telaViagemAtiva()), /Telefone do motorista/);
});

test("RF12: o pagamento mostra a chave PIX cadastrada pelo motorista (ou a padrão do protótipo)", () => {
  iniciarViagem("c1", "u1", { agora: new Date(saida() - 5 * 60000) });
  concluirViagem("c1", "u1", { agora: new Date(saida() + 40 * 60000) });
  salvar("sessao", "u2");
  assert.match(textoDe(telaPagamento(new URLSearchParams({ carona: "c1" }))), /pix-ficticio@fechabonde\.exemplo/);
  atualizar("usuarios", "u1", { chavePix: "carlos@pix.exemplo" });
  const t = telaPagamento(new URLSearchParams({ carona: "c1" }));
  assert.match(textoDe(t), /Chave do motoristacarlos@pix\.exemplo/);
  assert.match(textoDe(t), /cadastrada pelo motorista/);
});

test("US10: o motorista vê a reputação de quem pede vaga", () => {
  inserir("avaliacoes", { caronaId: "x", avaliadorId: "u1", avaliadoId: "u2", nota: 5 });
  atualizar("usuarios", "u2", { termosConvivenciaEm: new Date().toISOString() });
  solicitar("c2", "u2");
  salvar("sessao", "u3");
  assert.match(textoDe(telaMinhasCaronas()), /Júlia Santos.*★ 5,0 \(1 avaliação\)/);
});
