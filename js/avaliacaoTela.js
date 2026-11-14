// Tela de avaliação mútua (RF14, US10; Etapa 8.6): #/avaliacao?carona=<id>.
import { el, aviso, linkBotao, dataHora } from "./componentes.js";
import { listar, obter } from "./dados.js";
import { usuarioAtual } from "./sessao.js";
import { quemAvaliar, participantes, mediaDe, textoMedia, NOTA_MIN, NOTA_MAX, TAMANHO_MAX_COMENTARIO } from "./avaliacao.js";
import { avaliar } from "./avaliacoes.js";

const voltar = () => linkBotao("Voltar para Caronas", "#/caronas", "secundario");
const NOTAS = Array.from({ length: NOTA_MAX - NOTA_MIN + 1 }, (_, i) => NOTA_MIN + i);

export function telaAvaliacao(params) {
  const u = usuarioAtual();
  const carona = obter("caronas", params?.get("carona") ?? "");
  const raiz = el("div", {}, el("h2", {}, "Avaliação da viagem"));
  if (!carona) { raiz.append(aviso("erro", "Carona não encontrada."), voltar()); return raiz; }
  raiz.append(el("p", { class: "nota" }, `${carona.origem} → ${carona.destino}`, carona.concluidaEm && ` · concluída em ${dataHora(carona.concluidaEm)}`));
  if (carona.status !== "concluida") { raiz.append(aviso("alerta", "A avaliação é liberada depois que a viagem é concluída."), voltar()); return raiz; }
  if (!participantes(carona, listar("solicitacoes")).includes(u.id)) { raiz.append(aviso("alerta", "Só quem participou da viagem pode avaliar."), voltar()); return raiz; }

  const retorno = el("div", { tabindex: "-1" });
  const lista = el("ul", { class: "lista-caronas" });
  raiz.append(el("p", {}, "Sua avaliação ajuda a comunidade a escolher caronas com confiança. A pessoa avaliada é avisada, mas não vê quem deu cada nota."),
    retorno, lista, el("div", { class: "linha-acoes" }, voltar()));

  const desenhar = () => lista.replaceChildren(...quemAvaliar(carona, u.id, listar("solicitacoes"), listar("avaliacoes")).map(cartao));

  function cartao(item) {
    const pessoa = obter("usuarios", item.avaliadoId), nome = pessoa?.nome ?? "—";
    const papel = item.papel === "motorista" ? "Motorista" : `Passageiro(a)${item.obrigatorio ? "" : " · opcional"}`;
    const topo = [el("h3", {}, nome), el("p", { class: "nota" }, `${papel} · média atual: ${textoMedia(mediaDe(item.avaliadoId, listar("avaliacoes")))}`)];
    if (item.feita) return el("li", { class: "carona" }, ...topo,
      el("p", {}, `✔ Você avaliou com nota ${item.feita.nota} de ${NOTA_MAX}.`), item.feita.comentario && el("p", { class: "nota" }, `“${item.feita.comentario}”`));

    const id = item.avaliadoId, erro = el("p", { class: "campo-erro", hidden: true, role: "alert" });
    const comentario = el("textarea", { id: `comentario-${id}`, name: "comentario", rows: "2", maxlength: String(TAMANHO_MAX_COMENTARIO) });
    const form = el("form", { novalidate: true, onsubmit: (ev) => {
      ev.preventDefault();
      const marcada = NOTAS.map((n) => form.querySelector(`#nota-${id}-${n}`)).find((r) => r?.checked);
      const r = avaliar({ caronaId: carona.id, avaliadorId: u.id, avaliadoId: id, nota: marcada?.value, comentario: comentario.value });
      if (!r.ok) { erro.hidden = false; erro.textContent = `✖ ${r.motivo}`; return; }
      desenhar();
      retorno.replaceChildren(aviso("info", `Avaliação de ${nome} enviada.`));
      retorno.focus();
    } },
      el("fieldset", {}, el("legend", {}, `Nota para ${nome} (${NOTA_MIN} = ruim, ${NOTA_MAX} = ótima)`),
        el("div", { class: "linha-acoes" }, NOTAS.map((n) =>
          el("label", { class: "opcao", for: `nota-${id}-${n}` }, el("input", { type: "radio", id: `nota-${id}-${n}`, name: `nota-${id}`, value: String(n) }), `${n} ★`)))),
      el("div", { class: "campo" }, el("label", { for: `comentario-${id}` }, "Comentário (opcional)"), comentario),
      erro,
      el("button", { type: "submit", class: "botao" }, `Enviar avaliação de ${nome}`));
    return el("li", { class: "carona" }, ...topo, form);
  }

  desenhar();
  return raiz;
}
