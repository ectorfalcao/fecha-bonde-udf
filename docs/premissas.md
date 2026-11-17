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
- **Início:** lista todas as caronas, inclusive as "só para mulheres". Pendência a decidir. *Decidido na Etapa 10.1: o Início segue a mesma regra da busca.*

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
- **Viagens concluídas:** aparecem na tela Caronas (10 mais recentes) até o histórico completo (RF13, parte 8.7). *Atualizado na 8.7: Caronas mostra as 3 mais recentes e o link para o Histórico.*

## Premissas adicionais da Etapa 8.2
- **Onde fica o botão (RN11):** na tela "Viagem em andamento" (`#/viagem`), que só tem conteúdo enquanto há viagem em andamento. Uma faixa em todas as telas leva até ela. A barra inferior continua com 5 itens.
- **Quem vê:** o motorista e as passageiras com solicitação **confirmada**.
- **Serviços de segurança:** só a polícia (190), como no US08. SAMU (192) e bombeiros (193) não foram incluídos por não constarem na documentação.
- **SMS:** a documentação (UC04, RN11) diz que o app "envia mensagem automática". Um site não consegue; o app abre o aplicativo de SMS com o texto pronto e a pessoa envia. Registrado como inconsistência 3.
- **Localização:** uma leitura única do navegador, no momento do toque, e só se houver contato de emergência. Vai no texto do SMS como link de mapa. **Não é guardada** no armazenamento do app.
- **Registro:** a coleção `alertas` guarda a tentativa de acionamento (tipo, carona, horário, se havia localização), sem coordenadas, e a observação de que o app não confirma envio nem atendimento. Corresponde, de forma reduzida, à classe `AlertaEmergencia` do diagrama (que prevê `localizacaoAtual`; essa parte foi omitida de propósito, por privacidade).
- **Sem confirmação falsa:** a tela nunca diz que a polícia ou o contato foram acionados.

## Premissas adicionais da Etapa 8.3
- **Liberação da sala (RF10, RN07):** A sala é exclusiva para os membros confirmados da carona (motorista e passageiras/os com status `confirmada`). Solicitações pendentes, recusadas, canceladas ou na lista de espera recebem aviso explicativo e não leem nem enviam mensagens.
- **Janela de arquivamento (RN07):** 2 horas após a conclusão da viagem (`concluidaEm + 2 * 3600000`), a sala é desativada para novas mensagens. O histórico continua acessível para consulta (modo somente-leitura), com banner informativo.
- **Roteamento contextual:** Rota `#/chat?carona=<id>`, recebendo o ID da carona por query string, mantendo a barra de navegação com os 5 itens originais (destacando o item "Caronas" como fluxo-pai).
- **Reatividade e tempo real (RNF05):** Atualização via `CustomEvent` local e `BroadcastChannel` para sincronização imediata entre múltiplas abas abertas no mesmo navegador.
- **Modelo de dados:** Coleção `mensagens` com atributos `id`, `caronaId`, `remetenteId`, `texto`, `criadaEm`, espelhando o Diagrama de Classes (`chatGrupo` e `Mensagem`).
- **Segurança e acessibilidade (RNF10):** Limite de 500 caracteres, sanitização de nós sem uso de `innerHTML`, anúncios com `role="log"` e `aria-live="polite"`.
## Premissas adicionais da Etapa 8.4
- **Mapa (RF11):** esquemático, desenhado em SVG com as coordenadas aproximadas da lista de locais. Sem biblioteca nem imagens de mapa: funciona offline e não envia dados a terceiros. *Substituído na Etapa 11: mapa real (OpenStreetMap); o esquema virou a reserva sem internet.*
- **Posição do veículo:** estimada pelo tempo desde o início da viagem, em linha reta da partida ao destino, usando o mesmo tempo previsto da chegada estimada (30 km/h, trajeto 30% maior). Passado o tempo previsto, o veículo fica no destino até o motorista concluir.
- **Onde aparece:** só na tela *Viagem em andamento*, abaixo do botão de emergência, para o motorista e as passageiras confirmadas. Mapas na busca e na oferta ficam para o refinamento visual.
- **Rastreamento antes do início (RN08/US07: 15 min antes):** não há posição a compartilhar sem GPS; a viagem só aparece no mapa depois de iniciada. Inconsistência 4 (RF11 "X minutos") continua registrada.

