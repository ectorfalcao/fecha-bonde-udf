// Mapa real (RF11, Etapa 11): Leaflet + mapa do OpenStreetMap. Só roda no navegador.
// A biblioteca é carregada sob demanda (só na tela da viagem), de um CDN, com verificação de integridade (SRI):
// se o arquivo for alterado no caminho, o navegador recusa. Sem internet, a tela continua com o mapa esquemático.
const LEAFLET = {
  js: { url: "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js", integridade: "sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" },
  css: { url: "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css", integridade: "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" }
};
const AZULEJOS = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const ATRIBUICAO = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> · rotas <a href="https://project-osrm.org/">OSRM</a>';
const CORES = { rota: "#0d6b6b", contorno: "#ffffff" }; // os mesmos tokens de tokens.css (o Leaflet pede cor literal)

let carregando = null;

// Resolve com o objeto L do Leaflet, ou null (sem navegador, offline, bloqueado ou lento). Nunca rejeita.
export function carregarLeaflet({ tempoLimiteMs = 8000 } = {}) {
  if (globalThis.L?.map) return Promise.resolve(globalThis.L);
  const doc = globalThis.document;
  if (!doc?.head || typeof doc.createElement !== "function" || typeof globalThis.window === "undefined") return Promise.resolve(null);
  if (carregando) return carregando;
  carregando = new Promise((resolve) => {
    let fim = false;
    const terminar = (L) => { if (fim) return; fim = true; clearTimeout(relogio); if (!L) carregando = null; resolve(L); };
    const relogio = setTimeout(() => terminar(null), tempoLimiteMs);
    if (!doc.getElementById("leaflet-css")) {
      const css = doc.createElement("link");
      Object.assign(css, { id: "leaflet-css", rel: "stylesheet", href: LEAFLET.css.url, integrity: LEAFLET.css.integridade, crossOrigin: "anonymous" });
      doc.head.append(css);
    }
    const js = doc.createElement("script");
    Object.assign(js, { src: LEAFLET.js.url, integrity: LEAFLET.js.integridade, crossOrigin: "anonymous", async: true });
    js.onload = () => terminar(globalThis.L?.map ? globalThis.L : null);
    js.onerror = () => { js.remove(); terminar(null); };
    doc.head.append(js);
  });
  return carregando;
}

// Marcadores desenhados em CSS (componentes.css), na identidade do app: partida vazada, destino verde-petróleo, carro âmbar.
const CARRO = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 16v-4l1.7-4.4A2 2 0 0 1 7.6 6.3h8.8a2 2 0 0 1 1.9 1.3L20 12v4a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1Z"/><path d="M4 12h16M7.5 17v2.5M16.5 17v2.5"/></svg>';

function rotulo(texto) { const s = document.createElement("span"); s.textContent = texto; return s; } // texto, nunca HTML

// Desenha o mapa no contêiner. Devolve { moverVeiculo(posicao), destruir() }.
export function desenharMapaReal(L, conteiner, { origem, destino, rota }) {
  const mapa = L.map(conteiner, { scrollWheelZoom: false, zoomSnap: 0.25 });
  L.tileLayer(AZULEJOS, { maxZoom: 19, attribution: ATRIBUICAO }).addTo(mapa);

  L.polyline(rota.pontos, { color: CORES.contorno, weight: 9, opacity: 0.95, interactive: false }).addTo(mapa);
  const linha = L.polyline(rota.pontos, { color: CORES.rota, weight: 5, opacity: 0.95, dashArray: rota.fonte === "reta" ? "8 8" : null, interactive: false }).addTo(mapa);

  const ponto = (classe, tamanho) => L.divIcon({ className: `marcador-mapa ${classe}`, iconSize: [tamanho, tamanho] });
  // Rótulos virados para DENTRO do mapa (o ponto do leste mostra o nome à esquerda etc.): não são cortados na borda,
  // nem no celular, sem precisar afastar o enquadramento.
  const horizontal = Math.abs(destino.lng - origem.lng) >= Math.abs(destino.lat - origem.lat);
  const lado = (p, outro) => horizontal ? (p.lng >= outro.lng ? "left" : "right") : (p.lat >= outro.lat ? "bottom" : "top");
  const deslocar = { left: [-12, 0], right: [12, 0], top: [0, -12], bottom: [0, 12] };
  const marcar = (p, outro, classe, tamanho) => {
    const direcao = lado(p, outro);
    return L.marker([p.lat, p.lng], { icon: ponto(classe, tamanho), keyboard: false, interactive: false })
      .bindTooltip(rotulo(p.nome), { permanent: true, direction: direcao, offset: deslocar[direcao], className: "rotulo-mapa" }).addTo(mapa);
  };
  marcar(origem, destino, "origem", 20);
  marcar(destino, origem, "destino", 22);

  const precisao = L.circle([origem.lat, origem.lng], { radius: 0, color: CORES.rota, weight: 1, fillOpacity: 0.08, interactive: false }).addTo(mapa);
  const veiculo = L.marker([origem.lat, origem.lng], {
    icon: L.divIcon({ className: "marcador-mapa veiculo", html: CARRO, iconSize: [34, 34] }), keyboard: false, interactive: false, zIndexOffset: 1000
  }).addTo(mapa);

  mapa.fitBounds(linha.getBounds(), { padding: [36, 36] });
  // O contêiner pode mudar de tamanho (grade da tela, giro do celular): o mapa recalcula.
  const observador = typeof ResizeObserver === "function" ? new ResizeObserver(() => mapa.invalidateSize()) : null;
  observador?.observe(conteiner);
  setTimeout(() => mapa.invalidateSize(), 0);

  return {
    moverVeiculo(p) {
      if (!p) return;
      veiculo.setLatLng([p.lat, p.lng]);
      veiculo.getElement()?.classList.toggle("gps", p.fonte === "gps");
      precisao.setLatLng([p.lat, p.lng]).setRadius(p.fonte === "gps" && p.precisao ? p.precisao : 0);
      if (p.fonte === "gps" && !mapa.getBounds().contains([p.lat, p.lng])) mapa.panTo([p.lat, p.lng]);
    },
    destruir() { observador?.disconnect(); mapa.remove(); }
  };
}
