# Matriz de rastreabilidade

Status: Pendente | Parcial | Implementado | Simulado

| Req. | Descrição | Tela/módulo | Status | Teste | Esperado | Obtido |
|---|---|---|---|---|---|---|
| RF01 | Autenticação institucional | Acesso | Simulado | a definir | | |
| RF02 | Perfil, CNH e veículo | Perfil | Parcial | manual (Etapa 6: perfil de motorista criado) | | |
| RF03 | Aceite dos termos | Buscar (diálogo) | **Parcial** (diálogo na 1ª solicitação, aceite gravado; textos provisórios) | `tests/grupos.test.mjs`, `tests/telas.test.mjs` + manual | Sem aceite não solicita; aceite fica registrado | OK (automatizado e manual) |
| RF04 | Criar carona | Oferecer | **Parcial** (mapa simulado por lista de locais) | `tests/caronas.test.mjs` + manual | Carona publicada aparece na busca | Confirmado manualmente |
| RF05 | Rotas recorrentes | Oferecer | **Parcial** (semanal, até 182 dias; sem calendário acadêmico) | `tests/caronas.test.mjs` | Uma carona por data nos dias escolhidos | Teste automatizado OK; tela não conferida em detalhe |
| RF06 | Busca e filtros | Buscar | **Parcial** (raio em linha reta; locais fixos) | `tests/caronas.test.mjs` + manual | Filtros de raio, turno, horário e "só mulheres" | Busca testada manualmente; cartões OK após correção |
| RF07 | Solicitações de entrada | Buscar / Caronas | **Implementado** (avisos simulados dentro do app; desde a 10.3, todos no sino do topo) | `tests/grupos.test.mjs`, `tests/telas.test.mjs` + manual | Solicita, motorista aprova ou recusa, vagas atualizam | OK (automatizado e manual) |
| RF08 | Lista de espera | Buscar / Caronas | **Implementado** (o 1º da fila vira "pendente"; o motorista ainda aprova) | `tests/grupos.test.mjs` + manual | Lotou: fila; vagou: próximo é chamado | OK (automatizado e manual) |
| RF09 | Cancelamento | Caronas | **Implementado** (motorista só com 2 h de antecedência: premissa) | `tests/grupos.test.mjs`, `tests/telas.test.mjs` + manual | Passageiro libera vaga; motorista avisa todos | OK (automatizado e manual) |
| RF10 | Chat condicionado | Chat | **Implementado** (sala em tempo real para membros confirmados; arquivamento em 2h; defeito de nova solicitação corrigido na 10.0) | `tests/chat.test.mjs` + manual | Troca de mensagens entre motorista e confirmados; bloqueio a terceiros | OK (automatizado; navegador com duas abas no teste de ponta a ponta) |
| RF11 | Mapa e rastreamento | Viagem | **Parcial** (Etapa 11: mapa real do OpenStreetMap, rota pelas ruas pelo OSRM e GPS do motorista compartilhado no mesmo navegador; sem servidor, não chega a outro aparelho; esquema SIMULADO como reserva sem internet) | `tests/mapa.test.mjs`, `tests/viagem.test.mjs`, `tests/emergencia.test.mjs` | Mapa real com rota e veículo; GPS do motorista quando houver | Automatizado OK; navegador OK, computador e celular (Etapa 11) |
| RF12 | Pagamento | Pagamento | **Simulado** (PIX fictício depois da viagem concluída; cartão indisponível; chave PIX fictícia cadastrada pelo motorista desde a 10.2) | `tests/pagamento.test.mjs` | Passageiro confirmado paga uma vez após a conclusão; motorista vê pago/pendente | Automatizado OK; navegador OK (teste de ponta a ponta) |
| RF13 | Histórico e extrato | Histórico | **Implementado** (extrato com valores simulados) | `tests/historico.test.mjs` | Todas as viagens concluídas da pessoa e totais pagos, a pagar, recebidos e a receber | Automatizado OK; navegador OK (teste de ponta a ponta) |
| RF14 | Avaliação mútua | Avaliação | **Implementado** (1 a 5 estrelas + comentário opcional; não bloqueia o uso, ver inconsistência 2; média no Perfil e na aprovação desde a 10.2) | `tests/avaliacao.test.mjs` | Após a conclusão, motorista e passageiros se avaliam uma vez; média aparece no cartão | Automatizado OK; navegador OK (teste de ponta a ponta) |
| RF15 | Botão de emergência | Viagem | **Parcial/Simulado** (abre discagem 190 e SMS pré-preenchido no aparelho; não aciona serviços) | `tests/emergencia.test.mjs` + manual | Botão visível na viagem em andamento; 190 e SMS com localização | Automatizado OK; navegador OK (teste de ponta a ponta) |
| RN03 | Aceite prévio dos termos de convivência | Buscar | **Implementado** | `tests/grupos.test.mjs` | Solicitação recusada sem aceite | OK (automatizado) |
| RN04 | Vagas <= capacidade do veículo (1 a 4) | Oferecer | **Implementado** (validação) | `tests/caronas.test.mjs` | Vagas acima do limite recusadas | OK (automatizado) |
| RN05 | Filtro "só para mulheres" | Oferecer/Buscar/Início | **Parcial** (regra para passageira em grupo exclusivo em aberto, ver D7; Início corrigido na 10.1) | `tests/caronas.test.mjs` | Grupo só aparece para usuárias femininas, e some se houver passageiro não feminino confirmado | OK (automatizado) |
| RN06 | Vagas automáticas e lista de espera | Caronas | **Implementado** | `tests/grupos.test.mjs` | Lotou: pendentes vão para a fila; vagou: o primeiro é chamado e avisado | OK (automatizado e manual) |
| RNF01 | HTTPS/AES-256 | n/a | Pendente (depende de backend) | n/a | | |
| RNF02 | LGPD | Perfil → Privacidade | **Parcial** (10.2: consentimentos com data, revogar aceite de convivência, baixar os dados, excluir a conta com anonimização; sem servidor, tudo só neste navegador) | `tests/privacidade.test.mjs` | Pessoa vê, baixa e apaga seus dados | Automatizado OK; navegador OK (10.2) |
| RNF03 | Restrição ao domínio UDF | Acesso | Parcial | a definir | | |
| RNF04 | Tela em até 1,5 s | Todas | Pendente (indicativo) | Lighthouse | | |
| RNF05 | Latência de 200 ms | Chat/Viagem | Pendente (só local) | a definir | | |
| RNF06 | RAM até 150 MB | Todas | Pendente (indicativo) | DevTools | | |
| RNF07 | Uptime de 99,9% | n/a | Pendente (infraestrutura) | n/a | | |
| RNF08 | Auto-scaling | n/a | Pendente (infraestrutura) | n/a | | |
| RNF09 | Até 3 cliques | Navegação | **Parcial** (por desenho: Buscar, Solicitar vaga e Aceitar termos = 3 toques na 1ª solicitação, 2 depois) | manual | ≤ 3 toques | Conferido no teste geral da equipe; sem medição formal |
| RNF10 | WCAG 2.1 AA | Todas | Parcial (rótulos, erros com símbolo, estado nunca só por cor, botões com nome acessível, foco visível, menos movimento e alto contraste do sistema; **contraste medido nas Etapas 9 e 10**) | Etapa 9: 16 pares. Etapa 10: 28 pares novos, todos AA (texto ≥ 4,5:1, contornos ≥ 3:1). Teclado: ordem e foco conferidos no navegador. Leitor de tela: a executar | Texto com contraste AA | Contraste OK; teclado OK (amostra) |
| RNF11 | Android/iOS | PWA | Pendente (parcial) | a definir | | |
| RNF12 | Cache offline | Viagem | Parcial (store.js; sem Service Worker; telefone do motorista na viagem desde a 10.2; sem ponto de encontro, ver inconsistência 9) | `tests/privacidade.test.mjs` (telefone) | Dados da carona ativa à mão | Telefone OK; offline não testado |

