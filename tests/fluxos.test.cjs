const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const RedeData = require('../rede-data.js');
const flush = async () => { for (let i = 0; i < 12; i++) await Promise.resolve(); };

function ambiente(publico = false) {
    const elementos = new Map(), alertas = [], eventos = {};
    class Elemento {
        constructor(id = '') {
            this.id = id; this.value = ''; this.checked = false; this.disabled = false;
            this.style = {}; this.dataset = {}; this.eventos = {}; this.html = ''; this.textContent = '';
            const classes = new Set();
            this.classList = { add: (...items) => items.forEach(i => classes.add(i)),
                remove: (...items) => items.forEach(i => classes.delete(i)), contains: i => classes.has(i),
                toggle: (i, force) => { const yes = force ?? !classes.has(i); yes ? classes.add(i) : classes.delete(i); return yes; } };
        }
        addEventListener(tipo, fn) { (this.eventos[tipo] ||= []).push(fn); }
        async emitir(tipo, extra = {}) { for (const fn of this.eventos[tipo] || []) await fn({ target: this, preventDefault() {}, ...extra }); }
        set innerHTML(value) { this.html = value; }
        get innerHTML() { return this.html; }
        querySelector(selector) { return el(this.id + ':' + selector); }
        querySelectorAll() { return []; }
        getAttribute(key) { return key === 'data-tab' ? this.dataset.tab : this[key]; }
        setAttribute(key, value) { this[key] = value; }
        remove() { elementos.delete(this.id); }
        focus() {}
        reset() {}
        click() { return this.emitir('click'); }
    }
    function el(id) { if (!elementos.has(id)) elementos.set(id, new Elemento(id)); return elementos.get(id); }
    const tabs = ['manual', 'upload', 'view'].map(id => { const elem = el('tab-' + id); elem.dataset.tab = id; return elem; });
    const operadores = RedeData.OPERADORAS.map(id => { const elem = el(id); elem.checked = true; return elem; });
    const document = {
        getElementById: el,
        querySelector: selector => selector.startsWith('[data-tab=') ? tabs.find(t => selector.includes(t.dataset.tab)) : el(selector),
        querySelectorAll: selector => selector === '.tab-btn' ? tabs : selector === '.tab-content' ? [] :
            selector === '.operadora-checkbox input' ? operadores : [],
        createElement: () => new Elemento(),
        addEventListener: (type, fn) => { eventos[type] = fn; },
        body: { insertAdjacentHTML: (_, html) => {
            for (const match of html.matchAll(/id="([^"]+)"/g)) el(match[1]);
        }, appendChild: elem => elementos.set(elem.id, elem) }
    };
    let callbackAuth;
    const auth = { currentUser: null, onAuthStateChanged: fn => { callbackAuth = fn; },
        signOut: async () => { auth.currentUser = null; callbackAuth(null); } };
    const dados = new Map(); let leituras = 0, escritas = 0, serial = 0, falharLeitura = false;
    const collection = {
        get: async () => {
            leituras++;
            if (falharLeitura) throw Error('quota');
            return { docs: [...dados].map(([id, row]) => ({ id, data: () => row })) };
        },
        doc: id => ({ id: id || 'novo-' + ++serial, delete: async () => { dados.delete(id); } }),
        add: async row => { const ref = collection.doc(); dados.set(ref.id, row); escritas++; return ref; }
    };
    const db = { collection: () => collection, batch: () => {
        const rows = []; return { set: (ref, row) => rows.push([ref.id, row]),
            commit: async () => { rows.forEach(([id, row]) => dados.set(id, row)); escritas += rows.length; } };
    } };
    let form = {}, matriz = [];
    const context = vm.createContext({ document, RedeData, db,
        firebase: { firestore: () => db, auth: () => auth }, firebaseConfig: {},
        window: { addEventListener() {} }, console: { log() {}, error() {} },
        alert: text => alertas.push(text), confirm: () => true, setTimeout, clearTimeout,
        FormData: class { get(key) { return form[key] || ''; } getAll(key) { return form[key] || []; } },
        FileReader: class { readAsArrayBuffer() { this.onload({ target: { result: new ArrayBuffer(0) } }); } },
        XLSX: { read: () => ({ SheetNames: ['Sheet'], Sheets: { Sheet: { '!ref': 'A1:G900' } } }),
            utils: { sheet_to_json: () => matriz, decode_range: () => ({ s: { r: 0 } }) } }
    });
    vm.runInContext(fs.readFileSync(publico ? 'script.js' : 'admin.js', 'utf8'), context);
    return { el, dados, alertas, context, auth,
        async entrar() { auth.currentUser = { uid: 'admin' }; callbackAuth(auth.currentUser); await flush(); },
        async iniciarPublico() { eventos.DOMContentLoaded(); await flush(); },
        form: data => { form = data; },
        async planilha(rows) {
            matriz = [['Nome', 'Estado', 'Cidade', 'Tipo', 'Operadoras', 'Modalidades', 'Planos'], ...rows];
            el('fileInput').files = [{ name: 'rede.xlsx' }]; await el('fileInput').emitir('change');
        },
        get leituras() { return leituras; }, get escritas() { return escritas; },
        falharLeitura(value) { falharLeitura = value; }
    };
}

