import { salvar, carregar, localStorageDisponivel } from "./store.js";

const lista = document.getElementById("lista-verificacao");
const contador = document.getElementById("contador-visitas");

function verificacoes() {
  return [
    { ok: true, texto: "JavaScript em módulos (ES6) carregado." },
    { ok: localStorageDisponivel(), texto: "localStorage disponível (persistência de demonstração)." },
    { ok: window.isSecureContext, texto: "Contexto seguro (localhost ou HTTPS): exigido por Geolocalização e Service Worker." },
    { ok: "serviceWorker" in navigator, texto: "Service Worker suportado (cache offline, RNF12)." },
    { ok: "geolocation" in navigator, texto: "Geolocalização suportada (botão de emergência, RF15)." },
    { ok: "BroadcastChannel" in window, texto: "BroadcastChannel suportado (chat entre abas, RF10)." }
  ];
}

function exibir(itens) {
  lista.replaceChildren();
  for (const item of itens) {
    const li = document.createElement("li");
    li.className = item.ok ? "ok" : "falha";

    const estado = document.createElement("strong");
    // Texto + símbolo: o estado não depende só da cor (acessibilidade)
    estado.textContent = item.ok ? "✔ OK" : "✖ Falhou";

    const descricao = document.createElement("span");
    descricao.textContent = item.texto;

    li.append(estado, descricao);
    lista.append(li);
  }
}

function contarVisita() {
  const visitas = carregar("visitas", 0) + 1;
  salvar("visitas", visitas);
  contador.textContent = `Esta página foi aberta ${visitas} vez(es) neste navegador (prova de persistência).`;
}

exibir(verificacoes());
contarVisita();