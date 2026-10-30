// Sessão e verificação de e-mail SIMULADAS (UC01). Não há servidor: o código aparece na tela e a senha não é gravada.
import { carregar, salvar, remover } from "./store.js";
import { listar, obter, inserir, atualizar } from "./dados.js";
import { normalizarEmail, gerarCodigo, perfilPendencias } from "./regras.js";

const VALIDADE_MS = 10 * 60 * 1000, MAX_TENTATIVAS = 5;

export const usuarioAtual = () => { const id = carregar("sessao", null); return id ? obter("usuarios", id) : null; };
export const acessoLiberado = (u = usuarioAtual()) => Boolean(u?.emailVerificado && u?.termosUsoEm); // US01: só após e-mail + termos
export const veiculoDe = (u) => listar("veiculos").find((v) => v.motoristaId === u.id) ?? null;
export const pendenciasDe = (u) => perfilPendencias(u, veiculoDe(u));
const avisarSessao = () => globalThis.dispatchEvent?.(new Event("sessao-alterada"));
export const sair = () => { remover("sessao"); avisarSessao(); };

export function iniciarDesafio(email) {
  const codigo = gerarCodigo();
  salvar("desafio", { email: normalizarEmail(email), codigo, expira: Date.now() + VALIDADE_MS, tentativas: 0 });
  return codigo;
}

export function confirmarDesafio(email, codigoDigitado) {
  const d = carregar("desafio", null);
  const e = normalizarEmail(email);
  if (!d || d.email !== e) return { ok: false, motivo: "Solicite um novo código." };
  if (Date.now() > d.expira) return { ok: false, motivo: "Código expirado. Solicite um novo." };
  if (d.tentativas >= MAX_TENTATIVAS) return { ok: false, motivo: "Muitas tentativas. Solicite um novo código." };
  if (String(codigoDigitado).trim() !== d.codigo) {
    salvar("desafio", { ...d, tentativas: d.tentativas + 1 });
    const restam = MAX_TENTATIVAS - d.tentativas - 1;
    return { ok: false, motivo: `Código incorreto. Restam ${restam} tentativa(s).` };
  }
  remover("desafio");
  let u = listar("usuarios").find((x) => x.email === e);
  if (!u) u = inserir("usuarios", { email: e, nome: "", curso: "", turno: "", genero: "", telefone: "", telefoneVerificado: false, fotoNome: "", cnhNome: "", contatoNome: "", contatoTel: "", motorista: false, passageiro: true, termosUsoEm: null });
  u = atualizar("usuarios", u.id, { emailVerificado: true });
  if (!u) return { ok: false, motivo: "Não foi possível gravar no armazenamento do navegador." };
  salvar("sessao", u.id);
  avisarSessao();
  return { ok: true, usuario: u };
}

export const registrarAceiteUso = (id) => atualizar("usuarios", id, { termosUsoEm: new Date().toISOString() });
export const registrarAceiteConvivencia = (id) => atualizar("usuarios", id, { termosConvivenciaEm: new Date().toISOString() });