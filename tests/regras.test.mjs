import test from "node:test";
import assert from "node:assert/strict";
import * as R from "../js/regras.js";

test("RN01: aceita os três domínios e recusa e-mail pessoal (FA01)", () => {
  for (const e of ["a@aluno.udf.edu.br", "a@udf.edu.br", "a@cs.udf.edu.br", "  A@ALUNO.UDF.EDU.BR "]) assert.equal(R.emailInstitucionalValido(e), true, e);
  for (const e of ["a@gmail.com", "a@outlook.com", "", "semarroba", "a@@udf.edu.br"]) assert.equal(R.emailInstitucionalValido(e), false, e);
});
test("RN01: comparação de domínio é exata (sem truques de subdomínio)", () => {
  for (const e of ["a@cs.udf.edu.br.outro.com", "a@fakecs.udf.edu.br", "a@udf.edu.br.evil.com", "a@x.udf.edu.br"]) assert.equal(R.emailInstitucionalValido(e), false, e);
});
test("normalizarEmail e textoDominios", () => {
  assert.equal(R.normalizarEmail("  Ana@UDF.edu.br "), "ana@udf.edu.br");
  assert.match(R.textoDominios(), /@cs\.udf\.edu\.br.*ou @aluno\.udf\.edu\.br$/);
});
test("senhaValida exige 8+ caracteres", () => {
  assert.equal(R.senhaValida("1234567"), false);
  assert.equal(R.senhaValida("12345678"), true);
  assert.equal(R.senhaValida(null), false);
});
test("placaValida: antiga e Mercosul; recusa formatos errados", () => {
  for (const p of ["ABC1234", "ABC1D23", "abc-1d23", " fab1c23 "]) assert.equal(R.placaValida(p), true, p);
  for (const p of ["AB1234", "ABCD123", "ABC12345", "", "1234ABC"]) assert.equal(R.placaValida(p), false, p);
  assert.equal(R.normalizarPlaca("abc-1d23"), "ABC1D23");
});
test("telefoneValido: 10 ou 11 dígitos", () => {
  assert.equal(R.telefoneValido("(61) 90000-0001"), true);
  assert.equal(R.telefoneValido("6133334444"), true);
  assert.equal(R.telefoneValido("123"), false);
  assert.equal(R.telefoneValido(""), false);
});
test("RN04: capacidade de 1 a 4", () => {
  for (const n of [1, 2, 3, 4, "4"]) assert.equal(R.capacidadeValida(n), true, String(n));
  for (const n of [0, 5, 1.5, "", "x"]) assert.equal(R.capacidadeValida(n), false, String(n));
});
test("gerarCodigo: 6 dígitos", () => { for (let i = 0; i < 20; i++) assert.match(R.gerarCodigo(), /^\d{6}$/); });

const perfilOk = { nome: "Ana Lima", fotoNome: "f.jpg", curso: "ADS", turno: "Noturno", genero: "feminino", telefone: "(61) 90000-0004", passageiro: true, motorista: false, contatoNome: "", contatoTel: "" };
test("RN02: perfil de passageiro completo é válido", () => assert.deepEqual(R.validarPerfil(perfilOk), {}));
test("RN02: campos obrigatórios geram erro por campo", () => {
  const e = R.validarPerfil({ ...perfilOk, nome: "Ana", fotoNome: "", curso: " ", turno: "X", genero: "?", telefone: "1", passageiro: false });
  for (const k of ["nome", "foto", "curso", "turno", "genero", "telefone", "papel"]) assert.ok(e[k], k);
});
test("RN02: contato de emergência é opcional, mas se vier precisa estar completo (RF15)", () => {
  assert.deepEqual(R.validarPerfil({ ...perfilOk, contatoNome: "Mãe", contatoTel: "(61) 98888-7777" }), {});
  assert.ok(R.validarPerfil({ ...perfilOk, contatoNome: "Mãe", contatoTel: "" }).contatoTel);
  assert.ok(R.validarPerfil({ ...perfilOk, contatoNome: "", contatoTel: "(61) 98888-7777" }).contatoNome);
});
test("RN02: motorista exige CNH e veículo válido", () => {
  const m = { ...perfilOk, motorista: true };
  const e = R.validarPerfil(m);
  assert.ok(e.cnh && e.placa && e.modelo && e.cor && e.capacidade);
  assert.deepEqual(R.validarPerfil({ ...m, cnhNome: "c.jpg", veiculo: { placa: "ABC1D23", modelo: "Onix", cor: "Prata", capacidade: "4" } }), {});
});
test("perfilPendencias lista o que falta", () => {
  assert.deepEqual(R.perfilPendencias({ ...perfilOk, telefoneVerificado: true }, null), []);
  const p = R.perfilPendencias({ nome: "", passageiro: false, motorista: true }, null);
  for (const t of ["nome completo", "foto de perfil", "telefone verificado", "foto da CNH", "dados do veículo"]) assert.ok(p.includes(t), t);
});
