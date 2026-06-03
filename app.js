// ===== APP.JS — Cardápio Digital =====

function getData() {
  try {
    const saved = localStorage.getItem('cardapio_data');
    return saved ? JSON.parse(saved) : window.MENU_DEFAULT;
  } catch { return window.MENU_DEFAULT; }
}

const state = { carrinho: [], catAtiva: 'todos', buscaAberta: false, termo: '' };
const DATA = getData();

function applyConfig(cfg) {
  document.title = cfg.nome + ' — Cardápio Digital';
  document.getElementById('logo-emoji').textContent = cfg.emoji || '🍽️';
  document.getElementById('logo-nome').textContent = cfg.nome;
  document.getElementById('logo-sub').textContent = cfg.subtitulo;
  document.getElementById('footer-emoji').textContent = cfg.emoji || '🍽️';
  document.getElementById('footer-nome').textContent = cfg.nome;
  document.getElementById('footer-sub').textContent = cfg.subtitulo;
  document.getElementById('footer-copy-nome').textContent = cfg.nome;
  document.getElementById('footer-end').textContent = cfg.endereco;
  document.getElementById('footer-tel').textContent = cfg.telefone;
  document.getElementById('footer-hor').textContent = cfg.horario;
  document.getElementById('footer-whats').href = 'https://wa.me/' + cfg.whatsapp;
  document.documentElement.style.setProperty('--primary', cfg.corPrimaria);

  const badgeEl = document.getElementById('hero-badges');
  badgeEl.innerHTML = [cfg.heroBadge1, cfg.heroBadge2, cfg.heroBadge3]
    .filter(Boolean).map(b => `<div class="badge">${b}</div>`).join('');
}

function renderCategorias(cats) {
  const scroll = document.getElementById('cats-scroll');
  scroll.innerHTML = `<button class="cat-btn active" data-cat="todos">🍽️ Todos</button>`;
  cats.forEach(cat => {
    const btn = document.createElement('button');
    btn.className = 'cat-btn';
    btn.dataset.cat = cat.id;
    btn.textContent = `${cat.emoji} ${cat.nome}`;
    scroll.appendChild(btn);
  });
  bindCatBtns();
}

function tagLabel(tag) {
  if (!tag) return '';
  const map = { popular: ['Popular',''], novo: ['Novo','novo'], chef: ['Chef indica','chef'] };
  const [label, cls] = map[tag] || [tag,''];
  return `<span class="card-tag ${cls}">${label}</span>`;
}

function imgEl(foto, nome) {
  return `<img src="${foto}" alt="${nome}" loading="lazy"
    onerror="this.style.display='none';this.nextElementSibling.style.display='flex';" />
    <div class="img-fallback" style="display:none;">🍽️</div>`;
}

function produtoCard(p) {
  return `<div class="card-produto ${p.destaque?'destaque':''}" data-cat="${p.cat}" data-id="${p.id}" data-nome="${p.nome}" data-preco="${p.preco}">
    <div class="card-img-wrap">${imgEl(p.foto,p.nome)}${tagLabel(p.tag)}</div>
    <div class="card-body">
      <h3 class="card-nome">${p.nome}</h3>
      <p class="card-desc">${p.desc}</p>
      <div class="card-footer">
        <span class="card-preco">${fmt(p.preco)}</span>
        <button class="btn-add" data-nome="${p.nome}" data-preco="${p.preco}" data-foto="${p.foto}">+ Adicionar</button>
      </div>
    </div>
  </div>`;
}

function comboCard(p) {
  const extras = (p.extras||[]).map(e=>`<li>${e}</li>`).join('');
  const precoOld = p.precoOriginal ? `<span class="card-preco-old">${fmt(p.precoOriginal)}</span>` : '';
  return `<div class="card-produto card-combo ${p.destaque?'destaque':''}" data-cat="${p.cat}" data-id="${p.id}" data-nome="${p.nome}" data-preco="${p.preco}">
    <div class="card-img-wrap card-combo">${imgEl(p.foto,p.nome)}${tagLabel(p.tag)}</div>
    <div class="card-body">
      <h3 class="card-nome">${p.nome}</h3>
      <p class="card-desc">${p.desc}</p>
      ${extras?`<ul class="combo-itens">${extras}</ul>`:''}
      <div class="card-footer">
        <div>${precoOld}<span class="card-preco">${fmt(p.preco)}</span></div>
        <button class="btn-add" data-nome="${p.nome}" data-preco="${p.preco}" data-foto="${p.foto}">+ Adicionar</button>
      </div>
    </div>
  </div>`;
}

