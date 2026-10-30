import { el, aviso, estadoVazio, linkBotao, dataHora, dialogoAcoes } from "./componentes.js";
import { listar, obter } from "./dados.js";
import { usuarioAtual } from "./sessao.js";
import { viagensAtivasDe } from "./viagem.js";
import { NUMERO_POLICIA, contatoDe, linkTel, linkSms, montarMensagem } from "./emergencia.js";
import { obterLocalizacao, registrarAcionamento } from "./alertasEmergencia.js";

const lista = (linhas) => el("dl", {}, linhas.filter(Boolean).flatMap(([t, v]) => [el("dt", {}, t), el("dd", {}, v)]));
const hora = (iso) => new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
const rota = (c) => `${c.origem} → ${c.destino}`;

// Tela da viagem em andamento (RF15 / RN11 / US08): o botão de emergência fica no topo do cartão, sempre visível.
export function telaViagemAtiva() {
  const u = usuarioAtual();
  const ativas = viagensAtivasDe(u.id, listar("caronas"), listar("solicitacoes"));
  const cab = el("h2", {}, "Viagem em andamento");
  if (!ativas.length)
    return el("div", {}, cab, estadoVazio({ titulo: "Nenhuma viagem em andamento",
      texto: "O botão de emergência fica disponível enquanto uma viagem estiver em andamento. O motorista inicia a viagem na tela Caronas.",
      acao: linkBotao("Ir para Caronas", "#/caronas", "secundario") }));
  return el("div", {}, cab, el("ul", { class: "lista-caronas" }, ativas.map((c) => cartaoViagem(u, c))));
}

function cartaoViagem(u, c) {
  const motorista = obter("usuarios", c.motoristaId), veiculo = obter("veiculos", c.veiculoId);
  const aBordo = listar("solicitacoes").filter((s) => s.caronaId === c.id && s.status === "confirmada").length;
  return el("li", { class: "carona" }, el("h3", {}, rota(c)),
    el("button", { type: "button", class: "botao perigo", "aria-label": `Emergência: abrir opções de ajuda, viagem ${rota(c)}`, onclick: () => abrirEmergencia(c, motorista, veiculo) }, "🚨 Emergência"),
    el("p", { class: "nota" }, "Abre a discagem para a polícia (190) ou um SMS para o seu contato de emergência. O aplicativo não aciona nenhum serviço por conta própria."),
    lista([["Seu papel", c.motoristaId === u.id ? "Motorista" : "Passageiro(a)"], ["Motorista", motorista?.nome ?? "—"],
      veiculo && ["Veículo", `${veiculo.modelo} ${veiculo.cor}, placa ${veiculo.placa}`], ["Saída prevista", dataHora(c.dataHoraSaida)],
      c.iniciadaEm && ["Iniciada às", hora(c.iniciadaEm)], ["Passageiros a bordo", String(aBordo)]]),
    el("div", { class: "linha-acoes" }, linkBotao("Gerenciar em Caronas", "#/caronas", "secundario")));
}

// UC04: opções de discagem rápida e SMS. A localização só é pedida se houver contato para receber o SMS.
function abrirEmergencia(c, motorista, veiculo) {
  const eu = usuarioAtual(), contato = contatoDe(eu);
  let localizacao = null, dialogo;
  const estado = el("p", { class: "nota", "aria-live": "polite" });
  const dizer = (t) => { estado.textContent = t; };
  const registrar = (tipo, comLoc) => registrarAcionamento({ usuarioId: eu.id, caronaId: c.id, tipo, comLocalizacao: comLoc });
  const texto = () => linkSms(contato.telefone, montarMensagem({ usuario: eu, carona: c, motorista, veiculo, localizacao }));

  const ligar = el("a", { class: "botao perigo", href: linkTel(NUMERO_POLICIA), onclick: () => {
    registrar("ligar190", false);
    dizer("Abrimos a discagem no seu aparelho. Conclua a ligação por lá: o Fecha Bonde não faz nem confirma a chamada.");
  } }, `Ligar para a Polícia (${NUMERO_POLICIA})`);

  const sms = contato && el("a", { class: "botao", href: texto(), onclick: () => {
    registrar("sms", Boolean(localizacao));
    dizer("Abrimos o aplicativo de mensagens com o texto pronto. Toque em enviar por lá: o Fecha Bonde não envia nem confirma o SMS.");
  } }, `Enviar SMS para ${contato.nome}`);

  dialogo = dialogoAcoes({ titulo: "Emergência", corpo: [
    aviso("alerta", "Em perigo imediato, ligue 190. Este protótipo não aciona a polícia, não envia nada sozinho e não confirma chamadas nem SMS: a ligação e o SMS são feitos pelo seu aparelho."),
    el("div", { class: "linha-acoes" }, ligar),
    ...(contato
      ? [el("div", { class: "linha-acoes" }, sms)]
      : [aviso("info", "Você ainda não cadastrou um contato de emergência. Cadastre no Perfil para poder enviar um SMS com a sua localização."),
         el("div", { class: "linha-acoes" }, el("a", { class: "botao secundario", href: "#/perfil", onclick: () => dialogo.close() }, "Cadastrar contato no Perfil"))]),
    estado
  ] });   // spread: el() só achata um nível de lista

  if (contato) {
    dizer("Obtendo sua localização…");
    obterLocalizacao().then((r) => {
      localizacao = r.ok ? r : null;
      sms.setAttribute("href", texto());
      dizer(r.ok ? `Localização obtida (precisão de cerca de ${Math.round(r.precisao ?? 0)} m). Ela será incluída no SMS.`
                 : `Não foi possível obter a localização (${r.motivo}). O SMS segue sem ela.`);
    });
  }
}
