# Matriz de rastreabilidade

Status: Pendente | Parcial | Implementado | Simulado

| Req. | Descrição | Tela/módulo | Status | Teste | Esperado | Obtido |
|---|---|---|---|---|---|---|
| RF01 | Autenticação institucional | Acesso | Simulado | a definir | | |
| RF02 | Perfil, CNH e veículo | Perfil | Parcial | a definir | | |
| RF03 | Aceite dos termos | Termos | Parcial | a definir | | |
| RF04 | Criar carona | Oferecer | Pendente | a definir | | |
| RF05 | Rotas recorrentes | Oferecer | Pendente | a definir | | |
| RF06 | Busca e filtros | Buscar | Pendente | a definir | | |
| RF07 | Solicitações de entrada | Grupo | Pendente | a definir | | |
| RF08 | Lista de espera | Grupo | Pendente | a definir | | |
| RF09 | Cancelamento | Grupo | Pendente | a definir | | |
| RF10 | Chat condicionado | Chat | Pendente | a definir | | |
| RF11 | Mapa e rastreamento | Viagem | Pendente (simulado) | a definir | | |
| RF12 | Pagamento | Pagamento | Pendente (simulado) | a definir | | |
| RF13 | Histórico e extrato | Histórico | Pendente | a definir | | |
| RF14 | Avaliação mútua | Avaliação | Pendente | a definir | | |
| RF15 | Botão de emergência | Viagem | Pendente | a definir | | |
| RNF01 | HTTPS/AES-256 | n/a | Pendente (depende de backend) | n/a | | |
| RNF02 | LGPD | Privacidade | Parcial | a definir | | |
| RNF03 | Restrição ao domínio UDF | Acesso | Parcial | a definir | | |
| RNF04 | Tela em até 1,5 s | Todas | Pendente (indicativo) | Lighthouse | | |
| RNF05 | Latência de 200 ms | Chat/Viagem | Pendente (só local) | a definir | | |
| RNF06 | RAM até 150 MB | Todas | Pendente (indicativo) | DevTools | | |
| RNF07 | Uptime de 99,9% | n/a | Pendente (infraestrutura) | n/a | | |
| RNF08 | Auto-scaling | n/a | Pendente (infraestrutura) | n/a | | |
| RNF09 | Até 3 cliques | Navegação | Parcial (Etapa 4: nav a 1 toque; fluxo ainda não existe) | a definir | | |
| RNF10 | WCAG 2.1 AA | Todas | Parcial (base Etapas 3 e 4; sem auditoria) | Contraste, teclado e leitor de tela: a executar | | |
| RNF11 | Android/iOS | PWA | Pendente (parcial) | a definir | | |
| RNF12 | Cache offline | Viagem | Parcial (store.js corrigido na Etapa 4; sem Service Worker) | a definir | | |
## Etapa 4: o que foi verificado
| Item | Como | Resultado |
|---|---|---|
| Sintaxe dos 8 módulos JS | `node --check` | OK |
| `salvar()` não lança com storage bloqueado | `node --test tests/modelo.test.mjs` | OK |
| Carga inicial idempotente; RN01, RN04, RN05 (dados); vagas derivadas | idem (6 testes) | 6/6 OK |
| Navegação, foco, layout e contraste no navegador | **não executado** (sem navegador no ambiente) | Pendente: testar no Live Server |

## Etapa 5: acesso e perfil (RF01, RF02, RF03; RN01, RN02, RN03; RNF03)
| Req. | Situação | Limite conhecido |
|---|---|---|
| RF01 / RN01 / RNF03 | **Simulado**: domínio validado, bloqueio de e-mail pessoal (FA01), código na tela, sessão local. | Sem servidor: qualquer pessoa pode abrir o console e se passar por outra. Senha só validada, não gravada. |
| RF02 / RN02 | **Parcial**: formulário completo, validação de placa/capacidade/telefone, telefone verificado por código simulado. | Foto e CNH: só o nome do arquivo é guardado. Verificação de CNH inexistente. |
| RF03 / RN03 | **Parcial**: termos de uso aceitos e registrados no acesso. Diálogo de convivência pronto (`termos.js`), **sem gatilho** até a Etapa 7. | Textos dos termos são provisórios. |
| US01 | Acesso às funções só com e-mail confirmado e termos aceitos (guarda de rota). | Idem RF01. |

Testes automatizados (`node --test tests/modelo.test.mjs tests/regras.test.mjs`): 18 de 18 passam, cobrindo domínios de e-mail, senha, placa, capacidade, telefone, perfil de passageiro e motorista, fluxo do código (errado, expirado, tentativas) e liberação de acesso.
**Não executado no navegador:** diálogo de termos (`<dialog>`), envio dos formulários, foco após erro, leitor de tela.