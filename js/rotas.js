// Rota pelas ruas (RF11, Etapa 11): serviço público OSRM (servidor de demonstração, gratuito, sem chave).
// Só as coordenadas FIXAS da lista de locais são enviadas; nunca a localização de uma pessoa.
// A rota de cada par (origem → destino) fica guardada neste navegador: não consulta de novo e funciona sem internet depois.
// Sem resposta (offline, serviço fora do ar ou lento), a rota vira uma linha reta.
import { carregar, salvar } from "./store.js";
import { localPorId, distanciaKm } from "./caronas.js";

export const URL_OSRM = "https://router.project-osrm.org/route/v1/driving/";
const TEMPO_LIMITE_MS = 7000;

const km = (a, b) => distanciaKm({ lat: a[0], lng: a[1] }, { lat: b[0], lng: b[1] });

// Resposta do OSRM -> { pontos: [[lat, lng], ...], distanciaKm, duracaoMin, fonte: "osrm" } ou null.
export function rotaDoOsrm(json) {
  const r = json?.code === "Ok" ? json.routes?.[0] : null;
  const coords = r?.geometry?.coordinates;
  if (!Array.isArray(coords) || coords.length < 2) return null;
  return { pontos: coords.map(([lng, lat]) => [lat, lng]), distanciaKm: r.distance / 1000, duracaoMin: r.duration / 60, fonte: "osrm" };
}

export const rotaReta = (a, b) => ({ pontos: [[a.lat, a.lng], [b.lat, b.lng]], distanciaKm: distanciaKm(a, b), duracaoMin: null, fonte: "reta" });

// Ponto a uma fração (0 a 1) do comprimento da rota, andando pelos trechos. Usado para a posição ESTIMADA do carro.
export function pontoNaRota(pontos, fracao) {
  if (!Array.isArray(pontos) || pontos.length === 0) return null;
  const f = Math.min(1, Math.max(0, Number(fracao) || 0));
  const trechos = pontos.slice(1).map((p, i) => km(pontos[i], p));
  const total = trechos.reduce((s, d) => s + d, 0);
  if (pontos.length === 1 || total === 0 || f === 0) return [...pontos[0]];
  let falta = f * total;
  for (let i = 0; i < trechos.length; i++) {
    if (falta <= trechos[i] || i === trechos.length - 1) {
      const t = trechos[i] ? Math.min(1, falta / trechos[i]) : 0;
      const [a, b] = [pontos[i], pontos[i + 1]];
      return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
    }
    falta -= trechos[i];
  }
  return [...pontos[pontos.length - 1]];
}

// Nunca rejeita. buscar é injetável (os testes não acessam a rede).
export async function buscarRota(origemId, destinoId, { buscar = globalThis.fetch, tempoLimiteMs = TEMPO_LIMITE_MS } = {}) {
  const a = localPorId(origemId), b = localPorId(destinoId);
  if (!a || !b) return null;
  const chave = `${origemId}>${destinoId}`;
  const guardada = carregar("rotas", {})[chave];
  if (guardada) return guardada;
  if (typeof buscar !== "function") return rotaReta(a, b);
  const controle = typeof AbortController === "function" ? new AbortController() : null;
  const relogio = setTimeout(() => controle?.abort(), tempoLimiteMs);
  try {
    const resposta = await buscar(`${URL_OSRM}${a.lng},${a.lat};${b.lng},${b.lat}?overview=simplified&geometries=geojson`, { signal: controle?.signal });
    const rota = resposta?.ok ? rotaDoOsrm(await resposta.json()) : null;
    if (!rota) return rotaReta(a, b);
    salvar("rotas", { ...carregar("rotas", {}), [chave]: rota });
    return rota;
  } catch {
    return rotaReta(a, b);
  } finally {
    clearTimeout(relogio);
  }
}
