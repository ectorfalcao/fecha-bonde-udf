// Operações da Etapa 8.1: aplicam as regras de viagem.js sobre os dados e geram os avisos.
import { listar, obter, atualizar } from "./dados.js";
import { notificar } from "./notificacoes.js";
import { modoDemo } from "./demo.js";
import { podeIniciarViagem, podeConcluirViagem, planoAoIniciar } from "./viagem.js";

const ERRO_GRAVAR = { ok: false, motivo: "Não foi possível gravar no armazenamento do navegador.", codigo: "gravacao" };
const NAO_ENCONTRADA = { ok: false, motivo: "Carona não encontrada.", codigo: "permissao" };
const rotaDe = (c) => `${c.origem} → ${c.destino}`;
const doMotorista = (caronaId, motoristaId) => { const c = obter("caronas", caronaId); return c && c.motoristaId === motoristaId ? c : null; };

export function iniciarViagem(caronaId, motoristaId, { agora = new Date(), demo = modoDemo() } = {}) {
  const c = doMotorista(caronaId, motoristaId);
  if (!c) return NAO_ENCONTRADA;
  const v = podeIniciarViagem(c, { agora, demo });
  if (!v.ok) return v;
  const plano = planoAoIniciar(c, listar("solicitacoes"));
  if (!atualizar("caronas", c.id, { status: "em_andamento", iniciadaEm: agora.toISOString(), iniciadaEmModoDemo: v.usouDemo })) return ERRO_GRAVAR;
  for (const s of plano.paraEncerrar)
    if (atualizar("solicitacoes", s.id, { status: "cancelada", canceladaEm: agora.toISOString(), canceladaPor: "sistema" }))
      notificar(s.passageiroId, `Sua solicitação na carona ${rotaDe(c)} não foi atendida: a viagem já começou.`);
  for (const s of plano.embarcam) notificar(s.passageiroId, `A viagem ${rotaDe(c)} começou.`);
  return { ok: true, embarcaram: plano.embarcam.length, encerradas: plano.paraEncerrar.length, usouDemo: v.usouDemo };
}

export function concluirViagem(caronaId, motoristaId, { agora = new Date() } = {}) {
  const c = doMotorista(caronaId, motoristaId);
  if (!c) return NAO_ENCONTRADA;
  const v = podeConcluirViagem(c);
  if (!v.ok) return v;
  if (!atualizar("caronas", c.id, { status: "concluida", concluidaEm: agora.toISOString() })) return ERRO_GRAVAR;
  const passageiros = listar("solicitacoes").filter((s) => s.caronaId === c.id && s.status === "confirmada");
  for (const s of passageiros) notificar(s.passageiroId, `A viagem ${rotaDe(c)} foi concluída.`);
  return { ok: true, passageiros: passageiros.length };
}
