// Ícones da interface (Etapa 10): desenhados para o projeto, em SVG de traço (24 × 24, cor = currentColor).
// Substituem os emojis, que mudavam de aparência entre Windows, Android e iPhone. Sem biblioteca e sem rede.
// São DECORATIVOS (aria-hidden): o texto ao lado, ou o aria-label do botão, sempre diz a mesma coisa.
const NS = "http://www.w3.org/2000/svg";

const CAMINHOS = {
  inicio: ["M3 10.5 12 3l9 7.5", "M5 9v11a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9"],
  busca: ["M18 11a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z", "m20.5 20.5-4.5-4.5"],
  oferecer: ["M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z", "M12 8v8M8 12h8"],
  carro: ["M4 16v-4l1.7-4.4A2 2 0 0 1 7.6 6.3h8.8a2 2 0 0 1 1.9 1.3L20 12v4a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1Z", "M4 12h16", "M7.5 17v2.5M16.5 17v2.5", "M7 14.5h1.5M15.5 14.5H17"],
  usuario: ["M16 8a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z", "M4 21a8 8 0 0 1 16 0"],
  usuarios: ["M14.5 8a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z", "M3.5 20a7.5 7.5 0 0 1 15 0", "M16.5 4.7a3.5 3.5 0 0 1 0 6.6", "M21 20a7.5 7.5 0 0 0-3.2-6.1"],
  chat: ["M20.5 12a8.5 8.5 0 0 1-12.4 7.5L3.5 21l1.5-4.4A8.5 8.5 0 1 1 20.5 12Z", "M8.5 12h.01M12 12h.01M15.5 12h.01"],
  sirene: ["M6.5 19v-6a5.5 5.5 0 0 1 11 0v6", "M4 19h16v2H4Z", "M12 2v2.5M4.2 5.2l1.6 1.6M19.8 5.2l-1.6 1.6", "M10 14a2 2 0 0 1 2-2"],
  pin: ["M12 21s-7-6-7-11.5a7 7 0 0 1 14 0C19 15 12 21 12 21Z", "M14.5 9.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Z"],
  relogio: ["M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z", "M12 7v5l3.2 2"],
  calendario: ["M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z", "M4 10h16", "M8 3v4M16 3v4"],
  estrela: ["m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3l-5.6 2.9 1.1-6.2L3 9.6l6.2-.9Z"],
  carteira: ["M4 7.5A2.5 2.5 0 0 1 6.5 5H18v3", "M4 7.5V18a2 2 0 0 0 2 2h14V8H6.5A2.5 2.5 0 0 1 4 5.5", "M16.5 14h.01"],
  recibo: ["M5.5 3h13v18l-2.6-1.8L13.3 21 12 20l-1.3 1-2.6-1.8L5.5 21Z", "M9 8h6M9 12h6M9 16h3.5"],
  sair: ["M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4", "M9.5 16.5 5 12l4.5-4.5", "M5 12h11"],
  check: ["m5 12.5 4.5 4.5L19 7.5"],
  fechar: ["M6 6l12 12M18 6 6 18"],
  info: ["M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z", "M12 11v5.5", "M12 7.5h.01"],
  atencao: ["M10.3 4 2.5 17.5A2 2 0 0 0 4.2 20.5h15.6a2 2 0 0 0 1.7-3L13.7 4a2 2 0 0 0-3.4 0Z", "M12 9.5v4", "M12 17h.01"],
  erro: ["M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z", "m9 9 6 6M15 9l-6 6"],
  sino: ["M6 9a6 6 0 0 1 12 0c0 6.5 2.5 8.5 2.5 8.5h-17S6 15.5 6 9Z", "M10.3 20.5a1.9 1.9 0 0 0 3.4 0"],
  voltar: ["M19 12H5", "m11 18-6-6 6-6"],
  avancar: ["M5 12h14", "m13 6 6 6-6 6"],
  telefone: ["M7.5 3h9A1.5 1.5 0 0 1 18 4.5v15a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 19.5v-15A1.5 1.5 0 0 1 7.5 3Z", "M10.5 18h3"],
  escudo: ["M12 3 4.5 6v5.5c0 4.6 3.2 8.4 7.5 9.5 4.3-1.1 7.5-4.9 7.5-9.5V6Z", "m9 12 2.2 2.2L15.5 10"],
  lixeira: ["M4 7h16", "M10 11v6M14 11v6", "M6 7l1 12.5A1.5 1.5 0 0 0 8.5 21h7a1.5 1.5 0 0 0 1.5-1.5L18 7", "M9 7V4.5h6V7"],
  baixar: ["M12 4v11", "m7 10.5 5 5 5-5", "M5 20h14"],
  repetir: ["M17 2.5 20 5.5l-3 3", "M4 11V9.5a4 4 0 0 1 4-4h12", "M7 21.5l-3-3 3-3", "M20 13v1.5a4 4 0 0 1-4 4H4"],
  filtro: ["M4 5h16l-6.2 7.4V19l-3.6 1.8v-8.4Z"],
  bandeira: ["M5 21V4", "M5 4.5h11.5L14.5 8.5l2 4H5"],
  iniciar: ["M8 5.2v13.6a.7.7 0 0 0 1.1.6l10.2-6.8a.7.7 0 0 0 0-1.2L9.1 4.6a.7.7 0 0 0-1.1.6Z"],
  ampulheta: ["M7 3h10M7 21h10", "M8 3v3.5a4 4 0 0 0 8 0V3", "M8 21v-3.5a4 4 0 0 1 8 0V21"],
  fila: ["M10 6h10M10 12h10M10 18h10", "M4 6h2M4 12h2M4 18h2"],
  cartao: ["M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z", "M3 10h18", "M7 15h3"],
  qr: ["M4 4h6v6H4Z", "M14 4h6v6h-6Z", "M4 14h6v6H4Z", "M14 14h2.5v2.5H14ZM17.5 17.5H20V20h-2.5ZM14 19.5h1M19.5 14h.5"],
  rota: ["M6 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z", "M18 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z", "M8 18h7.5a3.5 3.5 0 0 0 0-7h-7a3.5 3.5 0 0 1 0-7H16"],
  mapa: ["m9 4.5-5 2v13l5-2 6 2 5-2v-13l-5 2-6-2Z", "M9 4.5v13M15 6.5v13"],
  editar: ["M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16Z", "m13.5 6.5 4 4"],
  chave: ["M15.5 13a4.5 4.5 0 1 0-4.3-3.2L3.5 17.5V20.5h3v-2h2v-2h2l1.7-1.7a4.5 4.5 0 0 0 3.3-1.8Z", "M16.5 8.5h.01"],
  ferramenta: ["M14.7 6.3a4 4 0 0 0 5 5l-9.4 9.4a2.1 2.1 0 0 1-3-3Z", "M14.7 6.3a4 4 0 0 1 5-2.8l-2.6 2.6.4 2.4 2.4.4 2.6-2.6"]
};

// icone("chat") -> <svg class="icone" aria-hidden="true">…</svg>
export function icone(nome, { tamanho = 20, classe = "icone" } = {}) {
  const svg = document.createElementNS(NS, "svg");
  const attrs = { class: classe, width: tamanho, height: tamanho, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor",
    "stroke-width": "1.9", "stroke-linecap": "round", "stroke-linejoin": "round", "aria-hidden": "true", focusable: "false" };
  for (const [k, v] of Object.entries(attrs)) svg.setAttribute(k, String(v));
  for (const d of CAMINHOS[nome] ?? CAMINHOS.info) {
    const p = document.createElementNS(NS, "path");
    p.setAttribute("d", d);
    svg.append(p);
  }
  return svg;
}

export const NOMES_ICONES = Object.keys(CAMINHOS);
