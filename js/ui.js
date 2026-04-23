// ui.js - Gerenciamento da interface do usuário

import { 
  produtos, 
  getCategorias, 
  editarProduto, 
  excluirProduto,
  solicitarExclusaoProduto,
  limparFormProduto, 
  editProdId 
} from './produtos.js';

import { 
  movimentos, 
  getMovimentosFiltrados, 
  getSaidaItems, 
  adicionarItemSaida, 
  removerItemSaida, 
  calcularTotaisSaida, 
  finalizarSaida, 
  cancelarSaida, 
  registrarEntrada, 
  limparFormEntrada 
} from './movimentos.js';

import { 
  notas, 
  getNota, 
  gerarHTMLNota, 
  imprimirNota, 
  getTodasNotas 
} from './notas.js';

import { 
  formatarMoeda, 
  formatarData, 
  mostrarToast, 
  abrirModal, 
  fecharModal,
  validarCPF,
  validarCNPJ,
  limparMascara
} from './utils.js';

// ===== PAGINAÇÃO =====

class Paginacao {
  constructor(itensPorPagina = 10) {
    this.itensPorPagina = itensPorPagina;
    this.paginaAtual = 1;
    this.totalItens = 0;
  }

  get totalPaginas() {
    return Math.ceil(this.totalItens / this.itensPorPagina) || 1;
  }

  get offset() {
    return (this.paginaAtual - 1) * this.itensPorPagina;
  }

  get limit() {
    return this.itensPorPagina;
  }

  get temProxima() {
    return this.paginaAtual < this.totalPaginas;
  }

  get temAnterior() {
    return this.paginaAtual > 1;
  }

  proximaPagina() {
    if (this.temProxima) this.paginaAtual++;
  }

  paginaAnterior() {
    if (this.temAnterior) this.paginaAtual--;
  }

  irParaPagina(numero) {
    if (numero >= 1 && numero <= this.totalPaginas) {
      this.paginaAtual = numero;
    }
  }

  resetar() {
    this.paginaAtual = 1;
  }

  paginar(lista) {
    this.totalItens = lista.length;
    return lista.slice(this.offset, this.offset + this.limit);
  }

  getInfo() {
    const inicio = this.offset + 1;
    const fim = Math.min(this.offset + this.limit, this.totalItens);
    return `${inicio}-${fim} de ${this.totalItens}`;
  }
}

function gerarHTMLPaginacao(paginacao) {
  const p = paginacao;
  
  return `
    <div class="paginacao">
      <div class="paginacao-info">
        Mostrando ${p.getInfo()} itens
      </div>
      <div class="paginacao-controles">
        <button class="btn btn-ghost btn-sm ${!p.temAnterior ? 'btn-disabled' : ''}" 
                ${!p.temAnterior ? 'disabled' : ''} 
                data-pagina="anterior">
          ◀ Anterior
        </button>
        <span class="paginacao-paginas">Página ${p.paginaAtual} de ${p.totalPaginas}</span>
        <button class="btn btn-ghost btn-sm ${!p.temProxima ? 'btn-disabled' : ''}" 
                ${!p.temProxima ? 'disabled' : ''} 
                data-pagina="proxima">
          Próxima ▶
        </button>
      </div>
    </div>
  `;
}

// ===== ESTADO DA UI =====
let paginaAtual = 'dashboard';
let filtroMovimentos = 'todos';
let confirmCallback = null;

// ===== NOTIFICAÇÕES =====
let notificacaoAtiva = false;
let intervaloNotificacao = null;
let chartCategorias = null;

// ====== ESTADO DE PAGINAÇÃO =====
let paginacaoEstoque = new Paginacao(10);
let paginacaoMovimentos = new Paginacao(10);

// ===== NAVEGAÇÃO =====
export function mostrarPagina(nome) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(`page-${nome}`).classList.add('active');
  
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.querySelector(`[data-page="${nome}"]`)?.classList.add('active');
  
  const titulos = {
    dashboard: 'Dashboard',
    estoque: 'Estoque',
    movimentos: 'Movimentos',
    entrada: 'Entrada de Peças',
    saida: 'Saída / Venda',
    notas: 'Notas Fiscais',
    orcamentos: 'Orçamentos',
    relatorios: 'Relatórios',
  };
  document.getElementById('page-title').textContent = titulos[nome] || nome;
  
  paginaAtual = nome;
  renderizarPaginaAtual();
}

function renderizarPaginaAtual() {
  switch(paginaAtual) {
    case 'dashboard': renderDashboard(); break;
    case 'estoque': renderEstoque(); break;
    case 'movimentos': renderMovimentos(); break;
    case 'entrada': populateSelects(); break;
    case 'saida': populateSelects(); renderSaidaItems(); break;
    case 'notas': renderNotas(); break;
    case 'orcamentos': renderOrcamentos(); break;
    case 'relatorios': renderRelatorios(); break;
  }
}

