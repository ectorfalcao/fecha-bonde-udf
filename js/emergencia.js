// Emergência (RF15, RN11, US08, UC04) como funções PURAS: sem DOM, sem storage, sem rede.
// O app NÃO aciona a polícia nem envia SMS sozinho: só prepara links tel: e sms: que abrem a discagem
// e o aplicativo de mensagens do aparelho. Quem conclui a ligação ou o envio é a pessoa.
import { telefoneValido } from "./regras.js";

export const NUMERO_POLICIA = "190";

// RF15 fala em "contatos"; o perfil (D8) guarda um. Só vale se tiver nome e telefone válido.
export const contatoDe = (u) =>
  u?.contatoNome?.trim() && telefoneValido(u.contatoTel) ? { nome: u.contatoNome.trim(), telefone: u.contatoTel } : null;

// Telefone brasileiro -> formato internacional (+55...). Devolve null se não for reconhecível.
export function telefoneParaLink(t) {
  const d = String(t ?? "").replace(/\D/g, "");
  if (d.length === 10 || d.length === 11) return `+55${d}`;
  if ((d.length === 12 || d.length === 13) && d.startsWith("55")) return `+${d}`;
  return null;
}
export const linkTel = (numero) => `tel:${numero}`;
export const linkMapa = (loc) => `https://www.google.com/maps?q=${loc.lat.toFixed(5)},${loc.lng.toFixed(5)}`;

const hhmm = (d) => new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(d);

// loc: { lat, lng, precisao } ou null (sem localização).
export function montarMensagem({ usuario, carona, motorista, veiculo, localizacao = null, agora = new Date() }) {
  const onde = localizacao
    ? `Localização: ${linkMapa(localizacao)} (precisão de cerca de ${Math.round(localizacao.precisao ?? 0)} m, às ${hhmm(agora)}).`
    : "Localização indisponível.";
  return [
    `EMERGÊNCIA: ${usuario?.nome || "Uma pessoa"} acionou o alerta de emergência no Fecha Bonde UDF (protótipo acadêmico).`,
    `Carona: ${carona.origem} → ${carona.destino}. Motorista: ${motorista?.nome ?? "—"}.` + (veiculo ? ` Veículo: ${veiculo.modelo} ${veiculo.cor}, placa ${veiculo.placa}.` : ""),
    onde,
    "Tente falar com a pessoa ou acione a polícia (190)."
  ].join("\n");
}

export function linkSms(telefone, mensagem) {
  const n = telefoneParaLink(telefone);
  return n ? `sms:${n}?body=${encodeURIComponent(mensagem)}` : null;
}
