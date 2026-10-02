/* Shared data rules. Works in the browser and in Node's offline tests. */
(function (root, factory) {
    const api = factory();
    if (typeof module === 'object' && module.exports) module.exports = api;
    else root.RedeData = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';
    const OPERADORAS = ['amil', 'amil-selecionada', 'bradesco', 'sulamerica', 'hapvida', 'liv-saude'];
    const UFS = 'AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO'.split(' ');
    function normalizar(value) {
        return String(value == null ? '' : value).toLowerCase().trim().normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '').replace(/[^\w\s]/g, '').replace(/\s+/g, ' ');
    }
    function escaparHTML(value) {
        return String(value == null ? '' : value).replace(/[&<>"']/g,
            c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
    }
    function chave(registro) {
        return JSON.stringify([registro.nome, registro.cidade, registro.estado].map(normalizar));
    }
    function operadora(value) {
        const compact = normalizar(value).replace(/\s/g, '');
        return OPERADORAS.find(op => normalizar(op).replace(/\s/g, '') === compact) || null;
    }
    function validar(registro) {
        const erros = [];
        for (const campo of ['nome', 'cidade']) {
            if (typeof registro[campo] !== 'string' || !registro[campo].trim() || registro[campo].length > 300)
                erros.push(campo + ': preencha até 300 caracteres');
        }
        if (!UFS.includes(registro.estado)) erros.push('Estado: informe uma UF válida');
        if (!['hospital', 'clinica', 'laboratorio'].includes(registro.tipo)) erros.push('Tipo inválido');
        if (!Array.isArray(registro.operadoras) || !registro.operadoras.length ||
            registro.operadoras.length > 6 || registro.operadoras.some(op => !OPERADORAS.includes(op)))
            erros.push('Operadoras: selecione ao menos uma operadora válida');
        for (const campo of ['modalidades', 'planos']) {
            if (typeof registro[campo] !== 'string' || registro[campo].length > 10000)
                erros.push(campo + ': limite de 10.000 caracteres');
        }
        return erros;
    }
    function processarLinhas(rows) {
        const registros = [], erros = [], duplicatasInternas = [], vistos = new Map();
        rows.forEach((row, index) => {
            const linha = row.__linha || index + 2;
            const tokens = String(row.Operadoras || '').split(',').map(s => s.trim()).filter(Boolean);
            const desconhecidas = tokens.filter(op => !operadora(op));
            const registro = {
                nome: String(row.Nome || '').trim(), estado: String(row.Estado || '').trim().toUpperCase(),
                cidade: String(row.Cidade || '').trim(), tipo: normalizar(row.Tipo || 'hospital'),
                operadoras: [...new Set(tokens.map(operadora).filter(Boolean))],
                modalidades: String(row.Modalidades || '').trim(), planos: String(row.Planos || '').trim()
            };
            const problemas = validar(registro);
            if (desconhecidas.length) problemas.push('Operadoras desconhecidas: ' + desconhecidas.join(', '));
            if (problemas.length) { erros.push({ linha, problemas }); return; }
            const key = chave(registro);
            if (vistos.has(key)) duplicatasInternas.push({ linha, duplicataDe: vistos.get(key) });
            else { vistos.set(key, linha); registros.push(registro); }
        });
        return { registros, erros, duplicatasInternas };
    }
    function indice(registros) {
        const map = new Map();
        registros.forEach(registro => {
            const key = chave(registro);
            if (!map.has(key)) map.set(key, []);
            map.get(key).push(registro);
        });
        return map;
    }
    function criarRepositorio(collection) {
        let dados = [], carregado = false, pendente = null, geracao = 0;
        return {
            async carregar(forcar = false) {
                if (pendente) return pendente;
                if (carregado && !forcar) return dados;
                const atual = geracao;
                const consulta = (async () => {
                    const snapshot = await collection.get({ source: 'server' });
                    if (atual !== geracao) throw new Error('Sessão alterada; carregue os dados novamente.');
                    dados = snapshot.docs.map(doc => {
                        const registro = doc.data();
                        // Normalize legacy spellings for display only, without rewriting documents.
                        return { ...registro, id: doc.id,
                            estado: String(registro.estado || '').trim().toUpperCase(),
                            cidade: String(registro.cidade || ''), nome: String(registro.nome || ''),
                            tipo: normalizar(registro.tipo),
                            operadoras: Array.isArray(registro.operadoras) ? registro.operadoras.map(op => operadora(op) || String(op)) : []
                        };
                    });
                    carregado = true;
                    return dados;
                })();
                pendente = consulta;
                try { return await consulta; }
                finally { if (pendente === consulta) pendente = null; }
            },
            adicionar(registros) {
                const map = new Map(dados.map(item => [item.id, item]));
                registros.forEach(item => map.set(item.id, item));
                dados = [...map.values()];
                return dados;
            },
            remover(ids) { const set = new Set(ids); dados = dados.filter(item => !set.has(item.id)); return dados; },
            limpar() { geracao++; dados = []; carregado = false; pendente = null; }
        };
    }
    function criarImportacao(collection, registros, tamanho = 400) {
        if (!Number.isInteger(tamanho) || tamanho < 1 || tamanho > 400) throw new Error('Tamanho de lote inválido');
        return { itens: registros.map(dados => ({ ref: collection.doc(), dados })), confirmados: 0, tamanho };
    }
    async function enviarImportacao(db, importacao, onLote = () => {}, onProgresso = () => {}, antesDoLote = () => {}) {
        while (importacao.confirmados < importacao.itens.length) {
            antesDoLote();
            const lote = [];
            let bytes = 0;
            for (const item of importacao.itens.slice(importacao.confirmados, importacao.confirmados + importacao.tamanho)) {
                // Conservative UTF-8 request estimate, allowing room for Firestore's wire overhead.
                const tamanho = new TextEncoder().encode(JSON.stringify(item.dados)).length + 1024;
                if (lote.length && bytes + tamanho > 4 * 1024 * 1024) break;
                lote.push(item); bytes += tamanho;
            }
            const batch = db.batch();
            lote.forEach(item => batch.set(item.ref, item.dados));
            await batch.commit();
            antesDoLote();
            importacao.confirmados += lote.length;
            onLote(lote.map(item => ({ ...item.dados, id: item.ref.id })));
            onProgresso(importacao.confirmados, importacao.itens.length);
        }
    }
    return { OPERADORAS, UFS, normalizar, escaparHTML, chave, operadora, validar, processarLinhas,
        indice, criarRepositorio, criarImportacao, enviarImportacao };
});