// ===== DASHBOARD =====
export function renderDashboard() {
  const total = produtos.length;
  const valorEstoque = produtos.reduce((s, p) => s + (p.custo * p.qty), 0);
  const criticos = produtos.filter(p => p.qty <= p.min);
  
  document.getElementById('stat-total').textContent = total;
  document.getElementById('stat-valor').textContent = 'R$ ' + formatarMoeda(valorEstoque);
  document.getElementById('stat-baixo').textContent = criticos.length;
  document.getElementById('stat-notas').textContent = notas.length;
  
  const badge = document.getElementById('alert-badge');
  if (badge) {
    badge.textContent = `● ${criticos.length} ALERTA${criticos.length !== 1 ? 'S' : ''}`;
  }
  
  const listaBaixo = document.getElementById('lista-baixo');
  if (criticos.length === 0) {
    listaBaixo.innerHTML = '<p style="color:var(--text3);padding:20px;text-align:center">✅ Nenhum item crítico.</p>';
  } else {
    listaBaixo.innerHTML = criticos.map(p => `
      <div class="mov-item">
        <div class="mov-icon ${p.qty === 0 ? 'mov-out' : 'mov-in'}">${p.qty === 0 ? '❌' : '⚠️'}</div>
        <div class="mov-info">
          <div class="mov-name">${p.nome}</div>
          <div class="mov-meta">${p.codigo} · ${p.categoria}</div>
        </div>
        <span class="stock-badge ${p.qty === 0 ? 'stock-out' : 'stock-low'}">${p.qty} un.</span>
      </div>
    `).join('');
  }
  
  const recentes = [...movimentos].reverse().slice(0, 6);
  const listaMov = document.getElementById('lista-mov-dash');
  if (recentes.length === 0) {
    listaMov.innerHTML = '<p style="color:var(--text3);padding:20px;text-align:center">Nenhum movimento.</p>';
  } else {
    listaMov.innerHTML = recentes.map(m => `
      <div class="mov-item">
        <div class="mov-icon ${m.tipo === 'entrada' ? 'mov-in' : 'mov-out'}">${m.tipo === 'entrada' ? '⬇️' : '⬆️'}</div>
        <div class="mov-info">
          <div class="mov-name">${m.peca}</div>
          <div class="mov-meta">${formatarData(m.data)} · ${m.resp}</div>
        </div>
        <div class="mov-qty ${m.tipo === 'entrada' ? 'qty-in' : 'qty-out'}">${m.tipo === 'entrada' ? '+' : '-'}${m.qty}</div>
      </div>
    `).join('');
  }
  
  renderGraficoCategorias();
}

// ===== GRÁFICO =====
export function renderGraficoCategorias() {
  const canvas = document.getElementById('chart-categorias');
  if (!canvas || typeof Chart === 'undefined') return;
  
  const categorias = {};
  produtos.forEach(p => {
    categorias[p.categoria] = (categorias[p.categoria] || 0) + 1;
  });
  
  const labels = Object.keys(categorias);
  const data = Object.values(categorias);
  const cores = ['#f97316', '#22c55e', '#3b82f6', '#ef4444', '#eab308', '#8b5cf6', '#ec4899', '#06b6d4', '#f59e0b', '#10b981'];
  
  if (chartCategorias) {
    chartCategorias.destroy();
  }
  
  chartCategorias = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: cores.slice(0, labels.length),
        borderWidth: 2,
        borderColor: '#1e242d'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'right',
          labels: { color: '#e2e8f0', font: { family: 'Barlow', size: 12 } }
        }
      }
    }
  });
}