## Etapa 11: mapa real (RF11, RN08, US07; branch `etapa-11-mapa-real`)

| Item | Situação | Arquivos | Teste |
|---|---|---|---|
| Mapa real do OpenStreetMap (Leaflet 1.9.4, carregado sob demanda com verificação de integridade) na tela *Viagem em andamento* | Implementado | `mapaReal.js`, `mapa.js`, `componentes.css` | navegador (Node não carrega a biblioteca: teste garante que fica o esquema) |
| Rota pelas ruas (OSRM), guardada por par de locais; linha reta tracejada se o serviço falhar | Implementado | `rotas.js` | `tests/mapa.test.mjs` (buscador falso, sem rede) |
| Posição estimada andando pela rota, na proporção do tempo previsto | Implementado | `rotas.js` (`pontoNaRota`), `mapa.js` | `tests/mapa.test.mjs` |
| GPS do motorista por escolha (botão), última posição neste navegador, outras abas recebem; validade de 2 min; apagado ao parar, ao negar a permissão e ao concluir | Implementado | `posicoes.js`, `mapa.js`, `viagens.js` | `tests/mapa.test.mjs` |
| Mapa esquemático como reserva sem internet (RNF12), rotulado SIMULADO | Mantido | `mapa.js` | `tests/emergencia.test.mjs` |
| Coordenadas dos 10 locais conferidas no OpenStreetMap (campus: cerca de 3 km; Jardim Botânico: cerca de 1,8 km) | Corrigido | `caronas.js` | `tests/viagem.test.mjs` passou a ler as coordenadas da lista |
| Texto de privacidade do Perfil atualizado (GPS do motorista) | Corrigido | `perfil.js` | manual |
| Rastreamento entre aparelhos diferentes | **Não existe** (exige servidor; inconsistência 12) | n/a | n/a |

### Defeitos achados e corrigidos durante a parte
| # | Defeito | Como foi achado | Correção |
|---|---|---|---|
| 1 | A regra antiga `.mapa svg` (feita para o esquema) esticava a bandeira da atribuição do Leaflet e o ícone do botão de GPS | Navegador | regra restrita ao desenho esquemático (`.mapa-area > svg`) |
| 2 | O rótulo "UDF Campus Sede" era cortado na borda; afastar o enquadramento deixava o mapa pequeno no celular | Navegador (1280 e 375 px) | rótulos virados para dentro do mapa |

### Verificação
| Item | Resultado |
|---|---|
| `node --check` nos módulos novos e alterados | OK |
| Suíte completa `node --test tests/*.test.mjs` | 188/188 (12 novos em `mapa.test.mjs`) |
| Sensibilidade | os testes de GPS e de rota usam geolocalização e buscador falsos; o teste de concluir a viagem falharia sem `pararCompartilhamento` em `viagens.js` |
| Navegador, computador (1280 px) | Mapa real carregado, rota pelas ruas de 19,2 km (Águas Claras → UDF), marcadores e rótulos, carro na posição estimada; com uma posição de GPS gravada, o carro foi para ela com o anel e o círculo de precisão, e a legenda passou a dizer "pelo GPS do motorista" |
| Navegador, celular (375 px) | Mapa ocupa a largura, sem rolagem lateral; passageira (mesmo navegador) vê o GPS do motorista |
| GPS real do aparelho (permissão do navegador) e o mapa sem internet no navegador | **Não executado** (cobertos pelos testes com geolocalização falsa e pelo esquema em Node) |

