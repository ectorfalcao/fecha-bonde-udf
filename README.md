# Fecha Bonde UDF

Protótipo acadêmico de um sistema de caronas compartilhadas para a comunidade do UDF
(disciplina Análise e Projeto de Sistemas). Todos os dados são fictícios.

## Como executar
1. Abra a pasta no VS Code.
2. Instale a extensão **Live Server**.
3. Clique com o botão direito em `index.html` → **Open with Live Server**.

> Não abra o `index.html` com duplo clique: módulos JavaScript não funcionam em `file://`.

## Status
Etapa 4 concluída (casca do app, componentes, modelo de dados fictício). Nenhum requisito funcional está implementado ainda.
Veja `docs/matriz-rastreabilidade.md` e `docs/premissas.md`.

## Estrutura
- `css/`: `tokens.css` (identidade), `base.css`, `componentes.css`
- `js/`: `app.js` (rotas e navegação), `router.js`, `dados.js` (modelo e dados fictícios), `store.js` (persistência), `componentes.js`, e as telas `inicio.js`, `pendente.js`, `ambiente.js`
- `#/ambiente`: verificação do ambiente (tela da Etapa 3)

## Testes
`node --test tests/modelo.test.mjs` (modelo de dados e persistência; a interface é testada manualmente no navegador).