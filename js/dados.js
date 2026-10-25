// Modelo de dados do protótipo (espelha o diagrama de classes, seção 10.2 da documentação).
// Persistência 100% local e FICTÍCIA: não há servidor, e-mail ou pagamento reais.
import { salvar, carregar } from "./store.js";

export { DOMINIOS_UDF, CAPACIDADE_MIN, CAPACIDADE_MAX } from "./regras.js";
const VERSAO = 2; // v2: usuários ganham campos de acesso/perfil (Etapa 5); trocar a versão recarrega os dados fictícios
const COLECOES = ["usuarios", "veiculos", "caronas", "solicitacoes"];

export const listar = (colecao) => carregar(colecao, []);
export const obter = (colecao, id) => listar(colecao).find((x) => x.id === id) ?? null;

export function atualizar(colecao, id, alteracoes) {
  const lista = listar(colecao);
  const i = lista.findIndex((x) => x.id === id);
  if (i < 0) return null;
  lista[i] = { ...lista[i], ...alteracoes };
  return salvar(colecao, lista) ? lista[i] : null;
}

export function inserir(colecao, item) {
  const lista = listar(colecao);
  const registro = { ...item, id: item.id ?? `${colecao.slice(0, 3)}-${Date.now().toString(36)}-${lista.length}` };
  return salvar(colecao, [...lista, registro]) ? registro : null;
}

// "Papel" é capacidade do usuário, não herança exclusiva: 33,3% da pesquisa quer ser "Ambos".
// Vagas disponíveis são DERIVADAS das solicitações confirmadas (evita o atributo duplicado da classe Carona).
export function vagasDisponiveis(carona) {
  const ocupadas = listar("solicitacoes").filter((s) => s.caronaId === carona.id && s.status === "confirmada").length;
  return Math.max(0, carona.vagasTotal - ocupadas);
}

const emDias = (dias, hora, min) => {
  const d = new Date(); d.setDate(d.getDate() + dias); d.setHours(hora, min, 0, 0);
  return d.toISOString();
};

export function iniciarDados() {
  if (carregar("versao-dados", 0) === VERSAO && COLECOES.every((c) => listar(c).length > 0)) return;
  salvar("usuarios", [
    { id: "u1", nome: "Carlos Eduardo", email: "carlos.eduardo@aluno.udf.edu.br", curso: "Análise e Desenvolvimento de Sistemas", turno: "Noturno", genero: "masculino", telefone: "(61) 90000-0001", motorista: true, passageiro: true, contatoNome: "", contatoTel: "", emailVerificado: true, termosUsoEm: emDias(-30, 9, 0), telefoneVerificado: true, fotoNome: "foto-ficticia.jpg", cnhNome: "cnh-ficticia.jpg" },
    { id: "u2", nome: "Júlia Santos", email: "julia.santos@aluno.udf.edu.br", curso: "Análise e Desenvolvimento de Sistemas", turno: "Noturno", genero: "feminino", telefone: "(61) 90000-0002", motorista: false, passageiro: true, contatoNome: "", contatoTel: "", emailVerificado: true, termosUsoEm: emDias(-30, 9, 0), telefoneVerificado: true, fotoNome: "foto-ficticia.jpg", cnhNome: "" },
    { id: "u3", nome: "Mariana Costa", email: "mariana.costa@aluno.udf.edu.br", curso: "Direito", turno: "Matutino", genero: "feminino", telefone: "(61) 90000-0003", motorista: true, passageiro: true, contatoNome: "", contatoTel: "", emailVerificado: true, termosUsoEm: emDias(-30, 9, 0), telefoneVerificado: true, fotoNome: "foto-ficticia.jpg", cnhNome: "cnh-ficticia.jpg" }
  ]);
  salvar("veiculos", [
    { id: "v1", motoristaId: "u1", placa: "FAB1C23", modelo: "Chevrolet Onix", cor: "Prata", capacidade: 4 },
    { id: "v2", motoristaId: "u3", placa: "FAB4D56", modelo: "Fiat Argo", cor: "Branco", capacidade: 3 }
  ]);
  salvar("caronas", [
    { id: "c1", motoristaId: "u1", veiculoId: "v1", origem: "Águas Claras", destino: "UDF Campus Sede (Asa Sul)", dataHoraSaida: emDias(1, 18, 30), toleranciaMin: 10, vagasTotal: 3, valor: 7.5, regras: "Bagagem pequena", recorrente: false, apenasMulheres: false, status: "aberta" },
    { id: "c2", motoristaId: "u3", veiculoId: "v2", origem: "Guará", destino: "UDF Campus Sede (Asa Sul)", dataHoraSaida: emDias(2, 6, 45), toleranciaMin: 5, vagasTotal: 2, valor: 0, regras: "", recorrente: true, apenasMulheres: true, status: "aberta" }
  ]);
  salvar("solicitacoes", [
    { id: "s1", caronaId: "c1", passageiroId: "u2", status: "confirmada", aceiteTermosEm: emDias(0, 9, 0) }
  ]);
  salvar("versao-dados", VERSAO);
}