test('painel importa 850 linhas com uma consulta, mantém filtros locais e eventos únicos', async () => {
    const a = ambiente(); await a.entrar(); assert.equal(a.leituras, 1);
    await a.planilha(Array.from({ length: 850 }, (_, i) => ['Hospital ' + i, 'SP', 'São Paulo', 'hospital', 'Amil']));
    await a.el('confirmUpload').emitir('click');
    assert.equal(a.escritas, 850); assert.equal(a.leituras, 2); assert.equal(a.dados.size, 850);
    await a.el('viewSearch').emitir('input'); await a.el('tab-view').emitir('click');
    assert.equal(a.leituras, 2);
    await a.auth.signOut(); await a.entrar();
    assert.equal(a.el('confirmUpload').eventos.click.length, 1);
    assert.equal(a.el('manualForm').eventos.submit.length, 1);
});

test('cadastro manual cancela/ignora sem gravar e prossegue somente por escolha explícita', async () => {
    for (const acao of ['cancelarDuplicata', 'ignorarDuplicata', 'prosseguirDuplicata']) {
        const a = ambiente();
        a.dados.set('antigo', { nome: 'Hospital', cidade: 'São Paulo', estado: 'SP', tipo: 'hospital', operadoras: ['amil'] });
        await a.entrar(); a.form({ nome: 'Hospital', cidade: 'São Paulo', estado: 'SP', tipo: 'hospital', operadoras: ['amil'] });
        const envio = a.el('manualForm').emitir('submit'); await flush();
        await a.el(acao).emitir('click'); await envio;
        assert.equal(a.escritas, acao === 'prosseguirDuplicata' ? 1 : 0);
        assert.equal(a.leituras, 2);
    }
});

test('falha da leitura impede importação e planilha inválida bloqueia confirmação', async () => {
    const a = ambiente(); await a.entrar();
    await a.planilha([['Hospital', 'SP', 'São Paulo', 'hospital', 'Amil']]);
    a.falharLeitura(true); await a.el('confirmUpload').emitir('click');
    assert.equal(a.escritas, 0); assert.match(a.el('previewTableContainer').textContent, /interrompida/);
    a.falharLeitura(false); await a.planilha([['Hospital', 'SP', 'São Paulo', 'hospital', 'Unimed']]);
    assert.equal(a.el('confirmUpload').disabled, true);
    await a.el('confirmUpload').emitir('click'); assert.equal(a.escritas, 0);
});

test('duplo clique no upload não repete leituras nem gravações', async () => {
    const a = ambiente(); await a.entrar();
    await a.planilha([['Hospital', 'SP', 'São Paulo', 'hospital', 'Amil']]);
    await Promise.all([a.el('confirmUpload').emitir('click'), a.el('confirmUpload').emitir('click')]);
    assert.equal(a.leituras, 2); assert.equal(a.escritas, 1);
});

test('upload ignora duplicatas da base e insere apenas o registro novo', async () => {
    const a = ambiente();
    a.dados.set('antigo', { nome: 'Hospital', cidade: 'São Paulo', estado: 'SP', tipo: 'hospital', operadoras: ['amil'] });
    await a.entrar();
    await a.planilha([['Hospital', 'SP', 'São Paulo', 'hospital', 'Amil'], ['Novo', 'SP', 'São Paulo', 'hospital', 'Amil']]);
    const envio = a.el('confirmUpload').emitir('click'); await flush();
    await a.el('ignorarDuplicata').emitir('click'); await envio;
    assert.equal(a.escritas, 1); assert.equal(a.dados.size, 2); assert.equal(a.leituras, 2);
});

test('consulta pública lê uma vez, filtra localmente e só atualiza por ação explícita', async () => {
    const a = ambiente(true);
    a.dados.set('1', { nome: 'Hospital', cidade: 'São Paulo', estado: 'SP', tipo: 'hospital', operadoras: ['amil'] });
    await a.iniciarPublico(); assert.equal(a.leituras, 1);
    await a.el('searchBtn').emitir('click'); await a.el('tipoFilter').emitir('change'); assert.equal(a.leituras, 1);
    await a.el('refreshDataBtn').emitir('click'); await flush(); assert.equal(a.leituras, 2);
    a.falharLeitura(true); await a.el('refreshDataBtn').emitir('click'); await flush();
    assert.match(a.el('resultsContainer').innerHTML, /Hospital/);
    assert.match(a.el('dataUpdatedAt').textContent, /Falha/);
});