## Premissas adicionais da Etapa 8.5 (decididas pelo grupo)
- **Quando se paga (RF12):** depois que o motorista conclui a viagem. Resolve a inconsistência 1 a favor de RF10/UC10/D6 (chat antes do pagamento) e dispensa regra de estorno: quem cancela antes da viagem nunca pagou.
- **Forma de pagamento:** só o PIX simulado funciona. O cartão aparece como opção indisponível, sem nenhum campo (inconsistência 5: a pesquisa mostra 100% de preferência por PIX).
- **Dados fictícios:** a chave PIX (`pix-ficticio@fechabonde.exemplo`, domínio reservado) e o código ("SIMULADO-FECHABONDE-...") não seguem o padrão do Banco Central e não funcionam em banco nenhum.
- **Pendências:** não são gravadas, são calculadas (passageiro confirmado + carona concluída + valor > 0 + sem pagamento), como as vagas (D10). Carona gratuita não gera pagamento.
- **Sem confirmação do motorista:** o registro do passageiro basta, porque não há dinheiro real para conferir.

## Premissas adicionais da Etapa 8.6
- **Escala (RF14):** nota de 1 a 5 estrelas e comentário opcional de até 300 caracteres. A documentação não define a escala; **precisa de confirmação da equipe ou do professor**.
- **Obrigatoriedade (RN10, inconsistência 2):** a avaliação fica "pendente" em Caronas e o motorista é levado à tela ao concluir, mas nada é bloqueado. Para bloquear (por exemplo, impedir nova solicitação com avaliação pendente), a equipe precisa decidir.
- **"Avaliando o motorista e o grupo":** interpretado como os demais passageiros confirmados, de forma **opcional**, como decidido na Etapa 8.
- **Privacidade:** quem foi avaliado recebe um aviso sem a nota e sem o nome de quem avaliou; a média aparece para todos no cartão da carona.
- **Onde avaliar depois:** em Caronas → Viagens concluídas, até o Histórico (8.7) existir.

## Premissas adicionais da Etapa 8.7
- **O que entra no histórico (RF13):** só viagens **concluídas** em que a pessoa foi motorista ou passageira confirmada. Caronas canceladas e solicitações recusadas não são viagens feitas.
- **Extrato:** quatro totais simulados (pagou, ainda deve, recebeu, a receber), calculados a partir dos pagamentos registrados; nada é gravado à parte. Caronas gratuitas ficam fora.
- **Onde fica:** tela própria, acessada por Caronas (a barra inferior continua com 5 itens). Pagar e avaliar depois também podem ser feitos por ela.

