// orcamentos.js - Gerenciamento de orçamentos

import { Storage } from './storage.js';
import { gerarId, mostrarToast, formatarMoeda } from './utils.js';
import { produtos } from './produtos.js';

// Estado dos orçamentos
export let orcamentos = JSON.parse(localStorage.getItem('ap_orcamentos') || '[]');

// Estado do orçamento atual sendo montado
let orcamentoAtual = [];

export function adicionarItemOrcamento(pecaId, quantidade) {
  const produto = produtos.find(p => p.id === pecaId);
  if (!produto) {
    mostrarToast('Peça não encontrada!', 'error');
    return false;
  }
  
  const existente = orcamentoAtual.find(i => i.id === pecaId);
  if (existente) {
    existente.qty += quantidade;
  } else {
    orcamentoAtual.push({
      id: pecaId,
      nome: produto.nome,
      codigo: produto.codigo,
      qty: quantidade,
      preco: produto.venda
    });
  }
  
  return true;
}

export function removerItemOrcamento(index) {
  orcamentoAtual.splice(index, 1);
}

export function getOrcamentoAtual() {
  return [...orcamentoAtual];
}

export function calcularTotalOrcamento() {
  return orcamentoAtual.reduce((s, i) => s + (i.preco * i.qty), 0);
}

export function limparOrcamentoAtual() {
  orcamentoAtual = [];
}

export function salvarOrcamento(cliente, doc) {
  if (orcamentoAtual.length === 0) {
    mostrarToast('Adicione itens ao orçamento!', 'error');
    return null;
  }
  
  const total = calcularTotalOrcamento();
  
  const orcamento = {
    id: gerarId(),
    numero: orcamentos.length + 1,
    data: new Date().toISOString(),
    cliente: cliente || 'Cliente não informado',
    doc: doc || '',
    itens: [...orcamentoAtual],
    total,
    status: 'pendente', // pendente, aprovado, recusado
    validoAte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 dias
  };
  
  orcamentos.push(orcamento);
  localStorage.setItem('ap_orcamentos', JSON.stringify(orcamentos));
  
  // Limpa o estado atual
  orcamentoAtual = [];
  
  mostrarToast('✅ Orçamento salvo com sucesso!');
  return orcamento;
}

export function aprovarOrcamento(id) {
  const orcamento = orcamentos.find(o => o.id === id);
  if (!orcamento) return null;
  
  // Verifica estoque
  for (const item of orcamento.itens) {
    const produto = produtos.find(p => p.id === item.id);
    if (!produto || produto.qty < item.qty) {
      mostrarToast(`Estoque insuficiente para: ${item.nome}`, 'error');
      return null;
    }
  }
  
  // Baixa estoque
  orcamento.itens.forEach(item => {
    const produto = produtos.find(p => p.id === item.id);
    produto.qty -= item.qty;
  });
  
  orcamento.status = 'aprovado';
  Storage.setProdutos(produtos);
  localStorage.setItem('ap_orcamentos', JSON.stringify(orcamentos));
  
  return orcamento;
}

export function recusarOrcamento(id) {
  const orcamento = orcamentos.find(o => o.id === id);
  if (orcamento) {
    orcamento.status = 'recusado';
    localStorage.setItem('ap_orcamentos', JSON.stringify(orcamentos));
  }
}

export function getTodosOrcamentos() {
  return [...orcamentos].reverse();
}