import { el, linkBotao, estadoVazio, selo, dataHora, icone } from "./componentes.js";
import { listar, obter } from "./dados.js";
import { cartaoCarona } from "./cartao.js";
import { usuarioAtual, acessoLiberado } from "./sessao.js";
import { visivelPara } from "./caronas.js";
import { contextoDados } from "./solicitacoes.js";
import { ATIVAS, rotuloStatus } from "./grupos.js";

const NS = "http://www.w3.org/2000/svg";
const svg = (tag, attrs = {}, ...filhos) => {
  const n = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, String(v));
  n.append(...filhos);
  return n;
};

// Ilustração do destaque: a "linha" da carona (partida, ponto de encontro âmbar e o campus). Decorativa.
const arteRota = () => svg("svg", { class: "hero-arte", viewBox: "0 0 240 180", "aria-hidden": "true", focusable: "false" },
  svg("path", { d: "M28 150 C 40 92, 120 132, 132 88 S 196 40, 212 30", fill: "none", stroke: "rgb(255 255 255 / 0.14)", "stroke-width": "14", "stroke-linecap": "round" }),
  svg("path", { d: "M28 150 C 40 92, 120 132, 132 88 S 196 40, 212 30", fill: "none", stroke: "#e8a317", "stroke-width": "3", "stroke-dasharray": "7 7", "stroke-linecap": "round" }),
  svg("circle", { cx: "28", cy: "150", r: "10", fill: "#fff", stroke: "#15202b", "stroke-width": "4" }),
  svg("circle", { cx: "132", cy: "88", r: "7", fill: "#e8a317", stroke: "#15202b", "stroke-width": "3" }),
  svg("circle", { cx: "212", cy: "30", r: "16", fill: "rgb(92 195 186 / 0.25)" }),
  svg("circle", { cx: "212", cy: "30", r: "10", fill: "#5cc3ba", stroke: "#15202b", "stroke-width": "4" }),
  svg("text", { x: "212", y: "64", "text-anchor": "middle", fill: "#c4cfd9", "font-size": "12", "font-weight": "700", "font-family": "Inter, system-ui, sans-serif" }, "UDF"));

// A próxima viagem da pessoa conectada (como passageira ou motorista), com dados reais do armazenamento.
function proximaViagem(u) {
  const caronas = listar("caronas"), sols = listar("solicitacoes");
  const agora = new Date();
  // Em andamento sempre; aberta só se a saída ainda não passou (carona vencida não é "próxima").
  const emCurso = (c) => c && (c.status === "em_andamento" || (c.status === "aberta" && new Date(c.dataHoraSaida) > agora));
  const comoPassageiro = sols.filter((s) => s.passageiroId === u.id && ATIVAS.includes(s.status))
    .map((s) => ({ c: obter("caronas", s.caronaId), s })).filter((x) => emCurso(x.c));
  const comoMotorista = caronas.filter((c) => c.motoristaId === u.id && emCurso(c)).map((c) => ({ c, s: null }));
  const proxima = [...comoPassageiro, ...comoMotorista]
    .sort((a, b) => (a.c.status === "em_andamento" ? -1 : 0) - (b.c.status === "em_andamento" ? -1 : 0) || new Date(a.c.dataHoraSaida) - new Date(b.c.dataHoraSaida))[0];
  if (!proxima) return null;
  const { c, s } = proxima, andamento = c.status === "em_andamento";
  const situacao = s ? rotuloStatus(s, c) : andamento ? "Viagem em andamento" : "Você é o motorista";
  return el("section", { class: "cartao proxima", "aria-labelledby": "h-proxima" },
    el("span", { class: "proxima-icone", "aria-hidden": "true" }, icone(andamento ? "sirene" : "carro", { tamanho: 24 })),
    el("div", { class: "proxima-texto" },
      el("h2", { id: "h-proxima", class: "rotulo" }, andamento ? "Viagem em andamento" : "Sua próxima viagem"),
      el("p", { class: "proxima-rota" }, el("span", { class: "mini-linha", "aria-hidden": "true" }), `${c.origem} → ${c.destino}`),
      el("p", { class: "nota" }, `${dataHora(c.dataHoraSaida)} · ${situacao}`)),
    el("div", { class: "linha-acoes" }, andamento
      ? linkBotao("Abrir viagem", "#/viagem", "perigo", "sirene")
      : linkBotao("Ver em Caronas", "#/caronas", "secundario", "avancar")));
}

export function telaInicio() {
  const agora = new Date(), u = usuarioAtual(), ctx = contextoDados(u);
  const conectado = u && acessoLiberado(u);
  const caronas = listar("caronas")
    .filter((c) => c.status === "aberta" && new Date(c.dataHoraSaida) > agora) // sem canceladas nem vencidas
    .filter((c) => visivelPara(c, ctx))                                      // RN05 (Etapa 10): como na busca
    .sort((a, b) => new Date(a.dataHoraSaida) - new Date(b.dataHoraSaida));
  const itens = caronas.map((c) => cartaoCarona(c)); // mesmo cartão da busca (Etapa 9.2)

  const destaque = el("section", { class: "hero", "aria-labelledby": "h-inicio" },
    el("div", { class: "hero-texto" },
      el("p", { class: "hero-sobretitulo" }, "Comunidade UDF · caronas compartilhadas"),
      el("h2", { id: "h-inicio" }, "Caronas para o UDF"),
      el("p", {}, "Encontre colegas que fazem o mesmo trajeto, divida o custo e chegue junto ao campus."),
      el("div", { class: "hero-acoes" },
        linkBotao("Buscar carona", "#/buscar", "grande", "busca"),
        conectado ? linkBotao("Oferecer carona", "#/oferecer", "claro grande", "oferecer")
          : !u && linkBotao("Entrar com e-mail institucional", "#/acesso", "claro grande", "usuario")),
      el("p", { class: "hero-nota" }, icone("info", { tamanho: 16 }), "Protótipo acadêmico: as caronas abaixo são fictícias. Para solicitar uma vaga, use a busca.")),
    arteRota());

  return el("div", {},
    destaque,
    conectado && proximaViagem(u),
    el("section", { "aria-labelledby": "h-proximas" },
      el("div", { class: "secao-topo" }, el("h2", { id: "h-proximas" }, "Próximas caronas"),
        itens.length > 0 && selo(`${itens.length} aberta(s)`, "marca")),
      itens.length
        ? el("ul", { class: "lista-caronas", "aria-label": "Caronas de exemplo" }, itens)
        : estadoVazio({ titulo: "Nenhuma carona aberta no momento", texto: "Quando alguém publicar uma carona, ela aparece aqui.",
            acao: conectado && linkBotao("Oferecer carona", "#/oferecer", "secundario", "oferecer") })));
}
