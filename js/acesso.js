import { el, aviso, selo, campo, comIcone, linkBotao } from "./componentes.js";
import { textoDominios, emailInstitucionalValido, senhaValida, normalizarEmail } from "./regras.js";
import { iniciarDesafio, confirmarDesafio, usuarioAtual, sair, pendenciasDe } from "./sessao.js";
import { pedirAceiteUso } from "./termos.js";

const NS = "http://www.w3.org/2000/svg";
const svg = (tag, attrs = {}) => { const n = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, String(v)); return n; };
const logo = () => {
  const s = svg("svg", { width: 30, height: 30, viewBox: "0 0 32 32", "aria-hidden": "true", focusable: "false" });
  s.append(svg("path", { d: "M6 24 C 6 14, 26 20, 26 8", fill: "none", stroke: "#e8a317", "stroke-width": "2.5", "stroke-dasharray": "3 3", "stroke-linecap": "round" }),
    svg("circle", { cx: 6, cy: 24, r: 4, fill: "#fff" }), svg("circle", { cx: 26, cy: 8, r: 4, fill: "#5cc3ba" }));
  return s;
};

// UC01: e-mail institucional + senha -> código (simulado) -> termos de uso -> perfil.
// Etapa 10: cartão central com os dois passos indicados; aviso de conta excluída (LGPD) quando vem do Perfil.
export function telaAcesso(params) {
  const raiz = el("div", { class: "acesso" });
  let etapa = "email", email = "", codigo = "", mensagem = params?.get?.("excluida") ? aviso("sucesso", "Sua conta foi excluída e seus dados pessoais foram apagados deste navegador.") : null;

  const passos = () => el("ol", { class: "passos", "aria-label": "Etapas do acesso" },
    el("li", { "aria-current": etapa === "email" ? "step" : null }, el("span", { class: "num" }, "1"), "E-mail"),
    el("li", { "aria-current": etapa === "codigo" ? "step" : null }, el("span", { class: "num" }, "2"), "Código"));

  const desenhar = () => {
    const u = usuarioAtual();
    const conteudo = u && etapa === "email" ? conectado(u) : etapa === "email" ? formEmail() : formCodigo();
    raiz.replaceChildren(el("section", { class: "cartao acesso-cartao", "aria-labelledby": "h-acesso" },
      el("div", { class: "acesso-topo" }, el("span", { class: "marca-logo" }, logo()),
        el("h2", { id: "h-acesso" }, "Acesso"),
        el("p", {}, "Entre com o seu e-mail institucional do UDF.")),
      ...[!(u && etapa === "email") && passos(), mensagem, conteudo].filter(Boolean))); // replaceChildren(null) escreveria "null" na tela
    mensagem = null;
  };

  function conectado(u) {
    return el("div", {}, aviso("info", `Você está conectado como ${u.email}.`),
      el("div", { class: "linha-acoes" },
        linkBotao("Ir para o perfil", "#/perfil", "", "usuario"),
        el("button", { type: "button", class: "botao secundario", onclick: () => { sair(); desenhar(); } }, comIcone("sair", "Sair"))));
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
      fE.no, fS.no, el("button", { type: "submit", class: "botao grande" }, comIcone("avancar", "Receber código")));
  }

  function formCodigo() {
    const fC = campo({ id: "codigo", rotulo: "Código de verificação", ajuda: "Digite o código de 6 dígitos.", autocomplete: "one-time-code", extra: { inputmode: "numeric" } });
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
      el("button", { type: "submit", class: "botao grande" }, comIcone("check", "Confirmar código")),
      el("div", { class: "linha-acoes" },
        el("button", { type: "button", class: "botao discreto", onclick: () => { etapa = "email"; desenhar(); } }, comIcone("voltar", "Usar outro e-mail"))));
  }

  desenhar();
  return raiz;
}
