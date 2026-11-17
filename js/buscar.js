import { el, aviso, campo, estadoVazio, linkBotao, cabecalhoTela, comIcone, icone } from "./componentes.js";
import { LOCAIS, filtrarCaronas } from "./caronas.js";
import { TURNOS } from "./regras.js";
import { listar, vagasDisponiveis } from "./dados.js";
import { usuarioAtual } from "./sessao.js";
import { cartaoCarona } from "./cartao.js";
import { solicitar, contextoDados } from "./solicitacoes.js";
import { pedirAceiteConvivencia } from "./termos.js";
import { ATIVAS, rotuloStatus } from "./grupos.js";

// RF06 / RN05 (busca) e RF07 / RF08 / RN03 (solicitar). Os resultados atualizam a cada mudança de filtro: sem botão "Buscar" (menos toques, RNF09).
// Etapa 10: filtros numa coluna fixa ao lado dos resultados no computador; em duas colunas compactas no celular.
export function telaBuscar() {
  const u = usuarioAtual();
  const f = {
    partida: campo({ id: "partida", rotulo: "Minha partida", ajuda: "Os resultados são filtrados pela distância em linha reta.", opcoes: LOCAIS.map((l) => [l.id, l.nome]), obrigatorio: false, vazio: "Qualquer partida" }),
    raio: campo({ id: "raio", rotulo: "Raio de busca", valor: "10", opcoes: [["5", "Até 5 km"], ["10", "Até 10 km"], ["20", "Até 20 km"], ["50", "Até 50 km"]], obrigatorio: false, vazio: "Sem limite" }),
    turno: campo({ id: "turno", rotulo: "Turno", opcoes: TURNOS.map((t) => [t, t]), obrigatorio: false, vazio: "Qualquer turno" }),
    chegar: campo({ id: "chegar", rotulo: "Chegar até", tipo: "time", ajuda: "Horário estimado de chegada.", obrigatorio: false })
  };
  f.partida.no.className = "campo campo-largo";
  f.chegar.no.className = "campo campo-largo";
  const mulheres = el("input", { type: "checkbox", id: "so-mulheres" });
  const filtroMulheres = u.genero === "feminino" && el("label", { class: "opcao", for: "so-mulheres" }, mulheres, "Só para mulheres");
  const retorno = el("div", { tabindex: "-1" });   // mensagens da solicitação; recebe o foco depois de agir
  const resumo = el("p", { class: "nota" });
  const resultados = el("div", { "aria-live": "polite" });

  const dizer = (...nos) => { retorno.replaceChildren(...nos.filter(Boolean)); retorno.focus(); };

  async function pedirVaga(c) {
    let eu = usuarioAtual();
    if (!eu.termosConvivenciaEm) {                   // RF03 / RN03: aceite antes da primeira solicitação
      eu = await pedirAceiteConvivencia(eu);
      if (!eu) return dizer(aviso("alerta", "Sem aceitar os termos de convivência não é possível solicitar uma vaga (RN03)."));
    }
    const r = solicitar(c.id, eu.id);
    atualizar();
    if (!r.ok) return dizer(aviso("erro", r.motivo), r.codigo === "perfil" && linkBotao("Ir para o perfil", "#/perfil", "secundario", "usuario"));
    dizer(aviso("sucesso", r.status === "pendente"
      ? "Solicitação enviada ao motorista. Acompanhe em Caronas."
      : `Carona lotada: você entrou na lista de espera (${r.posicao}º da fila). Acompanhe em Caronas.`), linkBotao("Ver em Caronas", "#/caronas", "secundario", "carro"));
  }

  function acaoDe(c) {
    const eu = usuarioAtual();
    if (c.motoristaId === eu.id) return el("p", { class: "nota" }, "Esta carona é sua.");
    const minha = listar("solicitacoes").find((s) => s.caronaId === c.id && s.passageiroId === eu.id && ATIVAS.includes(s.status));
    if (minha) return el("p", { class: "nota" }, `${rotuloStatus(minha)}. `, el("a", { href: "#/caronas" }, "Ver em Caronas"));
    if (!eu.passageiro) return el("p", { class: "nota" }, "Para solicitar vagas, marque \"Quero pegar carona\" no ", el("a", { href: "#/perfil" }, "perfil"), ".");
    const lotada = vagasDisponiveis(c) === 0;
    return el("button", { type: "button", class: lotada ? "botao secundario" : "botao", "aria-label": `${lotada ? "Entrar na lista de espera" : "Solicitar vaga"}: ${c.origem} para ${c.destino}`, onclick: () => pedirVaga(c) },
      comIcone(lotada ? "fila" : "check", lotada ? "Entrar na lista de espera" : "Solicitar vaga"));
  }

  function atualizar() {
    const h = f.chegar.entrada.value;
    const achadas = filtrarCaronas(listar("caronas"), {
      partidaId: f.partida.entrada.value, raioKm: Number(f.raio.entrada.value) || 0, turno: f.turno.entrada.value,
      chegarAteMin: h ? Number(h.slice(0, 2)) * 60 + Number(h.slice(3, 5)) : null, soMulheres: mulheres.checked
    }, contextoDados(u));
    resumo.textContent = `${achadas.length} carona(s) encontrada(s).`;
    resultados.replaceChildren(
      achadas.length
        ? el("ul", { class: "lista-caronas" }, achadas.map((r) => cartaoCarona(r.carona, { distanciaKm: r.distanciaKm, acao: acaoDe(r.carona) })))
        : estadoVazio({ titulo: "Nenhuma carona encontrada", texto: "Não há vagas com esses filtros. Aumente o raio ou remova algum filtro.", nomeIcone: "busca",
            acao: el("button", { type: "button", class: "botao secundario", onclick: limpar }, "Limpar filtros") }));
  }
  function limpar() {
    f.partida.entrada.value = ""; f.raio.entrada.value = "10"; f.turno.entrada.value = ""; f.chegar.entrada.value = ""; mulheres.checked = false; atualizar();
  }
  [...Object.values(f).map((c) => c.entrada), mulheres].forEach((i) => i.addEventListener("change", atualizar));

  atualizar();
  return el("div", {},
    cabecalhoTela({ titulo: "Buscar carona", descricao: "Escolha sua partida, turno e horário de chegada. A lista atualiza sozinha." }),
    el("div", { class: "layout-busca" },
      el("form", { class: "filtros", novalidate: true, onsubmit: (ev) => ev.preventDefault(), "aria-label": "Filtros de busca" },
        el("fieldset", {}, el("legend", {}, icone("filtro", { tamanho: 18 }), "Filtros"),
          el("div", { class: "grade-campos compacta" }, f.partida.no, f.raio.no, f.turno.no, f.chegar.no),
          filtroMulheres,
          el("div", { class: "linha-acoes" },el("button", { type: "button", class: "botao discreto", onclick: limpar }, comIcone("fechar", "Limpar filtros"))))),
      el("section", { "aria-label": "Resultados" },
        el("div", { class: "resultados-topo" }, resumo),
        retorno, resultados)));
}
