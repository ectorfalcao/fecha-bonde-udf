// Tela da Etapa 3 preservada: verificação do ambiente (útil para depurar o navegador do avaliador).
import { salvar, carregar, localStorageDisponivel } from "./store.js";
import { el } from "./componentes.js";

const verificacoes = () => [
  { ok: true, texto: "JavaScript em módulos (ES6) carregado." },
  { ok: localStorageDisponivel(), texto: "localStorage disponível (persistência de demonstração)." },
  { ok: window.isSecureContext, texto: "Contexto seguro (localhost ou HTTPS): exigido por Geolocalização e Service Worker." },
  { ok: "serviceWorker" in navigator, texto: "Service Worker suportado (cache offline, RNF12)." },
  { ok: "geolocation" in navigator, texto: "Geolocalização suportada (botão de emergência, RF15)." },
  { ok: "BroadcastChannel" in window, texto: "BroadcastChannel suportado (chat entre abas, RF10)." }
];

export function telaAmbiente() {
  const visitas = Number(carregar("visitas", 0)) || 0;
  const gravou = salvar("visitas", visitas + 1);
  return el("div", {}, el("h2", {}, "Verificação do ambiente"),
    el("ul", { class: "verificacao", "aria-live": "polite" },
      verificacoes().map((i) => el("li", { class: i.ok ? "ok" : "falha" },
        el("strong", {}, i.ok ? "✔ OK" : "✖ Falhou"), el("span", {}, i.texto)))),
    el("p", { class: "nota" }, gravou
      ? `Esta página foi aberta ${visitas + 1} vez(es) neste navegador.`
      : "Não foi possível gravar no armazenamento local."));
}