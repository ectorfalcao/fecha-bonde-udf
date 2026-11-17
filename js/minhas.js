import { el, aviso, selo, estadoVazio, linkBotao, moeda, dialogoConfirmar, fatos, cabecalhoTela, comIcone, avatar, icone } from "./componentes.js";
import { listar, obter, vagasDisponiveis } from "./dados.js";
import { usuarioAtual } from "./sessao.js";
import { aprovar, recusar, cancelarSolicitacao, cancelarCarona } from "./solicitacoes.js";
import { iniciarViagem, concluirViagem } from "./viagens.js";
import { ATIVAS, posicaoNaFila, filaOrdenada, podeCancelarCarona } from "./grupos.js";
import { podeIniciarViagem } from "./viagem.js";
import { modoDemo, definirModoDemo } from "./demo.js";
import { historicoDe } from "./historico.js";
import { cartaoViagemConcluida } from "./historicoTela.js";
import { topoCarona, pontosVagas, seloSituacao } from "./cartao.js";
import { mediaDe, textoMedia } from "./avaliacao.js";

const RECENTES = 3; // viagens concluídas mostradas em Caronas

const confirmar = (titulo, texto, aceitar, variante = "") => dialogoConfirmar({ titulo, corpo: el("p", {}, texto), aceitar, recusar: "Voltar", variante });
const rota = (c) => `${c.origem} → ${c.destino}`;
const hora = (iso) => new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
const tituloSecao = (id, nomeIcone, texto, contagem = null) =>
  el("h3", { id }, icone(nomeIcone, { tamanho: 20 }), texto, contagem != null && selo(String(contagem), "neutro"));

