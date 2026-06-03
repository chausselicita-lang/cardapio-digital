// ===== ADMIN.JS =====

const STORAGE_KEY = 'cardapio_data';

function getData() {
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    return s ? JSON.parse(s) : JSON.parse(JSON.stringify(window.MENU_DEFAULT));
  } catch { return JSON.parse(JSON.stringify(window.MENU_DEFAULT)); }
}

function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function getSenha() {
  return getData().config.senhaAdmin || 'admin123';
}

// ===== LOGIN =====
const loginScreen = document.getElementById('loginScreen');
const dashboard = document.getElementById('dashboard');

if (sessionStorage.getItem('admin_ok') === '1') showDashboard();

document.getElementById('loginForm').addEventListener('submit', e => {
  e.preventDefault();
  const val = document.getElementById('loginSenha').value;
  if (val === getSenha()) {
    sessionStorage.setItem('admin_ok', '1');
    showDashboard();
  } else {
    document.getElementById('loginErro').style.display = 'block';
  }
});

function showDashboard() {
  loginScreen.style.display = 'none';
  dashboard.style.display = 'flex';
  initDashboard();
}

document.getElementById('btnLogout').addEventListener('click', () => {
  sessionStorage.removeItem('admin_ok');
  location.reload();
});

// ===== NAVEGAÇÃO =====
function initDashboard() {
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('panel-' + btn.dataset.panel).classList.add('active');
      if (btn.dataset.panel === 'cadastros') carregarPainelCadastros();
    });
  });
  carregarTabelaPratos();
  carregarFormConfig();
  initFormConfig();
  initFormSenha();
  initModal();
  atualizarBadgeCadastros();
}

// ===== PAINEL PRATOS =====
function carregarTabelaPratos() {
  const data = getData();
  const body = document.getElementById('tabelaBody');
  const filtroNome = document.getElementById('filtroNome').value.toLowerCase();
  const filtroCat = document.getElementById('filtroCat').value;

  // Popular select de categorias
  const sel = document.getElementById('filtroCat');
  if (sel.options.length <= 1) {
    data.categorias.forEach(cat => {
      const opt = document.createElement('option');
      opt.value = cat.id; opt.textContent = `${cat.emoji} ${cat.nome}`;
      sel.appendChild(opt);
    });
  }

  let prods = data.produtos;
  if (filtroNome) prods = prods.filter(p => p.nome.toLowerCase().includes(filtroNome));
  if (filtroCat) prods = prods.filter(p => p.cat === filtroCat);

  body.innerHTML = prods.map(p => {
    const cat = data.categorias.find(c => c.id === p.cat);
    const tagHtml = p.tag ? `<span class="badge-tag ${p.tag}">${p.tag}</span>` : '—';
    const foto = p.foto
      ? `<img class="table-foto" src="${p.foto}" alt="${p.nome}" onerror="this.outerHTML='<div class=\\'table-foto-ph\\'>🍽️</div>'">`
      : `<div class="table-foto-ph">🍽️</div>`;
    return `<tr>
      <td>${foto}</td>
      <td><strong>${p.nome}</strong></td>
      <td>${cat ? cat.emoji + ' ' + cat.nome : p.cat}</td>
      <td><strong style="color:var(--primary)">${fmt(p.preco)}</strong></td>
      <td>${tagHtml}</td>
      <td><button class="toggle-ativo ${p.ativo!==false?'on':''}" data-id="${p.id}" title="${p.ativo!==false?'Ativo':'Inativo'}"></button></td>
      <td>
        <button class="btn-edit" data-id="${p.id}">✏️ Editar</button>
        <button class="btn-del" data-id="${p.id}">🗑️</button>
      </td>
    </tr>`;
  }).join('') || `<tr><td colspan="7" style="text-align:center;padding:32px;color:var(--text3)">Nenhum item encontrado</td></tr>`;

  // Eventos da tabela
  body.querySelectorAll('.toggle-ativo').forEach(btn => {
    btn.addEventListener('click', () => {
      const data = getData();
      const p = data.produtos.find(x => x.id === btn.dataset.id);
      if (p) { p.ativo = !(p.ativo !== false); saveData(data); carregarTabelaPratos(); toast('✅ Status atualizado'); }
    });
  });

  body.querySelectorAll('.btn-edit').forEach(btn => {
    btn.addEventListener('click', () => abrirModalEditar(btn.dataset.id));
  });

  body.querySelectorAll('.btn-del').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!confirm('Excluir este prato do cardápio?')) return;
      const data = getData();
      data.produtos = data.produtos.filter(x => x.id !== btn.dataset.id);
      saveData(data); carregarTabelaPratos(); toast('🗑️ Prato excluído');
    });
  });
}

