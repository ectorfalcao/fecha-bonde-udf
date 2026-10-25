# Divergências da documentação e premissas adotadas

Adotadas na Etapa 4 por decisão do grupo ("siga as premissas"). Nenhum requisito foi alterado.

| # | Tema | Premissa no código |
|---|---|---|
| D1 | Plataforma (app mobile × site) | Protótipo web mobile-first (PWA). RNF11 fica **parcial**. |
| D3 | Domínio de e-mail | Aceita `@cs.udf.edu.br` (domínio real dos alunos, informado pela equipe) além de `@udf.edu.br` e `@aluno.udf.edu.br` (RN01). **A RN01, o RF01, o UC01 e a US01 precisam ser atualizados na documentação.** |
| D4/D5 | Numeração de UC/US | Segue o diagrama de casos de uso; cadastro de veículo = US02. |
| D6 | Liberação do chat | Após aprovação do motorista (RF10, UC10), não após o pagamento. |
| D7 | Gênero | Campo `genero` no perfil, necessário a RF06/RN05. Etapa 7: só passageira de gênero feminino pode solicitar grupo "só mulheres"; a regra continua **sem confirmação da equipe ou do professor**. |
| D8 | Contato de emergência | Campo `contatoEmergencia` no perfil (RF15/RN11). Lacuna a registrar na documentação. |
| D9 | Termos | Dois aceites distintos: termos de uso (cadastro, US01) e termos de convivência (entrada em grupo, RF03). |
| D10 | Papéis | `motorista` e `passageiro` são capacidades do usuário (não herança exclusiva). Vagas disponíveis são calculadas, não armazenadas. |

Pendentes na documentação (fora do código): D2 (Kanban × Scrum, 2 sprints × 4 meses), D11 (datas, "Sistema XYZ", seções vazias), D12 (justificar filtro "só mulheres", que teve 0% na pesquisa de confiança).

## Premissas adicionais da Etapa 5
- **Placa:** aceita formato antigo (ABC1234) e Mercosul (ABC1D23); a documentação diz só "placa válida".
- **Gênero "Outro / prefiro não informar":** não entra no filtro "só para mulheres" (RN05 só define feminino). A regra precisa de confirmação.
- **Senha:** exigida no formulário (UC01), mas não gravada, pois não há servidor para protegê-la.
- **Dados fictícios:** trocar a versão dos dados recarrega os três usuários de exemplo e apaga contas criadas em teste (hoje na versão 3).
- **Perfil incompleto:** acessa o app, mas a RN02 impede criar carona (Etapa 6) e impedirá solicitar (Etapa 7).

## Premissas adicionais da Etapa 6
- **Mapa (RF04/RF06):** simulado por uma lista fixa de 10 locais com coordenadas aproximadas, tiradas das regiões citadas na pesquisa. Não é integração com mapa.
- **Distância e chegada estimada:** linha reta (haversine); tempo de viagem com premissa de 30 km/h e trajeto 30% maior que a linha reta, mínimo de 10 min.
- **Trajeto:** uma das pontas da carona deve ser o campus UDF (a documentação diz "Campus da faculdade ou endereço de retorno").
- **Recorrência (RF05):** semanal, até 182 dias (um semestre), gerando uma carona por data. A documentação não traz o calendário acadêmico, então não há vínculo com feriados ou recesso.
- **Tolerância de atraso:** 5, 10, 15 ou 20 minutos. **Contribuição:** de 0 (gratuita) a 999.
- **Turno "Integral"** casa com qualquer filtro de turno.
- **Grupo só para mulheres (RN05):** só motoristas do gênero feminino podem criar; o grupo não aparece para quem não é do gênero feminino e some da lista se houver passageiro não feminino confirmado. A regra para passageira que entra no grupo segue em aberto (D7).
- **Início:** lista todas as caronas, inclusive as "só para mulheres". Pendência a decidir.

## Premissas adicionais da Etapa 7
- **Cancelamento pelo motorista (RF09):** a documentação diz "antecedência mínima configurada" sem valor. Adotadas **2 horas**, e abaixo disso o cancelamento é **bloqueado** (não apenas avisado). Valor em `ANTECEDENCIA_CANCELAR_CARONA_H` (`js/grupos.js`).
- **Vaga e solicitação pendente:** só solicitações **confirmadas** ocupam vaga. Quando a carona lota, os demais pedidos pendentes passam para a lista de espera (RN06), mantendo a ordem de chegada.
- **Lista de espera (RF08):** ao abrir uma vaga, o primeiro da fila vira "pendente" e o **motorista ainda aprova**; não há confirmação automática. A documentação diz apenas "notificar o próximo".
- **Recusa:** passageiro recusado não pode solicitar a mesma carona de novo. Quem cancelou a própria solicitação pode.
- **Termos de convivência (RF03/RN03):** o diálogo aparece na primeira solicitação; o aceite fica gravado na solicitação. Textos continuam provisórios.
- **Notificações (RF07 a RF09):** simuladas dentro do app (coleção `notificacoes`, contador na navegação). Não é push nem e-mail.
- **Dados fictícios:** a versão dos dados continua 3; a coleção `notificacoes` nasce vazia e não entra na verificação de carga inicial.
- **Chat (RF10/D6):** a liberação ainda não existe (Etapa seguinte); o gatilho previsto é a solicitação passar a "confirmada".