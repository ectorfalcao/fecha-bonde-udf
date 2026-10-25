import { el, aviso, selo, estadoVazio, linkBotao, dataHora, moeda, dialogoConfirmar } from "./componentes.js";
import { listar, obter, vagasDisponiveis } from "./dados.js";
import { usuarioAtual } from "./sessao.js";
import { aprovar, recusar, cancelarSolicitacao, cancelarCarona } from "./solicitacoes.js";
import { iniciarViagem, concluirViagem } from "./viagens.js";
import { doUsuario, marcarLidas } from "./notificacoes.js";
import { ATIVAS, rotuloStatus, posicaoNaFila, filaOrdenada, podeCancelarCarona } from "./grupos.js";
import { podeIniciarViagem } from "./viagem.js";
import { modoDemo, definirModoDemo } from "./demo.js";

// Lista de definição: flatMap (e não map) porque el() achata só um nível de lista.
const lista = (linhas) => el("dl", {}, linhas.filter(Boolean).flatMap(([t, v, cls]) => [el("dt", {}, t), el("dd", { class: cls }, v)]));
const confirmar = (titulo, texto, aceitar) => dialogoConfirmar({ titulo, corpo: el("p", {}, texto), aceitar, recusar: "Voltar" });
const rota = (c) => `${c.origem} → ${c.destino}`;
const hora = (iso) => new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(new Date(iso));

