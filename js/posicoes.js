// GPS do motorista durante a viagem (RF11, RN08, US07; Etapa 11).
// O motorista escolhe compartilhar (botão na tela da viagem): o aparelho dele lê o GPS e grava a ÚLTIMA posição
// neste navegador. Outras abas do mesmo navegador recebem a mudança (evento "storage"); outro aparelho não,
// porque não há servidor. A posição é APAGADA quando o motorista para de compartilhar ou conclui a viagem.
import { carregar, salvar } from "./store.js";

export const VALIDADE_GPS_MS = 2 * 60 * 1000;   // posição mais velha que isso não é mostrada como "real"
const INTERVALO_GRAVACAO_MS = 3000;              // no máximo uma gravação a cada 3 s
const avisar = () => globalThis.dispatchEvent?.(new Event("posicao-alterada"));

export const posicaoGpsDe = (caronaId) => carregar("posicoes", {})[caronaId] ?? null;

export function guardarPosicao(caronaId, { lat, lng, precisao = null }, agora = new Date()) {
  const ok = salvar("posicoes", { ...carregar("posicoes", {}), [caronaId]: { lat, lng, precisao, em: agora.toISOString() } });
  avisar();
  return ok;
}

export function apagarPosicao(caronaId) {
  const todas = carregar("posicoes", {});
  if (!(caronaId in todas)) return true;
  delete todas[caronaId];
  const ok = salvar("posicoes", todas);
  avisar();
  return ok;
}

// Regra pura: qual posição mostrar. GPS recente vence; senão, a estimativa pelo tempo (sempre rotulada).
export function posicaoDoVeiculo({ gps = null, estimada = null, agora = new Date() }) {
  const idade = gps ? agora.getTime() - new Date(gps.em).getTime() : Infinity;
  if (gps && idade >= 0 && idade <= VALIDADE_GPS_MS) return { lat: gps.lat, lng: gps.lng, precisao: gps.precisao, fonte: "gps", em: gps.em };
  return estimada ? { lat: estimada.lat, lng: estimada.lng, fonte: "estimada", gpsAntigo: Boolean(gps) } : null;
}

// ---------- compartilhamento pelo aparelho do motorista ----------
// Um só por vez no app; continua enquanto o app estiver aberto (mesmo trocando de tela) e para ao concluir.
let ativo = null; // { caronaId, idObservacao, geo }

export const compartilhando = (caronaId) => ativo?.caronaId === caronaId;

// Devolve { ok } ou { ok:false, motivo }. aoErro recebe o motivo em texto (permissão negada, sem sinal...).
export function iniciarCompartilhamento(caronaId, { geo = globalThis.navigator?.geolocation, aoErro = () => {} } = {}) {
  if (!geo?.watchPosition) return { ok: false, motivo: "Este navegador não oferece localização." };
  pararCompartilhamento();
  let ultima = 0;
  const MOTIVOS = { 1: "permissão de localização negada", 2: "posição indisponível", 3: "tempo esgotado" };
  const idObservacao = geo.watchPosition(
    (p) => {
      const agora = Date.now();
      if (agora - ultima < INTERVALO_GRAVACAO_MS) return;
      ultima = agora;
      guardarPosicao(caronaId, { lat: p.coords.latitude, lng: p.coords.longitude, precisao: p.coords.accuracy });
    },
    (e) => {
      aoErro(MOTIVOS[e?.code] ?? "erro desconhecido");
      if (e?.code === 1) pararCompartilhamento(caronaId);
    },
    { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 });
  ativo = { caronaId, idObservacao, geo };
  avisar();
  return { ok: true };
}

// Para de ler o GPS e apaga a posição guardada (sem caronaId: para qualquer compartilhamento ativo).
export function pararCompartilhamento(caronaId = ativo?.caronaId) {
  if (ativo && (caronaId == null || ativo.caronaId === caronaId)) {
    ativo.geo.clearWatch?.(ativo.idObservacao);
    ativo = null;
  }
  if (caronaId != null) apagarPosicao(caronaId);
}
