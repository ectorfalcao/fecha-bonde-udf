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
Etapa 6 concluída: acesso e perfil (Etapa 5), **oferta de caronas** (RF04, RF05, RN04, RN05) e **busca com filtros** (RF06). Solicitações, lista de espera e cancelamento são da Etapa 7.
Veja `docs/matriz-rastreabilidade.md` e `docs/premissas.md`.

## Estrutura
- `css/`: `tokens.css` (identidade), `base.css`, `componentes.css`
- `js/`: `app.js` (rotas e navegação), `router.js`, `dados.js` (modelo e dados fictícios), `store.js` (persistência), `regras.js` e `caronas.js` (regras puras), `sessao.js`, `componentes.js`
- Telas: `inicio.js`, `acesso.js`, `perfil.js`, `buscar.js`, `oferecer.js`, `cartao.js` (cartão de carona), `termos.js`, `pendente.js`, `ambiente.js`
- `#/ambiente`: verificação do ambiente (tela da Etapa 3)

## Testes
`node --test tests/caronas.test.mjs`: regras de oferta, recorrência, filtros e dados fictícios (a interface é testada manualmente no navegador).
Os testes da Etapa 5 (`regras`, `modelo`) precisam ser recriados: os arquivos estão vazios ou ausentes.

## Dados fictícios
Mudar `VERSAO` em `js/dados.js` recarrega os dados de exemplo e apaga contas criadas em teste.