function renderMenu(cats, produtos) {
  const main = document.getElementById('main');
  main.innerHTML = '';
  cats.forEach(cat => {
    const itens = produtos.filter(p => p.cat === cat.id && p.ativo !== false);
    if (!itens.length) return;
    const isCombo = cat.id === 'combos';
    const sec = document.createElement('section');
    sec.className = 'secao';
    sec.dataset.secao = cat.id;
    sec.innerHTML = `
      <div class="secao-header">
        <h2 class="secao-titulo"><span>${cat.emoji}</span> ${cat.nome}</h2>
        <p class="secao-desc">${cat.desc}</p>
      </div>
      <div class="grid-produtos ${isCombo?'grid-combos':''}">
        ${itens.map(p => isCombo ? comboCard(p) : produtoCard(p)).join('')}
      </div>`;
    main.appendChild(sec);
  });
}

function bindCatBtns() {
  document.querySelectorAll('.cat-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.catAtiva = btn.dataset.cat;
      filtrar();
      if (state.catAtiva !== 'todos') {
        setTimeout(() => {
          const sec = document.querySelector(`.secao[data-secao="${state.catAtiva}"]`);
          if (sec) window.scrollTo({ top: sec.getBoundingClientRect().top + window.scrollY - 130, behavior: 'smooth' });
        }, 60);
      } else window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });
}

function filtrar() {
  const cat = state.catAtiva;
  const termo = state.termo;
  document.querySelectorAll('.secao').forEach(s => s.style.display = cat==='todos'||s.dataset.secao===cat ? '' : 'none');
  const cards = [...document.querySelectorAll('.card-produto')];
  let vis = 0;
  if (termo) {
    cards.forEach(c => {
      const match = c.dataset.nome.toLowerCase().includes(termo)
        || (c.querySelector('.card-desc')?.textContent.toLowerCase().includes(termo));
      c.style.display = match ? '' : 'none';
      if (match) vis++;
    });
    document.querySelectorAll('.secao').forEach(s => {
      if (s.style.display==='none') return;
      s.style.display = [...s.querySelectorAll('.card-produto')].some(c=>c.style.display!=='none') ? '' : 'none';
    });
    document.getElementById('searchResultBar').style.display = 'flex';
    document.getElementById('searchResultText').textContent = `${vis} resultado${vis!==1?'s':''} para "${document.getElementById('searchInput').value}"`;
    document.getElementById('semResultados').style.display = vis===0 ? 'flex' : 'none';
  } else {
    cards.forEach(c => { c.style.display = (cat==='todos'||c.dataset.cat===cat) ? '' : 'none'; });
    document.getElementById('searchResultBar').style.display = 'none';
    document.getElementById('semResultados').style.display = 'none';
  }
}

// Busca
document.getElementById('btnSearchToggle').addEventListener('click', () => {
  state.buscaAberta = !state.buscaAberta;
  document.getElementById('searchBar').classList.toggle('open', state.buscaAberta);
  if (state.buscaAberta) setTimeout(() => document.getElementById('searchInput').focus(), 300);
  else { document.getElementById('searchInput').value=''; state.termo=''; filtrar(); }
});
document.getElementById('searchInput').addEventListener('input', e => { state.termo = e.target.value.trim().toLowerCase(); filtrar(); });
document.getElementById('btnClear').addEventListener('click', () => { document.getElementById('searchInput').value=''; state.termo=''; filtrar(); });
document.getElementById('btnLimparBusca').addEventListener('click', () => {
  document.getElementById('searchInput').value=''; state.termo=''; state.buscaAberta=false;
  document.getElementById('searchBar').classList.remove('open'); filtrar();
});

