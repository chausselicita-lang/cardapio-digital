// ===== CARDÁPIO DIGITAL — Sabor & Arte =====

const state = {
  carrinho: [],
  categoriaAtiva: 'todos',
  buscaAberta: false,
  termoBusca: '',
  mesa: null
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

// ===== MESA =====
state.mesa = new URLSearchParams(window.location.search).get('mesa');
const mesaBadgeHeader = $('#mesaBadgeHeader');
const cartMesaInfo = $('#cartMesaInfo');

if (state.mesa) {
  mesaBadgeHeader.style.display = 'flex';
  $('#mesaBadgeText').textContent = `Mesa ${state.mesa}`;
  cartMesaInfo.style.display = 'flex';
  $('#cartMesaText').textContent = `Mesa ${state.mesa}`;
}

// ===== CONFIG =====
function carregarConfig() {
  try { return JSON.parse(localStorage.getItem('cardapio_config') || '{}'); } catch { return {}; }
}

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
let cartHistoryPushed = false;

function abrirCarrinho() {
  cartPanel.classList.add('open');
  cartOverlay.classList.add('open');
  document.body.style.overflow = 'hidden';
  history.pushState({ cart: true }, '');
  cartHistoryPushed = true;
}

function fecharCarrinho() {
  if (!cartPanel.classList.contains('open')) return;
  cartPanel.classList.remove('open');
  cartOverlay.classList.remove('open');
  document.body.style.overflow = '';
  if (cartHistoryPushed) {
    cartHistoryPushed = false;
    history.back();
  }
}

// Seta "voltar" do browser — fecha detalhe primeiro, depois carrinho
window.addEventListener('popstate', () => {
  if (produtoModal.classList.contains('open')) {
    produtoModal.classList.remove('open');
    document.body.style.overflow = '';
    detalhePushed = false;
    return;
  }
  if (cartPanel.classList.contains('open')) {
    cartPanel.classList.remove('open');
    cartOverlay.classList.remove('open');
    document.body.style.overflow = '';
    cartHistoryPushed = false;
  }
});

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
  btn.style.color = 'white';
  btn.style.borderColor = '#27ae60';
  setTimeout(() => {
    btn.textContent = '+ Adicionar';
    btn.style.background = '';
    btn.style.color = '';
    btn.style.borderColor = '';
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

// ===== MODAL DE PAGAMENTO =====
const modalPagOverlay = $('#modalPagOverlay');
const modalPagamento = $('#modalPagamento');

function abrirPagamento() {
  mostrarOpcoesPag();
  modalPagOverlay.classList.add('open');
  modalPagamento.classList.add('open');
}

function fecharPagamento() {
  modalPagOverlay.classList.remove('open');
  modalPagamento.classList.remove('open');
}

function mostrarOpcoesPag() {
  $('#pagOpcoes').style.display = 'block';
  $('#pixPanel').style.display = 'none';
}

btnPedido.addEventListener('click', () => {
  if (state.carrinho.length === 0) return;
  abrirPagamento();
});

$('#btnClosePag').addEventListener('click', fecharPagamento);
modalPagOverlay.addEventListener('click', fecharPagamento);

// PIX
$('#btnPix').addEventListener('click', () => {
  $('#pagOpcoes').style.display = 'none';
  $('#pixPanel').style.display = 'block';
  const config = carregarConfig();
  $('#pixKeyDisplay').textContent = config.chavePix || 'Chave PIX não configurada — consulte o caixa';
});

$('#btnVoltarPix').addEventListener('click', mostrarOpcoesPag);

$('#btnCopiarPix').addEventListener('click', () => {
  const config = carregarConfig();
  const key = config.chavePix || '';
  if (!key) { mostrarToast('⚠️ Chave PIX não configurada'); return; }
  navigator.clipboard.writeText(key)
    .then(() => mostrarToast('🔑 Chave PIX copiada!'))
    .catch(() => mostrarToast('⚠️ Não foi possível copiar'));
});

$('#btnConfirmarPix').addEventListener('click', () => {
  enviarWhatsApp('PIX');
  fecharPagamento();
  fecharCarrinho();
});

// Cartão
$('#btnCartao').addEventListener('click', () => {
  const config = carregarConfig();
  if (config.linkCartao) {
    window.open(config.linkCartao, '_blank');
  } else {
    mostrarToast('⚠️ Link do cartão não configurado');
  }
  enviarWhatsApp('Cartão (Mercado Pago)');
  fecharPagamento();
  fecharCarrinho();
});

// Dinheiro
$('#btnDinheiro').addEventListener('click', () => {
  enviarWhatsApp('Dinheiro');
  fecharPagamento();
  fecharCarrinho();
});

// Vale Refeição
$('#btnVale').addEventListener('click', () => {
  enviarWhatsApp('Vale Refeição (Alelo / Sodexo / VR)');
  fecharPagamento();
  fecharCarrinho();
});

// ===== ENVIAR VIA WHATSAPP =====
function enviarWhatsApp(formaPagamento) {
  const config = carregarConfig();
  const whats = config.whatsapp || '5511999999999';
  const total = state.carrinho.reduce((s, i) => s + i.preco * i.qty, 0);
  const linhas = state.carrinho.map(i =>
    `${i.emoji} ${i.nome} x${i.qty} — ${formatarPreco(i.preco * i.qty)}`
  ).join('\n');
  const mesaInfo = state.mesa ? `\n🪑 *Mesa: ${state.mesa}*` : '';
  const msg = encodeURIComponent(
    `🍽️ *Pedido — Sabor & Arte*${mesaInfo}\n\n${linhas}\n\n*Total: ${formatarPreco(total)}*\n💳 *Pagamento: ${formaPagamento}*\n\nPedido via Cardápio Digital 📱`
  );
  window.open(`https://wa.me/${whats}?text=${msg}`, '_blank');
}

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

// ===== DETALHE DO PRODUTO =====
const produtoModal     = $('#produtoModal');
const btnCloseProduto  = $('#btnCloseProduto');
let detalhePushed = false;

function abrirDetalhe(card) {
  const nome       = card.dataset.nome;
  const desc       = card.querySelector('.card-desc')?.textContent || '';
  const preco      = card.querySelector('.card-preco')?.textContent || '';
  const precoOld   = card.querySelector('.card-preco-old')?.textContent || '';
  const imgEl      = card.querySelector('.card-img img');
  const emojiEl    = card.querySelector('.card-emoji');
  const badgeEl    = card.querySelector('.card-tag');
  const btnOrig    = card.querySelector('.btn-add');

  // Imagem ou emoji
  const mImg = $('#produtoModalImgEl');
  const mEmoji = $('#produtoModalEmojiEl');
  if (imgEl) {
    mImg.src = imgEl.src;
    mImg.alt = nome;
    mImg.style.display = 'block';
    mEmoji.style.display = 'none';
  } else {
    mEmoji.textContent = emojiEl?.textContent || '🍽️';
    mEmoji.style.display = 'flex';
    mImg.style.display = 'none';
  }

  // Badge
  const mBadge = $('#produtoModalBadge');
  if (badgeEl) {
    mBadge.textContent = badgeEl.textContent;
    mBadge.className = 'card-tag produto-modal-badge' +
      (badgeEl.classList.contains('novo')  ? ' novo'  :
       badgeEl.classList.contains('chef')  ? ' chef'  : '');
    mBadge.style.display = '';
  } else {
    mBadge.style.display = 'none';
  }

  // Textos
  $('#produtoModalNome').textContent = nome;
  $('#produtoModalDesc').textContent = desc;

  const mPrecoOld = $('#produtoModalPrecoOld');
  mPrecoOld.textContent = precoOld;
  mPrecoOld.style.display = precoOld ? 'block' : 'none';
  $('#produtoModalPreco').textContent = preco;

  // Itens de combo (se houver)
  const mCombos = $('#produtoModalCombos');
  const comboItens = card.querySelectorAll('.combo-itens li');
  mCombos.innerHTML = '';
  if (comboItens.length) {
    comboItens.forEach(li => {
      const item = document.createElement('li');
      item.textContent = li.textContent;
      mCombos.appendChild(item);
    });
    mCombos.style.display = 'flex';
  } else {
    mCombos.style.display = 'none';
  }

  // Botão adicionar
  const mBtn = $('#produtoModalBtnAdd');
  mBtn.dataset.nome  = btnOrig.dataset.nome;
  mBtn.dataset.preco = btnOrig.dataset.preco;
  mBtn.dataset.emoji = btnOrig.dataset.emoji;
  mBtn.textContent = '+ Adicionar';
  mBtn.style.background = '';
  mBtn.style.color = '';
  mBtn.style.borderColor = '';

  produtoModal.classList.add('open');
  document.body.style.overflow = 'hidden';
  history.pushState({ detail: true }, '');
  detalhePushed = true;
}

function fecharDetalhe() {
  if (!produtoModal.classList.contains('open')) return;
  produtoModal.classList.remove('open');
  document.body.style.overflow = '';
  if (detalhePushed) {
    detalhePushed = false;
    history.back();
  }
}

// Clique no card abre o detalhe (ignora clique no botão Adicionar)
document.addEventListener('click', (e) => {
  if (e.target.closest('.btn-add')) return;
  if (e.target.closest('.produto-modal')) return;
  const card = e.target.closest('.card-produto');
  if (!card) return;
  abrirDetalhe(card);
});

btnCloseProduto.addEventListener('click', fecharDetalhe);

// ===== CARDÁPIO DINÂMICO — SUPABASE =====
const EMOJI_CAT = {
  entradas:'🥗', pratos:'🍖', lanches:'🍔', pizzas:'🍕',
  petiscos:'🍟', bebidas:'🍺', sobremesas:'🍰', combos:'🎁'
};
const TAG_LABELS = { popular:'Popular', novo:'Novo', chef:'Chef indica' };

function criarCard(p) {
  const emoji = EMOJI_CAT[p.categoria] || '🍽️';
  const preco = parseFloat(p.preco).toLocaleString('pt-BR', { style:'currency', currency:'BRL' });
  const tagClass = p.tag === 'novo' ? ' novo' : p.tag === 'chef' ? ' chef' : '';
  const tagHTML  = p.tag ? `<span class="card-tag${tagClass}">${TAG_LABELS[p.tag] || p.tag}</span>` : '';

  const card = document.createElement('div');
  card.className = `card-produto${p.tag === 'chef' ? ' destaque' : ''}`;
  card.dataset.cat   = p.categoria;
  card.dataset.nome  = p.nome;
  card.dataset.preco = p.preco;
  card.innerHTML = `
    <div class="card-img-wrap">
      <div class="card-img">
        ${p.foto_url
          ? `<img src="${p.foto_url}" alt="${p.nome}" loading="lazy" />`
          : `<span class="card-emoji">${emoji}</span>`}
      </div>
      ${tagHTML}
    </div>
    <div class="card-body">
      <h3 class="card-nome">${p.nome}</h3>
      <p class="card-desc">${p.descricao || ''}</p>
      <div class="card-footer">
        <span class="card-preco">${preco}</span>
        <button class="btn-add"
          data-nome="${p.nome}"
          data-preco="${p.preco}"
          data-emoji="${emoji}">+ Adicionar</button>
      </div>
    </div>`;
  return card;
}

async function carregarCardapioSupabase() {
  if (typeof db === 'undefined' || typeof SUPA_RID === 'undefined') return;

  try {
    const { data, error } = await db
      .from('cardapio_items')
      .select('*')
      .eq('restaurante_id', SUPA_RID)
      .eq('disponivel', true)
      .order('ordem');

    if (error || !data || data.length === 0) return;

    // Agrupa por categoria
    const porCat = {};
    data.forEach(p => {
      if (!porCat[p.categoria]) porCat[p.categoria] = [];
      porCat[p.categoria].push(p);
    });

    // Substitui cards estáticos pelos do banco
    $$('.secao').forEach(secao => {
      const cat  = secao.dataset.secao;
      const grid = secao.querySelector('.grid-produtos');
      if (!grid) return;

      const itens = porCat[cat];
      if (!itens || itens.length === 0) {
        secao.style.display = 'none';
        return;
      }

      // Remove cards estáticos e insere os dinâmicos
      secao.querySelectorAll('.card-produto').forEach(c => c.remove());
      itens.forEach(p => grid.appendChild(criarCard(p)));
      secao.style.display = '';
    });

    // Atualiza botões de categoria (oculta cats sem itens)
    $$('.cat-btn[data-cat]').forEach(btn => {
      const cat = btn.dataset.cat;
      if (cat === 'todos') return;
      if (!porCat[cat]) btn.style.display = 'none';
    });

  } catch (err) {
    console.warn('Supabase indisponível, usando itens estáticos.', err);
  }
}

// ===== INICIALIZAR =====
atualizarCarrinho();
carregarCardapioSupabase();
console.log('%c🍽️ Cardápio Digital — Sabor & Arte', 'color:#E8420A;font-size:16px;font-weight:bold;');
console.log('%cDesenvolvido com ❤️ para bares, lanchonetes e restaurantes', 'color:#888;font-size:12px;');