document.getElementById('filtroNome').addEventListener('input', carregarTabelaPratos);
document.getElementById('filtroCat').addEventListener('change', carregarTabelaPratos);
document.getElementById('btnNovoPrato').addEventListener('click', () => abrirModalNovo());

// ===== MODAL =====
function initModal() {
  document.getElementById('btnModalClose').addEventListener('click', fecharModal);
  document.getElementById('btnCancelarModal').addEventListener('click', fecharModal);
  document.getElementById('modalOverlay').addEventListener('click', e => {
    if (e.target === document.getElementById('modalOverlay')) fecharModal();
  });

  // Preview foto
  document.getElementById('pFoto').addEventListener('input', e => {
    const url = e.target.value.trim();
    const preview = document.getElementById('fotoPreview');
    const img = document.getElementById('fotoPreviewImg');
    if (url) { img.src = url; preview.style.display = 'block'; }
    else preview.style.display = 'none';
  });

  // Popular select categoria no modal
  const catSel = document.getElementById('pCat');
  getData().categorias.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat.id; opt.textContent = `${cat.emoji} ${cat.nome}`;
    catSel.appendChild(opt);
  });

  document.getElementById('formPrato').addEventListener('submit', salvarPrato);
}

function abrirModalNovo() {
  document.getElementById('modalTitulo').textContent = 'Novo Prato';
  document.getElementById('formPrato').reset();
  document.getElementById('pratoId').value = '';
  document.getElementById('fotoPreview').style.display = 'none';
  document.getElementById('pAtivo').checked = true;
  document.getElementById('modalOverlay').classList.add('open');
}

function abrirModalEditar(id) {
  const data = getData();
  const p = data.produtos.find(x => x.id === id);
  if (!p) return;
  document.getElementById('modalTitulo').textContent = 'Editar Prato';
  document.getElementById('pratoId').value = p.id;
  document.getElementById('pNome').value = p.nome;
  document.getElementById('pDesc').value = p.desc || '';
  document.getElementById('pPreco').value = p.preco;
  document.getElementById('pPrecoOld').value = p.precoOriginal || '';
  document.getElementById('pCat').value = p.cat;
  document.getElementById('pTag').value = p.tag || '';
  document.getElementById('pFoto').value = p.foto || '';
  document.getElementById('pDestaque').value = p.destaque ? 'true' : 'false';
  document.getElementById('pExtras').value = (p.extras || []).join('\n');
  document.getElementById('pAtivo').checked = p.ativo !== false;

  const preview = document.getElementById('fotoPreview');
  if (p.foto) { document.getElementById('fotoPreviewImg').src = p.foto; preview.style.display = 'block'; }
  else preview.style.display = 'none';

  document.getElementById('modalOverlay').classList.add('open');
}

function fecharModal() {
  document.getElementById('modalOverlay').classList.remove('open');
}

function salvarPrato(e) {
  e.preventDefault();
  const data = getData();
  const id = document.getElementById('pratoId').value;
  const extras = document.getElementById('pExtras').value.trim().split('\n').filter(Boolean);

  const prato = {
    id: id || 'p-' + Date.now(),
    nome: document.getElementById('pNome').value.trim(),
    desc: document.getElementById('pDesc').value.trim(),
    preco: parseFloat(document.getElementById('pPreco').value),
    precoOriginal: parseFloat(document.getElementById('pPrecoOld').value) || undefined,
    cat: document.getElementById('pCat').value,
    tag: document.getElementById('pTag').value,
    foto: document.getElementById('pFoto').value.trim(),
    destaque: document.getElementById('pDestaque').value === 'true',
    ativo: document.getElementById('pAtivo').checked,
    extras: extras.length ? extras : undefined
  };
  if (!prato.precoOriginal) delete prato.precoOriginal;
  if (!prato.extras) delete prato.extras;

  if (id) {
    const idx = data.produtos.findIndex(x => x.id === id);
    if (idx >= 0) data.produtos[idx] = prato;
  } else {
    data.produtos.push(prato);
  }

  saveData(data);
  fecharModal();
  carregarTabelaPratos();
  toast(id ? '✅ Prato atualizado!' : '✅ Prato adicionado!');
}

