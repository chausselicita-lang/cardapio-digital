// ===== CARDÁPIO DIGITAL — Sabor & Arte =====

const state = {
  carrinho: [],
  categoriaAtiva: 'todos',
  buscaAberta: false,
  termoBusca: ''
};

// ===== SELETORES =====
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];

const btnSearchToggle = $('#btnSearchToggle');
const btnCart = $('#btnCart');
const cartBadge = $('#cartBadge');
const cartPanel = $('#cartPanel');
const cartOverlay = $('#cartOverlay');
const btnCloseCart = $('#btnCloseCart');
const cartItems = $('#cartItems');
const cartEmpty = $('#cartEmpty');
const cartFooter = $('#cartFooter');
const cartTotal = $('#cartTotal');
const btnPedido = $('#btnPedido');
const btnLimparCart = $('#btnLimparCart');
const searchBar = $('#searchBar');
const searchInput = $('#searchInput');
const btnClear = $('#btnClear');
const searchResultBar = $('#searchResultBar');
const searchResultText = $('#searchResultText');
const btnLimparBusca = $('#btnLimparBusca');
const semResultados = $('#semResultados');
const toast = $('#toast');

// ===== CATEGORIAS =====
$$('.cat-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    $$('.cat-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.categoriaAtiva = btn.dataset.cat;
    filtrarConteudo();
  });
});

// ===== BUSCA =====
btnSearchToggle.addEventListener('click', () => {
  state.buscaAberta = !state.buscaAberta;
  searchBar.classList.toggle('open', state.buscaAberta);
  if (state.buscaAberta) {
    setTimeout(() => searchInput.focus(), 300);
  } else {
    limparBusca();
  }
});

searchInput.addEventListener('input', () => {
  state.termoBusca = searchInput.value.trim().toLowerCase();
  filtrarConteudo();
});

btnClear.addEventListener('click', limparBusca);
btnLimparBusca.addEventListener('click', () => {
  limparBusca();
  state.buscaAberta = false;
  searchBar.classList.remove('open');
});

function limparBusca() {
  searchInput.value = '';
  state.termoBusca = '';
  filtrarConteudo();
}

// ===== FILTRAR CONTEÚDO =====
function filtrarConteudo() {
  const cat = state.categoriaAtiva;
  const termo = state.termoBusca;
  const cards = $$('.card-produto');
  let visiveisTotal = 0;

  // Mostrar/ocultar seções
  $$('.secao').forEach(sec => {
    const secCat = sec.dataset.secao;
    const mostrarSecao = cat === 'todos' || cat === secCat;
    sec.style.display = mostrarSecao ? '' : 'none';
  });

  // Filtrar cards por busca
  if (termo) {
    cards.forEach(card => {
      const nome = card.dataset.nome.toLowerCase();
      const desc = card.querySelector('.card-desc')?.textContent.toLowerCase() || '';
      const visivel = nome.includes(termo) || desc.includes(termo);
      card.style.display = visivel ? '' : 'none';
      if (visivel) visiveisTotal++;
    });

    // Ocultar seções vazias na busca
    $$('.secao').forEach(sec => {
      if (sec.style.display === 'none') return;
      const cardsVisiveis = [...sec.querySelectorAll('.card-produto')].filter(c => c.style.display !== 'none');
      sec.style.display = cardsVisiveis.length ? '' : 'none';
    });

    searchResultBar.style.display = 'flex';
    searchResultText.textContent = `${visiveisTotal} resultado${visiveisTotal !== 1 ? 's' : ''} para "${searchInput.value}"`;
    semResultados.style.display = visiveisTotal === 0 ? 'flex' : 'none';
  } else {
    cards.forEach(c => c.style.display = '');
    searchResultBar.style.display = 'none';
    semResultados.style.display = 'none';

    // Reaplicar filtro de categoria
    if (cat !== 'todos') {
      cards.forEach(card => {
        const cardCat = card.dataset.cat;
        card.style.display = cardCat === cat ? '' : 'none';
      });
    }
  }
}

