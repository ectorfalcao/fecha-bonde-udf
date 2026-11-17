import { el, aviso, linkBotao } from "./componentes.js";
import { listar } from "./dados.js";
import { cartaoCarona } from "./cartao.js";
import { usuarioAtual } from "./sessao.js";
import { visivelPara } from "./caronas.js";
import { contextoDados } from "./solicitacoes.js";

export function telaInicio() {
  const agora = new Date(), u = usuarioAtual(), ctx = contextoDados(u);
  const caronas = listar("caronas")
    .filter((c) => c.status === "aberta" && new Date(c.dataHoraSaida) > agora) // sem canceladas nem vencidas
    .filter((c) => visivelPara(c, ctx));                                     // RN05 (Etapa 10): como na busca
  const itens = caronas.map((c) => cartaoCarona(c)); // mesmo cartão da busca (Etapa 9.2)
  return el("div", {},
    el("h2", {}, "Caronas para o UDF"),
    aviso("info", "Protótipo acadêmico: as caronas abaixo são fictícias. Para solicitar uma vaga, use a busca."),
    el("p", {}, linkBotao("Buscar carona", "#/buscar"), " ", !u && linkBotao("Entrar com e-mail institucional", "#/acesso", "secundario")),
    itens.length ? el("ul", { class: "lista-caronas", "aria-label": "Caronas de exemplo" }, itens) : el("p", { class: "nota" }, "Nenhuma carona aberta no momento."));
}