// Carrinho
document.getElementById('btnCart').addEventListener('click', () => abrirCart());
document.getElementById('btnCloseCart').addEventListener('click', fecharCart);
document.getElementById('cartOverlay').addEventListener('click', fecharCart);
function abrirCart() {
  document.getElementById('cartPanel').classList.add('open');
  document.getElementById('cartOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function fecharCart() {
  document.getElementById('cartPanel').classList.remove('open');
  document.getElementById('cartOverlay').classList.remove('open');
  document.body.style.overflow = '';
}

document.addEventListener('click', e => {
  const btn = e.target.closest('.btn-add');
  if (!btn) return;
  const nome = btn.dataset.nome, preco = parseFloat(btn.dataset.preco), foto = btn.dataset.foto||'';
  const ex = state.carrinho.find(i => i.nome===nome);
  if (ex) ex.qty++; else state.carrinho.push({nome,preco,foto,qty:1});
  atualizarCart();
  toast(`✅ ${nome} adicionado!`);
  btn.textContent='✓ Adicionado'; btn.style.background='#27ae60';
  setTimeout(() => { btn.textContent='+ Adicionar'; btn.style.background=''; }, 1400);
});

document.getElementById('cartItems').addEventListener('click', e => {
  const btn = e.target.closest('.btn-qty');
  if (!btn) return;
  const idx = parseInt(btn.dataset.idx);
  if (btn.dataset.action==='inc') state.carrinho[idx].qty++;
  else { state.carrinho[idx].qty--; if (state.carrinho[idx].qty<=0) state.carrinho.splice(idx,1); }
  atualizarCart();
});

document.getElementById('btnLimparCart').addEventListener('click', () => { state.carrinho=[]; atualizarCart(); toast('🗑️ Carrinho limpo'); });

document.getElementById('btnPedido').addEventListener('click', () => {
  if (!state.carrinho.length) return;
  const total = state.carrinho.reduce((s,i)=>s+i.preco*i.qty,0);
  const linhas = state.carrinho.map(i=>`• ${i.nome} x${i.qty} — ${fmt(i.preco*i.qty)}`).join('\n');
  const cfg = getData().config;
  const msg = encodeURIComponent(`🍽️ *Pedido — ${cfg.nome}*\n\n${linhas}\n\n*Total: ${fmt(total)}*\n\nPedido via Cardápio Digital 📱`);
  window.open(`https://wa.me/${cfg.whatsapp}?text=${msg}`, '_blank');
});

function atualizarCart() {
  const total = state.carrinho.reduce((s,i)=>s+i.preco*i.qty,0);
  const qty = state.carrinho.reduce((s,i)=>s+i.qty,0);
  const badge = document.getElementById('cartBadge');
  badge.textContent = qty; badge.style.display = qty>0 ? 'flex' : 'none';
  document.getElementById('cartTotal').textContent = fmt(total);
  document.getElementById('cartFooter').style.display = state.carrinho.length ? 'block' : 'none';
  document.getElementById('cartEmpty').style.display = state.carrinho.length ? 'none' : 'flex';
  const container = document.getElementById('cartItems');
  container.querySelectorAll('.cart-item').forEach(el=>el.remove());
  state.carrinho.forEach((item,idx) => {
    const el = document.createElement('div');
    el.className = 'cart-item';
    const thumb = item.foto
      ? `<img class="cart-item-thumb" src="${item.foto}" alt="${item.nome}" onerror="this.style.display='none'">`
      : `<div class="cart-item-thumb-emoji">🍽️</div>`;
    el.innerHTML = `${thumb}
      <div class="cart-item-info">
        <div class="cart-item-nome">${item.nome}</div>
        <div class="cart-item-preco">${fmt(item.preco*item.qty)}</div>
      </div>
      <div class="cart-item-controls">
        <button class="btn-qty" data-action="dec" data-idx="${idx}">−</button>
        <span class="qty-num">${item.qty}</span>
        <button class="btn-qty" data-action="inc" data-idx="${idx}">+</button>
      </div>`;
    container.insertBefore(el, document.getElementById('cartEmpty'));
  });
}

let toastTimer;
function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg; el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
}

function fmt(v) { return v.toLocaleString('pt-BR',{style:'currency',currency:'BRL'}); }

window.addEventListener('scroll', () => {
  document.getElementById('header').style.boxShadow =
    window.scrollY>10 ? '0 4px 24px rgba(0,0,0,0.35)' : '0 2px 20px rgba(0,0,0,0.3)';
}, {passive:true});

// INIT
applyConfig(DATA.config);
renderCategorias(DATA.categorias);
renderMenu(DATA.categorias, DATA.produtos);
atualizarCart();
