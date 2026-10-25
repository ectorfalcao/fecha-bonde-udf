import { el, aviso, campo, estadoVazio } from "./componentes.js";
import { LOCAIS, filtrarCaronas } from "./caronas.js";
import { TURNOS } from "./regras.js";
import { listar, obter } from "./dados.js";
import { usuarioAtual } from "./sessao.js";
import { cartaoCarona } from "./cartao.js";

// RF06 / RN05. Os resultados atualizam a cada mudança de filtro: sem botão "Buscar" (menos toques, RNF09).
export function telaBuscar() {
  const u = usuarioAtual();
  const f = {
    partida: campo({ id: "partida", rotulo: "Minha partida", ajuda: "Os resultados são filtrados pela distância em linha reta.", opcoes: LOCAIS.map((l) => [l.id, l.nome]), obrigatorio: false, vazio: "Qualquer partida" }),
    raio: campo({ id: "raio", rotulo: "Raio de busca", valor: "10", opcoes: [["5", "Até 5 km"], ["10", "Até 10 km"], ["20", "Até 20 km"], ["50", "Até 50 km"]], obrigatorio: false, vazio: "Sem limite" }),
    turno: campo({ id: "turno", rotulo: "Turno", opcoes: TURNOS.map((t) => [t, t]), obrigatorio: false, vazio: "Qualquer turno" }),
    chegar: campo({ id: "chegar", rotulo: "Chegar até", tipo: "time", ajuda: "Horário estimado de chegada (opcional).", obrigatorio: false })
  };
  const mulheres = el("input", { type: "checkbox", id: "so-mulheres" });
  const filtroMulheres = u.genero === "feminino" && el("label", { class: "opcao", for: "so-mulheres" }, mulheres, "Só para mulheres");
  const resultados = el("div", { "aria-live": "polite" });

  const ctx = { usuario: u, motoristaDe: (c) => obter("usuarios", c.motoristaId),
    passageirosConfirmados: (c) => listar("solicitacoes").filter((s) => s.caronaId === c.id && s.status === "confirmada").map((s) => obter("usuarios", s.passageiroId)).filter(Boolean) };

  function atualizar() {
    const h = f.chegar.entrada.value;
    const achadas = filtrarCaronas(listar("caronas"), {
      partidaId: f.partida.entrada.value, raioKm: Number(f.raio.entrada.value) || 0, turno: f.turno.entrada.value,
      chegarAteMin: h ? Number(h.slice(0, 2)) * 60 + Number(h.slice(3, 5)) : null, soMulheres: mulheres.checked
    }, ctx);
    resultados.replaceChildren(
      el("p", { class: "nota" }, `${achadas.length} carona(s) encontrada(s).`),
      achadas.length
        ? el("ul", { class: "lista-caronas" }, achadas.map((r) => cartaoCarona(r.carona, { distanciaKm: r.distanciaKm })))
        : estadoVazio({ titulo: "Nenhuma carona encontrada", texto: "Não há vagas com esses filtros. Aumente o raio ou remova algum filtro.",
            acao: el("button", { type: "button", class: "botao secundario", onclick: limpar }, "Limpar filtros") }));
  }
  function limpar() {
    f.partida.entrada.value = ""; f.raio.entrada.value = "10"; f.turno.entrada.value = ""; f.chegar.entrada.value = ""; mulheres.checked = false; atualizar();
  }
  [...Object.values(f).map((c) => c.entrada), mulheres].forEach((i) => i.addEventListener("change", atualizar));

  atualizar();
  return el("div", {}, el("h2", {}, "Buscar carona"),
    el("form", { novalidate: true, onsubmit: (ev) => ev.preventDefault(), "aria-label": "Filtros de busca" },
      el("fieldset", {}, el("legend", {}, "Filtros"), f.partida.no, f.raio.no, f.turno.no, f.chegar.no, filtroMulheres)),
    resultados,
    aviso("info", "Solicitar entrada em uma carona chega na Etapa 7."));
}
