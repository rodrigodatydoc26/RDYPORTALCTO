const SUPABASE_URL = 'https://jvwrbrypyrwnaaqijbqm.supabase.co';
const SUPABASE_KEY = 'sb_publishable_UFiCjGs2PuKMxk009jUCeg_NaPw8YUg';
const VALOR_KM = 1.10;

const state = {
    aba: 'home',
    categorias: [],
    ferramentas: [],
    pops: [],
    resmas: [],
    filtros: { busca: '', categoria: 'all' },
    tema: localStorage.getItem('portal-tema') || 'dark'
};

const API = {
    headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
    },
    async fetch(endpoint, opts = {}) {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 10000);
        try {
            const res = await fetch(`${SUPABASE_URL}/rest/v1${endpoint}`, {
                ...opts,
                headers: { ...this.headers, ...opts.headers },
                signal: ctrl.signal
            });
            if (!res.ok) throw new Error((await res.json()).message || 'Erro na requisição');
            if (res.status === 204) return null;
            return await res.json();
        } catch (err) {
            alert(`Erro: ${err.name === 'AbortError' ? 'Tempo esgotado (10s)' : err.message}`);
            throw err;
        } finally {
            clearTimeout(t);
        }
    },
    get:    (ep)       => API.fetch(ep),
    post:   (ep, data) => API.fetch(ep, { method: 'POST',   body: JSON.stringify(data) }),
    patch:  (ep, data) => API.fetch(ep, { method: 'PATCH',  body: JSON.stringify(data) }),
    delete: (ep)       => API.fetch(ep, { method: 'DELETE' })
};

const UI = {
    $:          (id)      => document.getElementById(id),
    render:     (id, html) => { const el = document.getElementById(id); if (el) el.innerHTML = html; },
    formatDate: (d)       => new Date(d).toLocaleDateString('pt-BR'),
    formatNum:  (n)       => Number(n).toLocaleString('pt-BR', { minimumFractionDigits: 2 })
};

// ── TABS ─────────────────────────────────────────────────────────────────────

function initTabs() {
    document.querySelectorAll('[data-tab]').forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            state.aba = tab;
            document.querySelectorAll('[data-tab]').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
            document.querySelectorAll('.view-section').forEach(s => s.classList.toggle('active', s.id === `view-${tab}`));
            if (tab === 'home')    loadHome();
            if (tab === 'pops')   loadPops();
            if (tab === 'resmas') loadResmas();
        });
    });
}

// ── HOME ─────────────────────────────────────────────────────────────────────

async function loadHome() {
    document.body.classList.add('loading');
    try {
        const [cats, cards] = await Promise.all([
            API.get('/categorias?order=ordem.asc'),
            API.get('/ferramentas?order=ordem.asc')
        ]);
        state.categorias = cats || [];
        state.ferramentas = cards || [];
        renderCategoryFilter();
        renderHome();
    } finally {
        document.body.classList.remove('loading');
    }
}

function renderCategoryFilter() {
    const sel = UI.$('filter-category');
    if (!sel) return;
    sel.innerHTML = '<option value="all">Todas as Categorias</option>' +
        state.categorias.map(c => `<option value="${c.id}">${c.nome}</option>`).join('');
}

function renderHome() {
    let items = state.ferramentas;
    if (state.filtros.busca) {
        const q = state.filtros.busca.toLowerCase();
        items = items.filter(f => f.titulo.toLowerCase().includes(q) || (f.descricao || '').toLowerCase().includes(q));
    }
    if (state.filtros.categoria !== 'all') {
        items = items.filter(f => f.categoria_id === state.filtros.categoria);
    }
    const html = items.length
        ? items.map(f => `
            <div class="card" onclick="window.open('${f.url}','_blank')">
                <div class="card-icon"><i data-lucide="${f.icone || 'link'}"></i></div>
                <h3>${f.titulo}</h3>
                <p>${f.descricao || ''}</p>
                ${f.tag ? `<span class="badge">${f.tag}</span>` : ''}
                <div class="card-actions" onclick="event.stopPropagation()">
                    <button class="btn-icon" title="Deletar" onclick="deletarFerramenta('${f.id}')">
                        <i data-lucide="trash-2"></i>
                    </button>
                </div>
            </div>`).join('')
        : '<p class="text-muted text-center py-40">Nenhuma ferramenta encontrada.</p>';
    UI.render('cards-grid', html);
    if (window.lucide) lucide.createIcons();
}

async function deletarFerramenta(id) {
    if (!confirm('Remover esta ferramenta?')) return;
    const pass = prompt('Senha admin:');
    if (pass !== 'cto2026') { alert('Senha incorreta.'); return; }
    await API.delete(`/ferramentas?id=eq.${id}`);
    await loadHome();
}

function initSearch() {
    const input = UI.$('main-search');
    if (!input) return;
    let t;
    input.addEventListener('input', e => {
        clearTimeout(t);
        t = setTimeout(() => { state.filtros.busca = e.target.value; renderHome(); }, 300);
    });
    UI.$('filter-category')?.addEventListener('change', e => {
        state.filtros.categoria = e.target.value;
        renderHome();
    });
}

// ── POPs ─────────────────────────────────────────────────────────────────────

async function loadPops() {
    UI.render('pops-container', '<p class="text-center py-40">Carregando...</p>');
    try {
        const data = await API.get('/pops?ativo=eq.true&order=titulo.asc');
        state.pops = data || [];
        renderPops();
    } catch { /* alert já exibido pelo API */ }
}