### Limites conhecidos
- Sem servidor: o GPS do motorista só chega a outras abas do mesmo navegador.
- O servidor público do OSRM é de demonstração: pode ficar lento ou fora do ar. Nesse caso, linha reta.
- Os azulejos do OpenStreetMap precisam de internet; a rota guardada não basta para desenhar o mapa real offline.
- A chegada prevista continua sendo a estimativa do app, não o tempo do OSRM.

## Etapa 10: modernização da interface (branch `etapa-10-redesign`)

### Auditoria de requisitos (início da Etapa 10)
Comparação do código com os documentos "Documentação-fecha-bonde" e "RFs-RNFs-USs", antes do redesign.
Estados: Atendido (implementação e comportamento verificados), Parcial, Não atendido, Não verificável.

| Grupo | Atendido | Parcial | Não atendido | Não verificável |
|---|---|---|---|---|
| RF | RF03, RF07, RF08, RF09, RF13, RF14, RF15 | RF01, RF02, RF04, RF05, RF06, RF10 (defeito, corrigido na 10.0), RF11 (simulado), RF12 (simulado) | nenhum | nenhum |
| RNF | RNF09 (pessoa conectada) | RNF02, RNF03, RNF10, RNF11, RNF12 | RNF01 (sem backend) | RNF04, RNF05, RNF06, RNF07, RNF08 (dependem de rede, aparelho ou infraestrutura) |
| RN | RN01, RN02, RN03, RN04, RN06, RN07, RN11 | RN05 (Início, corrigido na 10.1), RN08, RN10 | RN09 (decisão do grupo), RN12 | nenhum |
| US | US01, US02, US05, US08 | US03, US04, US06, US07, US09, US10 | nenhum | nenhum |

Medições locais (não substituem 4G nem produção): carregamento de 416 ms em `localhost`, cerca de 220 KB transferidos, 1,6 MB de memória JS.

### Entregue
| Parte | Item | Arquivos | Teste |
|---|---|---|---|
| 10.0 | **Defeito corrigido:** quem cancelava e pedia vaga de novo, e era confirmado, ficava sem chat (RF10) e sem pagamento (RF12): as regras olhavam só a primeira solicitação (a cancelada). `solicitacaoVigente()` escolhe a confirmada, depois a ativa, depois a mais recente | `grupos.js`, `chat.js`, `pagamento.js` | `grupos`, `chat`, `pagamento` (3 testes; falham com o código antigo) |
| 10.1 | **RN05 no Início:** carona "só para mulheres" não aparece para quem não é do gênero feminino nem para visitante (`visivelPara()`, a mesma regra da busca) | `caronas.js`, `inicio.js` | `telas` (falha com o código antigo) |
| 10.2 | **Redesign:** tokens com escalas, elevação em camadas, realce de superfície, movimento e camadas; ícones SVG próprios; topo fixo com navegação no computador e barra inferior com ícones no celular; componentes novos (avatar, cabeçalho de tela, fatos, selo de situação, botão de ícone com contador, base única de diálogos); todas as telas recompostas | `css/*`, `index.html`, `icones.js`, `componentes.js`, telas | suíte inteira |
| 10.2 | **Privacidade (RNF02):** consentimentos com data, baixar os dados (JSON), revogar o aceite de convivência, excluir a conta com anonimização | `privacidade.js`, `contas.js`, `perfil.js`, `acesso.js` | `privacidade` |
| 10.2 | **Reputação (US10):** média no próprio Perfil e na lista de quem pede vaga | `perfil.js`, `minhas.js` | `privacidade` |
| 10.2 | **Chave PIX fictícia (RF12):** cadastrada pelo motorista no Perfil e mostrada no pagamento | `regras.js`, `perfil.js`, `pagamentoTela.js` | `privacidade` |
| 10.2 | **Telefone do motorista (RNF12)** na viagem em andamento, para o passageiro confirmado | `viagemAtiva.js` | `privacidade` |
| 10.2 | Rodapé com a disciplina **Projeto de Software** | `index.html` | manual |
| 10.3 | **Centro de notificações:** todas as notificações no **sino** do topo, com o número de não lidas; a caixa mostra as **não lidas em cima** e as **lidas embaixo**; marcar uma ou todas como lidas. Saíram a seção Avisos de Caronas e o contador da navegação | `centroNotificacoes.js`, `avisos.js`, `notificacoes.js`, `app.js`, `minhas.js` | `notificacoes` (8 testes) |

### Defeitos achados e corrigidos durante a etapa
| # | Defeito | Como foi achado | Correção |
|---|---|---|---|
| 1 | Chat e pagamento negados depois de uma nova solicitação | Leitura do código na auditoria, confirmado com teste isolado | 10.0 |
| 2 | Caronas "só para mulheres" visíveis no Início para qualquer pessoa | Navegador (conectado como Carlos) | 10.1 |
| 3 | Ao trocar de tela, o título ficava escondido sob o topo fixo | Navegador | `router.js`: foco sem rolar e a tela nova começa do alto |
| 4 | Na tela Acesso com parâmetro (`?excluida=1`) aparecia o botão "Entrar" e o topo estourava a largura do celular | Medição de largura no navegador (375 px) | `app.js` compara a rota sem parâmetros; o topo encolhe em telas estreitas |
| 5 | Ao marcar uma notificação como lida, a caixa rolava sozinha | Navegador | foco sem rolar |

