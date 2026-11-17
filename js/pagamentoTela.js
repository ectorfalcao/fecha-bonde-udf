// Tela de pagamento SIMULADO (RF12, Etapa 8.5): #/pagamento?carona=<id>. Nenhum dinheiro é movimentado.
import { el, aviso, linkBotao, moeda, dataHora, fatos, cabecalhoTela, comIcone, icone } from "./componentes.js";
import { listar, obter } from "./dados.js";
import { usuarioAtual } from "./sessao.js";
import { podePagar, pagamentoDe, codigoPixFicticio, CHAVE_PIX_FICTICIA } from "./pagamento.js";
import { pagar } from "./pagamentos.js";

const voltar = () => linkBotao("Voltar para Caronas", "#/caronas", "secundario", "voltar");
const AVISO_SIMULADO = "Pagamento SIMULADO: nenhum dinheiro é movimentado. Não use chave PIX, conta ou cartão reais.";

export function telaPagamento(params) {
  const u = usuarioAtual();
  const carona = obter("caronas", params?.get("carona") ?? "");
  const raiz = el("div", { class: "tela-estreita" }, cabecalhoTela({ titulo: "Pagamento", descricao: "Contribuição combinada com o motorista, paga depois da viagem." }));
  if (!carona) { raiz.append(aviso("erro", "Carona não encontrada."), voltar()); return raiz; }

  const motorista = obter("usuarios", carona.motoristaId);
  // RF12 (Etapa 10): a chave cadastrada pelo motorista (fictícia) ou, se ele não cadastrou, a chave padrão do protótipo.
  const chave = motorista?.chavePix?.trim() || CHAVE_PIX_FICTICIA;
  // Etapa 9.4: quanto (grande, com o carimbo SIMULADO), depois para quem e por qual viagem.
  const resumo = el("section", { class: "carona pagamento-resumo recibo" },
    el("h3", { class: "sr-only" }, `${carona.origem} → ${carona.destino}`),
    el("p", { class: "pagamento-topo" }, el("span", { class: "nota" }, "Contribuição da viagem"), el("span", { class: "carimbo" }, "SIMULADO")),
    el("p", { class: "valor-grande" }, moeda(carona.valor)),
    el("p", { class: "nota" }, `${carona.origem} → ${carona.destino} · motorista ${motorista?.nome ?? "—"}`,
      carona.concluidaEm && ` · viagem concluída em ${dataHora(carona.concluidaEm)}`));
  const corpo = el("div", { tabindex: "-1" });
  raiz.append(aviso("alerta", AVISO_SIMULADO), resumo, corpo);

  const desenhar = () => {
    const feito = pagamentoDe(carona.id, u.id, listar("pagamentos"));
    if (feito) return corpo.replaceChildren(
      aviso("sucesso", `Pagamento simulado de ${moeda(feito.valor)} registrado em ${dataHora(feito.pagoEm)}. O motorista foi avisado.`), voltar());
    const v = podePagar({ carona, passageiroId: u.id, solicitacoes: listar("solicitacoes"), pagamentos: listar("pagamentos") });
    if (!v.ok) return corpo.replaceChildren(aviso("alerta", v.motivo), voltar());

    const erro = el("div");
    corpo.replaceChildren(
      el("fieldset", {}, el("legend", {}, icone("carteira", { tamanho: 18 }), "Forma de pagamento"),
        el("div", { class: "opcoes-cartao" },
          el("label", { class: "opcao-cartao", for: "metodo-pix" }, el("input", { type: "radio", id: "metodo-pix", name: "metodo", value: "pix", checked: true }), icone("qr"), "PIX (simulado)"),
          el("label", { class: "opcao-cartao", for: "metodo-cartao" }, el("input", { type: "radio", id: "metodo-cartao", name: "metodo", value: "cartao", disabled: true }), icone("cartao"), "Cartão (indisponível no protótipo)"))),
      el("section", { class: "secao carona", "aria-labelledby": "h-pix" }, el("h3", { id: "h-pix" }, "PIX"),
        fatos([["Chave do motorista", chave], ["Código (fictício)", el("code", { class: "codigo" }, codigoPixFicticio(carona, u.id))]], "linhas"),
        el("p", { class: "nota" }, motorista?.chavePix?.trim()
          ? "Chave cadastrada pelo motorista no perfil. Como o pagamento é simulado, nada é enviado a ela."
          : "O código e a chave acima são fictícios e não funcionam em nenhum banco.")),
      erro,
      el("div", { class: "linha-acoes" },
        el("button", { type: "button", class: "botao grande", onclick: () => {
          const r = pagar(carona.id, u.id);
          if (!r.ok) return erro.replaceChildren(aviso("erro", r.motivo));
          desenhar();
          corpo.focus();
        } }, comIcone("check", `Simular pagamento de ${moeda(carona.valor)}`)),
        voltar()));
  };
  desenhar();
  return raiz;
}
