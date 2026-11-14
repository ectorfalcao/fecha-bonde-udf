// Histórico e extrato (RF13, Etapa 8.7): #/historico. Também exporta o cartão de viagem concluída usado em Caronas.
import { el, linkBotao, estadoVazio, moeda, dataHora } from "./componentes.js";
import { listar, obter } from "./dados.js";
import { usuarioAtual } from "./sessao.js";
import { historicoDe, extratoDe } from "./historico.js";
import { pagamentoDe, situacaoPagamentos } from "./pagamento.js";
import { quemAvaliar } from "./avaliacao.js";
import { topoCarona } from "./cartao.js";

const lista = (linhas) => el("dl", {}, linhas.filter(Boolean).flatMap(([t, v, cls]) => [el("dt", {}, t), el("dd", { class: cls }, v)]));
const reais = (v) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); // moeda() diria "Gratuita" para 0

// Uma viagem concluída: papel, pagamento (RF12), avaliação (RF14) e ações pendentes.
export function cartaoViagemConcluida(u, c, { solicitacoes, pagamentos, avaliacoes }) {
  const souMotorista = c.motoristaId === u.id, pago = pagamentoDe(c.id, u.id, pagamentos);
  const situacao = situacaoPagamentos(c, solicitacoes, pagamentos);
  const aAvaliar = quemAvaliar(c, u.id, solicitacoes, avaliacoes), pendentes = aAvaliar.filter((a) => a.obrigatorio && !a.feita).length;
  return el("li", { class: "carona" }, topoCarona(c, "h4"),
    lista([["Seu papel", souMotorista ? "Motorista" : "Passageiro(a)"], ["Concluída em", dataHora(c.concluidaEm)],
      ["Passageiros", String(situacao.length)], ["Contribuição", moeda(c.valor), "valor"],
      c.valor > 0 && !souMotorista && ["Pagamento", pago ? `✔ Pago (simulado) em ${dataHora(pago.pagoEm)}` : "⚠ Pendente"],
      aAvaliar.length > 0 && ["Avaliação", pendentes ? `⚠ ${pendentes} pendente(s)` : "✔ Feita"]]),
    souMotorista && c.valor > 0 && situacao.length > 0 && [el("p", {}, el("strong", {}, "Pagamentos (simulados)")),
      el("ul", { class: "pessoas" }, situacao.map((s) => el("li", {}, el("span", {},
        `${obter("usuarios", s.passageiroId)?.nome ?? "—"} · ${s.pagamento ? "✔ Pago" : "⚠ Pendente"}`))))],
    el("div", { class: "linha-acoes" },
      c.valor > 0 && !souMotorista && !pago && linkBotao(`Pagar ${moeda(c.valor)}`, `#/pagamento?carona=${c.id}`),
      aAvaliar.some((a) => !a.feita) && linkBotao(pendentes ? "⭐ Avaliar" : "⭐ Avaliar outros passageiros", `#/avaliacao?carona=${c.id}`, pendentes ? "" : "secundario"),
      linkBotao("💬 Ver chat", `#/chat?carona=${c.id}`, "secundario")));
}

export function telaHistorico() {
  const u = usuarioAtual();
  const ctx = { solicitacoes: listar("solicitacoes"), pagamentos: listar("pagamentos"), avaliacoes: listar("avaliacoes") };
  const caronas = listar("caronas");
  const viagens = historicoDe(u.id, caronas, ctx.solicitacoes);
  const e = extratoDe(u.id, caronas, ctx.solicitacoes, ctx.pagamentos);
  return el("div", {}, el("h2", {}, "Histórico e extrato"),
    el("section", { class: "secao", "aria-labelledby": "h-extrato" }, el("h3", { id: "h-extrato" }, "Extrato (simulado)"),
      el("div", { class: "carona" }, lista([
        ["Você pagou", reais(e.pago), "valor"], ["Você ainda deve", reais(e.aPagar), "valor"],
        ["Você recebeu", reais(e.recebido), "valor"], ["A receber", reais(e.aReceber), "valor"]])),
      el("p", { class: "nota" }, "Valores simulados: nenhum dinheiro foi movimentado. Caronas gratuitas não entram no extrato.")),
    el("section", { class: "secao", "aria-labelledby": "h-viagens" }, el("h3", { id: "h-viagens" }, `Viagens concluídas (${viagens.length})`),
      viagens.length
        ? el("ul", { class: "lista-caronas" }, viagens.map((c) => cartaoViagemConcluida(u, c, ctx)))
        : estadoVazio({ titulo: "Nenhuma viagem concluída ainda", texto: "As viagens aparecem aqui depois que o motorista as conclui.", acao: linkBotao("Buscar carona", "#/buscar") })),
    el("div", { class: "linha-acoes" }, linkBotao("Voltar para Caronas", "#/caronas", "secundario")));
}