### Verificação
| Item | Resultado |
|---|---|
| `node --check` em todos os módulos | OK |
| Suíte completa `node --test tests/*.test.mjs` | 176/176 (eram 149 no início da etapa) |
| Testes ajustados (só o seletor) | `avaliacao.test.mjs`: o botão "⭐ Avaliar" virou "Avaliar" (ícone no lugar do emoji); `emergencia.test.mjs`: o SVG do mapa é buscado dentro da figura (os botões também têm SVG); `telas.test.mjs` (RF07): o aviso é conferido no centro de notificações |
| Navegador, computador (1280 px) | Login, Início, Buscar, Oferecer, Caronas, iniciar viagem (modo demonstração), emergência, chat (envio), concluir, avaliar, pagar, histórico, perfil, exclusão de conta e sino: OK, console sem erros |
| Navegador, tablet (768 px) e celular (375 px) | Sem rolagem lateral; barra inferior com ícones; diálogos sobem de baixo no celular |
| Teclado | Pular para o conteúdo, marca, navegação e sino em ordem; anel de foco visível; Esc fecha a caixa e o foco volta ao sino |
| Contraste | 28 pares novos medidos, todos AA |
| Leitor de tela, celular real (discagem, SMS, localização), conexão 4G | **Não executado** |

### Limites conhecidos
- Sem servidor: exclusão, download e notificações valem só para este navegador.
- A exclusão é bloqueada enquanto houver carona em curso (aberta ou em andamento) como motorista ou passageiro.
- A caixa de notificações mostra até 30 lidas (as mais recentes); as mais antigas continuam guardadas.
- Abrir a caixa não marca nada como lido: a pessoa escolhe marcar uma ou todas.

## Teste de ponta a ponta no navegador (fim da Etapa 8)

Executado com o **playwright-cli** (Edge real, controlado por script), partindo de dados fictícios limpos: 34 verificações, **34 OK**, console sem erros.

| Fluxo | O que foi conferido |
|---|---|
| Viagem (8.1) | Carlos liga o modo demonstração e inicia a c1; a faixa "viagem em andamento" aparece nas outras telas |
| Mapa (8.4) | Mapa SVG visível, rotulado SIMULADO, com chegada prevista; botão de emergência antes do mapa |
| Chat (8.3 + correção) | Entra e sai do chat 3 vezes; a mensagem enviada aparece na aba e **chega sozinha numa segunda aba** |
| Avaliação (8.6) | Ao concluir, o motorista vai direto para a avaliação; sem nota dá erro; Carlos avalia Júlia (5); Júlia avalia Carlos (4, com comentário); aviso sem revelar a nota; média ★ 5,0 aparece |
| Pagamento (8.5) | Júlia recebe o aviso de conclusão, vê "Pendente", cartão indisponível, código fictício, simula e recebe o recibo; Carlos é avisado e vê "✔ Pago" |
| Histórico (8.7) | Extrato da Júlia: pagou R$ 7,50, deve R$ 0,00; do Carlos: recebeu R$ 7,50 |
| Celular (375 px) | Caronas, Histórico, Buscar, Avaliação e Viagem sem rolagem lateral; botões com pelo menos 44 px de altura; mapa visível |

**Observações visuais para o refinamento (não são defeitos de fluxo):** no celular o mapa sobra espaço vazio quando a rota é quase horizontal; a chave e o código PIX aparecem sem o estilo de cartão; "Caronas (2)" quebra em duas linhas na barra inferior.

**Não coberto:** discagem 190 e SMS reais (exigem celular), permissão de localização, leitor de tela e medição de contraste.

## Etapa 8.7: histórico e extrato (RF13)

| Item | Situação | Arquivos | Teste |
|---|---|---|---|
| Tela **Histórico e extrato** (`#/historico`): todas as viagens concluídas em que a pessoa foi motorista ou passageira confirmada, da mais recente para a mais antiga | Implementado | `historico.js` (`historicoDe`), `historicoTela.js`, `app.js` | `tests/historico.test.mjs` |
| Extrato simulado: você pagou, ainda deve, recebeu e a receber; caronas gratuitas fora | Implementado | `historico.js` (`extratoDe`) | idem |
| Cada viagem com pagamento, avaliação e ações pendentes (Pagar, Avaliar, Ver chat): é o "avaliar depois pelo Histórico" da premissa da Etapa 8 | Implementado | `historicoTela.js` (`cartaoViagemConcluida`) | idem, `tests/pagamento.test.mjs`, `tests/avaliacao.test.mjs` |
| Caronas mostra só as 3 viagens concluídas mais recentes, com link para o histórico (antes: 10, provisório) | Implementado | `minhas.js` | `tests/historico.test.mjs` |

### Verificação
| Item | Resultado |
|---|---|
| `node --check` em todos os módulos | OK |
| Suíte completa `node --test tests/*.test.mjs` | 145/145 |
| Sensibilidade: incluí viagens canceladas no histórico e contei valor recebido como pago | A suíte falhou nos dois casos |
| Navegador: tela abre (usuário sem viagens concluídas) e todos os módulos carregam sem erros no console | OK |
| Histórico com viagens e extrato com valores no navegador | **Pendente (roteiro entregue)** |

### Limites conhecidos
- Canceladas não aparecem: o histórico é de viagens feitas. Não há filtro por período nem exportação do extrato.
- Valores são simulados e só deste navegador.

## Etapa 8.6: avaliação mútua (RF14, RN10, US10)