// ===== ESTOQUE =====
export function renderEstoque() {
  const search = document.getElementById('search-estoque')?.value.toLowerCase() || '';
  const cat = document.getElementById('filter-cat')?.value || '';
  const status = document.getElementById('filter-status')?.value || '';
  const ordem = document.getElementById('filter-ordem')?.value || 'nome-asc';
  
  let lista = produtos.filter(p => {
    const matchSearch = !search || p.nome.toLowerCase().includes(search) || p.codigo.toLowerCase().includes(search);
    const matchCat = !cat || p.categoria === cat;
    let matchStatus = true;
    if (status === 'ok') matchStatus = p.qty > p.min;
    else if (status === 'baixo') matchStatus = p.qty <= p.min && p.qty > 0;
    else if (status === 'zerado') matchStatus = p.qty === 0;
    return matchSearch && matchCat && matchStatus;
  });
  
  switch (ordem) {
    case 'nome-asc': lista.sort((a, b) => a.nome.localeCompare(b.nome)); break;
    case 'nome-desc': lista.sort((a, b) => b.nome.localeCompare(a.nome)); break;
    case 'preco-asc': lista.sort((a, b) => a.venda - b.venda); break;
    case 'preco-desc': lista.sort((a, b) => b.venda - a.venda); break;
    case 'qty-asc': lista.sort((a, b) => a.qty - b.qty); break;
    case 'qty-desc': lista.sort((a, b) => b.qty - a.qty); break;
  }
  const countEl = document.getElementById('count-estoque');

  const filterCat = document.getElementById('filter-cat');
  if (filterCat) {
    const cats = getCategorias();
    const currentVal = filterCat.value;
    filterCat.innerHTML = '<option value="">Todas categorias</option>' + 
      cats.map(c => `<option ${c === currentVal ? 'selected' : ''}>${c}</option>`).join('');
  }
  
  if (countEl) countEl.textContent = `${lista.length} itens encontrados`;
  
  const tbody = document.getElementById('tbody-estoque');
  if (lista.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;padding:32px">Nenhuma peça encontrada.</td></tr>`;
    return;
  }
  
  tbody.innerHTML = lista.map(p => {
    let statusCls = 'stock-ok', statusTxt = 'OK';
    if (p.qty === 0) { statusCls = 'stock-out'; statusTxt = 'ZERADO'; }
    else if (p.qty <= p.min) { statusCls = 'stock-low'; statusTxt = 'BAIXO'; }
    
    return `
      <tr>
        <td><span class="code-tag">${p.codigo}</span></td>
        <td><div style="font-weight:600">${p.nome}</div><div style="font-size:11px;color:var(--text3)">${p.marca||''}</div></td>
        <td>${p.categoria}</td>
        <td>${p.localizacao||'—'}</td>
        <td>${p.qty}</td>
        <td>${p.min}</td>
        <td><span class="stock-badge ${statusCls}">${statusTxt}</span></td>
        <td>R$ ${formatarMoeda(p.venda)}</td>
        <td>
          <button class="btn btn-ghost btn-sm btn-editar-produto" data-id="${p.id}">✏️</button>
          <button class="btn btn-red btn-sm btn-excluir-produto" data-id="${p.id}">🗑️</button>
        </td>
      </tr>
    `;
  }).join('');
  
   // Aplica paginação
  paginacaoEstoque.totalItens = lista.length;
  const listaPaginada = paginacaoEstoque.paginar(lista);
  
  // Atualiza contador
  if (countEl) {
    countEl.textContent = `${paginacaoEstoque.totalItens} itens (pág. ${paginacaoEstoque.paginaAtual} de ${paginacaoEstoque.totalPaginas})`;
  }
  
  // Renderiza tabela
  if (listaPaginada.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;padding:32px;color:var(--text3)">Nenhuma peça encontrada.</td></tr>`;
  } else {
    tbody.innerHTML = listaPaginada.map(p => {
      let statusCls = 'stock-ok', statusTxt = 'OK';
      if (p.qty === 0) { statusCls = 'stock-out'; statusTxt = 'ZERADO'; }
      else if (p.qty <= p.min) { statusCls = 'stock-low'; statusTxt = 'BAIXO'; }
      
      return `
        <tr>
          <td><span class="code-tag">${p.codigo}</span></td>
          <td>
            <div style="font-weight:600">${p.nome}</div>
            <div style="font-size:11px;color:var(--text3)">${p.marca||''}</div>
          </td>
          <td style="color:var(--text2)">${p.categoria}</td>
          <td style="font-size:12px;color:var(--text3)">${p.localizacao||'—'}</td>
          <td style="font-family:var(--font-mono);font-size:15px;font-weight:700">${p.qty}</td>
          <td style="font-family:var(--font-mono);color:var(--text3)">${p.min}</td>
          <td><span class="stock-badge ${statusCls}">${statusTxt}</span></td>
          <td style="font-family:var(--font-mono)">R$ ${formatarMoeda(p.venda)}</td>
          <td>
            <div style="display:flex;gap:6px">
              <button class="btn btn-ghost btn-sm btn-editar-produto" data-id="${p.id}">✏️</button>
              <button class="btn btn-red btn-sm btn-excluir-produto" data-id="${p.id}">🗑️</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
    
    // Reaplica event listeners dos botões
    document.querySelectorAll('.btn-editar-produto').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.dataset.id);
        const produto = editarProduto(id);
        if (produto) {
          document.getElementById('modal-prod-title').textContent = '✏️ Editar Peça';
          document.getElementById('prod-codigo').value = produto.codigo;
          document.getElementById('prod-nome').value = produto.nome;
          document.getElementById('prod-cat').value = produto.categoria;
          document.getElementById('prod-desc').value = produto.desc || '';
          document.getElementById('prod-qty').value = produto.qty;
          document.getElementById('prod-min').value = produto.min;
          document.getElementById('prod-custo').value = produto.custo.toFixed(2);
          document.getElementById('prod-venda').value = produto.venda.toFixed(2);
          document.getElementById('prod-loc').value = produto.localizacao || '';
          document.getElementById('prod-marca').value = produto.marca || '';
          abrirModal('modal-produto');
        }
      });
    });
    
    document.querySelectorAll('.btn-excluir-produto').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.dataset.id);
        solicitarExclusaoProduto(id);
      });
    });
  }
  
  // Renderiza controles de paginação
  const containerPaginacao = document.querySelector('#page-estoque .paginacao-container');
  if (containerPaginacao) {
    containerPaginacao.innerHTML = gerarHTMLPaginacao(paginacaoEstoque);
    
    containerPaginacao.querySelectorAll('[data-pagina]').forEach(btn => {
      btn.addEventListener('click', () => {
        const acao = btn.dataset.pagina;
        if (acao === 'anterior') paginacaoEstoque.paginaAnterior();
        else if (acao === 'proxima') paginacaoEstoque.proximaPagina();
        renderEstoque();
      });
    });
  }
}

// ===== MOVIMENTOS =====
export function renderMovimentos() {
  const lista = getMovimentosFiltrados(filtroMovimentos);
  const tbody = document.getElementById('tbody-mov');
  
  if (lista.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:32px">Nenhum movimento.</td></tr>`;
    return;
  }
  
  tbody.innerHTML = lista.map(m => `
    <tr>
      <td>${formatarData(m.data)}</td>
      <td><span class="stock-badge ${m.tipo === 'entrada' ? 'stock-ok' : 'stock-out'}">${m.tipo.toUpperCase()}</span></td>
      <td><div style="font-weight:600">${m.peca}</div><div style="font-size:11px">${m.codigo}</div></td>
      <td style="color:${m.tipo==='entrada'?'var(--green)':'var(--red)'}">${m.tipo==='entrada'?'+':'-'}${m.qty}</td>
      <td>${m.resp||'—'}</td>
      <td>${m.obs||'—'}</td>
    </tr>
  `).join('');
}

export function setFiltroMovimentos(filtro) {
  filtroMovimentos = filtro;
  renderMovimentos();
}

// ===== NOTAS =====
export function renderNotas() {
  const tbody = document.getElementById('tbody-notas');
  const lista = getTodasNotas();
  
  if (lista.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:32px">Nenhuma nota emitida.</td></tr>`;
    return;
  }
  
  tbody.innerHTML = lista.map(n => `
    <tr>
      <td><span class="code-tag">NF-${n.numero}</span></td>
      <td>${formatarData(n.data)}</td>
      <td>${n.cliente}</td>
      <td>${n.doc||'—'}</td>
      <td>${n.itens.length} item(s)</td>
      <td>R$ ${formatarMoeda(n.total)}</td>
      <td>${n.pagamento}</td>
      <td><button class="btn btn-blue btn-sm btn-ver-nf" data-nf="${n.numero}">🧾 Ver</button></td>
    </tr>
  `).join('');
  
  document.querySelectorAll('.btn-ver-nf').forEach(btn => {
    btn.addEventListener('click', () => {
      const numero = parseInt(btn.dataset.nf);
      const nota = getNota(numero);
      if (nota) {
        document.getElementById('nf-content').innerHTML = gerarHTMLNota(nota);
        abrirModal('modal-nf');
      }
    });
  });
}

// ===== SAÍDA =====
export function renderSaidaItems() {
  const items = getSaidaItems();
  const el = document.getElementById('out-items');
  
  if (items.length === 0) {
    el.innerHTML = '<p style="color:var(--text3);text-align:center;padding:20px">Nenhum item adicionado.</p>';
    atualizarTotaisSaida();
    return;
  }
  
  el.innerHTML = `
    <table style="width:100%;font-size:13px">
      <thead><tr><th>Peça</th><th>Qtd</th><th>Unit.</th><th>Total</th><th></th></tr></thead>
      <tbody>
        ${items.map((i, idx) => `
          <tr>
            <td><div style="font-weight:600">${i.nome}</div><div style="font-size:11px">${i.codigo}</div></td>
            <td>${i.qty}</td>
            <td>R$ ${formatarMoeda(i.preco)}</td>
            <td>R$ ${formatarMoeda(i.preco * i.qty)}</td>
            <td><button class="btn btn-red btn-sm btn-remover-item" data-idx="${idx}">✕</button></td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
  
  document.querySelectorAll('.btn-remover-item').forEach(btn => {
    btn.addEventListener('click', () => {
      removerItemSaida(parseInt(btn.dataset.idx));
      renderSaidaItems();
    });
  });
  
  atualizarTotaisSaida();
}

function atualizarTotaisSaida() {
  const { subtotal } = calcularTotaisSaida();
  const desconto = parseFloat(document.getElementById('out-desc')?.value) || 0;
  const total = Math.max(0, subtotal - desconto);
  
  const outSub = document.getElementById('out-sub');
  const outTotal = document.getElementById('out-total');
  if (outSub) outSub.textContent = 'R$ ' + formatarMoeda(subtotal);
  if (outTotal) outTotal.textContent = 'R$ ' + formatarMoeda(total);
}

// ===== SELECTS =====
export function populateSelects() {
  const selects = ['ent-peca', 'out-peca', 'orc-peca'];  // ← ADICIONE 'orc-peca'
  selects.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = '<option value="">Selecione a peça...</option>' +
      produtos.map(p => `<option value="${p.id}">${p.codigo} — ${p.nome} (${p.qty} un.)</option>`).join('');
  });
}

