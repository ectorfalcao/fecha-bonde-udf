import { el, aviso, selo, campo } from "./componentes.js";
import { TURNOS, GENEROS, CAPACIDADE_MIN, CAPACIDADE_MAX, validarPerfil, normalizarPlaca, gerarCodigo, telefoneValido } from "./regras.js";
import { atualizar, inserir } from "./dados.js";
import { usuarioAtual, veiculoDe, pendenciasDe, sair } from "./sessao.js";

const digitos = (t) => String(t ?? "").replace(/\D/g, "");

// RF02 / RN02: perfil de todos + CNH e veículo para motoristas. Arquivos: só o NOME é guardado (protótipo, sem upload).
export function telaPerfil() {
  const raiz = el("div");
  let codigoTel = null, aviso0 = null;
  const desenhar = () => { raiz.replaceChildren(...conteudo()); aviso0 = null; };

  function conteudo() {
    const u = usuarioAtual(), v = veiculoDe(u) ?? {}, pend = pendenciasDe(u);
    const opcoesCap = Array.from({ length: CAPACIDADE_MAX - CAPACIDADE_MIN + 1 }, (_, i) => [String(i + 1), String(i + 1)]);
    const f = {
      nome: campo({ id: "nome", rotulo: "Nome completo", valor: u.nome, autocomplete: "name" }),
      curso: campo({ id: "curso", rotulo: "Curso", valor: u.curso }),
      turno: campo({ id: "turno", rotulo: "Turno", valor: u.turno, opcoes: TURNOS.map((t) => [t, t]) }),
      genero: campo({ id: "genero", rotulo: "Gênero", ajuda: "Usado no filtro de caronas só para mulheres.", valor: u.genero, opcoes: GENEROS }),
      telefone: campo({ id: "telefone", rotulo: "Telefone com DDD", tipo: "tel", valor: u.telefone, autocomplete: "tel" }),
      foto: campo({ id: "foto", rotulo: "Foto de perfil", tipo: "file", accept: "image/*", ajuda: `Protótipo: só o nome do arquivo é guardado.${u.fotoNome ? ` Atual: ${u.fotoNome}.` : ""}`, obrigatorio: !u.fotoNome }),
      contatoNome: campo({ id: "contatoNome", rotulo: "Contato de emergência: nome", valor: u.contatoNome, obrigatorio: false }),
      contatoTel: campo({ id: "contatoTel", rotulo: "Contato de emergência: telefone", tipo: "tel", valor: u.contatoTel, obrigatorio: false }),
      cnh: campo({ id: "cnh", rotulo: "Foto da CNH", tipo: "file", accept: "image/*", ajuda: `Só o nome do arquivo é guardado.${u.cnhNome ? ` Atual: ${u.cnhNome}.` : ""}`, obrigatorio: false }),
      placa: campo({ id: "placa", rotulo: "Placa", valor: v.placa ?? "", ajuda: "Formato ABC1D23 ou ABC1234.", obrigatorio: false }),
      modelo: campo({ id: "modelo", rotulo: "Modelo do veículo", valor: v.modelo ?? "", obrigatorio: false }),
      cor: campo({ id: "cor", rotulo: "Cor", valor: v.cor ?? "", obrigatorio: false }),
      capacidade: campo({ id: "capacidade", rotulo: "Passageiros que cabem (sem o motorista)", valor: String(v.capacidade ?? ""), opcoes: opcoesCap, obrigatorio: false })
    };
    const ePapel = el("p", { class: "campo-erro", id: "papel-erro", hidden: true });
    const cPass = el("input", { type: "checkbox", id: "passageiro", checked: u.passageiro });
    const cMot = el("input", { type: "checkbox", id: "motorista", checked: u.motorista });
    const secMot = el("fieldset", { hidden: !u.motorista }, el("legend", {}, "Dados de motorista"), f.cnh.no, f.placa.no, f.modelo.no, f.cor.no, f.capacidade.no);
    cMot.addEventListener("change", () => { secMot.hidden = !cMot.checked; });

    const salvar = (ev) => {
      ev.preventDefault();
      const dados = {
        nome: f.nome.entrada.value, curso: f.curso.entrada.value, turno: f.turno.entrada.value, genero: f.genero.entrada.value,
        telefone: f.telefone.entrada.value, contatoNome: f.contatoNome.entrada.value, contatoTel: f.contatoTel.entrada.value,
        passageiro: cPass.checked, motorista: cMot.checked,
        fotoNome: f.foto.entrada.files?.[0]?.name || u.fotoNome, cnhNome: f.cnh.entrada.files?.[0]?.name || u.cnhNome,
        veiculo: { placa: f.placa.entrada.value, modelo: f.modelo.entrada.value, cor: f.cor.entrada.value, capacidade: f.capacidade.entrada.value }
      };
      const e = validarPerfil(dados);
      Object.entries(f).forEach(([id, c]) => c.erro(e[id] ?? ""));
      ePapel.hidden = !e.papel; ePapel.textContent = e.papel ? `✖ ${e.papel}` : "";
      const primeiro = Object.keys(e)[0];
      if (primeiro) { (f[primeiro]?.entrada ?? cPass).focus(); return; }
      const mudouTel = digitos(dados.telefone) !== digitos(u.telefone);
      const { veiculo, ...perfil } = dados;
      atualizar("usuarios", u.id, { ...perfil, telefoneVerificado: mudouTel ? false : u.telefoneVerificado });
      if (dados.motorista) {
        const novo = { placa: normalizarPlaca(veiculo.placa), modelo: veiculo.modelo.trim(), cor: veiculo.cor.trim(), capacidade: Number(veiculo.capacidade) };
        veiculoDe(u) ? atualizar("veiculos", veiculoDe(u).id, novo) : inserir("veiculos", { ...novo, motoristaId: u.id });
      }
      if (mudouTel) codigoTel = null;
      aviso0 = aviso("info", "Perfil salvo.");
      desenhar();
    };

    const form = el("form", { novalidate: true, onsubmit: salvar },
      el("fieldset", {}, el("legend", {}, "Dados pessoais"), f.nome.no, f.foto.no, f.curso.no, f.turno.no, f.genero.no, f.telefone.no),
      el("fieldset", {}, el("legend", {}, "Contato de emergência (opcional)"), f.contatoNome.no, f.contatoTel.no),
      el("fieldset", {}, el("legend", {}, "Como você vai usar o app?"),
        el("label", { class: "opcao", for: "passageiro" }, cPass, "Quero pegar carona (passageiro)"),
        el("label", { class: "opcao", for: "motorista" }, cMot, "Quero oferecer carona (motorista)"), ePapel),
      secMot, el("button", { type: "submit", class: "botao" }, "Salvar perfil"));

    return [
      el("h2", {}, "Perfil"),
      el("p", { class: "nota" }, `Conectado como ${u.email}`),
      aviso0,
      pend.length ? aviso("alerta", `Falta completar: ${pend.join(", ")}.`) : aviso("info", "Perfil completo."),
      blocoTelefone(u), form,
      el("div", { class: "linha-acoes" }, el("button", { type: "button", class: "botao secundario", onclick: () => { sair(); location.hash = "#/acesso"; } }, "Sair"))
    ];
  }

  // Verificação do telefone por SMS/WhatsApp: SIMULADA (RF02).
  function blocoTelefone(u) {
    if (u.telefoneVerificado) return aviso("info", "Telefone verificado (simulação).");
    if (!telefoneValido(u.telefone)) return null;
    if (!codigoTel) return el("div", { class: "linha-acoes" }, el("button", { type: "button", class: "botao secundario", onclick: () => { codigoTel = gerarCodigo(); desenhar(); } }, "Verificar telefone (simulado)"));
    const c = campo({ id: "codigoTel", rotulo: "Código recebido no telefone", ajuda: "Digite o código de 6 dígitos." });
    return el("form", { novalidate: true, onsubmit: (ev) => {
      ev.preventDefault();
      if (c.entrada.value.trim() !== codigoTel) { c.erro("Código incorreto."); c.entrada.focus(); return; }
      atualizar("usuarios", u.id, { telefoneVerificado: true }); codigoTel = null; aviso0 = aviso("info", "Telefone verificado."); desenhar();
    } },
      el("div", { class: "codigo-simulado" }, selo("Simulado"), el("span", {}, `Código enviado para ${u.telefone}:`), el("output", {}, codigoTel)),
      c.no, el("button", { type: "submit", class: "botao" }, "Confirmar telefone"));
  }

  desenhar();
  return raiz;
}
