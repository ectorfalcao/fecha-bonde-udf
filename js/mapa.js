// Mapa da viagem (RF11). Etapa 11: mapa REAL (Leaflet + OpenStreetMap), rota pelas ruas (OSRM) e GPS do motorista.
// A tela abre com o mapa esquemático (SVG, sem rede) e troca pelo mapa real assim que a biblioteca carrega.
// Sem internet (ou nos testes em Node), o esquema fica: é a reserva offline (RNF12), rotulada SIMULADO.
// Posição do carro: GPS do motorista se houver um recente neste navegador; senão, estimada pelo tempo (rotulada).
import { el, comIcone } from "./componentes.js";
import { localPorId } from "./caronas.js";
import { posicaoSimulada } from "./viagem.js";
import { pontoNaRota, buscarRota } from "./rotas.js";
import { posicaoGpsDe, posicaoDoVeiculo, compartilhando, iniciarCompartilhamento, pararCompartilhamento } from "./posicoes.js";
import { carregarLeaflet, desenharMapaReal } from "./mapaReal.js";

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
const horaSeg = (iso) => new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(new Date(iso));
const kmTexto = (v) => `${v.toFixed(1).replace(".", ",")} km`;

// Enquadra origem e destino mantendo a proporção real. A altura acompanha a rota (Etapa 9.3).
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