| Item | Situação | Arquivos | Teste |
|---|---|---|---|
| Quem avalia quem: motorista avalia cada passageiro; passageiro avalia o motorista e, opcionalmente, os colegas | Implementado | `avaliacao.js` (`quemAvaliar`) | `tests/avaliacao.test.mjs` |
| Só depois da conclusão, só entre quem viajou, ninguém se avalia, uma avaliação por pessoa e viagem | Implementado | `avaliacao.js` (`podeAvaliar`) | idem |
| Nota de 1 a 5 e comentário opcional (até 300 caracteres) | Implementado | `avaliacao.js` (`validarAvaliacao`) | idem |
| Tela **Avaliação** (`#/avaliacao?carona=...`); o motorista vai direto para ela ao concluir uma viagem com passageiros | Implementado | `avaliacaoTela.js`, `minhas.js`, `app.js` | idem |
| Aviso a quem foi avaliado, sem revelar nota nem autor | Implementado | `avaliacoes.js` | idem |
| Média só com avaliações feitas ("sem avaliações" quando não há nenhuma), exibida no cartão da busca e na tela de avaliação | Implementado | `avaliacao.js` (`mediaDe`), `cartao.js` | idem |
| Situação "Avaliação: pendente/feita" e botão "⭐ Avaliar" em Caronas → Viagens concluídas | Implementado | `minhas.js` | idem |

### Defeito achado e corrigido durante a parte
| # | Defeito | Como foi achado | Correção |
|---|---|---|---|
| 1 | Plural errado na média ("2 avaliaçãoões") | Teste automatizado | `avaliacao.js`: `textoMedia` escolhe a palavra inteira |

### Verificação
| Item | Resultado |
|---|---|
| `node --check` em todos os módulos | OK |
| Suíte completa `node --test tests/*.test.mjs` | 140/140 |
| Sensibilidade: deixei avaliar a si mesmo, avaliar antes da conclusão e misturar notas de outras pessoas na média | A suíte falhou nos três casos |
| Navegador: app carrega com os módulos novos, sem erros no console | OK |
| Fluxo completo no navegador (concluir, avaliar como motorista e como passageira, média no cartão) | **Pendente (roteiro entregue)** |

### Limites conhecidos
- A avaliação **não é obrigatória** na prática (RN10 diz "obrigatória"): fica pendente e não bloqueia nada. Ver inconsistência 2.
- Não dá para editar nem apagar uma avaliação enviada.
- Sem servidor, a média só considera avaliações feitas neste navegador.

## Etapa 8.5: pagamento simulado (RF12)

| Item | Situação | Arquivos | Teste |
|---|---|---|---|
| Pagamento liberado só depois da viagem concluída, só para passageiro confirmado, só em carona com valor | Implementado | `pagamento.js` (`podePagar`) | `tests/pagamento.test.mjs` |
| Tela **Pagamento** (`#/pagamento?carona=...`): PIX fictício (chave e código claramente falsos), cartão visível mas indisponível, aviso de simulação | Implementado | `pagamentoTela.js`, `app.js` | idem |
| Registro do pagamento (coleção `pagamentos`) e aviso ao motorista; não paga duas vezes | Implementado | `pagamentos.js` | idem |
| Pendências derivadas (não gravadas): motorista vê quem pagou; passageiro vê "Pendente" e o botão Pagar em Caronas | Implementado | `pagamento.js` (`situacaoPagamentos`), `minhas.js` | idem |
| Aviso de conclusão lembra o pagamento (só se a carona não for gratuita) | Implementado | `viagens.js` | idem |
| Cobrança real, PIX válido, cartão, estorno | **Não existe** (fora do protótipo; decisão do grupo) | n/a | n/a |

### Verificação
| Item | Resultado |
|---|---|
| `node --check` em todos os módulos | OK |
| Suíte completa `node --test tests/*.test.mjs` | 130/130 |
| Sensibilidade: liberei o pagamento antes da conclusão e habilitei o cartão | A suíte falhou nos dois casos |
| Navegador: app carrega com os módulos novos, sem erros no console | OK |
| Fluxo completo no navegador (concluir, pagar como passageira, ver como motorista) | **Pendente (roteiro entregue)** |

### Limites conhecidos
- Nada é cobrado: o botão só registra que o pagamento foi "feito".
- O motorista não confirma o recebimento; o registro do passageiro basta (não há como conferir um PIX fictício).
- Pagamento pendente não bloqueia nada: o passageiro pode continuar usando o app.

## Etapa 8.4: mapa da viagem (RF11, SIMULADO)

| Item | Situação | Arquivos | Teste |
|---|---|---|---|
| Mapa esquemático (SVG, sem biblioteca) com partida, destino, rota e veículo na tela *Viagem em andamento* | Implementado | `mapa.js`, `viagemAtiva.js`, `componentes.css` | `tests/emergencia.test.mjs` |
| Posição do veículo estimada pelo tempo desde o início (`posicaoSimulada`), presa entre origem e destino | Implementado | `viagem.js` | `tests/viagem.test.mjs` |
| Rótulo "SIMULADO" no desenho e na legenda; legenda em texto com % do trajeto e chegada prevista (o desenho é decorativo para leitor de tela) | Implementado | `mapa.js` | `tests/emergencia.test.mjs` |
| Atualização automática a cada 15 s enquanto a tela está aberta | Implementado | `mapa.js` | só no navegador |
| Botão de emergência continua antes do mapa (RN11) | Implementado | `viagemAtiva.js` | `tests/emergencia.test.mjs` |
| GPS real, rota pelas ruas, posição compartilhada entre aparelhos | **Não existe** (exige backend e serviço de mapas) | n/a | n/a |

### Verificação
| Item | Resultado |
|---|---|
| `node --check` em todos os módulos | OK |
| Suíte completa `node --test tests/*.test.mjs` | 120/120 |
| Sensibilidade: tirei o limite de 0 a 100% da posição e removi o mapa da tela | A suíte falhou nos dois casos |
| Navegador (servidor local, desktop): viagem iniciada em modo demonstração, mapa desenhado, sem erros no console | OK |
| Celular real, leitor de tela, contraste do desenho | **Não executado** |

