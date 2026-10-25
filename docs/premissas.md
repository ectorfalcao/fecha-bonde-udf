# Divergências da documentação e premissas adotadas

Adotadas na Etapa 4 por decisão do grupo ("siga as premissas"). Nenhum requisito foi alterado.

| # | Tema | Premissa no código |
|---|---|---|
| D1 | Plataforma (app mobile × site) | Protótipo web mobile-first (PWA). RNF11 fica **parcial**. |
| D3 | Domínio de e-mail | Aceita `@cs.udf.edu.br` (domínio real dos alunos, informado pela equipe) além de `@udf.edu.br` e `@aluno.udf.edu.br` (RN01). **A RN01, o RF01, o UC01 e a US01 precisam ser atualizados na documentação.** |
| D4/D5 | Numeração de UC/US | Segue o diagrama de casos de uso; cadastro de veículo = US02. |
| D6 | Liberação do chat | Após aprovação do motorista (RF10, UC10), não após o pagamento. |
| D7 | Gênero | Campo `genero` no perfil, necessário a RF06/RN05. A regra para passageira que entra em grupo "só mulheres" ainda precisa de definição. |
| D8 | Contato de emergência | Campo `contatoEmergencia` no perfil (RF15/RN11). Lacuna a registrar na documentação. |
| D9 | Termos | Dois aceites distintos: termos de uso (cadastro, US01) e termos de convivência (entrada em grupo, RF03). |
| D10 | Papéis | `motorista` e `passageiro` são capacidades do usuário (não herança exclusiva). Vagas disponíveis são calculadas, não armazenadas. |

Pendentes na documentação (fora do código): D2 (Kanban × Scrum, 2 sprints × 4 meses), D11 (datas, "Sistema XYZ", seções vazias), D12 (justificar filtro "só mulheres", que teve 0% na pesquisa de confiança).

## Premissas adicionais da Etapa 5
- **Placa:** aceita formato antigo (ABC1234) e Mercosul (ABC1D23); a documentação diz só "placa válida".
- **Gênero "Outro / prefiro não informar":** não entra no filtro "só para mulheres" (RN05 só define feminino). A regra precisa de confirmação.
- **Senha:** exigida no formulário (UC01), mas não gravada, pois não há servidor para protegê-la.
- **Dados fictícios v2:** trocar a versão dos dados recarrega os três usuários de exemplo (carlos.eduardo@, julia.santos@, mariana.costa@ aluno.udf.edu.br) e apaga contas criadas em teste.
- **Perfil incompleto:** acessa o app, mas a RN02 impedirá criar ou solicitar caronas (Etapas 6 e 7).