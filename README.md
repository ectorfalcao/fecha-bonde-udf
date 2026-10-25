# Fecha Bonde UDF

Protótipo acadêmico de um sistema de caronas compartilhadas para a comunidade do UDF
(disciplina Análise e Projeto de Sistemas). Todos os dados são fictícios.

## Como executar
1. Abra a pasta no VS Code.
2. Instale a extensão **Live Server**.
3. Clique com o botão direito em `index.html` → **Open with Live Server**.

> Não abra o `index.html` com duplo clique: módulos JavaScript não funcionam em `file://`.

Usuários de exemplo (qualquer senha com 8+ caracteres; o código de verificação aparece na tela):
`carlos.eduardo@`, `julia.santos@` e `mariana.costa@` + `aluno.udf.edu.br`.

## Status
Etapa 7 concluída: acesso e perfil (Etapa 5), oferta e busca de caronas (Etapa 6) e **solicitações, aprovação, lista de espera e cancelamento** (RF07, RF08, RF09, RN03, RN06), com avisos simulados dentro do app. Chat, mapa, pagamento, histórico, avaliação e emergência ainda não existem.
Veja `docs/matriz-rastreabilidade.md` e `docs/premissas.md`.

## Estrutura
- `css/`: `tokens.css` (identidade), `base.css`, `componentes.css`
- `js/`: `app.js` (rotas e navegação), `router.js`, `dados.js` (modelo e dados fictícios), `store.js` (persistência), `regras.js`, `caronas.js` e `grupos.js` (regras puras), `solicitacoes.js` (operações), `notificacoes.js` (avisos simulados), `sessao.js`, `componentes.js`
- Telas: `inicio.js`, `acesso.js`, `perfil.js`, `buscar.js`, `oferecer.js`, `minhas.js` (Caronas), `cartao.js` (cartão de carona), `termos.js`, `ambiente.js`. `pendente.js` (placeholder) está sem uso no momento.
- `#/ambiente`: verificação do ambiente (tela da Etapa 3)

## Testes
```
node --test tests/caronas.test.mjs tests/grupos.test.mjs tests/telas.test.mjs
```
- `caronas.test.mjs`: oferta, recorrência, filtros e dados fictícios (Etapa 6).
- `grupos.test.mjs`: solicitações, fila, aprovação, cancelamento, termos e avisos (Etapa 7).
- `telas.test.mjs`: renderiza as telas com um DOM falso (`dom-falso.mjs`, auxiliar) e simula os cliques. **Não substitui** o teste manual no navegador.

Os testes da Etapa 5 (`regras`, `modelo`) precisam ser recriados: os arquivos estão vazios ou ausentes.

## Dados fictícios
Mudar `VERSAO` em `js/dados.js` recarrega os dados de exemplo e apaga contas criadas em teste.