// ===== CONFIGURAÇÕES =====
function carregarFormConfig() {
  const cfg = getData().config;
  document.getElementById('cfg-nome').value = cfg.nome || '';
  document.getElementById('cfg-sub').value = cfg.subtitulo || '';
  document.getElementById('cfg-emoji').value = cfg.emoji || '🍽️';
  document.getElementById('cfg-cor').value = cfg.corPrimaria || '#E8420A';
  document.getElementById('cfg-cor-hex').value = cfg.corPrimaria || '#E8420A';
  document.getElementById('cfg-whats').value = cfg.whatsapp || '';
  document.getElementById('cfg-tel').value = cfg.telefone || '';
  document.getElementById('cfg-end').value = cfg.endereco || '';
  document.getElementById('cfg-hor').value = cfg.horario || '';
  document.getElementById('cfg-b1').value = cfg.heroBadge1 || '';
  document.getElementById('cfg-b2').value = cfg.heroBadge2 || '';
  document.getElementById('cfg-b3').value = cfg.heroBadge3 || '';
  document.getElementById('cfg-pix-chave').value = cfg.pixChave || '';
  document.getElementById('cfg-pix-nome').value = cfg.pixNome || '';
  document.getElementById('cfg-mp-link').value = cfg.mpLink || '';
  document.getElementById('cfg-whats-admin').value = cfg.whatsappAdmin || '';
}

