import { el, aviso, campo, linkBotao } from "./componentes.js";
import { LOCAIS, TOLERANCIAS, DIAS_SEMANA, gerarOcorrencias, validarOferta, turnoDaHora, localPorId, dataHoraDe } from "./caronas.js";
import { TURNOS, CAPACIDADE_MAX } from "./regras.js";
import { inserir } from "./dados.js";
import { usuarioAtual, veiculoDe, pendenciasDe } from "./sessao.js";

// RF04 (criar carona), RF05 (recorrência semanal), RN04 (vagas <= capacidade do veículo), RN05 (grupo só para mulheres).
export function telaOferecer() {
  const raiz = el("div");
  let publicadas = 0;
  const desenhar = () => { raiz.replaceChildren(...conteudo()); };

  function conteudo() {
    const u = usuarioAtual(), v = veiculoDe(u), pend = pendenciasDe(u), cab = el("h2", {}, "Oferecer carona");
    if (!u.motorista) return [cab, aviso("alerta", "Para oferecer caronas, marque \"Quero oferecer carona\" no seu perfil."), linkBotao("Ir para o perfil", "#/perfil")];
    if (pend.length || !v) return [cab, aviso("alerta", `Complete o perfil antes de oferecer caronas (RN02). Falta: ${pend.join(", ")}.`), linkBotao("Ir para o perfil", "#/perfil")];

    const max = Math.min(CAPACIDADE_MAX, v.capacidade), hoje = new Date();
    const iso = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}-${String(hoje.getDate()).padStart(2, "0")}`;
    const locais = LOCAIS.map((l) => [l.id, l.nome]);
    const f = {
      origem: campo({ id: "origem", rotulo: "Saída de", opcoes: locais }),
      destino: campo({ id: "destino", rotulo: "Destino", ajuda: "Uma das pontas precisa ser o campus UDF.", opcoes: locais }),
      data: campo({ id: "data", rotulo: "Data (primeira saída)", tipo: "date", extra: { min: iso } }),
      hora: campo({ id: "hora", rotulo: "Horário de saída", tipo: "time" }),
      tolerancia: campo({ id: "tolerancia", rotulo: "Tolerância de atraso", valor: "10", opcoes: TOLERANCIAS.map((t) => [String(t), `${t} minutos`]) }),
      vagas: campo({ id: "vagas", rotulo: "Vagas oferecidas", ajuda: `Seu veículo comporta até ${max} passageiro(s).`, opcoes: Array.from({ length: max }, (_, i) => [String(i + 1), String(i + 1)]) }),
      valor: campo({ id: "valor", rotulo: "Contribuição por vaga (R$)", ajuda: "Use 0 para carona gratuita.", extra: { inputmode: "decimal" } }),
      turno: campo({ id: "turno", rotulo: "Turno da carona", opcoes: TURNOS.map((t) => [t, t]) }),
      regras: campo({ id: "regras", rotulo: "Regras do veículo", ajuda: "Opcional. Ex.: espaço para bagagem.", obrigatorio: false }),
      dataFim: campo({ id: "dataFim", rotulo: "Repetir até", tipo: "date", obrigatorio: false })
    };
    f.hora.entrada.addEventListener("change", () => { if (!f.turno.entrada.value && f.hora.entrada.value) f.turno.entrada.value = turnoDaHora(Number(f.hora.entrada.value.slice(0, 2))); });

    const cMulheres = u.genero === "feminino" && el("input", { type: "checkbox", id: "apenasMulheres" });
    const eMulheres = el("p", { class: "campo-erro", id: "apenasMulheres-erro", hidden: true });
    const cRec = el("input", { type: "checkbox", id: "recorrente" });
    const dias = DIAS_SEMANA.map(([n, nome]) => ({ n, no: el("input", { type: "checkbox", id: `dia-${n}`, value: String(n) }), nome }));
    const eDias = el("p", { class: "campo-erro", id: "dias-erro", hidden: true });
    const secRec = el("fieldset", { hidden: true }, el("legend", {}, "Dias da semana"),
      dias.map((d) => el("label", { class: "opcao", for: `dia-${d.n}` }, d.no, d.nome)), eDias, f.dataFim.no);
    cRec.addEventListener("change", () => { secRec.hidden = !cRec.checked; });
    const mostrar = (p, msg) => { p.hidden = !msg; p.textContent = msg ? `✖ ${msg}` : ""; };

    const publicar = (ev) => {
      ev.preventDefault();
      const d = Object.fromEntries(Object.entries(f).map(([k, c]) => [k, c.entrada.value]));
      Object.assign(d, { apenasMulheres: Boolean(cMulheres?.checked), recorrente: cRec.checked, dias: dias.filter((x) => x.no.checked).map((x) => x.n) });
      const e = validarOferta(d, { veiculo: v, motorista: u });
      const saidas = d.recorrente ? gerarOcorrencias({ data: d.data, dataFim: d.dataFim, dias: d.dias, hora: d.hora }) : [dataHoraDe(d.data, d.hora)?.toISOString()];
      if (d.recorrente && !e.dias && !e.dataFim && !e.data && !saidas.length) e.dias = "Nenhum dos dias escolhidos cai nesse período.";
      Object.entries(f).forEach(([k, c]) => c.erro(e[k] ?? ""));
      mostrar(eDias, e.dias); mostrar(eMulheres, e.apenasMulheres);
      const primeiro = Object.keys(e)[0];
      if (primeiro) { (f[primeiro]?.entrada ?? (primeiro === "dias" ? dias[0].no : cMulheres))?.focus(); return; }
      const serieId = d.recorrente ? `ser-${Date.now().toString(36)}` : null;
      const valor = Number(d.valor.trim().replace(",", "."));
      saidas.forEach((s) => inserir("caronas", {
        motoristaId: u.id, veiculoId: v.id, origemId: d.origem, destinoId: d.destino, origem: localPorId(d.origem).nome, destino: localPorId(d.destino).nome,
        dataHoraSaida: s, toleranciaMin: Number(d.tolerancia), vagasTotal: Number(d.vagas), valor, regras: d.regras.trim(), turno: d.turno,
        recorrente: d.recorrente, serieId, apenasMulheres: d.apenasMulheres, status: "aberta"
      }));
      publicadas = saidas.length;
      desenhar();
    };

    return [cab,
      publicadas ? aviso("info", `${publicadas} carona(s) publicada(s). Elas já aparecem na busca.`) : null,
      publicadas ? el("p", {}, linkBotao("Ver na busca", "#/buscar", "secundario")) : null,
      el("p", { class: "nota" }, `Veículo: ${v.modelo} ${v.cor}, placa ${v.placa}.`),
      el("form", { novalidate: true, onsubmit: publicar },
        el("fieldset", {}, el("legend", {}, "Trajeto e horário"), f.origem.no, f.destino.no, f.data.no, f.hora.no, f.tolerancia.no, f.turno.no),
        el("fieldset", {}, el("legend", {}, "Vagas e valor"), f.vagas.no, f.valor.no, f.regras.no,
          cMulheres && el("label", { class: "opcao", for: "apenasMulheres" }, cMulheres, "Carona só para mulheres"), eMulheres),
        el("fieldset", {}, el("legend", {}, "Repetição"), el("label", { class: "opcao", for: "recorrente" }, cRec, "Repetir toda semana")),
        secRec, el("button", { type: "submit", class: "botao" }, "Publicar carona"))];
  }
  desenhar();
  return raiz;
}