// RF07, RF08, RF09, RN06 (Etapa 7) e ciclo da viagem (Etapa 8.1). Os avisos ficam no sino do topo (centroNotificacoes.js).
// Passageiro: acompanha e cancela. Motorista: aprova, recusa, cancela, inicia e conclui a viagem.
export function telaMinhasCaronas() {
  const retorno = el("div", { tabindex: "-1" });
  const corpo = el("div");
  const raiz = el("div", {},
    cabecalhoTela({ titulo: "Minhas caronas", descricao: "Acompanhe suas solicitações, aprove passageiros e conduza suas viagens." }),
    retorno, corpo);
  const desenhar = () => corpo.replaceChildren(...conteudo().filter(Boolean));
  const dizer = (no) => { retorno.replaceChildren(no); retorno.focus(); };
  const concluir = (r, sucesso) => { desenhar(); dizer(r.ok ? aviso("sucesso", sucesso) : aviso("erro", r.motivo)); };

  function conteudo() {
    const u = usuarioAtual(), todas = listar("solicitacoes");
    const minhas = todas.filter((s) => s.passageiroId === u.id && obter("caronas", s.caronaId)?.status !== "concluida")
      .sort((a, b) => String(b.criadaEm ?? "").localeCompare(String(a.criadaEm ?? "")));
    const oferecidas = listar("caronas").filter((c) => c.motoristaId === u.id && (c.status === "aberta" || c.status === "em_andamento"))
      .sort((a, b) => new Date(a.dataHoraSaida) - new Date(b.dataHoraSaida));
    const encerradas = concluidasDe(u, todas);
    const blocos = []; // Etapa 10.3: as notificações saíram daqui e ficam todas no sino do topo
    if (minhas.length) blocos.push(blocoPassageiro(u, minhas));
    if (oferecidas.length) blocos.push(blocoMotorista(u, oferecidas));
    if (encerradas.length) blocos.push(blocoConcluidas(u, encerradas, todas));
    if (!minhas.length && !oferecidas.length && !encerradas.length)
      blocos.push(estadoVazio({ titulo: "Nada por aqui ainda", texto: "Solicite uma vaga em uma carona ou publique a sua.", nomeIcone: "carro",
        acao: el("div", { class: "linha-acoes" }, linkBotao("Buscar carona", "#/buscar", "", "busca"), u.motorista && linkBotao("Oferecer carona", "#/oferecer", "secundario", "oferecer")) }));
    blocos.push(blocoDemo());
    return blocos;
  }

  const concluidasDe = (u, todas) => historicoDe(u.id, listar("caronas"), todas);

  function blocoPassageiro(u, minhas) {
    const todas = listar("solicitacoes");
    const itens = minhas.map((s) => {
      const c = obter("caronas", s.caronaId);
      if (!c) return null;
      const pos = s.status === "espera" ? posicaoNaFila(s, c, todas) : 0;
      const m = obter("usuarios", c.motoristaId);
      return el("li", { class: "carona" }, topoCarona(c, "h4"),
        fatos([["Situação", seloSituacao(s, c)], pos > 0 && ["Posição na fila", `${pos}º`],
          ["Motorista", m?.nome ?? "—"], ["Contribuição", moeda(c.valor), "valor"]]),
        s.status === "confirmada" && el("div", { class: "linha-acoes" },
          linkBotao("Chat do grupo", `#/chat?carona=${c.id}`, "secundario", "chat"),
          c.status === "em_andamento" && linkBotao("Abrir viagem e emergência", "#/viagem", "perigo", "sirene")),
        ATIVAS.includes(s.status) && c.status === "aberta" && el("div", { class: "linha-acoes" },
          el("button", { type: "button", class: "botao discreto", "aria-label": `Cancelar solicitação de ${rota(c)}`, onclick: async () => {
            if (await confirmar("Cancelar solicitação?", s.status === "confirmada" ? "Sua vaga será liberada e o motorista será avisado." : "O motorista será avisado.", "Cancelar solicitação", "perigo"))
              concluir(cancelarSolicitacao(s.id, u.id), "Solicitação cancelada. O motorista foi avisado.");
          } }, comIcone("fechar", "Cancelar solicitação"))));
    }).filter(Boolean);
    return el("section", { class: "secao", "aria-labelledby": "h-pass" }, tituloSecao("h-pass", "usuario", "Como passageiro", itens.length), el("ul", { class: "lista-caronas larga" }, itens));
  }

  function blocoMotorista(u, oferecidas) {
    const avaliacoes = listar("avaliacoes");
    const itens = oferecidas.map((c) => {
      const sols = listar("solicitacoes").filter((s) => s.caronaId === c.id);
      const pessoaDe = (s) => obter("usuarios", s.passageiroId);
      const pend = sols.filter((s) => s.status === "pendente"), conf = sols.filter((s) => s.status === "confirmada"), fila = filaOrdenada(c, sols);
      // Cada pessoa com avatar, curso e reputação (US10: a média ajuda o motorista a decidir).
      const pessoas = (titulo, grupo, acoes) => grupo.length > 0 && [
        el("p", { class: "grupo-titulo" }, titulo, selo(String(grupo.length), "neutro")),
        el("ul", { class: "pessoas" }, grupo.map((s, i) => {
          const p = pessoaDe(s);
          return el("li", {},
            el("span", { class: "pessoa" }, avatar(p?.nome, "md"),
              el("span", { class: "pessoa-texto" },
                el("span", { class: "pessoa-nome" }, `${acoes === "fila" ? `${i + 1}º · ` : ""}${p?.nome ?? "—"}`),
                el("span", { class: "pessoa-detalhe" }, `${p?.curso ?? ""} · ${textoMedia(mediaDe(s.passageiroId, avaliacoes))}`))),
            acoes === "decidir" && el("span", { class: "linha-acoes" },
              el("button", { type: "button", class: "botao", "aria-label": `Aprovar ${p?.nome}`, onclick: () => concluir(aprovar(s.id, u.id), `${p?.nome} foi aprovado(a).`) }, comIcone("check", "Aprovar")),
              el("button", { type: "button", class: "botao secundario", "aria-label": `Recusar ${p?.nome}`, onclick: () => concluir(recusar(s.id, u.id), `${p?.nome} foi recusado(a).`) }, "Recusar")));
        }))];

      if (c.status === "em_andamento")
        return el("li", { class: "carona" }, topoCarona(c, "h4"),
          el("p", { class: "selos" }, selo("Viagem em andamento", "escuro", "carro")),
          fatos([["Iniciada às", hora(c.iniciadaEm)], ["Passageiros a bordo", String(conf.length)]]),
          pessoas("A bordo", conf),
          c.iniciadaEmModoDemo && el("p", { class: "nota" }, "Iniciada com o modo demonstração (fora da janela de 15 minutos)."),
          el("div", { class: "linha-acoes" },
            el("button", { type: "button", class: "botao", "aria-label": `Concluir viagem ${rota(c)}`, onclick: async () => {
              if (await confirmar("Concluir a viagem?", conf.length ? `Confirme que a viagem terminou. ${conf.length} passageiro(s) serão avisados.` : "Confirme que a viagem terminou.", "Concluir viagem"))
              {
                const r = concluirViagem(c.id, u.id);
                if (r.ok && r.passageiros) location.hash = `#/avaliacao?carona=${c.id}`; // RF14: avaliação logo ao concluir
                else concluir(r, "Viagem concluída.");
              }
            } }, comIcone("bandeira", "Concluir viagem")),
            linkBotao("Abrir viagem e emergência", "#/viagem", "perigo", "sirene"),
            linkBotao("Chat do grupo", `#/chat?carona=${c.id}`, "secundario", "chat")));

      const bloqueio = podeCancelarCarona(c), inicio = podeIniciarViagem(c, { demo: modoDemo() });
      const livres = vagasDisponiveis(c);
      return el("li", { class: "carona" }, topoCarona(c, "h4"),
        fatos([["Vagas", [`${livres} livre(s) de ${c.vagasTotal}`, pontosVagas(livres, c.vagasTotal)]], ["Contribuição", moeda(c.valor), "valor"]]),
        new Date(c.dataHoraSaida) <= new Date() && aviso("alerta", "O horário de saída já passou."),
        pessoas("Aguardando sua aprovação", pend, "decidir"), pessoas("Confirmados", conf), pessoas("Lista de espera", fila, "fila"),
        !sols.some((s) => ATIVAS.includes(s.status)) && el("p", { class: "nota" }, "Nenhuma solicitação ainda."),
        el("div", { class: "linha-acoes" },
          // Início fora da janela: o botão fica com aparência indisponível, mas ainda explica o motivo ao ser acionado.
          el("button", { type: "button", class: "botao", "aria-disabled": inicio.ok ? null : "true", "aria-label": `Iniciar viagem ${rota(c)}`, onclick: async () => {
            const v = podeIniciarViagem(c, { demo: modoDemo() });
            if (!v.ok) return concluir(v, "");
            const aviso1 = conf.length ? `${conf.length} passageiro(s) confirmado(s) serão avisados.` : "Nenhum passageiro está confirmado.";
            const aviso2 = pend.length + fila.length ? ` ${pend.length + fila.length} solicitação(ões) sem resposta serão encerradas.` : "";
            if (await confirmar("Iniciar a viagem?", aviso1 + aviso2, "Iniciar viagem")) concluir(iniciarViagem(c.id, u.id), "Viagem iniciada.");
          } }, comIcone("iniciar", "Iniciar viagem")),
          linkBotao("Chat do grupo", `#/chat?carona=${c.id}`, "secundario", "chat"),
          el("button", { type: "button", class: "botao discreto", "aria-disabled": bloqueio.ok ? null : "true", "aria-label": `Cancelar carona ${rota(c)}`, onclick: async () => {
            if (!bloqueio.ok) return concluir(bloqueio, "");
            const n = pend.length + conf.length + fila.length;
            if (await confirmar("Cancelar esta carona?", n ? `${n} passageiro(s) com solicitação ativa serão avisados.` : "Nenhum passageiro tem solicitação ativa.", "Cancelar carona", "perigo"))
              concluir(cancelarCarona(c.id, u.id), "Carona cancelada. Os passageiros foram avisados.");
          } }, comIcone("fechar", "Cancelar carona"))),
        !inicio.ok && el("p", { class: "nota" }, inicio.motivo),
        inicio.ok && inicio.usouDemo && el("p", { class: "nota" }, "Modo demonstração: início liberado fora da janela de 15 minutos."),
        !bloqueio.ok && el("p", { class: "nota" }, bloqueio.motivo));
    });
    return el("section", { class: "secao", "aria-labelledby": "h-mot" }, tituloSecao("h-mot", "carro", "Como motorista", itens.length), el("ul", { class: "lista-caronas larga" }, itens));
  }

  // RF13 (Etapa 8.7): só as viagens concluídas mais recentes; o resto, com o extrato, fica no Histórico.
  function blocoConcluidas(u, encerradas, todas) {
    const ctx = { solicitacoes: todas, pagamentos: listar("pagamentos"), avaliacoes: listar("avaliacoes") };
    return el("section", { class: "secao", "aria-labelledby": "h-conc" }, tituloSecao("h-conc", "bandeira", "Viagens concluídas recentes"),
      el("ul", { class: "lista-caronas larga" }, encerradas.slice(0, RECENTES).map((c) => cartaoViagemConcluida(u, c, ctx))),
      el("div", { class: "linha-acoes" }, linkBotao(`Ver histórico e extrato (${encerradas.length} viagem(ns))`, "#/historico", "secundario", "recibo")));
  }

  // Ferramenta de teste: o selo no cabeçalho avisa quando está ligada.
  function blocoDemo() {
    const caixa = el("input", { type: "checkbox", id: "modo-demo", checked: modoDemo() });
    caixa.addEventListener("change", () => {
      definirModoDemo(caixa.checked);
      desenhar();
      corpo.querySelector("#modo-demo")?.focus();
      retorno.replaceChildren(aviso("alerta", caixa.checked ? "Modo demonstração ligado: o motorista pode iniciar a viagem a qualquer momento." : "Modo demonstração desligado."));
    });
    return el("fieldset", { class: "ferramentas-teste" }, el("legend", {}, icone("ferramenta", { tamanho: 18 }), "Ferramentas de teste"),
      el("label", { class: "opcao", for: "modo-demo" }, caixa, "Modo demonstração: liberar o início da viagem a qualquer momento"),
      el("p", { class: "nota" }, "Só para testar o protótipo. No uso normal, o início é liberado 15 minutos antes da saída (RN08)."));
  }

  desenhar();
  return raiz;
}