### Limites conhecidos
- A posição é uma **estimativa pelo relógio**, em linha reta: não mostra onde o carro realmente está.
- Só funciona para os 10 locais da lista do protótipo.
- O passageiro e o motorista veem a mesma estimativa porque ela é calculada em cada aparelho, não porque a posição é compartilhada.

## Etapa 8.3: chat de grupo condicionado (RF10, RN07, US06, UC14)

| Item | Situação | Arquivos | Teste |
|---|---|---|---|
| Tela **Chat do grupo** (`#/chat?carona=...`) com histórico cronológico de mensagens | Implementado | `chatTela.js`, `router.js`, `app.js` | `tests/chat.test.mjs` |
| Acesso restrito a membros confirmados (motorista e passageiras/os confirmados) | Implementado | `chat.js` (`podeAcessarChat`), `mensagens.js` | `tests/chat.test.mjs` |
| Bloqueio explícito para solicitações pendentes, espera e terceiros com aviso explicativo | Implementado | `chat.js`, `chatTela.js` | `tests/chat.test.mjs` |
| Arquivamento e desativação de novas mensagens 2 horas após o encerramento da viagem (RN07) | Implementado | `chat.js` (`estadoDoChat`), `chatTela.js` | `tests/chat.test.mjs` |
| Envio de mensagens com validação de texto (até 500 caracteres, sem nós vazios) e autor identificado | Implementado | `chat.js`, `mensagens.js`, `chatTela.js` | `tests/chat.test.mjs` |
| Sincronização e reatividade (CustomEvent e BroadcastChannel entre abas) | Implementado | `mensagens.js`, `chatTela.js` | `tests/chat.test.mjs` |
| Botão "💬 Chat do grupo" na tela Caronas e na tela Viagem em andamento | Implementado | `minhas.js`, `viagemAtiva.js` | `tests/chat.test.mjs`, `tests/telas.test.mjs` |
| Acessibilidade: anúncio via `role="log"` e `aria-live="polite"`, rótulos WCAG 2.1 AA | Implementado | `chatTela.js`, `componentes.css` | `tests/chat.test.mjs` |

### Verificação (Node; testes automatizados)
| Item | Resultado |
|---|---|
| Sintaxe e testes automatizados | 115/115 testes passando (`tests/chat.test.mjs`: 16/16) |
| Regressão das etapas 5 a 8.2 | 0 regressões detectadas |

### Defeito achado e corrigido depois da parte (revisão na Etapa 8.4)
| # | Defeito | Como foi achado | Correção |
|---|---|---|---|
| 1 | Cada visita ao chat registrava um ouvinte global `chat-mensagem` que nunca era removido: as telas antigas continuavam sendo redesenhadas fora da página (memória e processamento desperdiçados) | Leitura do código no diagnóstico | `chatTela.js`: troca o ouvinte da visita anterior e o remove quando a tela sai; teste novo em `tests/chat.test.mjs` (falha com o código antigo) |

## Etapa 8.2: botão de emergência (RF15, RN11, US08, UC04)

| Item | Situação | Arquivos | Teste |
|---|---|---|---|
| Tela **Viagem em andamento** (`#/viagem`) com o botão 🚨 Emergência no topo do cartão | Implementado | `viagemAtiva.js`, `app.js` | `tests/emergencia.test.mjs` |
| Botão só para quem participa da viagem (motorista e passageira **confirmada**) | Implementado | `viagem.js` (`viagensAtivasDe`) | idem |
| Faixa "Você tem uma viagem em andamento" em todas as telas, com atalho para a viagem | Implementado | `app.js`, `viagens.js`, `sessao.js` | só no navegador |
| Ligar para a polícia: link `tel:190` | Implementado (abre a discagem do aparelho) | `emergencia.js`, `viagemAtiva.js` | idem |
| SMS ao contato de emergência do perfil, com texto pronto e link de mapa com a localização | Implementado (abre o app de SMS do aparelho; a pessoa envia) | `emergencia.js`, `alertasEmergencia.js` | idem |
| Localização pedida ao navegador só se houver contato; se negada, o SMS segue sem ela | Implementado | `alertasEmergencia.js` | idem |
| Registro da tentativa (tipo, carona, horário, se havia localização; **sem coordenadas**) | Implementado | `alertasEmergencia.js` | idem |
| Despacho automático, SMS enviado sozinho, confirmação de atendimento, localização contínua em tempo real | **Não existe** (exigem backend e serviços externos) | n/a | n/a |

### Defeito achado e corrigido durante a parte
| # | Defeito | Como foi achado | Correção |
|---|---|---|---|
| 1 | No diálogo sem contato cadastrado aparecia `[object HTMLElement]` (lista aninhada em `el()`) | Teste de tela (detector de lixo de texto) | `viagemAtiva.js`: spread da lista |

### Verificação (Node 22; testes automatizados, sem navegador)
| Item | Resultado |
|---|---|
| `node --check` em todos os módulos e testes | OK |
| Suíte completa `node --test tests/*.test.mjs` | 103/103 |
| Sensibilidade: troquei o número 190, desliguei o pedido de localização, gravei coordenadas, deixei pendente ver o botão | A suíte falhou nos quatro casos |
| Navegador real, celular (discagem e SMS reais), permissão de localização, leitor de tela | **Não executado (roteiro entregue)** |

