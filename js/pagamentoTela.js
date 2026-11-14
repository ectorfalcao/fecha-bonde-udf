// Tela de pagamento SIMULADO (RF12, Etapa 8.5): #/pagamento?carona=<id>. Nenhum dinheiro é movimentado.
import { el, aviso, linkBotao, moeda, dataHora } from "./componentes.js";
import { listar, obter } from "./dados.js";
import { usuarioAtual } from "./sessao.js";
import { podePagar, pagamentoDe, codigoPixFicticio, CHAVE_PIX_FICTICIA } from "./pagamento.js";
import { pagar } from "./pagamentos.js";

const lista = (linhas) => el("dl", {}, linhas.filter(Boolean).flatMap(([t, v, cls]) => [el("dt", {}, t), el("dd", { class: cls }, v)]));
const voltar = () => linkBotao("Voltar para Caronas", "#/caronas", "secundario");
const AVISO_SIMULADO = "Pagamento SIMULADO: nenhum dinheiro é movimentado. Não use chave PIX, conta ou cartão reais.";

export function telaPagamento(params) {
  const u = usuarioAtual();
  const carona = obter("caronas", params?.get("carona") ?? "");
  const raiz = el("div", {}, el("h2", {}, "Pagamento"));
  if (!carona) { raiz.append(aviso("erro", "Carona não encontrada."), voltar()); return raiz; }

  const motorista = obter("usuarios", carona.motoristaId);
  const resumo = el("section", { class: "carona" }, el("h3", {}, `${carona.origem} → ${carona.destino}`),
    lista([["Motorista", motorista?.nome ?? "—"], ["Viagem concluída em", carona.concluidaEm && dataHora(carona.concluidaEm)],
      ["Contribuição", moeda(carona.valor), "valor"]].filter(([, v]) => v)));
  const corpo = el("div", { tabindex: "-1" });
  raiz.append(aviso("alerta", AVISO_SIMULADO), resumo, corpo);

  const desenhar = () => {
    const feito = pagamentoDe(carona.id, u.id, listar("pagamentos"));
    if (feito) return corpo.replaceChildren(
      aviso("info", `Pagamento simulado de ${moeda(feito.valor)} registrado em ${dataHora(feito.pagoEm)}. O motorista foi avisado.`), voltar());
    const v = podePagar({ carona, passageiroId: u.id, solicitacoes: listar("solicitacoes"), pagamentos: listar("pagamentos") });
    if (!v.ok) return corpo.replaceChildren(aviso("alerta", v.motivo), voltar());

    const erro = el("div");
    corpo.replaceChildren(
      el("fieldset", {}, el("legend", {}, "Forma de pagamento"),
        el("label", { class: "opcao", for: "metodo-pix" }, el("input", { type: "radio", id: "metodo-pix", name: "metodo", value: "pix", checked: true }), "PIX (simulado)"),
        el("label", { class: "opcao", for: "metodo-cartao" }, el("input", { type: "radio", id: "metodo-cartao", name: "metodo", value: "cartao", disabled: true }), "Cartão (indisponível no protótipo)")),
      el("section", { class: "secao", "aria-labelledby": "h-pix" }, el("h3", { id: "h-pix" }, "PIX"),
        lista([["Chave do motorista", CHAVE_PIX_FICTICIA], ["Código (fictício)", el("code", {}, codigoPixFicticio(carona, u.id))]]),
        el("p", { class: "nota" }, "O código e a chave acima são fictícios e não funcionam em nenhum banco.")),
      erro,
      el("div", { class: "linha-acoes" },
        el("button", { type: "button", class: "botao", onclick: () => {
          const r = pagar(carona.id, u.id);
          if (!r.ok) return erro.replaceChildren(aviso("erro", r.motivo));
          desenhar();
          corpo.focus();
        } }, `Simular pagamento de ${moeda(carona.valor)}`),
        voltar()));
  };
  desenhar();
  return raiz;
}