// ===== ATUALIZAÇÃO GERAL =====
export function atualizarUI() {
  populateSelects();
  renderizarPaginaAtual();
}

// ===== NOTIFICAÇÕES DE ESTOQUE =====
export function verificarEstoqueBaixo() {
  const criticos = produtos.filter(p => p.qty <= p.min);
  const badge = document.getElementById('alert-badge');
  if (!badge) return;
  
  if (criticos.length > 0) {
    badge.textContent = `⚠️ ${criticos.length} ALERTA${criticos.length !== 1 ? 'S' : ''}`;
    badge.classList.add('alert-active');
    
    if (!notificacaoAtiva) {
      notificacaoAtiva = true;
      const nomesCriticos = criticos.slice(0, 3).map(p => p.nome).join(', ');
      const mensagem = criticos.length > 3 ? `${nomesCriticos} e mais ${criticos.length - 3} itens...` : `${nomesCriticos}`;
      mostrarToast(`⚠️ Estoque baixo: ${mensagem}`, 'error');
    }
  } else {
    badge.textContent = `● 0 ALERTAS`;
    badge.classList.remove('alert-active');
    notificacaoAtiva = false;
  }
}

export function iniciarMonitoramentoEstoque() {
  intervaloNotificacao = setInterval(verificarEstoqueBaixo, 30000);
  setTimeout(verificarEstoqueBaixo, 2000);
}