function renderPops() {
    if (!state.pops.length) {
        UI.render('pops-container', '<p class="text-muted text-center py-40">Nenhum POP cadastrado.</p>');
        return;
    }
    const html = `<div class="table-container">
        <table id="pops-table">
            <thead>
                <tr><th>Título</th><th>Categoria</th><th>Objetivo</th><th></th></tr>
            </thead>
            <tbody>
                ${state.pops.map(p => `
                <tr>
                    <td>${p.titulo}</td>
                    <td><span class="badge">${p.categoria}</span></td>
                    <td class="text-muted">${p.objetivo || '—'}</td>
                    <td class="td-actions">
                        <button class="btn-icon" title="Deletar" onclick="deletarPop('${p.id}')">
                            <i data-lucide="trash-2"></i>
                        </button>
                    </td>
                </tr>`).join('')}
            </tbody>
        </table>
    </div>`;
    UI.render('pops-container', html);
    if (window.lucide) lucide.createIcons();
}

async function salvarPop() {
    const titulo    = UI.$('pop-titulo')?.value?.trim();
    const categoria = UI.$('pop-categoria')?.value?.trim();
    const objetivo  = UI.$('pop-objetivo')?.value?.trim();
    if (!titulo || !categoria) { alert('Preencha Título e Categoria.'); return; }

    document.body.classList.add('loading');
    try {
        await API.post('/pops', { titulo, categoria, objetivo: objetivo || null });
        UI.$('pop-titulo').value    = '';
        UI.$('pop-categoria').value = '';
        UI.$('pop-objetivo').value  = '';
        await loadPops();
    } finally {
        document.body.classList.remove('loading');
    }
}

async function deletarPop(id) {
    if (!confirm('Remover este POP?')) return;
    const pass = prompt('Senha admin:');
    if (pass !== 'cto2026') { alert('Senha incorreta.'); return; }
    await API.delete(`/pops?id=eq.${id}`);
    await loadPops();
}

// ── RESMAS ───────────────────────────────────────────────────────────────────

async function loadResmas() {
    UI.render('resmas-list', '<tr><td colspan="6" class="text-center">Carregando...</td></tr>');
    try {
        const data = await API.get('/resmas?order=data_registro.desc');
        state.resmas = data || [];
        renderResmas();
    } catch { /* alert já exibido */ }
}

function renderResmas() {
    const html = state.resmas.length
        ? state.resmas.map(r => `
            <tr>
                <td>${UI.formatDate(r.data_registro)}</td>
                <td>${r.equipamento}</td>
                <td>${r.operador}</td>
                <td>${r.quantidade}</td>
                <td><span class="badge badge-${statusClass(r.status)}">${r.status}</span></td>
                <td class="td-actions">
                    <button class="btn-icon" title="Deletar" onclick="deletarResma('${r.id}')">
                        <i data-lucide="trash-2"></i>
                    </button>
                </td>
            </tr>`).join('')
        : '<tr><td colspan="6" class="text-center text-muted">Nenhum registro encontrado.</td></tr>';
    UI.render('resmas-list', html);
    if (window.lucide) lucide.createIcons();
}

function statusClass(s) {
    return s === 'entregue' ? 'success' : s === 'cancelado' ? 'danger' : 'muted';
}

async function deletarResma(id) {
    if (!confirm('Remover este registro?')) return;
    const pass = prompt('Senha admin:');
    if (pass !== 'cto2026') { alert('Senha incorreta.'); return; }
    await API.delete(`/resmas?id=eq.${id}`);
    await loadResmas();
}

// ── CALCULADORA KM ───────────────────────────────────────────────────────────

function calcularKm() {
    const ini = parseFloat(UI.$('km-inicial')?.value || 0);
    const fim = parseFloat(UI.$('km-final')?.value || 0);
    if (fim <= ini || isNaN(ini) || isNaN(fim)) {
        alert('KM Final deve ser maior que KM Inicial.');
        return;
    }
    const dist  = fim - ini;
    const valor = dist * VALOR_KM;
    const el = UI.$('km-resultado');
    if (!el) return;
    el.innerHTML = `
        <div class="result-row"><span>Distância percorrida:</span><strong>${dist.toFixed(2)} km</strong></div>
        <div class="result-row"><span>Valor por km (R$ ${VALOR_KM.toFixed(2)}):</span><strong>${valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong></div>
    `;
    el.classList.add('has-result');
}

// ── EXPORTAR EXCEL ───────────────────────────────────────────────────────────

const XLSX_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';

function exportarExcel(tabelaId, nome) {
    const table = UI.$(tabelaId);
    if (!table) return;
    if (window.XLSX) {
        _doExport(table, nome);
    } else {
        const s = document.createElement('script');
        s.src = XLSX_CDN;
        s.onload = () => _doExport(table, nome);
        document.head.appendChild(s);
    }
}

function _doExport(table, nome) {
    const wb = XLSX.utils.table_to_book(table);
    XLSX.writeFile(wb, `${nome}_${new Date().toISOString().split('T')[0]}.xlsx`);
}

// ── TEMA ─────────────────────────────────────────────────────────────────────

function toggleTheme() {
    state.tema = state.tema === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', state.tema);
    localStorage.setItem('portal-tema', state.tema);
    const icon = UI.$('theme-icon');
    if (icon) icon.setAttribute('data-lucide', state.tema === 'dark' ? 'moon' : 'sun');
    if (window.lucide) lucide.createIcons();
}

// ── INIT ─────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
    document.documentElement.setAttribute('data-theme', state.tema);
    initTabs();
    initSearch();
    loadHome();
    UI.$('theme-toggle')?.addEventListener('click', toggleTheme);
    UI.$('btn-calc')?.addEventListener('click', calcularKm);
    UI.$('btn-salvar-pop')?.addEventListener('click', salvarPop);
    if (window.lucide) lucide.createIcons();
});