// opcoes.souMotorista: mostra o botão para compartilhar o GPS do aparelho.
export function mapaViagem(carona, { souMotorista = false } = {}) {
  const a = localPorId(carona.origemId), b = localPorId(carona.destinoId);
  if (!a || !b) return el("p", { class: "nota" }, "Mapa indisponível: esta carona não usa os locais da lista do protótipo.");
  const { H, xy } = projetor(a, b), pa = xy(a), pb = xy(b);

  // ---------- desenho esquemático (abre primeiro; fica se não houver internet) ----------
  const percorrido = svg("line", { class: "mapa-percorrido", x1: pa[0], y1: pa[1], x2: pa[0], y2: pa[1] });
  const veiculo = svg("circle", { class: "mapa-veiculo", r: 8, cx: pa[0], cy: pa[1] });
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

  const area = el("div", { class: "mapa-area" }, desenho);
  const legenda = el("figcaption", { class: "nota" });
  const chegada = el("p", { class: "mapa-chegada", "aria-hidden": "true" }); // em destaque para quem enxerga; a legenda diz o mesmo
  const estadoGps = el("p", { class: "nota gps-estado", "aria-live": "polite" });

  // ---------- GPS: botão do motorista ----------
  const botaoGps = souMotorista && el("button", { type: "button", class: "botao secundario", onclick: () => alternarGps() });
  const desenharBotaoGps = () => {
    if (!botaoGps) return;
    const ligado = compartilhando(carona.id);
    botaoGps.setAttribute("aria-pressed", ligado ? "true" : "false");
    botaoGps.replaceChildren(...comIcone("pin", ligado ? "Parar de compartilhar minha localização" : "Compartilhar minha localização (GPS)"));
  };
  let erroGps = "";
  function alternarGps() {
    erroGps = "";
    if (compartilhando(carona.id)) pararCompartilhamento(carona.id);
    else {
      const r = iniciarCompartilhamento(carona.id, { aoErro: (motivo) => { erroGps = `Não foi possível ler o GPS (${motivo}).`; atualizar(); } });
      if (!r.ok) erroGps = r.motivo;
    }
    desenharBotaoGps();
    atualizar();
  }

  const figura = el("figure", { class: "mapa" }, chegada, area, legenda,
    el("div", { class: "gps-controle" }, botaoGps, estadoGps));

  // ---------- estado e atualização ----------
  let rota = null, real = null, rotaTexto = "";
  const estimadaAgora = () => {
    const p = posicaoSimulada(carona);
    const naRota = rota && pontoNaRota(rota.pontos, p.progresso);
    return { ...p, ...(naRota ? { lat: naRota[0], lng: naRota[1] } : {}) };
  };

  function atualizar() {
    const p = estimadaAgora();
    const pos = posicaoDoVeiculo({ gps: posicaoGpsDe(carona.id), estimada: p });
    const pct = Math.round(p.progresso * 100);
    chegada.replaceChildren(...[el("span", {}, p.progresso < 1 ? "Chegada prevista" : "Tempo previsto encerrado"),
      p.progresso < 1 && el("strong", {}, hora(p.chegadaPrevista))].filter(Boolean)); // replaceChildren(false) escreveria "false"
    const quando = p.progresso < 1 ? `Chegada prevista às ${hora(p.chegadaPrevista)}.` : "O tempo previsto acabou: a viagem termina quando o motorista concluir.";
    const ondeEsta = pos.fonte === "gps"
      ? `posição do veículo pelo GPS do motorista, atualizada às ${horaSeg(pos.em)}`
      : `posição estimada do veículo, ${pct}% do trajeto ${a.nome} → ${b.nome}`;

    if (real) {
      real.moverVeiculo(pos);
      legenda.textContent = `Mapa OpenStreetMap. ${rotaTexto} Agora: ${ondeEsta}. ${quando}`;
    } else {
      const [vx, vy] = xy(pos);
      veiculo.setAttribute("cx", String(vx)); veiculo.setAttribute("cy", String(vy));
      percorrido.setAttribute("x2", String(vx)); percorrido.setAttribute("y2", String(vy));
      legenda.textContent = `Mapa SIMULADO, sem o mapa real (sem internet ou ainda carregando): ${ondeEsta}. ${quando}`;
    }

    estadoGps.textContent = erroGps || (souMotorista
      ? (compartilhando(carona.id)
          ? "Sua localização está sendo compartilhada com o grupo neste navegador. Ela é apagada quando você para ou conclui a viagem."
          : "Compartilhe o GPS para o carro aparecer na posição real. Sem servidor, só quem usa este mesmo navegador vê.")
      : pos.fonte === "gps"
        ? "Você está vendo o GPS do motorista."
        : pos.gpsAntigo
          ? "O último GPS do motorista tem mais de 2 minutos: mostrando a posição estimada pelo tempo."
          : "O GPS do motorista não chegou a este aparelho (o protótipo não tem servidor): mostrando a posição estimada pelo tempo.");
  }

  desenharBotaoGps();
  atualizar();

  // Atualiza sozinho: a cada 15 s (estimativa) e a cada GPS novo (nesta aba ou em outra aba do navegador).
  const aoMudarPosicao = (ev) => { if (!ev?.key || ev.key.endsWith("posicoes")) { desenharBotaoGps(); atualizar(); } };
  globalThis.addEventListener?.("posicao-alterada", aoMudarPosicao);
  globalThis.addEventListener?.("storage", aoMudarPosicao);
  const encerrar = () => {
    clearInterval(timer);
    globalThis.removeEventListener?.("posicao-alterada", aoMudarPosicao);
    globalThis.removeEventListener?.("storage", aoMudarPosicao);
    real?.destruir();
  };
  const timer = setInterval(() => (figura.isConnected === false ? encerrar() : atualizar()), ATUALIZAR_MS);
  timer.unref?.(); // nos testes em Node, não segura o processo aberto

  // ---------- troca pelo mapa real ----------
  (async () => {
    const L = await carregarLeaflet();
    if (!L) return;                                   // offline, bloqueado ou testes: fica o esquema
    rota = await buscarRota(carona.origemId, carona.destinoId);
    for (let i = 0; i < 20 && !figura.isConnected; i++) await new Promise((r) => setTimeout(r, 50));
    if (!figura.isConnected || !rota) return;
    const conteiner = el("div", { class: "mapa-real", role: "region", "aria-label": `Mapa da viagem ${a.nome} → ${b.nome}` });
    area.replaceChildren(conteiner);
    real = desenharMapaReal(L, conteiner, { origem: a, destino: b, rota });
    rotaTexto = rota.fonte === "osrm"
      ? `Rota pelas ruas: ${kmTexto(rota.distanciaKm)}.`
      : `Rota em linha reta (${kmTexto(rota.distanciaKm)}): o serviço de rotas não respondeu.`;
    atualizar();
  })();

  return figura;
}
