import { el, aviso, linkBotao, estadoVazio, dataHora } from "./componentes.js";
import { obter, listar } from "./dados.js";
import { usuarioAtual } from "./sessao.js";
import { podeAcessarChat, estadoDoChat, TAMANHO_MAX_MENSAGEM } from "./chat.js";
import { listarMensagens, enviarMensagem } from "./mensagens.js";
import { parametrosRota } from "./router.js";

const horaFormatada = (iso) =>
  new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(new Date(iso));

const rotaDe = (c) => `${c.origem} → ${c.destino}`;

// Tela do Chat de Grupo Condicionado (RF10, RN07, US06, UC14)
export function telaChat(params) {
  const u = usuarioAtual();
  const caronaId = params?.get("carona") || params?.get("id") || parametrosRota().get("carona") || parametrosRota().get("id");

  if (!caronaId) {
    return el("div", {},
      el("h2", {}, "Chat do grupo"),
      estadoVazio({
        titulo: "Nenhuma carona selecionada",
        texto: "Acesse o chat a partir da tela de Caronas ou da Viagem em andamento.",
        acao: linkBotao("Ir para Caronas", "#/caronas", "secundario")
      })
    );
  }

  const carona = obter("caronas", caronaId);
  if (!carona) {
    return el("div", {},
      el("h2", {}, "Chat do grupo"),
      aviso("erro", "Carona não encontrada no sistema."),
      linkBotao("Voltar para Caronas", "#/caronas", "secundario")
    );
  }

  // RF10: valida permissão de acesso
  const perm = podeAcessarChat({
    carona,
    usuarioId: u.id,
    solicitacoes: listar("solicitacoes")
  });

  if (!perm.ok) {
    return el("div", {},
      el("h2", {}, `Chat: ${rotaDe(carona)}`),
      aviso("alerta", perm.motivo),
      el("div", { class: "linha-acoes" },
        linkBotao("Voltar para Caronas", "#/caronas", "secundario")
      )
    );
  }

  const motorista = obter("usuarios", carona.motoristaId);
  const estado = estadoDoChat(carona);

  // Cabeçalho da carona
  const cabecalho = el("div", { class: "chat-cabecalho" },
    el("div", { class: "chat-info-carona" },
      el("h2", {}, `Chat: ${rotaDe(carona)}`),
      el("p", { class: "nota" },
        `Motorista: ${motorista?.nome ?? "—"} · Saída: ${dataHora(carona.dataHoraSaida)}`
      )
    ),
    el("div", { class: "chat-acoes-topo" },
      linkBotao("← Voltar para Caronas", "#/caronas", "secundario")
    )
  );

  // Avisos contextuais de estado (RN07)
  const avisoEstado = !estado.podeEnviar
    ? aviso(estado.status === "arquivado" ? "info" : "alerta", estado.motivo)
    : null;

  // Lista de mensagens
  const listaEl = el("ol", {
    class: "lista-mensagens",
    "aria-live": "polite",
    "aria-relevant": "additions",
    role: "log",
    tabindex: "0",
    "aria-label": `Mensagens do grupo da carona ${rotaDe(carona)}`
  });

  const areaMensagens = el("div", { class: "chat-area-mensagens" }, listaEl);

  function desenharMensagens() {
    const msgs = listarMensagens(carona.id);
    if (!msgs.length) {
      listaEl.replaceChildren(
        el("li", { class: "mensagem-vazia" },
          el("p", { class: "nota" }, "Nenhuma mensagem ainda. Combine o ponto de encontro e tire dúvidas aqui.")
        )
      );
      return;
    }

    const itens = msgs.map((m) => {
      const eMeu = m.remetenteId === u.id;
      const autor = obter("usuarios", m.remetenteId);
      const eMotoristaMsg = m.remetenteId === carona.motoristaId;

      const autorRotulo = eMeu
        ? "Você"
        : `${autor?.nome ?? "Membro"}${eMotoristaMsg ? " (Motorista)" : ""}`;

      return el("li", {
        class: `mensagem-item ${eMeu ? "mensagem-minha" : "mensagem-outro"}`
      },
        el("div", { class: "mensagem-meta" },
          el("span", { class: "mensagem-autor" }, autorRotulo),
          el("time", {
            class: "mensagem-hora",
            datetime: m.criadaEm
          }, horaFormatada(m.criadaEm))
        ),
        el("p", { class: "mensagem-texto" }, m.texto)
      );
    });

    listaEl.replaceChildren(...itens);
    // Rolagem suave para o final após atualização
    setTimeout(() => {
      areaMensagens.scrollTop = areaMensagens.scrollHeight;
    }, 0);
  }

  // Ouvinte reativo de mensagens
  const aoReceberMensagem = (ev) => {
    if (ev?.detail?.caronaId === carona.id) {
      desenharMensagens();
    }
  };
  globalThis.addEventListener?.("chat-mensagem", aoReceberMensagem);

  // Formulário de envio (se chat ativo)
  let formulario = null;
  if (estado.podeEnviar) {
    const retornoErro = el("p", { class: "campo-erro", hidden: true, "aria-live": "assertive" });
    const entrada = el("input", {
      type: "text",
      id: "chat-input",
      class: "chat-input",
      name: "mensagem",
      placeholder: "Digite uma mensagem para o grupo...",
      maxlength: String(TAMANHO_MAX_MENSAGEM),
      autocomplete: "off",
      required: true,
      "aria-label": "Mensagem para o grupo"
    });

    const btnEnviar = el("button", {
      type: "submit",
      class: "botao"
    }, "Enviar");

    formulario = el("form", {
      class: "form-chat",
      onsubmit: (ev) => {
        ev.preventDefault();
        retornoErro.hidden = true;
        const texto = entrada.value;
        const res = enviarMensagem({
          caronaId: carona.id,
          remetenteId: u.id,
          texto
        });

        if (!res.ok) {
          retornoErro.hidden = false;
          retornoErro.textContent = `✖ ${res.motivo}`;
          return;
        }

        entrada.value = "";
        desenharMensagens();
        entrada.focus();
      }
    },
      el("div", { class: "chat-campo-linha" }, entrada, btnEnviar),
      retornoErro
    );
  }

  desenharMensagens();

  const container = el("div", { class: "chat-container" },
    cabecalho,
    avisoEstado,
    areaMensagens,
    formulario
  );

  return container;
}