// RF07, RF08, RF09, RN06 (Etapa 7) e ciclo da viagem (Etapa 8.1).
// Passageiro: acompanha e cancela. Motorista: aprova, recusa, cancela, inicia e conclui a viagem.
export function telaMinhasCaronas() {
  const retorno = el("div", { tabindex: "-1" });
  const corpo = el("div");
  const raiz = el("div", {}, el("h2", {}, "Minhas caronas"), retorno, corpo);
  const desenhar = () => corpo.replaceChildren(...conteudo().filter(Boolean));
  const dizer = (no) => { retorno.replaceChildren(no); retorno.focus(); };
  const concluir = (r, sucesso) => { desenhar(); dizer(r.ok ? aviso("info", sucesso) : aviso("erro", r.motivo)); };

  function conteudo() {
    const u = usuarioAtual(), todas = listar("solicitacoes");
    const minhas = todas.filter((s) => s.passageiroId === u.id && obter("caronas", s.caronaId)?.status !== "concluida")
      .sort((a, b) => String(b.criadaEm ?? "").localeCompare(String(a.criadaEm ?? "")));
    const oferecidas = listar("caronas").filter((c) => c.motoristaId === u.id && (c.status === "aberta" || c.status === "em_andamento"))
      .sort((a, b) => new Date(a.dataHoraSaida) - new Date(b.dataHoraSaida));
    const encerradas = concluidasDe(u, todas);
    const blocos = [blocoAvisos(u)];
    if (minhas.length) blocos.push(blocoPassageiro(u, minhas));
    if (oferecidas.length) blocos.push(blocoMotorista(u, oferecidas));
    if (encerradas.length) blocos.push(blocoConcluidas(u, encerradas, todas));
    if (!minhas.length && !oferecidas.length && !encerradas.length)
      blocos.push(estadoVazio({ titulo: "Nada por aqui ainda", texto: "Solicite uma vaga em uma carona ou publique a sua.",
        acao: el("div", { class: "linha-acoes" }, linkBotao("Buscar carona", "#/buscar"), u.motorista && linkBotao("Oferecer carona", "#/oferecer", "secundario")) }));
    blocos.push(blocoDemo());
    return blocos;
  }

  const concluidasDe = (u, todas) => {
    const minhasConf = new Set(todas.filter((s) => s.passageiroId === u.id && s.status === "confirmada").map((s) => s.caronaId));
    return listar("caronas").filter((c) => c.status === "concluida" && (c.motoristaId === u.id || minhasConf.has(c.id)))
      .sort((a, b) => String(b.concluidaEm).localeCompare(String(a.concluidaEm))).slice(0, 10);
  };

  function blocoAvisos(u) {
    const todos = doUsuario(u.id), novos = todos.filter((n) => !n.lida).length;
    return el("section", { class: "secao", "aria-labelledby": "h-avisos" },
      el("h3", { id: "h-avisos" }, novos ? `Avisos (${novos} nova${novos > 1 ? "s" : ""})` : "Avisos"),
      todos.length
        ? [el("ul", { class: "pessoas" }, todos.slice(0, 8).map((n) => el("li", {}, el("span", {}, !n.lida && [selo("Nova"), " "], n.texto, " ", el("small", { class: "nota" }, dataHora(n.criadaEm)))))),
           novos > 0 && el("button", { type: "button", class: "botao secundario", onclick: () => { marcarLidas(u.id); desenhar(); } }, "Marcar todos como lidos")]
        : el("p", { class: "nota" }, "Nenhum aviso por enquanto. Os avisos são simulados dentro do app."));
  }

  function blocoPassageiro(u, minhas) {
    const todas = listar("solicitacoes");
    const itens = minhas.map((s) => {
      const c = obter("caronas", s.caronaId);
      if (!c) return null;
      const pos = s.status === "espera" ? posicaoNaFila(s, c, todas) : 0;
      return el("li", { class: "carona" }, el("h4", {}, rota(c)),
        lista([["Situação", rotuloStatus(s, c)], pos > 0 && ["Posição na fila", `${pos}º`], ["Saída", dataHora(c.dataHoraSaida)],
          ["Motorista", obter("usuarios", c.motoristaId)?.nome ?? "—"], ["Contribuição", moeda(c.valor), "valor"]]),
        ATIVAS.includes(s.status) && c.status === "aberta" && el("div", { class: "linha-acoes" },
          el("button", { type: "button", class: "botao secundario", "aria-label": `Cancelar solicitação de ${rota(c)}`, onclick: async () => {
            if (await confirmar("Cancelar solicitação?", s.status === "confirmada" ? "Sua vaga será liberada e o motorista será avisado." : "O motorista será avisado.", "Cancelar solicitação"))
              concluir(cancelarSolicitacao(s.id, u.id), "Solicitação cancelada. O motorista foi avisado.");
          } }, "Cancelar solicitação")));
    }).filter(Boolean);
    return el("section", { class: "secao", "aria-labelledby": "h-pass" }, el("h3", { id: "h-pass" }, "Como passageiro"), el("ul", { class: "lista-caronas" }, itens));
  }

  function blocoMotorista(u, oferecidas) {
    const itens = oferecidas.map((c) => {
      const sols = listar("solicitacoes").filter((s) => s.caronaId === c.id);
      const nomeDe = (s) => obter("usuarios", s.passageiroId);
      const pend = sols.filter((s) => s.status === "pendente"), conf = sols.filter((s) => s.status === "confirmada"), fila = filaOrdenada(c, sols);
      const pessoas = (titulo, grupo, acoes) => grupo.length > 0 && [el("p", {}, el("strong", {}, titulo)),
        el("ul", { class: "pessoas" }, grupo.map((s, i) => el("li", {}, el("span", {}, `${acoes === "fila" ? `${i + 1}º · ` : ""}${nomeDe(s)?.nome ?? "—"} · ${nomeDe(s)?.curso ?? ""}`),
          acoes === "decidir" && el("span", { class: "linha-acoes" },
            el("button", { type: "button", class: "botao", "aria-label": `Aprovar ${nomeDe(s)?.nome}`, onclick: () => concluir(aprovar(s.id, u.id), `${nomeDe(s)?.nome} foi aprovado(a).`) }, "Aprovar"),
            el("button", { type: "button", class: "botao secundario", "aria-label": `Recusar ${nomeDe(s)?.nome}`, onclick: () => concluir(recusar(s.id, u.id), `${nomeDe(s)?.nome} foi recusado(a).`) }, "Recusar")))))];

      if (c.status === "em_andamento")
        return el("li", { class: "carona" }, el("h4", {}, rota(c)),
          lista([["Situação", "🚗 Viagem em andamento"], ["Iniciada às", hora(c.iniciadaEm)], ["Saída prevista", dataHora(c.dataHoraSaida)], ["Passageiros a bordo", String(conf.length)]]),
          pessoas("A bordo", conf),
          c.iniciadaEmModoDemo && el("p", { class: "nota" }, "Iniciada com o modo demonstração (fora da janela de 15 minutos)."),
          el("div", { class: "linha-acoes" },
            el("button", { type: "button", class: "botao", "aria-label": `Concluir viagem ${rota(c)}`, onclick: async () => {
              if (await confirmar("Concluir a viagem?", conf.length ? `Confirme que a viagem terminou. ${conf.length} passageiro(s) serão avisados.` : "Confirme que a viagem terminou.", "Concluir viagem"))
                concluir(concluirViagem(c.id, u.id), "Viagem concluída.");
            } }, "Concluir viagem")));

      const bloqueio = podeCancelarCarona(c), inicio = podeIniciarViagem(c, { demo: modoDemo() });
      return el("li", { class: "carona" }, el("h4", {}, rota(c)),
        lista([["Saída", dataHora(c.dataHoraSaida)], ["Vagas", `${vagasDisponiveis(c)} livre(s) de ${c.vagasTotal}`], ["Contribuição", moeda(c.valor), "valor"]]),
        new Date(c.dataHoraSaida) <= new Date() && el("p", { class: "nota" }, "O horário de saída já passou."),
        pessoas("Aguardando sua aprovação", pend, "decidir"), pessoas("Confirmados", conf), pessoas("Lista de espera", fila, "fila"),
        !sols.some((s) => ATIVAS.includes(s.status)) && el("p", { class: "nota" }, "Nenhuma solicitação ainda."),
        el("div", { class: "linha-acoes" },
          el("button", { type: "button", class: "botao", "aria-label": `Iniciar viagem ${rota(c)}`, onclick: async () => {
            const v = podeIniciarViagem(c, { demo: modoDemo() });
            if (!v.ok) return concluir(v, "");
            const aviso1 = conf.length ? `${conf.length} passageiro(s) confirmado(s) serão avisados.` : "Nenhum passageiro está confirmado.";
            const aviso2 = pend.length + fila.length ? ` ${pend.length + fila.length} solicitação(ões) sem resposta serão encerradas.` : "";
            if (await confirmar("Iniciar a viagem?", aviso1 + aviso2, "Iniciar viagem")) concluir(iniciarViagem(c.id, u.id), "Viagem iniciada.");
          } }, "Iniciar viagem"),
          el("button", { type: "button", class: "botao secundario", "aria-label": `Cancelar carona ${rota(c)}`, onclick: async () => {
            if (!bloqueio.ok) return concluir(bloqueio, "");
            const n = pend.length + conf.length + fila.length;
            if (await confirmar("Cancelar esta carona?", n ? `${n} passageiro(s) com solicitação ativa serão avisados.` : "Nenhum passageiro tem solicitação ativa.", "Cancelar carona"))
              concluir(cancelarCarona(c.id, u.id), "Carona cancelada. Os passageiros foram avisados.");
          } }, "Cancelar carona")),
        !inicio.ok && el("p", { class: "nota" }, inicio.motivo),
        inicio.ok && inicio.usouDemo && el("p", { class: "nota" }, "Modo demonstração: início liberado fora da janela de 15 minutos."),
        !bloqueio.ok && el("p", { class: "nota" }, bloqueio.motivo));
    });
    return el("section", { class: "secao", "aria-labelledby": "h-mot" }, el("h3", { id: "h-mot" }, "Como motorista"), el("ul", { class: "lista-caronas" }, itens));
  }

  // Viagens concluídas (as 10 mais recentes). O histórico completo e o extrato vêm na parte 8.7 (RF13).
  function blocoConcluidas(u, encerradas, todas) {
    return el("section", { class: "secao", "aria-labelledby": "h-conc" }, el("h3", { id: "h-conc" }, "Viagens concluídas"),
      el("ul", { class: "lista-caronas" }, encerradas.map((c) => el("li", { class: "carona" }, el("h4", {}, rota(c)),
        lista([["Seu papel", c.motoristaId === u.id ? "Motorista" : "Passageiro(a)"], ["Saída", dataHora(c.dataHoraSaida)], ["Concluída em", dataHora(c.concluidaEm)],
          ["Passageiros", String(todas.filter((s) => s.caronaId === c.id && s.status === "confirmada").length)]])))));
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
    return el("fieldset", {}, el("legend", {}, "Ferramentas de teste"),
      el("label", { class: "opcao", for: "modo-demo" }, caixa, "Modo demonstração: liberar o início da viagem a qualquer momento"),
      el("p", { class: "nota" }, "Só para testar o protótipo. No uso normal, o início é liberado 15 minutos antes da saída (RN08)."));
  }

  desenhar();
  return raiz;
}