## Etapa 9: refinamento visual (decisões do grupo)
- **Direção:** linguagem de mapa de transporte. Cada carona é uma "linha": partida (círculo vazado), ponto de encontro (âmbar) e destino (círculo verde-petróleo). Proposta completa com maquetes das telas compartilhada com o grupo.
- **Cor principal:** o verde "sustentabilidade" da Etapa 4 foi trocado pelo **verde-petróleo** (#0D6B6B), por decisão do grupo. O azul "financeiro" saiu: valores usam negrito. Vermelho só para emergência e erro; âmbar para atenção (o âmbar claro nunca é cor de texto).
- **Fonte:** Inter, guardada no projeto (`css/fontes/`, licença OFL, 48 KB, alfabeto latino com acentos). Funciona offline (RNF12) e não consulta serviço externo. Sem o arquivo, cai para a fonte do sistema.
- **Contraste (RNF10):** os 16 pares de texto e fundo usados nas telas foram medidos; o menor é 5,2:1 (selo âmbar). Todos passam no WCAG 2.1 AA.
- **Cartão de carona (9.2):** a rota vira um bloco de percurso (`percurso()` em `cartao.js`): partida e destino ligados por linha tracejada, horário de saída (com o dia) e chegada estimada em destaque, e a duração e a tolerância no meio. É o mesmo bloco em Início, Buscar, Caronas e Histórico; o Início passou a usar o próprio cartão da busca. O título da rota continua na página para leitor de tela e navegação por títulos, mas fica escondido visualmente. Recorrência e "só para mulheres" viraram selos.
- **Viagem e mapa (9.3):** botão de emergência em largura total; "Chegada prevista" em destaque acima do mapa; placa e modelo do carro no topo da lista, para conferir ao embarcar. O mapa ajusta a altura à rota (de 150 a 260 de altura no desenho) e ganha uma grade de ruas de fundo, só ilustrativa: não são as ruas reais.
- **Chat (9.3):** faixa de contexto com a mini-linha do percurso, data, motorista e número de pessoas no grupo; aviso discreto de quem pode ler; enquanto o grupo não conversou, uma dica âmbar para combinar o **ponto de encontro em texto** (decisão do grupo: sem campo próprio, o app não guarda endereço).
- **Defeito corrigido (9.3):** no celular, o campo de mensagem do chat empurrava o botão "Enviar" para fora da tela (campo de texto em flexbox sem `min-width: 0`). Achado na medição de largura do teste de ponta a ponta.
- **Pagamento (9.4):** o valor aparece primeiro, grande, com o carimbo SIMULADO; depois rota, motorista e data da conclusão; chave e código PIX num cartão, com o código em fonte de código.
- **Estados (9.4):** erro (vermelho, ✖), atenção (âmbar, ⚠), informação (verde-petróleo, ℹ) e sem resultados (borda tracejada, sempre com uma saída) já tinham forma própria. Faltava o carregamento: "Obtendo sua localização…" na emergência ganhou um indicador girando, que fica parado para quem pediu menos movimento no sistema.
- **Navegação (9.4):** o número de avisos novos virou um círculo ao lado de "Caronas" (antes "Caronas (2)" quebrava em duas linhas no celular); o leitor de tela continua ouvindo "Caronas, 2 aviso(s) novo(s)". Links de texto passaram do azul padrão do navegador para o verde-petróleo escuro. *Substituído na Etapa 10.3: o número de não lidas fica no sino do topo.*

## Etapa 10: modernização da interface (decisões do grupo)
Decididas depois da auditoria de requisitos do início da etapa (resumo em `matriz-rastreabilidade.md`).

- **Defeito do chat e do pagamento (10.0):** corrigir antes do redesign, num commit próprio. Quando a pessoa tem mais de uma solicitação na mesma carona (cancelou e pediu de novo), vale a confirmada; senão a ativa (pendente ou espera); senão a mais recente.
- **RN05 no Início (10.1):** o Início segue a regra da busca. Carona "só para mulheres" não aparece para quem não é do gênero feminino nem para visitante sem sessão.
- **Nome da disciplina:** **Projeto de Software** (curso de Análise e Desenvolvimento de Sistemas). O rodapé e o README dizem isso; antes diziam "Análise e Projeto de Sistemas". Ver inconsistência 7.
- **Inclusões aprovadas:** privacidade/LGPD no Perfil, média de avaliação no Perfil, chave PIX fictícia do motorista e telefone do motorista na viagem.

### Identidade visual (10.2)
- **Mantida e refinada:** asfalto, verde-petróleo e âmbar, fonte Inter, a "linha" de transporte do percurso e a faixa tracejada de rua no topo. Ganharam escalas completas, sombras em camadas com a cor do asfalto (nunca preto puro), um realce leve na borda de cima das superfícies e gradientes discretos no botão principal, no topo e no destaque do Início.
- **Vermelho continua só para emergência e erro.** O contador de não lidas usa o âmbar escuro (`--alerta`).
- **Ícones:** desenhados para o projeto em SVG (`js/icones.js`), sem biblioteca e sem rede. Substituem os emojis, que mudavam de aparência entre sistemas. São decorativos: o texto ou o nome acessível do botão diz a mesma coisa. Os símbolos ✔ ⚠ ✖ continuam no texto dos estados, porque fazem parte da leitura ("Pagamento ⚠ Pendente").
- **Navegação:** a mesma lista de 5 itens fica no topo no computador (a partir de 64rem) e numa barra inferior com ícones no celular.
- **Botão indisponível:** "Iniciar viagem" e "Cancelar carona" fora do prazo ficam com aparência de indisponível (`aria-disabled`), mas continuam focáveis e explicam o motivo ao serem acionados, como antes.
- **Diálogos:** uma base única (`abrirDialogo` em `componentes.js`), com botão de fechar. No celular o modal vira uma folha que sobe de baixo. Existe uma variante de painel lateral, ainda sem uso, para painéis futuros.
- **Animações:** curtas (até 320 ms) e desligadas para quem pede menos movimento no sistema.

### Privacidade e dados pessoais (10.2, RNF02/RN12)
- **Excluir a conta = anonimizar.** Saem os dados pessoais (nome, e-mail, telefone, curso, gênero, fotos, contato de emergência, chave PIX), o veículo, os avisos, os alertas de emergência e as avaliações recebidas. O texto das mensagens enviadas vira "Mensagem removida a pedido do autor (LGPD)" e o comentário das avaliações feitas é apagado (a nota fica na média de quem foi avaliado). Ficam, só com o id, as caronas, as solicitações e os pagamentos, porque fazem parte do histórico e do extrato de outras pessoas.
- **Bloqueio:** a exclusão é recusada enquanto houver carona em curso (aberta ou em andamento) como motorista ou passageiro, para ninguém ficar sem aviso. A pessoa cancela ou conclui antes.
- **Depois da exclusão:** a sessão é encerrada e o mesmo e-mail pode criar uma conta nova.
- **Baixar meus dados:** um arquivo JSON com tudo o que o app guarda sobre a pessoa. As avaliações recebidas vão sem o autor (mesma regra da tela).
- **Revogar o aceite dos termos de convivência:** as solicitações atuais continuam valendo e o aceite é pedido de novo na próxima solicitação. O aceite dos termos de uso não é revogável à parte: sem ele não há uso do app, então o caminho é excluir a conta.
- **Localização:** continua lida só no toque da emergência e não é guardada. A permissão é retirada nas configurações do navegador.

### Outras inclusões (10.2)
- **Chave PIX do motorista (RF12):** opcional e **fictícia**, porque o pagamento é simulado. Aceita de 3 a 77 caracteres, sem espaços, e recusa os formatos de dado pessoal que dá para reconhecer (CPF, CNPJ e telefone). Sem chave cadastrada, o pagamento mostra a chave padrão do protótipo (`pix-ficticio@fechabonde.exemplo`). E-mails reais não têm como ser detectados: o campo pede, por escrito, uma chave inventada.
- **Reputação (US10):** a média aparece no próprio Perfil e, para o motorista, ao lado de cada pessoa que pede vaga. Não há perfil público de terceiros: a "exibição pública" da US10 fica coberta pelo cartão da carona (motorista) e pela tela de aprovação (passageiros).
- **Telefone do motorista (RNF12):** na tela da viagem em andamento, só para o passageiro confirmado, com toque que abre a discagem. O motorista não vê o próprio número.

### Centro de notificações (10.3)
- **Um lugar só:** todas as notificações ficam no **sino** do canto superior direito, que aparece para quem está conectado. Saíram a seção "Avisos" da tela Caronas e o contador do item Caronas na navegação.
- **Caixa:** as **não lidas em cima** e as **lidas embaixo**, cada grupo da mais nova para a mais antiga. A não lida tem o selo "Nova" e o marcador âmbar (nunca só a cor).
- **Lida:** abrir a caixa **não** marca nada como lido. A pessoa marca uma ("Marcar como lida") ou todas ("Marcar todas como lidas").
- **Limite:** a caixa mostra até 30 lidas (as mais recentes); as mais antigas continuam guardadas.
- **Ações:** as notificações são texto. As ações (aprovar, pagar, avaliar) continuam em Caronas, com o atalho "Ver minhas caronas" na própria caixa.
- **Acessibilidade:** a caixa é o `<dialog>` nativo (foco preso, Esc fecha e o foco volta ao sino). O número do sino é visual e o nome acessível diz por extenso ("Notificações: 3 não lida(s)"). No celular a caixa sobe de baixo.

### Inconsistências documentais registradas na Etapa 10 (continuação da lista da Etapa 8)
7. **Nome da disciplina:** o README e o rodapé diziam "Análise e Projeto de Sistemas"; a equipe informou "Projeto de Software". O código foi corrigido; a documentação deve conferir.
8. **Matrícula:** RF01 e RN01 aceitam "e-mail institucional **ou** matrícula ativa verificada"; US01 e UC01 falam só de e-mail. O protótipo implementa só o e-mail.
9. **Ponto de encontro:** RNF12 e RN12 pedem que o ponto de encontro da viagem ativa fique em cache offline, mas o grupo decidiu (Etapa 9.3) não ter campo de ponto de encontro: ele é combinado em texto no chat. O RNF12 fica parcial.
10. **Numeração das histórias:** no PDF "RFs-RNFs-USs", a história do cadastro de veículo aparece sem número (falta "US02"), logo depois da US01.

## Etapa 11: mapa real (decisões do grupo)
Substitui o mapa SIMULADO da tela *Viagem em andamento* (Etapa 8.4) por um mapa de verdade. Escolhas feitas pela equipe:

- **Provedor: OpenStreetMap**, desenhado com a biblioteca **Leaflet 1.9.4**. Gratuito, sem chave e sem cadastro. O RF11 cita Google Maps e Mapbox; os dois exigem conta e chave (o Google, também faturamento), por isso ficaram de fora. Ver inconsistência 11.
- **Rota pelas ruas: serviço público OSRM** (servidor de demonstração, gratuito). Mostra o caminho real e a distância. Se o serviço não responder em 7 s, a rota vira uma linha reta, tracejada e com aviso na legenda.
- **Posição do carro: GPS do motorista**, com a estimativa pelo tempo como reserva.

### Como funciona
- **Carregamento:** a biblioteca vem de um CDN (unpkg) só quando a tela da viagem abre, com verificação de integridade (SRI): se o arquivo for alterado no caminho, o navegador recusa. A tela abre com o mapa esquemático e troca pelo mapa real assim que ele carrega.
- **Sem internet:** fica o mapa esquemático da Etapa 8.4, rotulado SIMULADO. É a reserva offline (RNF12). Nos testes em Node, também.
- **Rota guardada:** a rota de cada par de locais fica neste navegador. A mesma origem e destino não consultam o OSRM de novo, e o desenho funciona depois sem internet (os azulejos do mapa, não).
- **Coordenadas conferidas:** com um mapa real, as coordenadas aproximadas da Etapa 6 ficariam visivelmente fora do lugar. Elas foram conferidas no OpenStreetMap (Nominatim). O campus mudou cerca de 3 km: passou a ser o endereço do UDF (W5 Sul, SQS 304, Asa Sul). O Jardim Botânico mudou cerca de 1,8 km; as outras regiões já estavam certas. Distâncias e tempos estimados mudaram um pouco por causa disso.
- **Chegada prevista:** continua a mesma estimativa do resto do app (30 km/h e trajeto 30% maior que a linha reta), para não mostrar dois horários diferentes. O OSRM só fornece o desenho e a distância da rota.
- **Posição estimada:** sem GPS, o carro anda **pela rota** (não mais em linha reta), na proporção do tempo previsto.

### GPS do motorista (RN08, US07)
- **Por escolha:** só o motorista tem o botão "Compartilhar minha localização (GPS)" na tela da viagem em andamento. Nada é lido sem o toque, e o navegador pede a permissão.
- **Enquanto compartilha:** o aparelho lê o GPS e grava só a **última** posição (no máximo a cada 3 s) neste navegador. O compartilhamento continua mesmo trocando de tela dentro do app.
- **Quem vê:** sem servidor, a posição **não chega a outro aparelho**. A passageira vê o GPS do motorista se usar o mesmo navegador (demonstração com duas abas); fora disso, vê a posição estimada, e a tela explica o motivo.
- **Validade:** posição com mais de 2 minutos não é mostrada como real.
- **Apagada:** quando o motorista toca em "Parar de compartilhar", quando a permissão é negada e quando a viagem é concluída.
- **Janela de 15 minutos (RN08):** o compartilhamento só existe com a viagem em andamento, e ela só pode ser iniciada 15 minutos antes da saída (ou pelo modo demonstração).

### Privacidade
- **Serviços externos:** o mapa pede imagens ao OpenStreetMap (que fica sabendo a região vista) e pede a rota ao OSRM, enviando só as coordenadas fixas da lista de locais (nunca a posição de uma pessoa). A biblioteca vem do unpkg.
- **O GPS do motorista não é enviado a nenhum serviço:** ele só posiciona o marcador. Os azulejos pedidos para mostrar a região em volta dele revelam a área, como em qualquer mapa on-line.
- **Perfil:** o texto de privacidade passou a dizer que, para o motorista que compartilha, a localização também é lida durante a viagem.

### Inconsistências documentais registradas na Etapa 11
11. **Provedor do mapa:** RF11 e UC15 citam Google Maps ou Mapbox; o protótipo usa OpenStreetMap, que é gratuito e dispensa chave. A documentação deve citar o provedor adotado.
12. **Rastreamento entre aparelhos:** RF11, US07 e UC15 pressupõem que a posição do motorista chegue ao passageiro em tempo real (RNF05: 200 ms). Isso exige um servidor (ou um serviço de tempo real), que o protótipo não tem. Hoje a posição só é compartilhada dentro do mesmo navegador.