### Limites conhecidos
- O app **não sabe** se a ligação ou o SMS aconteceu: só abre a discagem e o aplicativo de mensagens. A interface diz isso.
- A localização é uma **foto** do momento do toque, não acompanhamento em tempo real.
- `geolocation` só funciona em `localhost` ou HTTPS. Abrindo o Live Server por IP na rede (http://192.168...), a localização falha e o SMS segue sem ela.
- `tel:` e `sms:` dependem do aparelho: em computador sem aplicativo de telefonia, nada abre.
- Só há um contato de emergência por perfil (D8); o RF15 fala em "contatos".

## Etapa 8.1: ciclo de vida da viagem (base de RF10 a RF15; RN08 parcial)

Não é um requisito funcional do documento: é a base necessária para chat (RF10), mapa (RF11), pagamento (RF12), histórico (RF13), avaliação (RF14) e emergência (RF15), que dependem de "viagem ativa". Apoio: diagrama de atividades ("Executar viagem", "Finalizar corrida") e diagrama de objetos (`EmAndamento`).

| Item | Situação | Arquivos | Teste |
|---|---|---|---|
| Estados `aberta → em_andamento → concluida` | Implementado | `viagem.js` (regras), `viagens.js` (operações) | `tests/viagem.test.mjs` |
| Início pelo motorista a partir de 15 min antes (RN08) | Implementado | `viagem.js`, `minhas.js` | `tests/viagem.test.mjs`, `tests/telas.test.mjs` |
| Conclusão pelo motorista, com aviso aos passageiros | Implementado | `viagens.js`, `minhas.js` | idem |
| Pendentes e lista de espera encerrados ao iniciar | Implementado (premissa nova) | `viagem.js`, `viagens.js` | idem |
| Sem cancelar, aprovar, recusar ou solicitar durante a viagem | Implementado | `solicitacoes.js`, `grupos.js` | `tests/viagem.test.mjs` |
| Modo demonstração (ferramenta de teste, selo no cabeçalho) | Implementado | `demo.js`, `minhas.js`, `app.js` | `tests/viagem.test.mjs`, `tests/telas.test.mjs` (o selo do cabeçalho só no navegador) |
| Viagens concluídas na tela Caronas (10 mais recentes) | Provisório até a 8.7 | `minhas.js` | `tests/telas.test.mjs` |

### Verificação (Node 22; testes automatizados, sem navegador)
| Item | Resultado |
|---|---|
| `node --check` em todos os módulos e testes | OK |
| Suíte completa `node --test tests/*.test.mjs` | 88/88 |
| Sensibilidade: quebrei de propósito a janela de 15 min, o encerramento da lista de espera, o bloqueio de cancelar durante a viagem e o registro do modo demonstração | A suíte falhou nos quatro casos |
| Teste manual no navegador | **Pendente (roteiro entregue)** |

### Limites conhecidos
- A viagem é iniciada e concluída por um toque do motorista: não há GPS nem confirmação de chegada.
- Uma carona `aberta` cujo horário já passou e que nunca foi iniciada continua na tela do motorista (com aviso), sem expirar sozinha.
- Sem servidor, o passageiro só vê o estado da viagem ao abrir ou recarregar a tela Caronas.

## Etapa 8.0: rede de testes e correções (antes de RF10 a RF15)

### Achados do diagnóstico
- `caronas.test`, `grupos_test.mjs`, `regras_test.mjs` e `telas_test.mjs` estavam **vazios (0 bytes)**; `dom-falso.mjs` não existia. Os resultados anteriores (18/18, 21/21, 21/21, 3/3) **não puderam ser reverificados** e passam a ser tratados como não comprovados.
- A carona só tinha os estados `aberta` e `cancelada` (sem "em andamento" nem "concluída"): tratado na 8.1.

### Defeitos encontrados e corrigidos
| # | Defeito | Como foi achado | Correção |
|---|---|---|---|
| 1 | Início listava caronas canceladas e vencidas | Teste de tela `Início` (falhou antes da correção) | `inicio.js`: só `aberta` e saída futura; mensagem se não houver nenhuma |
| 2 | `replaceChildren(..., null)` escreve a palavra "null" na tela (Acesso, Perfil e Oferecer) | Teste de tela, com DOM falso que imita o navegador (falhou antes da correção) | `acesso.js`, `perfil.js`, `oferecer.js`: `.filter(Boolean)`. **Conferir no navegador** se a palavra "null" aparecia nessas telas |
| 3 | Comentário de `termos.js` dizia que o diálogo de convivência não estava ligado | Leitura do código | Comentário corrigido |

### Verificação (Node 22; testes automatizados, sem navegador)
| Item | Como | Resultado |
|---|---|---|
| Sintaxe dos 21 módulos e dos arquivos de teste | `node --check` | OK |
| Regras de acesso e perfil | `tests/regras.test.mjs` | 13/13 |
| Oferta, recorrência, filtros e dados fictícios | `tests/caronas.test.mjs` | 20/20 |
| Grupos, fila, aprovação, cancelamento, termos e avisos | `tests/grupos.test.mjs` | 21/21 |
| Telas (solicitar, termos, aprovar, avisos, cancelar, sem texto indevido) | `tests/telas.test.mjs` | 12/12 |
| Sensibilidade da suíte | Quebrei de propósito `statusInicial` e `aprovar`: a suíte falhou nos dois casos | OK |
| Teclado, leitor de tela, contraste, responsividade, navegador real | **Não executado** | Pendente |

Observação: um teste meu passou sem ter força (regex com `\b` em texto sem espaços) e foi corrigido antes da entrega.

## Etapa 7: grupos, solicitações, lista de espera e cancelamento (RF07, RF08, RF09; RN03, RN06)

### Entregue
- Botão "Solicitar vaga" (ou "Entrar na lista de espera") na busca; diálogo dos termos de convivência na 1ª solicitação.
- Tela **Caronas**: passageiro acompanha situação e posição na fila e cancela; motorista aprova, recusa e cancela a carona.
- Avisos simulados dentro do app, com contador no item "Caronas" da navegação.
- Regras puras em `js/grupos.js`; operações em `js/solicitacoes.js`; avisos em `js/notificacoes.js`; tela em `js/minhas.js`.

### Defeitos encontrados e corrigidos durante a etapa
| # | Defeito | Como foi achado | Correção |
|---|---|---|---|
| 1 | Avisos gerados no mesmo milissegundo apareciam do mais antigo para o mais novo | Teste automatizado | `notificacoes.js`: empate mostra o mais recente primeiro |
| 2 | Mensagem de solicitação poderia escrever "false" na tela | Revisão antes da entrega | `buscar.js`: `dizer()` ignora valores falsos |
| 3 | Botões Aprovar/Recusar ficavam em posições diferentes conforme o tamanho do nome | Teste manual (captura de tela) | `componentes.css`: nome em cima, botões embaixo, em todos os itens |
| 4 | `favicon.ico` com erro 404 no console | Teste manual | `index.html`: ícone embutido |

### Verificação
| Item | Como | Resultado |
|---|---|---|
| Sintaxe dos 21 módulos | `node --check` | OK |
| Regras da Etapa 6 | `tests/caronas.test.mjs` | 21/21 |
| Regras e fluxos da Etapa 7 (fila, promoção, recusa, permissões, termos, RN05, cancelamento, avisos) | `tests/grupos.test.mjs` | 21/21 |
| Telas renderizadas com DOM falso (solicitar, aprovar, avisos, cancelar; bug de `[object HTMLElement]` provado detectável) | `tests/telas.test.mjs` | 3/3 |
| Fluxo completo no navegador (Live Server) | Manual, integrante da equipe | Funcionando, após as correções 3 e 4 |
| Teclado, leitor de tela, contraste, responsividade | **Não executado** | Pendente |

Observação: `tests/dom-falso.mjs` é um DOM mínimo só para testes em Node; não substitui o navegador.

### Limites conhecidos
- Avisos são simulados (sem push, e-mail ou SMS) e só aparecem para o usuário ao abrir o app.
- Sem servidor: dois usuários só "se falam" no mesmo navegador, trocando de conta.
- A tela Início ainda lista as caronas "só para mulheres" a todos. *Resolvido na Etapa 10.1.*
- Caronas fictícias têm datas relativas e vencem em poucos dias.
- Nada impede que a mesma passageira esteja em duas caronas no mesmo horário.

## Etapa 6: oferta e busca de caronas (RF04, RF05, RF06, RN04, RN05)

### Defeitos encontrados e corrigidos
| # | Defeito | Causa | Correção |
|---|---|---|---|
| 1 | Telas Buscar/Oferecer mostravam "Disponível na Etapa 6" | `app.js` ainda registrava o placeholder; `buscar.js`, `oferecer.js`, `caronas.js` e `cartao.js` nunca eram importados | `app.js` importa e registra `telaBuscar` e `telaOferecer` (`exigeLogin: true`) |
| 2 | Caronas fictícias incompatíveis com os filtros | Sem `origemId`, `destinoId` e `turno` | `dados.js` v3 |
| 3 | `campo()` ignorava `extra` e `vazio` | Parâmetros não previstos | `componentes.js` |
| 4 | Cartões exibiam `[object HTMLElement]` | `map` devolvia pares dentro de `el()`, que achata só um nível | `cartao.js`: `flatMap` |

### Verificação
| Item | Como | Resultado |
|---|---|---|
| Sintaxe dos 17 módulos | `node --check` | OK |
| Regras de oferta, recorrência, filtros e dados fictícios | `node --test tests/caronas.test.mjs` | 21/21 OK |
| Perfil de motorista, oferta e busca; cartões | Manual no Live Server, feito pelo integrante da equipe | Funcionou; defeito 4 achado e corrigido nesse teste |
| Teclado, leitor de tela, contraste, responsividade | **Não executado** | Pendente |

### Limites conhecidos
- Mapa: lista fixa de 10 locais com coordenadas aproximadas (simulação, não integração com mapa).
- Distância em linha reta; chegada estimada = saída + tempo calculado (premissa de 30 km/h e trajeto 30% maior).
- `oferecer.js` não confere se a gravação no armazenamento funcionou.

## Etapa 5: acesso e perfil (RF01, RF02, RF03; RN01, RN02, RN03; RNF03)
| Req. | Situação | Limite conhecido |
|---|---|---|
| RF01 / RN01 / RNF03 | **Simulado**: domínio validado, bloqueio de e-mail pessoal (FA01), código na tela, sessão local. | Sem servidor: qualquer pessoa pode abrir o console e se passar por outra. Senha só validada, não gravada. |
| RF02 / RN02 | **Parcial**: formulário completo, validação de placa/capacidade/telefone, telefone verificado por código simulado. | Foto e CNH: só o nome do arquivo é guardado. Verificação de CNH inexistente. |
| RF03 / RN03 | **Parcial**: termos de uso aceitos e registrados no acesso. Diálogo de convivência pronto (`termos.js`), **sem gatilho** até a Etapa 7. | Textos dos termos são provisórios. |
| US01 | Acesso às funções só com e-mail confirmado e termos aceitos (guarda de rota). | Idem RF01. |

**Atualização (Etapa 8.0):** `regras.test.mjs` foi recriado e passa; `modelo.test.mjs` continua inexistente. Antes disso, esta matriz registrava "18 de 18 passam", mas `tests/regras.test.mjs` e `tests/modelo.test.mjs` não existem com conteúdo (o primeiro está com 0 bytes). Esse resultado **não pôde ser reverificado** e deve ser tratado como não comprovado até os testes serem recriados.