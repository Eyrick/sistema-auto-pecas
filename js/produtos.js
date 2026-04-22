// produtos.js - Gerenciamento de produtos

import { Storage } from './storage.js';
import { gerarId, mostrarToast, fecharModal } from './utils.js';
import { atualizarUI, populateSelects, renderEstoque, renderDashboard } from './ui.js';
import { confirmarAcao } from './ui.js';

// Estado global dos produtos
export let produtos = Storage.getProdutos();
export let editProdId = null;

/**
 * Salva um novo produto ou atualiza um existente
 * @param {Object} dados - Dados do produto
 * @returns {boolean} Sucesso da operação
 */
export function salvarProduto(dados) {
  const { codigo, nome, categoria, desc, qty, min, custo, venda, localizacao, marca } = dados;
  
  // Validação básica
  if (!nome || !codigo) {
    mostrarToast('Preencha nome e código!', 'error');
    return false;
  }

  if (!categoria) {
    mostrarToast('Selecione uma categoria!', 'error');
    return false;
  }

  const produto = {
    id: editProdId || gerarId(),
    codigo: codigo.trim().toUpperCase(),
    nome: nome.trim(),
    categoria,
    desc: desc || '',
    qty: parseInt(qty) || 0,
    min: parseInt(min) || 0,
    custo: parseFloat(custo) || 0,
    venda: parseFloat(venda) || 0,
    localizacao: localizacao || '',
    marca: marca || '',
    criado: new Date().toISOString()
  };

  if (editProdId) {
    // Atualização
    const idx = produtos.findIndex(p => p.id === editProdId);
    if (idx >= 0) {
      produtos[idx] = produto;
      mostrarToast('✅ Peça atualizada com sucesso!');
    }
  } else {
    // Criação - verifica código duplicado
    if (produtos.find(p => p.codigo === produto.codigo)) {
      mostrarToast('❌ Código já existe!', 'error');
      return false;
    }
    produtos.push(produto);
    mostrarToast('✅ Peça cadastrada com sucesso!');
  }

  Storage.setProdutos(produtos);
  editProdId = null;
  fecharModal('modal-produto');
  atualizarUI();
  
  return true;
}

/**
 * Carrega os dados de um produto para edição
 * @param {number} id - ID do produto
 * @returns {Object|null} Dados do produto ou null
 */
export function editarProduto(id) {
  const produto = produtos.find(p => p.id === id);
  if (!produto) return null;
  
  editProdId = id;
  return produto;
}

/**
 * Exclui um produto do estoque
 * @param {number} id - ID do produto
 * @returns {boolean} Sucesso da operação
 */

export function solicitarExclusaoProduto(id) {
  const produto = produtos.find(p => p.id === id);
  if (!produto) return;
  
  confirmarAcao(
    '🗑️ Excluir Peça',
    `Tem certeza que deseja excluir permanentemente "${produto.nome}"?`,
    () => {
      produtos = produtos.filter(p => p.id !== id);
      Storage.setProdutos(produtos);
      atualizarUI();
      mostrarToast('✅ Peça removida com sucesso!');
    }
  );
}

/**
 * Retorna lista única de categorias ordenadas
 * @returns {Array} Lista de categorias
 */
export function getCategorias() {
  return [...new Set(produtos.map(p => p.categoria))].sort();
}

/**
 * Busca um produto pelo ID
 * @param {number} id - ID do produto
 * @returns {Object|undefined} Produto encontrado
 */
export function getProdutoPorId(id) {
  return produtos.find(p => p.id === id);
}

/**
 * Inicializa produtos com dados de exemplo se o estoque estiver vazio
 */
export function inicializarProdutos() {
  if (produtos.length === 0) {
    produtos = [
      { id: 1, codigo: 'AP-0001', nome: 'Pastilha de Freio Dianteira', categoria: 'Freios', desc: 'Compatível com GM Onix, Cobalt', qty: 12, min: 5, custo: 45.00, venda: 89.90, localizacao: 'Prateleira A-1', marca: 'Bendix', criado: new Date().toISOString() },
      { id: 2, codigo: 'AP-0002', nome: 'Filtro de Óleo', categoria: 'Filtros', desc: 'Universal rosca 3/4', qty: 3, min: 5, custo: 12.00, venda: 24.90, localizacao: 'Prateleira B-2', marca: 'Mann', criado: new Date().toISOString() },
      { id: 3, codigo: 'AP-0003', nome: 'Amortecedor Dianteiro', categoria: 'Suspensão', desc: 'Fiat Palio / Siena', qty: 0, min: 2, custo: 180.00, venda: 340.00, localizacao: 'Galpão C-5', marca: 'Monroe', criado: new Date().toISOString() },
      { id: 4, codigo: 'AP-0004', nome: 'Correia Dentada', categoria: 'Motor', desc: 'VW Gol 1.0 AP', qty: 8, min: 3, custo: 35.00, venda: 79.90, localizacao: 'Prateleira A-4', marca: 'Gates', criado: new Date().toISOString() },
      { id: 5, codigo: 'AP-0005', nome: 'Vela de Ignição', categoria: 'Elétrica', desc: 'NGK BKR6E — compatibilidade ampla', qty: 24, min: 10, custo: 8.00, venda: 18.00, localizacao: 'Prateleira D-1', marca: 'NGK', criado: new Date().toISOString() },
      { id: 6, codigo: 'AP-0006', nome: 'Disco de Freio', categoria: 'Freios', desc: 'Honda Civic 2007-2012', qty: 4, min: 2, custo: 95.00, venda: 189.90, localizacao: 'Galpão B-2', marca: 'Fremax', criado: new Date().toISOString() }
    ];
    Storage.setProdutos(produtos);
  }
}

/**
 * Limpa o formulário de produto
 */
export function limparFormProduto() {
  editProdId = null;
  document.getElementById('modal-prod-title').textContent = '➕ Cadastrar Nova Peça';
  document.getElementById('prod-codigo').value = '';
  document.getElementById('prod-nome').value = '';
  document.getElementById('prod-desc').value = '';
  document.getElementById('prod-qty').value = 0;
  document.getElementById('prod-min').value = 5;
  document.getElementById('prod-custo').value = '0.00';
  document.getElementById('prod-venda').value = '0.00';
  document.getElementById('prod-loc').value = '';
  document.getElementById('prod-marca').value = '';
}