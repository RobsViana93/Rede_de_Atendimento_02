const test = require('node:test');
const assert = require('node:assert/strict');
const D = require('../rede-data.js');
const registro = (nome = 'Hospital São João') => ({ nome, cidade: 'São Paulo', estado: 'SP',
    tipo: 'hospital', operadoras: ['amil'], modalidades: '', planos: '' });
const snapshot = rows => ({ docs: rows.map((row, i) => ({ id: String(i), data: () => row })) });

test('normalização, índice preserva todas as duplicatas e escape bloqueia HTML', () => {
    assert.equal(D.chave(registro()), D.chave({ ...registro(' hospital sao joao '), cidade: ' SAO PAULO ' }));
    assert.equal(D.indice([registro(), registro(), registro('Outro')]).get(D.chave(registro())).length, 2);
    assert.equal(D.escaparHTML('<img src=x onerror="x">'), '&lt;img src=x onerror=&quot;x&quot;&gt;');
    assert.notEqual(D.chave({ nome: 'a', cidade: 'b c', estado: 'SP' }), D.chave({ nome: 'a b', cidade: 'c', estado: 'SP' }));
});

test('planilha padroniza aliases, informa linha real e rejeita desconhecidos', () => {
    const row = { Nome: 'Clínica', Cidade: 'São Paulo', Estado: ' sp ', Tipo: 'Clínica',
        Operadoras: 'Sul América, SulAmérica, Amil Selecionada, Liv Saúde' };
    const result = D.processarLinhas([row, { ...row, Nome: 'Clinica', __linha: 5 },
        { ...row, __linha: 8, Operadoras: 'Unimed' }, { ...row, __linha: 10, Estado: 'ZZ' }]);
    assert.equal(result.registros.length, 1);
    assert.deepEqual(result.registros[0].operadoras, ['sulamerica', 'amil-selecionada', 'liv-saude']);
    assert.equal(result.registros[0].tipo, 'clinica');
    assert.deepEqual(result.erros.map(e => e.linha), [8, 10]);
    assert.equal(result.duplicatasInternas[0].linha, 5);
});

test('consulta compartilhada, base vazia em cache e atualização explícita', async () => {
    let chamadas = 0, liberar;
    const repo = D.criarRepositorio({ get: options => {
        assert.equal(options.source, 'server'); chamadas++;
        return new Promise(resolve => { liberar = resolve; });
    } });
    const a = repo.carregar(), b = repo.carregar(true);
    assert.equal(chamadas, 1); liberar(snapshot([]));
    await Promise.all([a, b]); await repo.carregar(); assert.equal(chamadas, 1);
    const c = repo.carregar(true); liberar(snapshot([registro()])); await c;
    assert.equal(chamadas, 2);
    repo.adicionar([{ ...registro('Novo'), id: 'novo' }]);
    assert.equal((await repo.carregar()).length, 2);
    repo.remover(['novo']); assert.equal((await repo.carregar()).length, 1);
    assert.equal(chamadas, 2);
});

test('falha de leitura não é cache vazio e permite tentar novamente', async () => {
    let chamadas = 0;
    const repo = D.criarRepositorio({ get: async () => {
        if (++chamadas === 1) throw Error('quota'); return snapshot([]);
    } });
    await assert.rejects(repo.carregar(), /quota/);
    await repo.carregar(); assert.equal(chamadas, 2);
});

test('mudança de sessão descarta consulta anterior', async () => {
    let liberar;
    const repo = D.criarRepositorio({ get: () => new Promise(r => { liberar = r; }) });
    const consulta = repo.carregar(); repo.limpar(); liberar(snapshot([registro()]));
    await assert.rejects(consulta, /Sessão alterada/);
});

test('500 linhas contra 2000 documentos fazem uma consulta de verificação', async () => {
    let chamadas = 0;
    const repo = D.criarRepositorio({ get: async () => { chamadas++; return snapshot(
        Array.from({ length: 2000 }, (_, i) => registro('Hospital ' + i))); } });
    const indice = D.indice(await repo.carregar(true));
    const duplicatas = Array.from({ length: 500 }, (_, i) => indice.get(D.chave(registro('Hospital ' + i))));
    assert.equal(duplicatas.filter(Boolean).length, 500); assert.equal(chamadas, 1);
});

test('falha após confirmação no servidor retoma IDs do lote incerto sem duplicar', async () => {
    let serial = 0, commits = 0, falhar = true;
    const salvos = new Map(), tamanhos = [], confirmados = [];
    const collection = { doc: () => ({ id: 'doc-' + ++serial }) };
    const db = { batch: () => {
        const itens = [];
        return { set: (ref, dados) => itens.push([ref.id, dados]), commit: async () => {
            commits++; tamanhos.push(itens.length); itens.forEach(([id, dados]) => salvos.set(id, dados));
            if (commits === 2 && falhar) { falhar = false; throw Error('Resposta perdida'); }
        } };
    } };
    const envio = D.criarImportacao(collection, Array.from({ length: 850 }, (_, i) => registro('Hospital ' + i)));
    await assert.rejects(D.enviarImportacao(db, envio, rows => confirmados.push(...rows)), /Resposta perdida/);
    assert.equal(envio.confirmados, 400); assert.equal(salvos.size, 800);
    await D.enviarImportacao(db, envio, rows => confirmados.push(...rows));
    assert.equal(salvos.size, 850); assert.equal(confirmados.length, 850);
    assert.equal(serial, 850); assert.deepEqual(tamanhos, [400, 400, 400, 50]);
});

test('lotes também respeitam tamanho estimado para textos extensos em UTF-8', async () => {
    let serial = 0;
    const envio = D.criarImportacao({ doc: () => ({ id: String(++serial) }) },
        Array.from({ length: 400 }, () => ({ ...registro(), modalidades: '漢'.repeat(10000), planos: '字'.repeat(10000) })));
    let lotes = 0;
    await D.enviarImportacao({ batch: () => {
        let bytes = 0;
        return { set: (_, row) => { bytes += new TextEncoder().encode(JSON.stringify(row)).length + 1024; },
            commit: async () => { assert.ok(bytes <= 4 * 1024 * 1024); lotes++; } };
    } }, envio);
    assert.ok(lotes > 1); assert.equal(envio.confirmados, 400);
});

test('sessão encerrada impede o próximo lote', async () => {
    let serial = 0, ativo = true, lotes = 0;
    const envio = D.criarImportacao({ doc: () => ({ id: String(++serial) }) }, Array.from({ length: 401 }, () => registro()));
    await assert.rejects(D.enviarImportacao({ batch: () => ({ set() {}, commit: async () => { lotes++; } }) },
        envio, () => { ativo = false; }, () => {}, () => { if (!ativo) throw Error('Sessão encerrada'); }), /Sessão encerrada/);
    assert.equal(lotes, 1); assert.equal(envio.confirmados, 400);
});
