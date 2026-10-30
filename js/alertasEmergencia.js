// Operações da emergência (Etapa 8.2): localização do aparelho e registro do acionamento.
// O registro guarda SÓ que a pessoa tocou na ação (tipo, carona, horário). Não guarda coordenadas.
import { inserir } from "./dados.js";

const MOTIVOS = { 1: "permissão negada", 2: "posição indisponível", 3: "tempo esgotado" };

// Nunca rejeita: devolve { ok:true, lat, lng, precisao } ou { ok:false, motivo }.
export function obterLocalizacao({ geo = globalThis.navigator?.geolocation, timeoutMs = 8000 } = {}) {
  return new Promise((resolve) => {
    if (!geo) return resolve({ ok: false, motivo: "este navegador não oferece localização" });
    let fim = false;
    const terminar = (r) => { if (!fim) { fim = true; clearTimeout(relogio); resolve(r); } };
    const relogio = setTimeout(() => terminar({ ok: false, motivo: MOTIVOS[3] }), timeoutMs + 500);
    try {
      geo.getCurrentPosition(
        (p) => terminar({ ok: true, lat: p.coords.latitude, lng: p.coords.longitude, precisao: p.coords.accuracy }),
        (e) => terminar({ ok: false, motivo: MOTIVOS[e?.code] ?? "erro desconhecido" }),
        { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 30000 });
    } catch { terminar({ ok: false, motivo: "erro desconhecido" }); }
  });
}

// tipo: "ligar190" | "sms". Registra a TENTATIVA iniciada no aparelho; o app não sabe se a ligação ou o SMS aconteceu.
export const registrarAcionamento = ({ usuarioId, caronaId, tipo, comLocalizacao = false, agora = new Date() }) =>
  inserir("alertas", { usuarioId, caronaId, tipo, comLocalizacao, criadaEm: agora.toISOString(), observacao: "Acionamento iniciado no aparelho; o app não confirma envio nem atendimento." });
