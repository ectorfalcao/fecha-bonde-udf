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

## Decisões da Etapa 8 (aprovadas pela equipe)
- **Ciclo de vida da carona:** `aberta` → `em andamento` → `concluída` (e `cancelada`). O **motorista** inicia (a partir de 15 min antes da saída, RN08) e conclui a viagem, como no diagrama de atividades. Haverá um **modo demonstração**, visível e rotulado, que libera o início fora da janela, para testar sem esperar o relógio.
- **Pagamento (RF12):** simulado. PIX com código fictício e botão "simular pagamento"; cartão apenas como opção demonstrativa, **sem campos de número ou validade**; chave PIX do motorista fictícia, com aviso para não usar chave real.
- **Avaliação (RF14/RN10):** tela ao concluir a viagem. Passageiro avalia o motorista (os demais passageiros, opcional); motorista avalia cada passageiro. É possível "avaliar depois" pelo Histórico; a média só conta avaliações feitas.
- **Mapa (RF11/RN08):** mapa esquemático com posição do veículo **simulada** entre origem e destino, rotulado "SIMULADO". Sem GPS real: sem servidor, a posição do motorista não chegaria a outro aparelho.
- **Navegação:** a barra inferior continua com 5 itens; chat, mapa, pagamento e avaliação são acessados pela tela Caronas.

## Inconsistências documentais registradas (a resolver na documentação; a especificação não foi alterada)
1. **Liberação do chat:** RF10, UC10 e D6 dizem "após aprovação do motorista"; o diagrama de atividades põe o pagamento antes. O código segue RF10/UC10/D6.
2. **Avaliação:** RN10 diz "obrigatória"; RF14 e US10 falam em pop-up e comentário opcional. "Avaliando o motorista e o grupo" não define se "grupo" são os outros passageiros.
3. **SMS de emergência:** UC04/RN11 dizem que o app "envia mensagem automática"; um site só consegue abrir o aplicativo de SMS com o texto pronto (`sms:`), e a pessoa precisa enviar.
4. **Rastreamento:** RF11 diz "X minutos"; RN08 e US07 dizem 15.
5. **Pagamento:** RF12 prevê PIX e cartão; a pesquisa mostra 100% de preferência por PIX.
6. **Diagrama de objetos:** usa `EmAndamento`, `RastreamentoGPS` e `TransacaoFinanceira`, ausentes do diagrama de classes; os e-mails (`@df.oeub.edu.br`) diferem dos domínios da RN01.

## Premissas adicionais da Etapa 8.1
- **Estados da carona:** `aberta`, `em_andamento`, `concluida`, `cancelada`. Só o motorista muda o estado de uma viagem (iniciar e concluir), como no diagrama de atividades.
- **Início:** liberado a partir de 15 minutos antes da saída (RN08/US07) e sem limite depois. Sem passageiros confirmados, o início é permitido, e a tela avisa antes de confirmar.
- **Solicitações sem resposta ao iniciar:** pendentes e lista de espera são encerradas pelo sistema (`cancelada`, `canceladaPor: "sistema"`) e o passageiro é avisado. A documentação não prevê esse caso; **precisa de confirmação da equipe ou do professor**.
- **Durante e depois da viagem:** ninguém solicita, aprova, recusa ou cancela solicitação pelo app, e o motorista não cancela a carona. A documentação não prevê cancelamento de viagem em andamento.
- **Modo demonstração:** ferramenta de teste, desligada por padrão, que libera o início fora da janela. Quando ligada, o cabeçalho avisa em todas as telas. Quando é usada para iniciar, a carona guarda `iniciadaEmModoDemo: true`.
- **Viagens concluídas:** aparecem na tela Caronas (10 mais recentes) até o histórico completo (RF13, parte 8.7).