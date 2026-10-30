# Fecha Bonde UDF

Protótipo acadêmico de um sistema de caronas compartilhadas para a comunidade do UDF
(disciplina Análise e Projeto de Sistemas). Todos os dados são fictícios.

## Como executar
1. Abra a pasta no VS Code.
2. Instale a extensão **Live Server**.
3. Clique com o botão direito em `index.html` → **Open with Live Server**.

> Não abra o `index.html` com duplo clique: módulos JavaScript não funcionam em `file://`.
> Para a localização da emergência funcionar, use o endereço `localhost` (ou HTTPS), não o IP da rede.

Usuários de exemplo (qualquer senha com 8+ caracteres; o código de verificação aparece na tela):
`carlos.eduardo@`, `julia.santos@` e `mariana.costa@` + `aluno.udf.edu.br`.

## Status
Etapa 7 concluída: acesso e perfil (Etapa 5), oferta e busca de caronas (Etapa 6) e **solicitações, aprovação, lista de espera e cancelamento** (RF07, RF08, RF09, RN03, RN06), com avisos simulados dentro do app.

**Etapa 8 em andamento.**
- 8.0 concluída: suíte de testes recriada e defeitos corrigidos.
- 8.1 aprovada: **ciclo de vida da viagem** (`aberta → em andamento → concluída`), início pelo motorista (janela de 15 min, RN08), conclusão, **modo demonstração**.
- 8.2 concluída e aprovada: **botão de emergência** (RF15, RN11, US08) na tela *Viagem em andamento*: abre a discagem para o 190 e um SMS pré-preenchido para o contato do perfil. **Não aciona nenhum serviço sozinho.**
- 8.3 concluída: **chat de grupo condicionado** (RF10, RN07, US06, UC14): sala restrita e em tempo real para membros confirmados, com histórico cronológico e arquivamento automático após 2 horas da conclusão da viagem.
- Próximas: 8.3 chat, 8.4 mapa (simulado), 8.5 pagamento (simulado), 8.6 avaliação, 8.7 histórico.

Veja `docs/matriz-rastreabilidade.md` e `docs/premissas.md`.

## Estrutura
- `css/`: `tokens.css` (identidade), `base.css`, `componentes.css`
- `js/`: `app.js` (rotas, navegação e faixa de viagem), `router.js`, `dados.js` (modelo e dados fictícios), `store.js` (persistência), `regras.js`, `caronas.js`, `grupos.js`, `viagem.js`, `emergencia.js` e `chat.js` (regras puras), `solicitacoes.js`, `viagens.js`, `alertasEmergencia.js` e `mensagens.js` (operações), `notificacoes.js` (avisos simulados), `demo.js` (modo demonstração), `sessao.js`, `componentes.js`
- Telas: `inicio.js`, `acesso.js`, `perfil.js`, `buscar.js`, `oferecer.js`, `minhas.js` (Caronas), `viagemAtiva.js` (viagem e emergência), `chatTela.js` (chat do grupo), `cartao.js` (cartão de carona), `termos.js`, `ambiente.js`. `pendente.js` (placeholder) está sem uso no momento.
- `#/ambiente`: verificação do ambiente (tela da Etapa 3)

## Modo demonstração
Na tela **Caronas**, no fim da página, há a opção "Modo demonstração". Ligada, o motorista pode iniciar a viagem a qualquer momento (no uso normal, só a partir de 15 minutos antes da saída). Enquanto estiver ligada, o cabeçalho mostra "MODO DEMONSTRAÇÃO LIGADO". É uma ferramenta de teste, não uma funcionalidade do produto.

## Testes
```
node --test tests/*.test.mjs
```
Precisa do Node 20 ou superior. Nenhum pacote para instalar.
- `regras.test.mjs`: acesso (RN01), perfil (RN02), placa, telefone, capacidade (RN04).
- `caronas.test.mjs`: oferta, recorrência, filtros e dados fictícios (Etapa 6).
- `grupos.test.mjs`: solicitações, fila, aprovação, cancelamento, termos e avisos (Etapa 7).
- `viagem.test.mjs`: ciclo da viagem, janela de 15 min, modo demonstração (Etapa 8.1).
- `emergencia.test.mjs`: contato, links `tel:` e `sms:`, mensagem, localização simulada, tela da emergência (Etapa 8.2).
- `chat.test.mjs`: regras de acesso ao chat, permissões, arquivamento após 2h (RN07), envio e tela (Etapa 8.3).
- `telas.test.mjs`: renderiza as telas com um DOM falso (`dom-falso.mjs`, auxiliar) e simula os cliques. Também falha se aparecer "null", "undefined" ou "[object" no texto da tela. **Não substitui** o teste manual no navegador.

Os testes foram **recriados na Etapa 8.0**: os arquivos anteriores estavam vazios, então os resultados antigos não puderam ser reverificados. Não existe `modelo.test.mjs`.

## Dados fictícios
Mudar `VERSAO` em `js/dados.js` recarrega os dados de exemplo e apaga contas criadas em teste.