// ===== CARRINHO =====
function abrirCarrinho() {
  cartPanel.classList.add('open');
  cartOverlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function fecharCarrinho() {
  cartPanel.classList.remove('open');
  cartOverlay.classList.remove('open');
  document.body.style.overflow = '';
}

btnCart.addEventListener('click', abrirCarrinho);
btnCloseCart.addEventListener('click', fecharCarrinho);
cartOverlay.addEventListener('click', fecharCarrinho);

// ===== ADICIONAR AO CARRINHO =====
document.addEventListener('click', (e) => {
  const btn = e.target.closest('.btn-add');
  if (!btn) return;
  const nome = btn.dataset.nome;
  const preco = parseFloat(btn.dataset.preco);
  const emoji = btn.dataset.emoji;

  const existente = state.carrinho.find(item => item.nome === nome);
  if (existente) {
    existente.qty++;
  } else {
    state.carrinho.push({ nome, preco, emoji, qty: 1 });
  }

  atualizarCarrinho();
  mostrarToast(`${emoji} ${nome} adicionado!`);

  // Animação no botão
  btn.textContent = '✓ Adicionado';
  btn.style.background = '#27ae60';
  setTimeout(() => {
    btn.textContent = '+ Adicionar';
    btn.style.background = '';
  }, 1400);
});

// ===== ATUALIZAR CARRINHO =====
function atualizarCarrinho() {
  const total = state.carrinho.reduce((s, i) => s + i.preco * i.qty, 0);
  const qtdTotal = state.carrinho.reduce((s, i) => s + i.qty, 0);

  // Badge
  cartBadge.textContent = qtdTotal;
  cartBadge.style.display = qtdTotal > 0 ? 'flex' : 'none';

  // Total
  cartTotal.textContent = formatarPreco(total);

  // Footer
  cartFooter.style.display = state.carrinho.length ? 'block' : 'none';

  // Empty state
  cartEmpty.style.display = state.carrinho.length ? 'none' : 'flex';

  // Renderizar itens
  const itemsExistentes = cartItems.querySelectorAll('.cart-item');
  itemsExistentes.forEach(i => i.remove());

  state.carrinho.forEach((item, idx) => {
    const el = document.createElement('div');
    el.className = 'cart-item';
    el.innerHTML = `
      <span class="cart-item-emoji">${item.emoji}</span>
      <div class="cart-item-info">
        <div class="cart-item-nome">${item.nome}</div>
        <div class="cart-item-preco">${formatarPreco(item.preco * item.qty)}</div>
      </div>
      <div class="cart-item-controls">
        <button class="btn-qty" data-action="dec" data-idx="${idx}">−</button>
        <span class="qty-num">${item.qty}</span>
        <button class="btn-qty" data-action="inc" data-idx="${idx}">+</button>
      </div>
    `;
    cartItems.insertBefore(el, cartEmpty);
  });
}

// Controles de quantidade no carrinho
cartItems.addEventListener('click', (e) => {
  const btn = e.target.closest('.btn-qty');
  if (!btn) return;
  const idx = parseInt(btn.dataset.idx);
  const action = btn.dataset.action;

  if (action === 'inc') {
    state.carrinho[idx].qty++;
  } else {
    state.carrinho[idx].qty--;
    if (state.carrinho[idx].qty <= 0) {
      state.carrinho.splice(idx, 1);
    }
  }
  atualizarCarrinho();
});

// Limpar carrinho
btnLimparCart.addEventListener('click', () => {
  state.carrinho = [];
  atualizarCarrinho();
  mostrarToast('🗑️ Carrinho limpo');
});

// ===== PEDIDO VIA WHATSAPP =====
btnPedido.addEventListener('click', () => {
  if (state.carrinho.length === 0) return;
  const total = state.carrinho.reduce((s, i) => s + i.preco * i.qty, 0);
  const linhas = state.carrinho.map(i =>
    `${i.emoji} ${i.nome} x${i.qty} — ${formatarPreco(i.preco * i.qty)}`
  ).join('\n');
  const msg = encodeURIComponent(
    `🍽️ *Pedido — Sabor & Arte*\n\n${linhas}\n\n*Total: ${formatarPreco(total)}*\n\nPedido via Cardápio Digital 📱`
  );
  window.open(`https://wa.me/5511999999999?text=${msg}`, '_blank');
});

// ===== TOAST =====
let toastTimer;
function mostrarToast(msg) {
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
}

// ===== UTIL =====
function formatarPreco(val) {
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// ===== SCROLL SUAVE PARA SEÇÕES =====
$$('.cat-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const cat = btn.dataset.cat;
    if (cat === 'todos') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setTimeout(() => {
      const secao = document.querySelector(`.secao[data-secao="${cat}"]`);
      if (secao && secao.style.display !== 'none') {
        const offset = secao.getBoundingClientRect().top + window.scrollY - 130;
        window.scrollTo({ top: offset, behavior: 'smooth' });
      }
    }, 60);
  });
});

// ===== HEADER SHADOW NO SCROLL =====
window.addEventListener('scroll', () => {
  const header = $('#header');
  header.style.boxShadow = window.scrollY > 10
    ? '0 4px 24px rgba(0,0,0,0.35)'
    : '0 2px 20px rgba(0,0,0,0.3)';
}, { passive: true });

// ===== INICIALIZAR =====
atualizarCarrinho();
console.log('%c🍽️ Cardápio Digital — Sabor & Arte', 'color:#E8420A;font-size:16px;font-weight:bold;');
console.log('%cDesenvolvido com ❤️ para bares, lanchonetes e restaurantes', 'color:#888;font-size:12px;');
