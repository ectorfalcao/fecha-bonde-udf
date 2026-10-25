// Textos PROVISÓRIOS, redigidos pela equipe de desenvolvimento para o protótipo. Devem ser revisados pela instituição.
import { el, aviso, dialogoConfirmar } from "./componentes.js";
import { registrarAceiteUso, registrarAceiteConvivencia } from "./sessao.js";

const USO = [
  "O Fecha Bonde UDF é um protótipo acadêmico. Nenhum dado aqui é real e nenhum pagamento é processado.",
  "O acesso é restrito a integrantes da comunidade acadêmica com e-mail institucional.",
  "Os dados informados ficam apenas neste navegador e podem ser apagados a qualquer momento (princípios da LGPD: finalidade, necessidade e transparência)."
];
const CONVIVENCIA = [
  "Respeitar horários, trajetos e combinados do grupo de carona.",
  "Tratar motorista e passageiros com cordialidade; não é tolerado assédio nem discriminação.",
  "Avisar com antecedência em caso de cancelamento.",
  "Usar o botão de emergência apenas em situação de risco."
];
const corpo = (itens) => [aviso("alerta", "Texto provisório para o protótipo."), el("ul", {}, itens.map((t) => el("li", {}, t)))];

export async function pedirAceiteUso(usuario) {
  const ok = await dialogoConfirmar({ titulo: "Termos de uso", corpo: corpo(USO), aceitar: "Aceitar e continuar", recusar: "Não aceito" });
  return ok ? registrarAceiteUso(usuario.id) : null;
}
// RF03/RN03: chamado por buscar.js na primeira solicitação de vaga (Etapa 7).
export async function pedirAceiteConvivencia(usuario) {
  const ok = await dialogoConfirmar({ titulo: "Termos de convivência da comunidade", corpo: corpo(CONVIVENCIA), aceitar: "Aceitar", recusar: "Cancelar" });
  return ok ? registrarAceiteConvivencia(usuario.id) : null;
}