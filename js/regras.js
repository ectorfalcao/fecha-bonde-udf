// Regras de negócio como funções PURAS (sem DOM nem storage): fáceis de testar e de reaproveitar no backend futuro.
// RN01 cita @udf.edu.br e @aluno.udf.edu.br; @cs.udf.edu.br é o domínio real dos alunos (confirmado pela equipe).
// A comparação é EXATA: "@cs.udf.edu.br.outro.com" e "@fakecs.udf.edu.br" não passam.
export const DOMINIOS_UDF = ["@cs.udf.edu.br", "@udf.edu.br", "@aluno.udf.edu.br"];
export const textoDominios = () => DOMINIOS_UDF.join(", ").replace(/, ([^,]*)$/, " ou $1");
export const CAPACIDADE_MIN = 1, CAPACIDADE_MAX = 4;             // RN04
export const TURNOS = ["Matutino", "Vespertino", "Noturno", "Integral"];
export const GENEROS = [["feminino", "Feminino"], ["masculino", "Masculino"], ["outro", "Outro / prefiro não informar"]];

export const normalizarEmail = (e) => String(e ?? "").trim().toLowerCase();
export function emailInstitucionalValido(email) {          // RN01, RNF03 (no front-end: não substitui validação no servidor)
  const m = /^[^\s@]+(@[^\s@]+)$/.exec(normalizarEmail(email));
  return Boolean(m) && DOMINIOS_UDF.includes(m[1]);
}
export const senhaValida = (s) => typeof s === "string" && s.length >= 8;
export const normalizarPlaca = (p) => String(p ?? "").toUpperCase().replace(/[\s-]/g, "");
export const placaValida = (p) => /^[A-Z]{3}\d[A-Z0-9]\d{2}$/.test(normalizarPlaca(p)); // ABC1234 (antiga) e ABC1D23 (Mercosul)
export const telefoneValido = (t) => /^\d{10,11}$/.test(String(t ?? "").replace(/\D/g, ""));
export const capacidadeValida = (n) => Number.isInteger(Number(n)) && Number(n) >= CAPACIDADE_MIN && Number(n) <= CAPACIDADE_MAX;

export function gerarCodigo() { // 6 dígitos; em produção seria gerado e enviado pelo servidor
  const n = globalThis.crypto?.getRandomValues ? globalThis.crypto.getRandomValues(new Uint32Array(1))[0] : Math.floor(Math.random() * 2 ** 32);
  return String(n % 1_000_000).padStart(6, "0");
}

// RN02: devolve { idDoCampo: mensagem }. Objeto vazio = válido.
export function validarPerfil(d) {
  const e = {};
  if (!d.nome?.trim() || d.nome.trim().split(/\s+/).length < 2) e.nome = "Informe o nome completo (nome e sobrenome).";
  if (!d.fotoNome) e.foto = "Envie uma foto de perfil.";
  if (!d.curso?.trim()) e.curso = "Informe o curso.";
  if (!TURNOS.includes(d.turno)) e.turno = "Selecione o turno.";
  if (!GENEROS.some(([v]) => v === d.genero)) e.genero = "Selecione uma opção.";
  if (!telefoneValido(d.telefone)) e.telefone = "Informe o telefone com DDD (10 ou 11 dígitos).";
  if (!d.motorista && !d.passageiro) e.papel = "Escolha ao menos um papel: passageiro ou motorista.";
  if (d.contatoNome?.trim() || d.contatoTel?.trim()) {
    if (!d.contatoNome?.trim()) e.contatoNome = "Informe o nome do contato de emergência.";
    if (!telefoneValido(d.contatoTel)) e.contatoTel = "Informe o telefone do contato com DDD.";
  }
  if (d.motorista) {
    if (!d.cnhNome) e.cnh = "Envie a foto da CNH.";
    Object.assign(e, validarVeiculo(d.veiculo ?? {}));
  }
  return e;
}
export function validarVeiculo(v) {
  const e = {};
  if (!placaValida(v.placa)) e.placa = "Placa inválida. Use o formato ABC1D23 ou ABC1234.";
  if (!v.modelo?.trim()) e.modelo = "Informe o modelo do veículo.";
  if (!v.cor?.trim()) e.cor = "Informe a cor do veículo.";
  if (!capacidadeValida(v.capacidade)) e.capacidade = `Informe de ${CAPACIDADE_MIN} a ${CAPACIDADE_MAX} passageiros.`;
  return e;
}

// Lista o que falta para o perfil cumprir a RN02 (usado para liberar criar/solicitar caronas nas próximas etapas).
export function perfilPendencias(u, veiculo) {
  const p = [];
  if (!u.nome?.trim()) p.push("nome completo");
  if (!u.fotoNome) p.push("foto de perfil");
  if (!u.curso?.trim()) p.push("curso");
  if (!u.turno) p.push("turno");
  if (!u.genero) p.push("gênero");
  if (!u.telefone || !u.telefoneVerificado) p.push("telefone verificado");
  if (!u.motorista && !u.passageiro) p.push("papel (passageiro ou motorista)");
  if (u.motorista && !u.cnhNome) p.push("foto da CNH");
  if (u.motorista && !veiculo) p.push("dados do veículo");
  return p;
}