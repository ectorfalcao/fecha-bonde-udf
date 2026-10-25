# Matriz de rastreabilidade

Status: Pendente | Parcial | Implementado | Simulado

| Req. | Descrição | Tela/módulo | Status | Teste | Esperado | Obtido |
|---|---|---|---|---|---|---|
| RF01 | Autenticação institucional | Acesso | Simulado | a definir | | |
| RF02 | Perfil, CNH e veículo | Perfil | Parcial | manual (Etapa 6: perfil de motorista criado) | | |
| RF03 | Aceite dos termos | Termos | Parcial | a definir | | |
| RF04 | Criar carona | Oferecer | **Parcial** (mapa simulado por lista de locais) | `tests/caronas.test.mjs` + manual | Carona publicada aparece na busca | Confirmado manualmente |
| RF05 | Rotas recorrentes | Oferecer | **Parcial** (semanal, até 182 dias; sem calendário acadêmico) | `tests/caronas.test.mjs` | Uma carona por data nos dias escolhidos | Teste automatizado OK; tela não conferida em detalhe |
| RF06 | Busca e filtros | Buscar | **Parcial** (raio em linha reta; locais fixos) | `tests/caronas.test.mjs` + manual | Filtros de raio, turno, horário e "só mulheres" | Busca testada manualmente; cartões OK após correção |
| RF07 | Solicitações de entrada | Grupo | Pendente (Etapa 7) | a definir | | |
| RF08 | Lista de espera | Grupo | Pendente (Etapa 7) | a definir | | |
| RF09 | Cancelamento | Grupo | Pendente (Etapa 7) | a definir | | |
| RF10 | Chat condicionado | Chat | Pendente | a definir | | |
| RF11 | Mapa e rastreamento | Viagem | Pendente (simulado) | a definir | | |
| RF12 | Pagamento | Pagamento | Pendente (simulado) | a definir | | |
| RF13 | Histórico e extrato | Histórico | Pendente | a definir | | |
| RF14 | Avaliação mútua | Avaliação | Pendente | a definir | | |
| RF15 | Botão de emergência | Viagem | Pendente | a definir | | |
| RN04 | Vagas <= capacidade do veículo (1 a 4) | Oferecer | **Implementado** (validação) | `tests/caronas.test.mjs` | Vagas acima do limite recusadas | OK (automatizado) |
| RN05 | Filtro "só para mulheres" | Oferecer/Buscar | **Parcial** (regra para passageira em grupo exclusivo em aberto, ver D7) | `tests/caronas.test.mjs` | Grupo só aparece para usuárias femininas, e some se houver passageiro não feminino confirmado | OK (automatizado) |
| RNF01 | HTTPS/AES-256 | n/a | Pendente (depende de backend) | n/a | | |
| RNF02 | LGPD | Privacidade | Parcial | a definir | | |
| RNF03 | Restrição ao domínio UDF | Acesso | Parcial | a definir | | |
| RNF04 | Tela em até 1,5 s | Todas | Pendente (indicativo) | Lighthouse | | |
| RNF05 | Latência de 200 ms | Chat/Viagem | Pendente (só local) | a definir | | |
| RNF06 | RAM até 150 MB | Todas | Pendente (indicativo) | DevTools | | |
| RNF07 | Uptime de 99,9% | n/a | Pendente (infraestrutura) | n/a | | |
| RNF08 | Auto-scaling | n/a | Pendente (infraestrutura) | n/a | | |
| RNF09 | Até 3 cliques | Navegação | Parcial (Início → Buscar em 1 toque; "solicitar" só existe na Etapa 7) | a definir | | |
| RNF10 | WCAG 2.1 AA | Todas | Parcial (rótulos, erros com símbolo e foco nos formulários; sem auditoria) | Contraste, teclado e leitor de tela: a executar | | |
| RNF11 | Android/iOS | PWA | Pendente (parcial) | a definir | | |
| RNF12 | Cache offline | Viagem | Parcial (store.js; sem Service Worker) | a definir | | |

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
- A tela Início ainda lista todas as caronas, inclusive as "só para mulheres", a qualquer usuário.
- Caronas fictícias têm datas relativas e vencem em poucos dias.
- `oferecer.js` não confere se a gravação no armazenamento funcionou.

## Etapa 5: acesso e perfil (RF01, RF02, RF03; RN01, RN02, RN03; RNF03)
| Req. | Situação | Limite conhecido |
|---|---|---|
| RF01 / RN01 / RNF03 | **Simulado**: domínio validado, bloqueio de e-mail pessoal (FA01), código na tela, sessão local. | Sem servidor: qualquer pessoa pode abrir o console e se passar por outra. Senha só validada, não gravada. |
| RF02 / RN02 | **Parcial**: formulário completo, validação de placa/capacidade/telefone, telefone verificado por código simulado. | Foto e CNH: só o nome do arquivo é guardado. Verificação de CNH inexistente. |
| RF03 / RN03 | **Parcial**: termos de uso aceitos e registrados no acesso. Diálogo de convivência pronto (`termos.js`), **sem gatilho** até a Etapa 7. | Textos dos termos são provisórios. |
| US01 | Acesso às funções só com e-mail confirmado e termos aceitos (guarda de rota). | Idem RF01. |

**Atenção, testes da Etapa 5:** esta matriz registrava "18 de 18 passam", mas `tests/regras.test.mjs` e `tests/modelo.test.mjs` não existem com conteúdo (o primeiro está com 0 bytes). Esse resultado **não pôde ser reverificado** e deve ser tratado como não comprovado até os testes serem recriados.