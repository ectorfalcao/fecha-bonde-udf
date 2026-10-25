import { el, aviso, selo, campo } from "./componentes.js";
import { textoDominios, emailInstitucionalValido, senhaValida, normalizarEmail } from "./regras.js";
import { iniciarDesafio, confirmarDesafio, usuarioAtual, sair, pendenciasDe } from "./sessao.js";
import { pedirAceiteUso } from "./termos.js";

// UC01: e-mail institucional + senha -> código (simulado) -> termos de uso -> perfil.
export function telaAcesso() {
  const raiz = el("div");
  let etapa = "email", email = "", codigo = "", mensagem = null;

  const desenhar = () => {
    const u = usuarioAtual();
    raiz.replaceChildren(...[el("h2", {}, "Acesso"), mensagem, u && etapa === "email" ? conectado(u) : etapa === "email" ? formEmail() : formCodigo()].filter(Boolean)); // replaceChildren(null) escreveria "null" na tela
    mensagem = null;
  };

  function conectado(u) {
    return el("div", {}, aviso("info", `Você está conectado como ${u.email}.`),
      el("div", { class: "linha-acoes" },
        el("a", { class: "botao", href: "#/perfil" }, "Ir para o perfil"),
        el("button", { type: "button", class: "botao secundario", onclick: () => { sair(); desenhar(); } }, "Sair")));
  }

  function formEmail() {
    const fE = campo({ id: "email", rotulo: "E-mail institucional", tipo: "email", ajuda: `Aceitamos ${textoDominios()}.`, autocomplete: "username" });
    const fS = campo({ id: "senha", rotulo: "Senha", tipo: "password", ajuda: "Mínimo de 8 caracteres.", autocomplete: "current-password" });
    return el("form", { novalidate: true, onsubmit: (ev) => {
      ev.preventDefault();
      const eE = emailInstitucionalValido(fE.entrada.value) ? "" : `E-mail não institucional. Use um endereço ${textoDominios()}.`; // FA01
      const eS = senhaValida(fS.entrada.value) ? "" : "A senha precisa ter ao menos 8 caracteres.";
      fE.erro(eE); fS.erro(eS);
      if (eE || eS) { (eE ? fE : fS).entrada.focus(); return; }
      email = normalizarEmail(fE.entrada.value); codigo = iniciarDesafio(email); etapa = "codigo"; desenhar();
      raiz.querySelector("#codigo")?.focus();
    } },
      aviso("alerta", "Simulação: não há servidor. A senha é apenas validada (não é gravada) e o código de verificação aparece na tela."),
      fE.no, fS.no, el("button", { type: "submit", class: "botao" }, "Receber código"));
  }

  function formCodigo() {
    const fC = campo({ id: "codigo", rotulo: "Código de verificação", ajuda: "Digite o código de 6 dígitos.", autocomplete: "one-time-code" });
    return el("form", { novalidate: true, onsubmit: async (ev) => {
      ev.preventDefault();
      const r = confirmarDesafio(email, fC.entrada.value);
      if (!r.ok) { fC.erro(r.motivo); fC.entrada.focus(); return; }
      let u = r.usuario;
      if (!u.termosUsoEm) {
        u = await pedirAceiteUso(u);
        if (!u) { sair(); etapa = "email"; mensagem = aviso("erro", "Sem aceitar os termos de uso não é possível usar o aplicativo."); desenhar(); return; }
      }
      etapa = "email";
      location.hash = pendenciasDe(u).length ? "#/perfil" : "#/";
    } },
      el("div", { class: "codigo-simulado" }, selo("Simulado"), el("span", {}, `Código enviado para ${email}:`), el("output", {}, codigo)),
      fC.no,
      el("div", { class: "linha-acoes" },
        el("button", { type: "submit", class: "botao" }, "Confirmar código"),
        el("button", { type: "button", class: "botao secundario", onclick: () => { etapa = "email"; desenhar(); } }, "Usar outro e-mail")));
  }

  desenhar();
  return raiz;
}