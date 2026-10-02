// Requires Firebase's local emulator. Never falls back to production.
const { test, before } = require('node:test');
const assert = require('node:assert/strict');
const project = 'demo-rede-tests';
const host = process.env.FIRESTORE_EMULATOR_HOST;
if (!host || !/^127\.0\.0\.1:\d+$/.test(host)) {
    throw new Error('Execute via emulators:exec com FIRESTORE_EMULATOR_HOST local.');
}
const base = `http://${host}/v1/projects/${project}/databases/(default)/documents`;
const valido = () => ({ nome: 'Hospital Teste', estado: 'SP', cidade: 'São Paulo',
    tipo: 'hospital', operadoras: ['amil'], modalidades: '', planos: '' });
function token(provider = 'password') {
    const now = Math.floor(Date.now() / 1000);
    const encode = obj => Buffer.from(JSON.stringify(obj)).toString('base64url');
    return encode({ alg: 'none', typ: 'JWT' }) + '.' + encode({
        iss: `https://securetoken.google.com/${project}`, aud: project,
        sub: 'usuario-teste', user_id: 'usuario-teste', iat: now, exp: now + 3600, auth_time: now,
        firebase: { sign_in_provider: provider, identities: {} }
    }) + '.';
}
function valor(v) {
    if (typeof v === 'string') return { stringValue: v };
    if (typeof v === 'number') return { integerValue: String(v) };
    if (Array.isArray(v)) return { arrayValue: { values: v.map(valor) } };
    if (v === null) return { nullValue: null };
    return { mapValue: { fields: campos(v) } };
}
function campos(obj) { return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, valor(v)])); }
async function pedido(method, path, dados, auth) {
    return fetch(`${base}/${path}`, {
        method, headers: { 'Content-Type': 'application/json', ...(auth ? { Authorization: `Bearer ${auth}` } : {}) },
        body: dados === undefined ? undefined : JSON.stringify({ fields: campos(dados) }),
        signal: AbortSignal.timeout(15000)
    });
}
async function resultado(response, status) {
    const text = await response.text();
    assert.equal(response.status, status, text);
}
before(async () => {
    const reset = await fetch(`http://${host}/emulator/v1/projects/${project}/databases/(default)/documents`,
        { method: 'DELETE', signal: AbortSignal.timeout(15000) });
    assert.equal(reset.status, 200);
    await resultado(await pedido('PATCH', 'hospitais/publico', valido(), 'owner'), 200);
});
test('leitura pública de documento e listagem da coleção', async () => {
    await resultado(await pedido('GET', 'hospitais/publico'), 200);
    await resultado(await pedido('GET', 'hospitais'), 200);
});
test('escrita sem autenticação e com provedor anônimo é negada', async () => {
    await resultado(await pedido('PATCH', 'hospitais/sem-login', valido()), 403);
    await resultado(await pedido('PATCH', 'hospitais/anonimo', valido(), token('anonymous')), 403);
});
test('conta email/senha pode criar, atualizar e excluir', async () => {
    await resultado(await pedido('PATCH', 'hospitais/administrador', valido(), token()), 200);
    await resultado(await pedido('PATCH', 'hospitais/administrador', { ...valido(), nome: 'Atualizado' }, token()), 200);
    await resultado(await pedido('DELETE', 'hospitais/administrador', undefined, token()), 200);
});
test('Google, custom token e outros provedores não escrevem', async () => {
    for (const provider of ['google.com', 'custom', 'phone']) {
        await resultado(await pedido('PATCH', 'hospitais/provedor-' + provider, valido(), token(provider)), 403);
    }
});
test('campos obrigatórios ausentes são negados', async () => {
    for (const campo of ['nome', 'estado', 'cidade', 'tipo', 'operadoras']) {
        const dados = valido(); delete dados[campo];
        await resultado(await pedido('PATCH', 'hospitais/falta-' + campo, dados, token()), 403);
    }
});
test('UF, tipo, operadora e tipos de campos inválidos são negados', async () => {
    const casos = [ { estado: 'ZZ' }, { estado: 'sp' }, { tipo: 'farmacia' },
        { operadoras: ['unimed'] }, { operadoras: [] }, { operadoras: 'amil' },
        { nome: 123 }, { nome: '' }, { cidade: 123 }, { cidade: '' },
        { modalidades: 123 }, { planos: null }, { extra: 'campo não previsto' } ];
    for (const [i, invalido] of casos.entries()) {
        await resultado(await pedido('PATCH', 'hospitais/invalido-' + i, { ...valido(), ...invalido }, token()), 403);
    }
});
test('limites de texto rejeitam excesso e aceitam valores de fronteira', async () => {
    for (const [campo, limite] of [['nome', 300], ['cidade', 300], ['modalidades', 10000], ['planos', 10000]]) {
        await resultado(await pedido('PATCH', 'hospitais/limite-' + campo, { ...valido(), [campo]: 'a'.repeat(limite) }, token()), 200);
        await resultado(await pedido('PATCH', 'hospitais/excesso-' + campo, { ...valido(), [campo]: 'a'.repeat(limite + 1) }, token()), 403);
    }
});
test('campos opcionais ausentes são aceitos', async () => {
    const dados = valido(); delete dados.modalidades; delete dados.planos;
    await resultado(await pedido('PATCH', 'hospitais/opcionais', dados, token()), 200);
});
test('documento legado inválido é legível e pode ser excluído, mas não regravado inválido', async () => {
    const legado = { nome: 'Legado', estado: 'sp' };
    await resultado(await pedido('PATCH', 'hospitais/legado', legado, 'owner'), 200);
    await resultado(await pedido('GET', 'hospitais/legado'), 200);
    await resultado(await pedido('PATCH', 'hospitais/legado', legado, token()), 403);
    await resultado(await pedido('DELETE', 'hospitais/legado'), 403);
    await resultado(await pedido('DELETE', 'hospitais/legado', undefined, token()), 200);
});
test('outras coleções negam leitura e escrita mesmo com email/senha', async () => {
    await resultado(await pedido('PATCH', 'privado/documento', { segredo: 'teste' }, 'owner'), 200);
    await resultado(await pedido('GET', 'privado/documento'), 403);
    await resultado(await pedido('GET', 'privado/documento', undefined, token()), 403);
    await resultado(await pedido('PATCH', 'privado/outro', valido(), token()), 403);
});
