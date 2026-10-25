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
| RF07 | Solicitações de entrada | Buscar / Caronas | **Implementado** (avisos simulados dentro do app) | `tests/grupos.test.mjs`, `tests/telas.test.mjs` + manual | Solicita, motorista aprova ou recusa, vagas atualizam | OK (automatizado e manual) |
| RF08 | Lista de espera | Buscar / Caronas | **Implementado** (o 1º da fila vira "pendente"; o motorista ainda aprova) | `tests/grupos.test.mjs` + manual | Lotou: fila; vagou: próximo é chamado | OK (automatizado e manual) |
| RF09 | Cancelamento | Caronas | **Implementado** (motorista só com 2 h de antecedência: premissa) | `tests/grupos.test.mjs`, `tests/telas.test.mjs` + manual | Passageiro libera vaga; motorista avisa todos | OK (automatizado e manual) |
| RF10 | Chat condicionado | Chat | Pendente (a liberação depende do estado "confirmada", já existente) | a definir | | |
| RF11 | Mapa e rastreamento | Viagem | Pendente (simulado) | a definir | | |
| RF12 | Pagamento | Pagamento | Pendente (simulado) | a definir | | |
| RF13 | Histórico e extrato | Histórico | Pendente | a definir | | |
| RF14 | Avaliação mútua | Avaliação | Pendente | a definir | | |
| RF15 | Botão de emergência | Viagem | Pendente | a definir | | |
| RN03 | Aceite prévio dos termos de convivência | Buscar | **Implementado** | `tests/grupos.test.mjs` | Solicitação recusada sem aceite | OK (automatizado) |
| RN04 | Vagas <= capacidade do veículo (1 a 4) | Oferecer | **Implementado** (validação) | `tests/caronas.test.mjs` | Vagas acima do limite recusadas | OK (automatizado) |
| RN05 | Filtro "só para mulheres" | Oferecer/Buscar | **Parcial** (regra para passageira em grupo exclusivo em aberto, ver D7) | `tests/caronas.test.mjs` | Grupo só aparece para usuárias femininas, e some se houver passageiro não feminino confirmado | OK (automatizado) |
| RN06 | Vagas automáticas e lista de espera | Caronas | **Implementado** | `tests/grupos.test.mjs` | Lotou: pendentes vão para a fila; vagou: o primeiro é chamado e avisado | OK (automatizado e manual) |
| RNF01 | HTTPS/AES-256 | n/a | Pendente (depende de backend) | n/a | | |
| RNF02 | LGPD | Privacidade | Parcial | a definir | | |
| RNF03 | Restrição ao domínio UDF | Acesso | Parcial | a definir | | |
| RNF04 | Tela em até 1,5 s | Todas | Pendente (indicativo) | Lighthouse | | |
| RNF05 | Latência de 200 ms | Chat/Viagem | Pendente (só local) | a definir | | |
| RNF06 | RAM até 150 MB | Todas | Pendente (indicativo) | DevTools | | |
| RNF07 | Uptime de 99,9% | n/a | Pendente (infraestrutura) | n/a | | |
| RNF08 | Auto-scaling | n/a | Pendente (infraestrutura) | n/a | | |
| RNF09 | Até 3 cliques | Navegação | **Parcial** (por desenho: Buscar, Solicitar vaga e Aceitar termos = 3 toques na 1ª solicitação, 2 depois) | manual | ≤ 3 toques | Conferido no teste geral da equipe; sem medição formal |
| RNF10 | WCAG 2.1 AA | Todas | Parcial (rótulos, erros com símbolo, estado nunca só por cor, botões com nome acessível; sem auditoria) | Contraste, teclado e leitor de tela: a executar | | |
| RNF11 | Android/iOS | PWA | Pendente (parcial) | a definir | | |
| RNF12 | Cache offline | Viagem | Parcial (store.js; sem Service Worker) | a definir | | |

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
- A tela Início ainda lista as caronas "só para mulheres" a todos.
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