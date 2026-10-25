import { el, aviso, linkBotao, dataHora, moeda } from "./componentes.js";
import { listar, obter, vagasDisponiveis } from "./dados.js";
import { usuarioAtual } from "./sessao.js";

export function telaInicio() {
  const caronas = listar("caronas");
  const itens = caronas.map((c) => {
    const motorista = obter("usuarios", c.motoristaId);
    const vagas = vagasDisponiveis(c);
    return el("li", { class: "carona" },
      el("h3", {}, `${c.origem} → ${c.destino}`),
      el("dl", {},
        el("dt", {}, "Saída"), el("dd", {}, dataHora(c.dataHoraSaida)),
        el("dt", {}, "Motorista"), el("dd", {}, motorista?.nome ?? "—"),
        el("dt", {}, "Vagas"), el("dd", {}, vagas > 0 ? `${vagas} de ${c.vagasTotal}` : "Lotada (lista de espera)"),
        el("dt", {}, "Contribuição"), el("dd", { class: "valor" }, moeda(c.valor)),
        c.apenasMulheres && [el("dt", {}, "Grupo"), el("dd", {}, "Só para mulheres")]));
  });
  return el("div", {},
    el("h2", {}, "Caronas para o UDF"),
    aviso("info", "Protótipo acadêmico: as caronas abaixo são fictícias e ainda não podem ser solicitadas."),
    el("p", {}, linkBotao("Buscar carona", "#/buscar"), " ", !usuarioAtual() && linkBotao("Entrar com e-mail institucional", "#/acesso", "secundario")),
    el("ul", { class: "lista-caronas", "aria-label": "Caronas de exemplo" }, itens));
}