function initFormConfig() {
  // Sincronizar color picker com hex
  document.getElementById('cfg-cor').addEventListener('input', e => {
    document.getElementById('cfg-cor-hex').value = e.target.value;
  });
  document.getElementById('cfg-cor-hex').addEventListener('input', e => {
    const hex = e.target.value;
    if (/^#[0-9A-Fa-f]{6}$/.test(hex)) document.getElementById('cfg-cor').value = hex;
  });

  document.getElementById('formConfig').addEventListener('submit', e => {
    e.preventDefault();
    const data = getData();
    data.config.nome = document.getElementById('cfg-nome').value.trim();
    data.config.subtitulo = document.getElementById('cfg-sub').value.trim();
    data.config.emoji = document.getElementById('cfg-emoji').value.trim();
    data.config.corPrimaria = document.getElementById('cfg-cor').value;
    data.config.whatsapp = document.getElementById('cfg-whats').value.trim();
    data.config.telefone = document.getElementById('cfg-tel').value.trim();
    data.config.endereco = document.getElementById('cfg-end').value.trim();
    data.config.horario = document.getElementById('cfg-hor').value.trim();
    data.config.heroBadge1 = document.getElementById('cfg-b1').value.trim();
    data.config.heroBadge2 = document.getElementById('cfg-b2').value.trim();
    data.config.heroBadge3 = document.getElementById('cfg-b3').value.trim();
    data.config.pixChave = document.getElementById('cfg-pix-chave').value.trim();
    data.config.pixNome = document.getElementById('cfg-pix-nome').value.trim();
    data.config.mpLink = document.getElementById('cfg-mp-link').value.trim();
    data.config.whatsappAdmin = document.getElementById('cfg-whats-admin').value.trim();
    saveData(data);
    toast('✅ Configurações salvas!');
  });

  document.getElementById('btnResetConfig').addEventListener('click', () => {
    if (!confirm('Restaurar configurações padrão? As personalizações serão perdidas.')) return;
    const data = getData();
    data.config = JSON.parse(JSON.stringify(window.MENU_DEFAULT.config));
    data.config.senhaAdmin = getSenha(); // mantém senha
    saveData(data);
    carregarFormConfig();
    toast('♻️ Configurações restauradas');
  });
}

// ===== SENHA =====
function initFormSenha() {
  document.getElementById('formSenha').addEventListener('submit', e => {
    e.preventDefault();
    const atual = document.getElementById('senhaAtual').value;
    const nova = document.getElementById('senhaNova').value;
    const confirm = document.getElementById('senhaConfirm').value;
    if (atual !== getSenha()) { toast('❌ Senha atual incorreta'); return; }
    if (nova.length < 4) { toast('❌ A nova senha precisa ter pelo menos 4 caracteres'); return; }
    if (nova !== confirm) { toast('❌ As senhas não coincidem'); return; }
    const data = getData();
    data.config.senhaAdmin = nova;
    saveData(data);
    document.getElementById('formSenha').reset();
    toast('✅ Senha alterada com sucesso!');
  });
}

// ===== CADASTROS =====
const CAD_KEY = 'cardapio_cadastros';

function getCadastros() {
  try { return JSON.parse(localStorage.getItem(CAD_KEY) || '[]'); } catch { return []; }
}

function saveCadastros(lista) {
  localStorage.setItem(CAD_KEY, JSON.stringify(lista));
}

function atualizarBadgeCadastros() {
  const pendentes = getCadastros().filter(c => c.status === 'aguardando_pagamento').length;
  const badge = document.getElementById('cad-badge');
  if (pendentes > 0) {
    badge.textContent = pendentes;
    badge.style.display = 'inline-block';
  } else {
    badge.style.display = 'none';
  }
}

function carregarPainelCadastros() {
  const lista = getCadastros().sort((a, b) => new Date(b.dataCadastro) - new Date(a.dataCadastro));
  const body = document.getElementById('tabelaCadastrosBody');
  const vazio = document.getElementById('cadastrosVazio');
  const wrap = document.getElementById('cadastrosTableWrap');

  if (!lista.length) {
    vazio.style.display = 'block';
    wrap.style.display = 'none';
    return;
  }

  vazio.style.display = 'none';
  wrap.style.display = 'block';

  body.innerHTML = lista.map(c => {
    const dt = new Date(c.dataCadastro);
    const dtStr = dt.toLocaleDateString('pt-BR') + ' ' + dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const whatsNum = (c.whatsapp || '').replace(/\D/g, '');
    const statusHtml = c.status === 'ativo'
      ? '<span class="badge-cad ativo">✅ Ativo</span>'
      : '<span class="badge-cad pendente">⏳ Aguardando</span>';
    const btnAtivar = c.status === 'aguardando_pagamento'
      ? `<button class="btn-ativar-cad" data-id="${c.id}">✅ Ativar</button>`
      : '';
    return `<tr>
      <td style="font-size:12px;color:var(--text2);white-space:nowrap">${dtStr}</td>
      <td>
        <strong>${c.nome}</strong><br>
        <small style="color:var(--text3)">${c.segmento || ''} — ${c.cidade || ''}</small>
      </td>
      <td>
        ${c.responsavel}<br>
        <small style="color:var(--text3)">${c.email || ''}</small>
      </td>
      <td>
        ${whatsNum
          ? `<a href="https://wa.me/${whatsNum}" target="_blank" style="color:var(--primary);font-weight:600;text-decoration:none">${c.whatsapp}</a>`
          : c.whatsapp}
      </td>
      <td>
        <strong>${c.plano ? c.plano.nome : '—'}</strong><br>
        <small style="color:var(--text3)">${c.plano ? fmt(c.plano.preco) + '/mês' : ''}</small>
      </td>
      <td>${statusHtml}</td>
      <td style="white-space:nowrap">
        ${btnAtivar}
        <button class="btn-del btn-del-cad" data-id="${c.id}" title="Excluir cadastro">🗑️</button>
      </td>
    </tr>`;
  }).join('') || `<tr><td colspan="7" style="text-align:center;padding:32px;color:var(--text3)">Nenhum cadastro encontrado</td></tr>`;

  body.querySelectorAll('.btn-ativar-cad').forEach(btn => {
    btn.addEventListener('click', () => ativarCadastro(btn.dataset.id));
  });
  body.querySelectorAll('.btn-del-cad').forEach(btn => {
    btn.addEventListener('click', () => excluirCadastro(btn.dataset.id));
  });
}

function ativarCadastro(id) {
  if (!confirm('Confirmar ativação do cardápio para este cliente?')) return;
  const lista = getCadastros();
  const c = lista.find(x => x.id === id);
  if (!c) return;
  c.status = 'ativo';
  c.dataAtivacao = new Date().toISOString();
  saveCadastros(lista);
  carregarPainelCadastros();
  atualizarBadgeCadastros();
  toast(`✅ Cardápio de "${c.nome}" ativado!`);
}

function excluirCadastro(id) {
  if (!confirm('Excluir este cadastro permanentemente?')) return;
  saveCadastros(getCadastros().filter(x => x.id !== id));
  carregarPainelCadastros();
  atualizarBadgeCadastros();
  toast('🗑️ Cadastro excluído');
}

// ===== TOAST =====
let toastTimer;
function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg; el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2500);
}

function fmt(v) { return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }
