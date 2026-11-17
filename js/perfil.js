import { el, aviso, selo, campo, cabecalhoTela, avatar, comIcone, icone, dataHora, dialogoConfirmar } from "./componentes.js";
import { TURNOS, GENEROS, CAPACIDADE_MIN, CAPACIDADE_MAX, CHAVE_PIX_MAX, validarPerfil, normalizarPlaca, gerarCodigo, telefoneValido } from "./regras.js";
import { atualizar, inserir, listar } from "./dados.js";
import { usuarioAtual, veiculoDe, pendenciasDe, sair } from "./sessao.js";
import { mediaDe, textoMedia } from "./avaliacao.js";
import { exportarDados, revogarConvivencia, excluirConta } from "./contas.js";

const digitos = (t) => String(t ?? "").replace(/\D/g, "");

// RF02 / RN02: perfil de todos + CNH e veículo para motoristas. Arquivos: só o NOME é guardado (protótipo, sem upload).
// Etapa 10: resumo com avatar e reputação (US10), chave PIX fictícia do motorista (RF12) e privacidade (RNF02, LGPD).
export function telaPerfil() {
  const raiz = el("div");
  let codigoTel = null, aviso0 = null;
  const desenhar = () => { raiz.replaceChildren(...conteudo().filter(Boolean)); aviso0 = null; }; // filter: replaceChildren(null) escreveria "null" na tela

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
      capacidade: campo({ id: "capacidade", rotulo: "Passageiros que cabem (sem o motorista)", valor: String(v.capacidade ?? ""), opcoes: opcoesCap, obrigatorio: false }),
      chavePix: campo({ id: "chavePix", rotulo: "Chave PIX para receber (fictícia, opcional)", valor: u.chavePix ?? "", obrigatorio: false,
        ajuda: "O pagamento é simulado: invente uma chave (ex.: seunome@pix.exemplo). Não use CPF, telefone ou e-mail reais.", extra: { maxlength: String(CHAVE_PIX_MAX), autocomplete: "off", spellcheck: "false" } })
    };
    f.nome.no.className = "campo campo-largo";
    f.foto.no.className = "campo campo-largo";
    f.cnh.no.className = "campo campo-largo";
    f.chavePix.no.className = "campo campo-largo";
    const ePapel = el("p", { class: "campo-erro", id: "papel-erro", hidden: true });
    const cPass = el("input", { type: "checkbox", id: "passageiro", checked: u.passageiro });
    const cMot = el("input", { type: "checkbox", id: "motorista", checked: u.motorista });
    const secMot = el("fieldset", { hidden: !u.motorista }, el("legend", {}, icone("carro", { tamanho: 18 }), "Dados de motorista"),
      el("div", { class: "grade-campos" }, f.cnh.no, f.placa.no, f.modelo.no, f.cor.no, f.capacidade.no, f.chavePix.no));
    cMot.addEventListener("change", () => { secMot.hidden = !cMot.checked; });

    const salvar = (ev) => {
      ev.preventDefault();
      const dados = {
        nome: f.nome.entrada.value, curso: f.curso.entrada.value, turno: f.turno.entrada.value, genero: f.genero.entrada.value,
        telefone: f.telefone.entrada.value, contatoNome: f.contatoNome.entrada.value, contatoTel: f.contatoTel.entrada.value,
        passageiro: cPass.checked, motorista: cMot.checked,
        fotoNome: f.foto.entrada.files?.[0]?.name || u.fotoNome, cnhNome: f.cnh.entrada.files?.[0]?.name || u.cnhNome,
        chavePix: f.chavePix.entrada.value.trim(),
        veiculo: { placa: f.placa.entrada.value, modelo: f.modelo.entrada.value, cor: f.cor.entrada.value, capacidade: f.capacidade.entrada.value }
      };
      const e = validarPerfil(dados);
      Object.entries(f).forEach(([id, c]) => c.erro(e[id] ?? ""));
      ePapel.hidden = !e.papel; ePapel.textContent = e.papel ? `✖ ${e.papel}` : "";
      const primeiro = Object.keys(e)[0];
      if (primeiro) { (f[primeiro]?.entrada ?? cPass).focus(); return; }
      const mudouTel = digitos(dados.telefone) !== digitos(u.telefone);
      const { veiculo, ...perfil } = dados;
      atualizar("usuarios", u.id, { ...perfil, chavePix: dados.motorista ? dados.chavePix : (u.chavePix ?? ""), telefoneVerificado: mudouTel ? false : u.telefoneVerificado });
      if (dados.motorista) {
        const novo = { placa: normalizarPlaca(veiculo.placa), modelo: veiculo.modelo.trim(), cor: veiculo.cor.trim(), capacidade: Number(veiculo.capacidade) };
        veiculoDe(u) ? atualizar("veiculos", veiculoDe(u).id, novo) : inserir("veiculos", { ...novo, motoristaId: u.id });
      }
      if (mudouTel) codigoTel = null;
      aviso0 = aviso("sucesso", "Perfil salvo.");
      desenhar();
    };

    const form = el("form", { novalidate: true, onsubmit: salvar },
      el("fieldset", {}, el("legend", {}, icone("usuario", { tamanho: 18 }), "Dados pessoais"),
        el("div", { class: "grade-campos" }, f.nome.no, f.curso.no, f.turno.no, f.genero.no, f.telefone.no, f.foto.no)),
      el("fieldset", {}, el("legend", {}, icone("escudo", { tamanho: 18 }), "Contato de emergência (opcional)"),
        el("p", { class: "nota" }, "Recebe o SMS do botão de emergência durante uma viagem."),
        el("div", { class: "grade-campos" }, f.contatoNome.no, f.contatoTel.no)),
      el("fieldset", {}, el("legend", {}, icone("rota", { tamanho: 18 }), "Como você vai usar o app?"),
        el("label", { class: "opcao", for: "passageiro" }, cPass, "Quero pegar carona (passageiro)"),
        el("label", { class: "opcao", for: "motorista" }, cMot, "Quero oferecer carona (motorista)"), ePapel),
      secMot,
      el("div", { class: "publicar" }, el("button", { type: "submit", class: "botao grande" }, comIcone("check", "Salvar perfil"))));

    return [
      cabecalhoTela({ titulo: "Perfil", descricao: "Seus dados aparecem para quem viaja com você. Tudo fica só neste navegador." }),
      aviso0,
      el("div", { class: "layout-perfil" },
        el("aside", { "aria-label": "Resumo do perfil" }, resumo(u, pend), blocoTelefone(u)),
        el("div", {}, form, blocoPrivacidade(u),
          el("div", { class: "sair" }, el("button", { type: "button", class: "botao secundario", onclick: () => { sair(); location.hash = "#/acesso"; } }, comIcone("sair", "Sair")))))
    ];
  }

  // Resumo: avatar, contato, papéis, situação do cadastro e reputação (US10: média visível no perfil).
  function resumo(u, pend) {
    const media = mediaDe(u.id, listar("avaliacoes"));
    return el("section", { class: "cartao perfil-topo", "aria-labelledby": "h-resumo" },
      avatar(u.nome || u.email, "xl"),
      el("h3", { id: "h-resumo" }, u.nome || "Seu nome"),
      el("p", { class: "nota" }, `Conectado como ${u.email}`),
      (u.curso || u.turno) && el("p", { class: "nota" }, [u.curso, u.turno].filter(Boolean).join(" · ")),
      el("p", { class: "selos" },
        u.passageiro && selo("Passageiro", "neutro", "usuario"), u.motorista && selo("Motorista", "neutro", "carro"),
        u.telefoneVerificado && selo("Telefone verificado (simulação)", "marca", "check")),
      el("p", { class: "reputacao" }, icone("estrela", { tamanho: 16 }), media ? `Sua reputação: ${textoMedia(media)}` : "Sua reputação: sem avaliações ainda"),
      pend.length ? aviso("alerta", `Falta completar: ${pend.join(", ")}.`) : aviso("sucesso", "Perfil completo."));
  }

  // Verificação do telefone por SMS/WhatsApp: SIMULADA (RF02).
  function blocoTelefone(u) {
    if (u.telefoneVerificado) return null; // o selo "Telefone verificado" no resumo já mostra
    if (!telefoneValido(u.telefone)) return null;
    if (!codigoTel) return el("div", { class: "linha-acoes" }, el("button", { type: "button", class: "botao secundario largo", onclick: () => { codigoTel = gerarCodigo(); desenhar(); } }, comIcone("telefone", "Verificar telefone (simulado)")));
    const c = campo({ id: "codigoTel", rotulo: "Código recebido no telefone", ajuda: "Digite o código de 6 dígitos.", autocomplete: "one-time-code" });
    return el("form", { class: "cartao", novalidate: true, onsubmit: (ev) => {
      ev.preventDefault();
      if (c.entrada.value.trim() !== codigoTel) { c.erro("Código incorreto."); c.entrada.focus(); return; }
      atualizar("usuarios", u.id, { telefoneVerificado: true }); codigoTel = null; aviso0 = aviso("sucesso", "Telefone verificado."); desenhar();
    } },
      el("div", { class: "codigo-simulado" }, selo("Simulado"), el("span", {}, `Código enviado para ${u.telefone}:`), el("output", {}, codigoTel)),
      c.no, el("button", { type: "submit", class: "botao largo" }, "Confirmar telefone"));
  }

  // Privacidade (RNF02, LGPD): consentimentos com data, download dos dados, revogação e exclusão com anonimização.
  function blocoPrivacidade(u) {
    const retorno = el("div", { tabindex: "-1" });
    const dizer = (no) => { retorno.replaceChildren(no); retorno.focus(); };
    const baixar = () => {
      const blob = new Blob([JSON.stringify(exportarDados(u.id), null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = el("a", { href: url, download: `fecha-bonde-meus-dados-${u.id}.json` });
      document.body.append(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      dizer(aviso("sucesso", "Arquivo com os seus dados gerado (formato JSON)."));
    };
    const revogar = async () => {
      if (!(await dialogoConfirmar({ titulo: "Revogar o aceite dos termos de convivência?", corpo: el("p", {}, "Suas solicitações atuais continuam valendo. Na próxima vez que pedir uma vaga, o app vai pedir o aceite de novo."), aceitar: "Revogar aceite", recusar: "Voltar" }))) return;
      revogarConvivencia(u.id);
      aviso0 = aviso("sucesso", "Aceite dos termos de convivência revogado.");
      desenhar();
    };
    const excluir = async () => {
      const ok = await dialogoConfirmar({ titulo: "Excluir sua conta?", variante: "perigo", aceitar: "Excluir minha conta", recusar: "Voltar", corpo: [
        el("p", {}, "Esta ação não pode ser desfeita. Vamos:"),
        el("ul", {},
          el("li", {}, "apagar seus dados pessoais (nome, e-mail, telefone, curso, contato de emergência, veículo e chave PIX);"),
          el("li", {}, "apagar seus avisos, alertas de emergência e as avaliações que você recebeu;"),
          el("li", {}, "trocar o texto das suas mensagens por “mensagem removida”;"),
          el("li", {}, "manter só o registro anônimo das viagens e pagamentos, porque fazem parte do histórico de outras pessoas.")),
        el("p", { class: "nota" }, "Dica: baixe seus dados antes, se quiser guardar uma cópia.")] });
      if (!ok) return;
      const r = excluirConta(u.id);
      if (!r.ok) return dizer(aviso("erro", r.motivo));
      location.hash = "#/acesso?excluida=1";
    };
    return el("section", { class: "cartao privacidade", "aria-labelledby": "h-privacidade" },
      el("h3", { id: "h-privacidade", class: "secao-titulo" }, icone("escudo", { tamanho: 20 }), "Privacidade e seus dados (LGPD)"),
      el("p", { class: "nota" }, u.termosUsoEm ? `Termos de uso aceitos em ${dataHora(u.termosUsoEm)}. ` : "",
        u.termosConvivenciaEm ? `Termos de convivência aceitos em ${dataHora(u.termosConvivenciaEm)}.` : "Termos de convivência ainda não aceitos (o aceite é pedido na primeira solicitação de vaga)."),
      el("p", { class: "nota" }, "Localização: lida quando você toca no botão de emergência (não é guardada) e, se você for motorista e escolher compartilhar o GPS, durante a viagem (só a última posição fica neste navegador e é apagada quando você para ou conclui). A permissão pode ser retirada nas configurações do navegador."),
      retorno,
      el("div", { class: "linha-acoes" },
        el("button", { type: "button", class: "botao secundario", onclick: baixar }, comIcone("baixar", "Baixar meus dados")),
        u.termosConvivenciaEm && el("button", { type: "button", class: "botao secundario", onclick: revogar }, "Revogar aceite de convivência"),
        el("button", { type: "button", class: "botao discreto perigo-texto", onclick: excluir }, comIcone("lixeira", "Excluir minha conta"))));
  }

  desenhar();
  return raiz;
}