// ===== CONFIRMAÇÃO =====
export function confirmarAcao(titulo, mensagem, onConfirm) {
  document.getElementById('confirm-title').textContent = titulo;
  document.getElementById('confirm-message').textContent = mensagem;
  confirmCallback = onConfirm;
  abrirModal('modal-confirmacao');
}

// ===== INICIALIZAÇÃO DE EVENTOS =====
export function inicializarEventos() {
  document.querySelectorAll('[data-page]').forEach(btn => {
    btn.addEventListener('click', (e) => mostrarPagina(e.currentTarget.dataset.page));
  });
  
  document.querySelectorAll('[data-modal]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const modal = e.currentTarget.dataset.modal;
      
      // Só trata modais que NÃO são de orçamento
      if (modal === 'modal-produto') {
        limparFormProduto();
        abrirModal(modal);
      } else if (modal === 'modal-nf') {
        abrirModal(modal);
      } else if (modal === 'modal-confirmacao') {
        abrirModal(modal);
      }
      // modal-orcamento é tratado pelo btn-novo-orcamento
    });
  });
  
  document.querySelectorAll('[data-close-modal]').forEach(btn => {
    btn.addEventListener('click', (e) => fecharModal(e.currentTarget.dataset.closeModal));
  });
  
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.classList.remove('open'); });
  });
  
  document.getElementById('btn-salvar-produto')?.addEventListener('click', () => {
    import('./produtos.js').then(m => {
      m.salvarProduto({
        codigo: document.getElementById('prod-codigo').value,
        nome: document.getElementById('prod-nome').value,
        categoria: document.getElementById('prod-cat').value,
        desc: document.getElementById('prod-desc').value,
        qty: document.getElementById('prod-qty').value,
        min: document.getElementById('prod-min').value,
        custo: document.getElementById('prod-custo').value,
        venda: document.getElementById('prod-venda').value,
        localizacao: document.getElementById('prod-loc').value,
        marca: document.getElementById('prod-marca').value
      });
    });
  });
  
  document.getElementById('search-estoque')?.addEventListener('input', renderEstoque);
  document.getElementById('filter-cat')?.addEventListener('change', renderEstoque);
  document.getElementById('filter-status')?.addEventListener('change', renderEstoque);
  document.getElementById('filter-ordem')?.addEventListener('change', renderEstoque);
  document.getElementById('btn-limpar-filtros')?.addEventListener('click', () => {
    document.getElementById('search-estoque').value = '';
    document.getElementById('filter-cat').value = '';
    document.getElementById('filter-status').value = '';
    document.getElementById('filter-ordem').value = 'nome-asc';
    renderEstoque();
  });
  
  document.querySelectorAll('[data-mov-filter]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('[data-mov-filter]').forEach(b => b.classList.remove('active'));
      e.currentTarget.classList.add('active');
      setFiltroMovimentos(e.currentTarget.dataset.movFilter);
    });
  });
  
  document.getElementById('btn-confirmar-entrada')?.addEventListener('click', () => {
    if (registrarEntrada(
      parseInt(document.getElementById('ent-peca').value),
      parseInt(document.getElementById('ent-qty').value),
      document.getElementById('ent-resp').value,
      document.getElementById('ent-obs').value
    )) limparFormEntrada();
  });
  
  document.getElementById('btn-limpar-entrada')?.addEventListener('click', limparFormEntrada);
  
  document.getElementById('btn-add-item')?.addEventListener('click', () => {
    if (adicionarItemSaida(
      parseInt(document.getElementById('out-peca').value),
      parseInt(document.getElementById('out-qty').value)
    )) {
      document.getElementById('out-peca').value = '';
      document.getElementById('out-qty').value = 1;
      renderSaidaItems();
    }
  });
  
  document.getElementById('out-desc')?.addEventListener('input', atualizarTotaisSaida);
  
  document.getElementById('btn-finalizar-saida')?.addEventListener('click', () => {
    const cliente = document.getElementById('out-cliente').value;
    const doc = document.getElementById('out-doc').value;
    const pagamento = document.getElementById('out-pag').value;
    const desconto = parseFloat(document.getElementById('out-desc').value) || 0;
    
    if (doc && doc.trim() !== '') {
      const numerosDoc = doc.replace(/\D/g, '');
      if (numerosDoc.length === 11 && !validarCPF(doc)) {
        mostrarToast('CPF inválido!', 'error');
        return;
      }
      if (numerosDoc.length === 14 && !validarCNPJ(doc)) {
        mostrarToast('CNPJ inválido!', 'error');
        return;
      }
    }
    
    const nota = finalizarSaida({ cliente, doc, pagamento, desconto });
    if (nota) {
      document.getElementById('out-cliente').value = '';
      document.getElementById('out-doc').value = '';
      document.getElementById('out-desc').value = 0;
      renderSaidaItems();
      document.getElementById('nf-content').innerHTML = gerarHTMLNota(nota);
      abrirModal('modal-nf');
    }
  });
  
  document.getElementById('btn-cancelar-saida')?.addEventListener('click', () => {
    cancelarSaida();
    document.getElementById('out-cliente').value = '';
    document.getElementById('out-doc').value = '';
    document.getElementById('out-desc').value = 0;
    renderSaidaItems();
  });
  
  document.getElementById('btn-imprimir-nf')?.addEventListener('click', () => {
    const content = document.getElementById('nf-printable');
    if (content) imprimirNota(content.outerHTML);
  });
  
  document.getElementById('btn-confirmar-acao')?.addEventListener('click', () => {
    if (confirmCallback) { confirmCallback(); confirmCallback = null; }
    fecharModal('modal-confirmacao');
  });
  

  // Exportar CSV
document.getElementById('btn-exportar-estoque')?.addEventListener('click', () => {
  import('./utils.js').then(m => m.exportarProdutosCSV(produtos));
});

document.getElementById('btn-exportar-movimentos')?.addEventListener('click', () => {
  import('./utils.js').then(m => m.exportarMovimentosCSV(movimentos));
});

document.getElementById('btn-exportar-notas')?.addEventListener('click', () => {
  import('./utils.js').then(m => m.exportarNotasCSV(notas));
});


  // Backup
document.getElementById('btn-backup')?.addEventListener('click', () => {
  import('./storage.js').then(m => {
    m.criarBackup();
    mostrarToast('💾 Backup criado com sucesso!');
  });
});

// Restore - abre janela de seleção de arquivo
document.getElementById('btn-restore')?.addEventListener('click', () => {
  document.getElementById('input-restore')?.click();
});

// Restore - processa o arquivo selecionado
document.getElementById('input-restore')?.addEventListener('change', (e) => {
  const arquivo = e.target.files[0];
  if (!arquivo) return;
  
  import('./storage.js').then(m => {
    m.restaurarBackup(arquivo)
      .then(() => {
        mostrarToast('✅ Backup restaurado! Recarregando...');
        setTimeout(() => location.reload(), 1500);
      })
      .catch(err => mostrarToast('❌ ' + err.message, 'error'));
  });
  
  // Limpa o input para permitir selecionar o mesmo arquivo novamente
  e.target.value = '';
});

// Novo Orçamento
document.getElementById('btn-novo-orcamento')?.addEventListener('click', () => {
  import('./orcamentos.js').then(m => {
    m.limparOrcamentoAtual();
    renderOrcamentoItems();
    populateSelects();
    abrirModal('modal-orcamento');
  });
});

// Adicionar item ao orçamento
document.getElementById('btn-add-item-orc')?.addEventListener('click', () => {
  import('./orcamentos.js').then(m => {
    const pecaId = parseInt(document.getElementById('orc-peca').value);
    const qty = parseInt(document.getElementById('orc-qty').value);
    if (m.adicionarItemOrcamento(pecaId, qty)) {
      document.getElementById('orc-peca').value = '';
      document.getElementById('orc-qty').value = 1;
      renderOrcamentoItems();
    }
  });
});

// Salvar orçamento
document.getElementById('btn-salvar-orcamento')?.addEventListener('click', () => {
  import('./orcamentos.js').then(m => {
    const cliente = document.getElementById('orc-cliente').value;
    const doc = document.getElementById('orc-doc').value;
    if (m.salvarOrcamento(cliente, doc)) {
      document.getElementById('orc-cliente').value = '';
      document.getElementById('orc-doc').value = '';
      fecharModal('modal-orcamento');
      renderOrcamentos();
    }
  });
});

// Período dos relatórios
document.querySelectorAll('.periodo-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    document.querySelectorAll('.periodo-btn').forEach(b => b.classList.remove('active'));
    e.currentTarget.classList.add('active');
    periodoSelecionado = e.currentTarget.dataset.periodo;
    renderRelatorios();
  });
});
}

// ===== EXPORTAÇÃO PARA CSV =====

/**
 * Exporta dados para arquivo CSV
 */
export function exportarParaCSV(dados, nomeArquivo = 'exportacao.csv') {
  if (!dados || dados.length === 0) {
    mostrarToast('Nenhum dado para exportar!', 'error');
    return;
  }

  const headers = Object.keys(dados[0]);
  
  const linhas = [
    headers.join(';'),
    ...dados.map(item => 
      headers.map(h => {
        let valor = item[h] || '';
        if (typeof valor === 'string' && valor.includes(';')) {
          valor = `"${valor}"`;
        }
        return valor;
      }).join(';')
    )
  ];
  
  const BOM = '\uFEFF';
  const csvContent = BOM + linhas.join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = nomeArquivo;
  link.click();
  URL.revokeObjectURL(url);
  
  mostrarToast(`✅ Arquivo "${nomeArquivo}" exportado!`);
}

/**
 * Exporta produtos para CSV
 */
export function exportarProdutosCSV(produtos) {
  const dados = produtos.map(p => ({
    'Codigo': p.codigo,
    'Nome': p.nome,
    'Categoria': p.categoria,
    'Marca': p.marca || '',
    'Localizacao': p.localizacao || '',
    'Quantidade': p.qty,
    'Estoque Minimo': p.min,
    'Preco Custo': formatarMoeda(p.custo),
    'Preco Venda': formatarMoeda(p.venda)
  }));
  
  const data = new Date().toISOString().slice(0, 10);
  exportarParaCSV(dados, `estoque_${data}.csv`);
}

/**
 * Exporta movimentos para CSV
 */
export function exportarMovimentosCSV(movimentos) {
  const dados = movimentos.map(m => ({
    'Data': formatarData(m.data),
    'Tipo': m.tipo.toUpperCase(),
    'Peca': m.peca,
    'Codigo': m.codigo,
    'Quantidade': m.qty,
    'Responsavel': m.resp,
    'Observacao': m.obs || ''
  }));
  
  const data = new Date().toISOString().slice(0, 10);
  exportarParaCSV(dados, `movimentos_${data}.csv`);
}

/**
 * Exporta notas fiscais para CSV
 */
export function exportarNotasCSV(notas) {
  const dados = notas.map(n => ({
    'Numero NF': `NF-${n.numero}`,
    'Data': formatarData(n.data),
    'Cliente': n.cliente,
    'Documento': n.doc || '',
    'Itens': n.itens.length,
    'Subtotal': formatarMoeda(n.subtotal),
    'Desconto': formatarMoeda(n.desconto || 0),
    'Total': formatarMoeda(n.total),
    'Pagamento': n.pagamento
  }));
  
  const data = new Date().toISOString().slice(0, 10);
  exportarParaCSV(dados, `notas_fiscais_${data}.csv`);
}

// ===== ORÇAMENTOS =====

export function renderOrcamentos() {
  import('./orcamentos.js').then(m => {
    const lista = m.getTodosOrcamentos();
    const tbody = document.getElementById('tbody-orcamentos');
    
    if (lista.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:32px">Nenhum orçamento cadastrado.</td></tr>`;
      return;
    }
    
    tbody.innerHTML = lista.map(o => {
      let statusCls = 'stock-ok';
      let statusTxt = 'Pendente';
      if (o.status === 'aprovado') { statusCls = 'stock-ok'; statusTxt = '✅ Aprovado'; }
      else if (o.status === 'recusado') { statusCls = 'stock-out'; statusTxt = '❌ Recusado'; }
      
      return `
        <tr>
          <td><span class="code-tag">#${o.numero}</span></td>
          <td>${formatarData(o.data)}</td>
          <td>${o.cliente}</td>
          <td>${o.itens.length} item(s)</td>
          <td>R$ ${formatarMoeda(o.total)}</td>
          <td><span class="stock-badge ${statusCls}">${statusTxt}</span></td>
          <td>
            <div style="display:flex;gap:6px">
              ${o.status === 'pendente' ? `
                <button class="btn btn-green btn-sm btn-aprovar-orc" data-id="${o.id}">✅ Aprovar</button>
                <button class="btn btn-red btn-sm btn-recusar-orc" data-id="${o.id}">❌ Recusar</button>
              ` : ''}
            </div>
          </td>
        </tr>
      `;
    }).join('');
    
    document.querySelectorAll('.btn-aprovar-orc').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.dataset.id);
        m.aprovarOrcamento(id);
        renderOrcamentos();
        atualizarUI();
      });
    });
    
    document.querySelectorAll('.btn-recusar-orc').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.dataset.id);
        m.recusarOrcamento(id);
        renderOrcamentos();
      });
    });
  });
}

