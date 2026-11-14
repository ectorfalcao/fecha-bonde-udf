// Mapa esquemático da viagem (RF11, Etapa 8.4). SIMULADO: não há GPS nem servidor (ver premissas).
// Desenhado em SVG puro, sem biblioteca nem imagens externas: funciona offline e não envia dados a terceiros.
import { el } from "./componentes.js";
import { localPorId } from "./caronas.js";
import { posicaoSimulada } from "./viagem.js";

const NS = "http://www.w3.org/2000/svg";
const W = 320, MARGEM = 36, H_MIN = 150, H_MAX = 260, QUADRA = 40;
const ATUALIZAR_MS = 15000;
const COS_LAT = Math.cos((-15.8 * Math.PI) / 180); // corrige a largura das longitudes na latitude de Brasília

// el() cria elementos HTML; SVG precisa de createElementNS para ser desenhado pelo navegador.
const svg = (tag, attrs = {}, ...filhos) => {
  const n = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, String(v));
  n.append(...filhos);
  return n;
};
const hora = (d) => new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(d);

// Enquadra origem e destino mantendo a proporção real. A altura acompanha a rota (Etapa 9.3):
// rota quase horizontal = mapa baixo, sem a faixa vazia que aparecia no celular.
function projetor(a, b) {
  const x = (p) => p.lng * COS_LAT, y = (p) => -p.lat;
  const minX = Math.min(x(a), x(b)), minY = Math.min(y(a), y(b));
  const larg = Math.abs(x(a) - x(b)) || 1e-9, alt = Math.abs(y(a) - y(b)) || 1e-9;
  const H = Math.round(Math.min(H_MAX, Math.max(H_MIN, (W - 2 * MARGEM) * (alt / larg) + 2 * MARGEM)));
  const esc = Math.min((W - 2 * MARGEM) / larg, (H - 2 * MARGEM) / alt);
  const ox = (W - larg * esc) / 2, oy = (H - alt * esc) / 2;
  return { H, xy: (p) => [ox + (x(p) - minX) * esc, oy + (y(p) - minY) * esc] };
}

// Rótulo do lado de dentro do desenho, para nomes longos não saírem da área.
const rotulo = ([px, py], texto, H) => svg("text", {
  x: px < W / 2 ? px - 6 : px + 6, y: py < H / 2 ? py - 12 : py + 22,
  "text-anchor": px < W / 2 ? "start" : "end"
}, texto);

// Quadras de fundo (ruas em grade) para o desenho ser lido como mapa; não representam ruas reais.
const ruas = (H) => {
  let d = "";
  for (let x = QUADRA / 2; x < W; x += QUADRA) d += `M${x} 0V${H}`;
  for (let y = QUADRA / 2; y < H; y += QUADRA) d += `M0 ${y}H${W}`;
  return svg("path", { class: "mapa-ruas", d });
};

export function mapaViagem(carona) {
  const a = localPorId(carona.origemId), b = localPorId(carona.destinoId);
  if (!a || !b) return el("p", { class: "nota" }, "Mapa indisponível: esta carona não usa os locais da lista do protótipo.");
  const { H, xy } = projetor(a, b), pa = xy(a), pb = xy(b);

  const percorrido = svg("line", { class: "mapa-percorrido", x1: pa[0], y1: pa[1], x2: pa[0], y2: pa[1] });
  const veiculo = svg("circle", { class: "mapa-veiculo", r: 8, cx: pa[0], cy: pa[1] });
  const legenda = el("figcaption", { class: "nota" });
  const chegada = el("p", { class: "mapa-chegada", "aria-hidden": "true" }); // em destaque para quem enxerga; a legenda diz o mesmo

  // O desenho é decorativo para leitores de tela: a legenda em texto diz a mesma coisa.
  const desenho = svg("svg", { viewBox: `0 0 ${W} ${H}`, "aria-hidden": "true", focusable: "false" },
    svg("rect", { class: "mapa-fundo", width: W, height: H, rx: 12 }),
    ruas(H),
    svg("line", { class: "mapa-rota", x1: pa[0], y1: pa[1], x2: pb[0], y2: pb[1] }),
    percorrido,
    svg("circle", { class: "mapa-origem", r: 7, cx: pa[0], cy: pa[1] }),
    svg("circle", { class: "mapa-destino", r: 7, cx: pb[0], cy: pb[1] }),
    rotulo(pa, a.nome, H), rotulo(pb, b.nome, H),
    veiculo,
    svg("text", { class: "mapa-selo", x: W - 10, y: 20, "text-anchor": "end" }, "SIMULADO"));

  const figura = el("figure", { class: "mapa" }, chegada, desenho, legenda);

  const atualizar = () => {
    const p = posicaoSimulada(carona);
    const [vx, vy] = xy(p);
    veiculo.setAttribute("cx", String(vx)); veiculo.setAttribute("cy", String(vy));
    percorrido.setAttribute("x2", String(vx)); percorrido.setAttribute("y2", String(vy));
    const pct = Math.round(p.progresso * 100);
    chegada.replaceChildren(...[el("span", {}, p.progresso < 1 ? "Chegada prevista" : "Tempo previsto encerrado"),
      p.progresso < 1 && el("strong", {}, hora(p.chegadaPrevista))].filter(Boolean)); // replaceChildren(false) escreveria "false"
    legenda.textContent = `Mapa SIMULADO, sem GPS: posição estimada do veículo, ${pct}% do trajeto ${a.nome} → ${b.nome}. ` +
      (p.progresso < 1
        ? `Chegada prevista às ${hora(p.chegadaPrevista)}.`
        : "O tempo previsto acabou: a viagem termina quando o motorista concluir.");
  };
  atualizar();
  // Atualiza sozinho enquanto a tela estiver aberta; para quando o mapa sai da página.
  const timer = setInterval(() => (figura.isConnected === false ? clearInterval(timer) : atualizar()), ATUALIZAR_MS);
  timer.unref?.(); // nos testes em Node, não segura o processo aberto
  return figura;
}
