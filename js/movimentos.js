// movimentos.js - Gerenciamento de movimentos (entradas e saídas)

import { Storage } from './storage.js';
import { produtos } from './produtos.js';
import { gerarId, mostrarToast } from './utils.js';
import { atualizarUI } from './ui.js';
import { criarNotaFiscal } from './notas.js';

// Estado global dos movimentos
export let movimentos = Storage.getMovimentos();

/**
 * Registra uma entrada de produtos no estoque
 * @param {number} pecaId - ID da peça
 * @param {number} quantidade - Quantidade a adicionar
 * @param {string} responsavel - Nome do fornecedor/responsável
 * @param {string} observacao - Observações adicionais
 * @returns {boolean} Sucesso da operação
 */
export function registrarEntrada(pecaId, quantidade, responsavel, observacao = '') {
  const produto = produtos.find(p => p.id === pecaId);
  if (!produto) {
    mostrarToast('Peça não encontrada!', 'error');
    return false;
  }

  if (quantidade <= 0) {
    mostrarToast('Quantidade deve ser maior que zero!', 'error');
    return false;
  }

  // Atualiza estoque
  produto.qty += quantidade;

  // Registra movimento
  movimentos.push({
    id: gerarId(),
    tipo: 'entrada',
    pecaId,
    peca: produto.nome,
    codigo: produto.codigo,
    qty: quantidade,
    resp: responsavel || 'Não informado',
    obs: observacao,
    data: new Date().toISOString()
  });

  Storage.salvarTudo(produtos, movimentos, Storage.getNotas());
  mostrarToast(`✅ +${quantidade} unidade(s) de "${produto.nome}" adicionada(s)!`);
  atualizarUI();
  
  return true;
}

// Estado da venda atual
let saidaItems = [];

/**
 * Adiciona um item à venda atual
 * @param {number} pecaId - ID da peça
 * @param {number} quantidade - Quantidade
 * @returns {boolean} Sucesso da operação
 */
export function adicionarItemSaida(pecaId, quantidade) {
  const produto = produtos.find(p => p.id === pecaId);
  if (!produto) {
    mostrarToast('Peça não encontrada!', 'error');
    return false;
  }

  if (quantidade <= 0) {
    mostrarToast('Quantidade deve ser maior que zero!', 'error');
    return false;
  }

  if (quantidade > produto.qty) {
    mostrarToast(`Estoque insuficiente! Disponível: ${produto.qty} un.`, 'error');
    return false;
  }

  const itemExistente = saidaItems.find(i => i.id === pecaId);
  if (itemExistente) {
    if (itemExistente.qty + quantidade > produto.qty) {
      mostrarToast(`Quantidade total ultrapassa o estoque! Disponível: ${produto.qty} un.`, 'error');
      return false;
    }
    itemExistente.qty += quantidade;
  } else {
    saidaItems.push({
      id: pecaId,
      nome: produto.nome,
      codigo: produto.codigo,
      qty: quantidade,
      preco: produto.venda
    });
  }

  return true;
}

/**
 * Remove um item da venda atual
 * @param {number} index - Índice do item
 */
export function removerItemSaida(index) {
  saidaItems.splice(index, 1);
}

/**
 * Retorna os itens da venda atual
 * @returns {Array} Itens da venda
 */
export function getSaidaItems() {
  return [...saidaItems];
}

/**
 * Calcula os totais da venda atual
 * @returns {Object} Subtotais e total
 */
export function calcularTotaisSaida() {
  const subtotal = saidaItems.reduce((s, i) => s + (i.preco * i.qty), 0);
  return { subtotal };
}

/**
 * Finaliza a venda, baixa estoque e emite NF
 * @param {Object} dadosVenda - Dados do cliente e pagamento
 * @returns {Object|null} Nota fiscal gerada ou null
 */
export function finalizarSaida(dadosVenda) {
  const { cliente, doc, pagamento, desconto } = dadosVenda;

  if (saidaItems.length === 0) {
    mostrarToast('Adicione ao menos um item à venda!', 'error');
    return null;
  }

  // Valida estoque novamente
  for (const item of saidaItems) {
    const produto = produtos.find(p => p.id === item.id);
    if (!produto || produto.qty < item.qty) {
      mostrarToast(`Estoque insuficiente para: ${item.nome}`, 'error');
      return null;
    }
  }

  const subtotal = saidaItems.reduce((s, i) => s + (i.preco * i.qty), 0);
  const total = Math.max(0, subtotal - (desconto || 0));

  // Baixa estoque e registra movimentos
  saidaItems.forEach(item => {
    const produto = produtos.find(p => p.id === item.id);
    produto.qty -= item.qty;
    
    movimentos.push({
      id: gerarId(),
      tipo: 'saida',
      pecaId: item.id,
      peca: item.nome,
      codigo: item.codigo,
      qty: item.qty,
      resp: cliente,
      obs: `Venda — ${doc ? 'Doc: ' + doc : 'Consumidor Final'}`,
      data: new Date().toISOString()
    });
  });

  // Cria nota fiscal
  const nota = criarNotaFiscal({
    cliente: cliente || 'Consumidor Final',
    doc: doc || '',
    itens: [...saidaItems],
    subtotal,
    desconto: desconto || 0,
    total,
    pagamento
  });

  // Salva tudo
  Storage.salvarTudo(produtos, movimentos, Storage.getNotas());
  
  mostrarToast(`✅ Venda finalizada! NF-${nota.numero} emitida.`);

  // Limpa venda atual
  saidaItems = [];
  atualizarUI();

  return nota;
}

/**
 * Cancela a venda atual
 */
export function cancelarSaida() {
  saidaItems = [];
}

/**
 * Retorna movimentos filtrados por tipo
 * @param {string} tipo - 'todos', 'entrada' ou 'saida'
 * @returns {Array} Movimentos filtrados
 */
export function getMovimentosFiltrados(tipo = 'todos') {
  if (tipo === 'todos') return [...movimentos].reverse();
  return movimentos.filter(m => m.tipo === tipo).reverse();
}

/**
 * Limpa o formulário de entrada
 */
export function limparFormEntrada() {
  document.getElementById('ent-peca').value = '';
  document.getElementById('ent-qty').value = 1;
  document.getElementById('ent-resp').value = '';
  document.getElementById('ent-obs').value = '';
}