export function renderOrcamentoItems() {
  import('./orcamentos.js').then(m => {
    const items = m.getOrcamentoAtual();
    const el = document.getElementById('orc-items');
    
    if (items.length === 0) {
      el.innerHTML = '<p style="color:var(--text3);text-align:center;padding:20px">Nenhum item adicionado.</p>';
    } else {
      el.innerHTML = `
        <table style="width:100%;font-size:13px">
          <thead><tr><th>Peça</th><th>Qtd</th><th>Unit.</th><th>Total</th><th></th></tr></thead>
          <tbody>
            ${items.map((i, idx) => `
              <tr>
                <td><div style="font-weight:600">${i.nome}</div><div style="font-size:11px">${i.codigo}</div></td>
                <td>${i.qty}</td>
                <td>R$ ${formatarMoeda(i.preco)}</td>
                <td>R$ ${formatarMoeda(i.preco * i.qty)}</td>
                <td><button class="btn btn-red btn-sm btn-remover-orc" data-idx="${idx}">✕</button></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
      
      document.querySelectorAll('.btn-remover-orc').forEach(btn => {
        btn.addEventListener('click', () => {
          m.removerItemOrcamento(parseInt(btn.dataset.idx));
          renderOrcamentoItems();
          document.getElementById('orc-total').textContent = 'R$ ' + formatarMoeda(m.calcularTotalOrcamento());
        });
      });
    }
    
    document.getElementById('orc-total').textContent = 'R$ ' + formatarMoeda(m.calcularTotalOrcamento());
  });
}

// ===== RELATÓRIOS =====

let periodoSelecionado = 'todos';
let chartVendas = null;

export function renderRelatorios() {
  const agora = new Date();
  let dataInicio;
  
  switch (periodoSelecionado) {
    case 'hoje':
      dataInicio = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
      break;
    case 'semana':
      dataInicio = new Date(agora.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'mes':
      dataInicio = new Date(agora.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    default:
      dataInicio = new Date(0); // todos
  }
  
  const vendasFiltradas = notas.filter(n => new Date(n.data) >= dataInicio);
  
  // Cards
  const faturamentoTotal = vendasFiltradas.reduce((s, n) => s + n.total, 0);
  document.getElementById('rel-fat-total').textContent = 'R$ ' + formatarMoeda(faturamentoTotal);
  document.getElementById('rel-total-vendas').textContent = vendasFiltradas.length;
  
  // Produto mais vendido
  const contagem = {};
  vendasFiltradas.forEach(n => {
    n.itens.forEach(i => {
      contagem[i.nome] = (contagem[i.nome] || 0) + i.qty;
    });
  });
  
  const topNome = Object.entries(contagem).sort((a, b) => b[1] - a[1])[0];
  if (topNome) {
    document.getElementById('rel-top-produto').textContent = topNome[0];
    document.getElementById('rel-top-qtd').textContent = topNome[1] + ' un. vendidas';
  }
  
  // Média diária
  const dias = Math.max(1, Math.ceil((agora - dataInicio) / (24 * 60 * 60 * 1000)));
  const mediaDiaria = faturamentoTotal / dias;
  document.getElementById('rel-media-diaria').textContent = 'R$ ' + formatarMoeda(mediaDiaria);
  
  // Gráfico
  renderGraficoVendas(vendasFiltradas);
  
  // Top 5 produtos
  renderTopProdutos(contagem);
}

function renderGraficoVendas(vendas) {
  const canvas = document.getElementById('chart-vendas');
  if (!canvas || typeof Chart === 'undefined') return;
  
  // Agrupa por data
  const porData = {};
  vendas.forEach(v => {
    const data = new Date(v.data).toLocaleDateString('pt-BR');
    porData[data] = (porData[data] || 0) + v.total;
  });
  
  const labels = Object.keys(porData);
  const data = Object.values(porData);
  
  if (chartVendas) chartVendas.destroy();
  
  chartVendas = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Vendas (R$)',
        data: data,
        backgroundColor: '#f97316',
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          ticks: { color: '#94a3b8' },
          grid: { color: '#2a3340' }
        },
        x: {
          ticks: { color: '#94a3b8', maxRotation: 45 },
          grid: { display: false }
        }
      }
    }
  });
}

function renderTopProdutos(contagem) {
  const top5 = Object.entries(contagem).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const el = document.getElementById('lista-top-produtos');
  
  if (top5.length === 0) {
    el.innerHTML = '<p style="color:var(--text3);text-align:center;padding:20px">Nenhuma venda no período.</p>';
    return;
  }
  
  el.innerHTML = top5.map(([nome, qtd], i) => `
    <div class="mov-item">
      <div style="font-family:var(--font-display);font-size:24px;font-weight:900;color:var(--accent);width:40px">#${i + 1}</div>
      <div class="mov-info">
        <div class="mov-name">${nome}</div>
        <div class="mov-meta">${qtd} unidades vendidas</div>
      </div>
      <div style="width:${Math.min(100, qty * 5)}px;height:8px;background:var(--accent);border-radius:4px"></div>
    </div>
  `).join('');
}