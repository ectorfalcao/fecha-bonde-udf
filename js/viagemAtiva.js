import { el, aviso, estadoVazio, linkBotao, dataHora, dialogoAcoes, fatos, cabecalhoTela, comIcone, avatar } from "./componentes.js";
import { listar, obter } from "./dados.js";
import { usuarioAtual } from "./sessao.js";
import { viagensAtivasDe } from "./viagem.js";
import { NUMERO_POLICIA, contatoDe, linkTel, linkSms, montarMensagem, telefoneParaLink } from "./emergencia.js";
import { obterLocalizacao, registrarAcionamento } from "./alertasEmergencia.js";
import { mapaViagem } from "./mapa.js";

const hora = (iso) => new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
const rota = (c) => `${c.origem} → ${c.destino}`;

// Tela da viagem em andamento (RF15 / RN11 / US08): o botão de emergência fica no topo do cartão, sempre visível.
export function telaViagemAtiva() {
  const u = usuarioAtual();
  const ativas = viagensAtivasDe(u.id, listar("caronas"), listar("solicitacoes"));
  const cab = cabecalhoTela({ titulo: "Viagem em andamento", descricao: ativas.length ? "Confira o carro antes de embarcar. Em caso de perigo, use o botão de emergência." : null });
  if (!ativas.length)
    return el("div", {}, cab, estadoVazio({ titulo: "Nenhuma viagem em andamento", nomeIcone: "carro",
      texto: "O botão de emergência fica disponível enquanto uma viagem estiver em andamento. O motorista inicia a viagem na tela Caronas.",
      acao: linkBotao("Ir para Caronas", "#/caronas", "secundario", "carro") }));
  return el("div", {}, cab, el("ul", { class: "lista-caronas coluna" }, ativas.map((c) => cartaoViagem(u, c))));
}

function cartaoViagem(u, c) {
  const motorista = obter("usuarios", c.motoristaId), veiculo = obter("veiculos", c.veiculoId);
  const aBordo = listar("solicitacoes").filter((s) => s.caronaId === c.id && s.status === "confirmada").length;
  const souMotorista = c.motoristaId === u.id;
  // RNF12 (Etapa 10): passageiro vê o telefone do motorista para combinar o embarque (só na viagem em andamento,
  // só para quem está confirmado nela). Toque abre a discagem do aparelho.
  const telMotorista = !souMotorista && telefoneParaLink(motorista?.telefone);
  return el("li", { class: "carona viagem" }, el("h3", {}, rota(c)),
    el("button", { type: "button", class: "botao perigo largo", "aria-label": `Emergência: abrir opções de ajuda, viagem ${rota(c)}`, onclick: () => abrirEmergencia(c, motorista, veiculo) }, comIcone("sirene", "Emergência")),
    el("p", { class: "nota" }, "Abre a discagem para a polícia (190) ou um SMS para o seu contato de emergência. O aplicativo não aciona nenhum serviço por conta própria."),
    mapaViagem(c, { souMotorista }), // Etapa 11: mapa real; o motorista pode compartilhar o GPS
    // Etapa 9.3: placa e carro primeiro, para conferir na hora de embarcar.
    fatos([veiculo && ["Veículo", [`${veiculo.modelo} ${veiculo.cor}, placa ${veiculo.placa}`, " ", el("span", { class: "placa", "aria-hidden": "true" }, el("span", {}, veiculo.placa))]],
      ["Motorista", el("span", { class: "pessoa" }, avatar(motorista?.nome, "sm"), el("span", { class: "pessoa-texto" }, motorista?.nome ?? "—"))],
      telMotorista && ["Telefone do motorista", el("a", { href: linkTel(telMotorista) }, motorista.telefone)],
      ["Seu papel", souMotorista ? "Motorista" : "Passageiro(a)"], ["Saída prevista", dataHora(c.dataHoraSaida)],
      c.iniciadaEm && ["Iniciada às", hora(c.iniciadaEm)], ["Passageiros a bordo", String(aBordo)]], "linhas"),
    el("div", { class: "linha-acoes" },
      linkBotao("Chat do grupo", `#/chat?carona=${c.id}`, "secundario", "chat"),
      linkBotao("Gerenciar em Caronas", "#/caronas", "discreto", "carro")));
}

// UC04: opções de discagem rápida e SMS. A localização só é pedida se houver contato para receber o SMS.
function abrirEmergencia(c, motorista, veiculo) {
  const eu = usuarioAtual(), contato = contatoDe(eu);
  let localizacao = null, dialogo;
  const estado = el("p", { class: "nota", "aria-live": "polite" });
  const dizer = (t) => { estado.textContent = t; };
  const registrar = (tipo, comLoc) => registrarAcionamento({ usuarioId: eu.id, caronaId: c.id, tipo, comLocalizacao: comLoc });
  const texto = () => linkSms(contato.telefone, montarMensagem({ usuario: eu, carona: c, motorista, veiculo, localizacao }));

  const ligar = el("a", { class: "botao perigo grande", href: linkTel(NUMERO_POLICIA), onclick: () => {
    registrar("ligar190", false);
    dizer("Abrimos a discagem no seu aparelho. Conclua a ligação por lá: o Fecha Bonde não faz nem confirma a chamada.");
  } }, comIcone("telefone", `Ligar para a Polícia (${NUMERO_POLICIA})`));

  const sms = contato && el("a", { class: "botao grande", href: texto(), onclick: () => {
    registrar("sms", Boolean(localizacao));
    dizer("Abrimos o aplicativo de mensagens com o texto pronto. Toque em enviar por lá: o Fecha Bonde não envia nem confirma o SMS.");
  } }, comIcone("chat", `Enviar SMS para ${contato.nome}`));

  dialogo = dialogoAcoes({ titulo: "Emergência", corpo: [
    aviso("alerta", "Em perigo imediato, ligue 190. Este protótipo não aciona a polícia, não envia nada sozinho e não confirma chamadas nem SMS: a ligação e o SMS são feitos pelo seu aparelho."),
    el("div", { class: "linha-acoes" }, ligar),
    ...(contato
      ? [el("div", { class: "linha-acoes" }, sms)]
      : [aviso("info", "Você ainda não cadastrou um contato de emergência. Cadastre no Perfil para poder enviar um SMS com a sua localização."),
         el("div", { class: "linha-acoes" }, el("a", { class: "botao secundario", href: "#/perfil", onclick: () => dialogo.close() }, comIcone("usuario", "Cadastrar contato no Perfil")))]),
    estado
  ] });   // spread: el() só achata um nível de lista

  if (contato) {
    dizer("Obtendo sua localização…");
    estado.className = "nota carregando"; // Etapa 9.4: estado de carregamento com forma própria, além do texto
    obterLocalizacao().then((r) => {
      estado.className = "nota";
      localizacao = r.ok ? r : null;
      sms.setAttribute("href", texto());
      dizer(r.ok ? `Localização obtida (precisão de cerca de ${Math.round(r.precisao ?? 0)} m). Ela será incluída no SMS.`
                 : `Não foi possível obter a localização (${r.motivo}). O SMS segue sem ela.`);
    });
  }
}
