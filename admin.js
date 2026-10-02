// Função para normalizar strings para comparação
const { normalizar: normalizarString, escaparHTML, chave: chaveRegistro } = RedeData;
function solicitarAcaoDuplicatas(duplicatas) {
    return new Promise(resolve => criarModalDuplicatas(duplicatas, resolve));
}

// Função para criar modal de duplicatas
function criarModalDuplicatas(duplicatas, callback) {
    const modalHTML = `
        <div id="duplicateModal" style="
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10001;
        ">
            <div style="
                background: #FFFFFF;
                padding: 32px;
                border-radius: 16px;
                box-shadow: 0 25px 50px -12px rgba(15, 23, 42, 0.25);
                border: 1px solid #E2E8F0;
                max-width: 600px;
                max-height: 85vh;
                overflow-y: auto;
                color: #0F172A;
            ">
                <div style="display: flex; align-items: center; gap: 14px; margin-bottom: 16px;">
                    <div style="width: 44px; height: 44px; border-radius: 50%; background: #FEF3C7; border: 1px solid #FDE68A; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                        <i class="fas fa-exclamation-triangle" style="color: #D97706; font-size: 1.3rem;"></i>
                    </div>
                    <div>
                        <h2 style="margin: 0; font-size: 1.35rem; font-weight: 700; color: #0F172A;">Duplicatas Identificadas</h2>
                        <p style="color: #64748B; font-size: 0.9rem; margin: 2px 0 0 0;">Revise os registros antes de continuar a importação:</p>
                    </div>
                </div>

                <div style="
                    background: #F8FAFC;
                    border-radius: 12px;
                    padding: 16px;
                    margin-bottom: 20px;
                    border: 1px solid #E2E8F0;
                    max-height: 280px;
                    overflow-y: auto;
                ">
                    ${duplicatas.map((dup, index) => `
                        <div style="
                            padding: 12px;
                            border-bottom: 1px solid #E2E8F0;
                            margin-bottom: 8px;
                            background: #FFFFFF;
                            border-radius: 8px;
                            border: 1px solid #E2E8F0;
                        ">
                            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                                <i class="fas fa-copy" style="color: #1D4ED8;"></i>
                                <strong style="color: #1D4ED8; font-size: 0.9rem;">Registro ${index + 1}</strong>
                            </div>
                            <div style="color: #0F172A; font-weight: 600; font-size: 0.92rem; margin-bottom: 3px;">
                                <span style="color: #64748B; font-weight: normal;">Novo:</span> ${escaparHTML(dup.novoRegistro.nome)} (${escaparHTML(dup.novoRegistro.cidade || '')}, ${escaparHTML(dup.novoRegistro.estado || '')})
                            </div>
                            <div style="color: #64748B; font-size: 0.88rem;">
                                <span>No banco:</span> ${escaparHTML(dup.registroExistente.nome)} (${escaparHTML(dup.registroExistente.cidade || '')}, ${escaparHTML(dup.registroExistente.estado || '')})
                            </div>
                        </div>
                    `).join('')}
                </div>

                <p style="color: #64748B; margin-bottom: 20px; font-size: 0.88rem; line-height: 1.5;">
                    <strong style="color: #0F172A;">Ignorar duplicadas:</strong> Envia apenas os registros novos e pula os já cadastrados.<br>
                    <strong style="color: #0F172A;">Prosseguir mesmo assim:</strong> Envia tudo e insere registros repetidos.
                </p>
                <div style="display: flex; gap: 10px; justify-content: flex-end; flex-wrap: wrap;">
                    <button id="cancelarDuplicata" class="btn btn-secondary btn-sm">
                        <i class="fas fa-times"></i> Cancelar
                    </button>
                    <button id="ignorarDuplicata" class="btn btn-primary btn-sm">
                        <i class="fas fa-filter"></i> Ignorar Duplicadas e Enviar
                    </button>
                    <button id="prosseguirDuplicata" class="btn btn-secondary btn-sm" style="border-color: #CBD5E1;">
                        <i class="fas fa-check"></i> Prosseguir Mesmo Assim
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    const modal = document.getElementById('duplicateModal');
    const cancelarBtn = document.getElementById('cancelarDuplicata');
    const ignorarBtn = document.getElementById('ignorarDuplicata');
    const prosseguirBtn = document.getElementById('prosseguirDuplicata');

    cancelarBtn.addEventListener('click', () => {
        modal.remove();
        callback('cancelar');
    });

    if (ignorarBtn) {
        ignorarBtn.addEventListener('click', () => {
            modal.remove();
            callback('ignorar');
        });
    }

    prosseguirBtn.addEventListener('click', () => {
        modal.remove();
        callback('prosseguir');
    });
}

        // ---- Guard: verifica se o firebase-config.js foi publicado com valores reais ----
        (function verificarConfig() {
            var msg = document.getElementById('errorMessage');
            function erroConfig(texto) {
                if (msg) { msg.textContent = texto; msg.style.display = 'block'; }
                var btn = document.getElementById('loginForm') ? document.querySelector('#loginForm button[type="submit"]') : null;
                if (btn) btn.disabled = true;
            }
            if (typeof firebase === 'undefined' || typeof firebaseConfig === 'undefined') {
                erroConfig('Arquivo de configuração do Firebase não encontrado no servidor. Confirme que ele foi criado na pasta do projeto e faça um novo deploy.');
                return;
            }
            var valoresPendentes = ['COLE_AQUI_SUA_API_KEY', 'SEU_MESSAGING_SENDER_ID', 'SEU_APP_ID'];
            var temPendente = Object.keys(firebaseConfig).some(function (k) {
                return valoresPendentes.indexOf(String(firebaseConfig[k])) !== -1;
            });
            if (temPendente) {
                erroConfig('O arquivo de configuração ainda contém valores de exemplo. Edite o firebase-config.js da pasta local, cole os valores reais do Console Firebase (Configurações do projeto → Seus apps) e rode "firebase deploy --only hosting" novamente.');
            }
        })();

        // ---- Guard de seguranca: se a pagina quebrou durante o carregamento,
        // o login ainda deve funcionar e os erros devem aparecer na tela.
        window.addEventListener('error', function (ev) {
            try {
                var msgEl = document.getElementById('errorMessage');
                if (msgEl && !window.__erroExibido) {
                    msgEl.textContent = 'Ocorreu um erro ao carregar a pagina (' + ev.message + '). O login continua disponivel; use F12 para mais detalhes.';
                    msgEl.style.display = 'block';
                    window.__erroExibido = true;
                }
            } catch (e) {}
        });

        // initializeApp já executado em firebase-config.js
        const db = firebase.firestore();
        const auth = firebase.auth();

        // Elementos DOM
        const loginOverlay = document.getElementById('loginOverlay');
        const adminContent = document.getElementById('adminContent');
        const loginForm = document.getElementById('loginForm');
        const logoutBtn = document.getElementById('logoutBtn');
        const errorMessage = document.getElementById('errorMessage');

        let adminInicializado = false;
        let reiniciarSessaoAdmin = () => {};
        let uidSessao = null;

        // Verificar autenticação
        auth.onAuthStateChanged((user) => {
            if (user) {
                // Usuário logado - mostrar conteúdo admin
                loginOverlay.style.display = 'none';
                adminContent.classList.add('active');
                logoutBtn.style.display = 'block';

                // Inicializar scripts admin após login bem-sucedido
                if (!adminInicializado) { inicializarAdmin(); adminInicializado = true; }
                if (uidSessao !== user.uid) { uidSessao = user.uid; reiniciarSessaoAdmin(); }
            } else {
                // Usuário não logado - mostrar login
                uidSessao = null;
                reiniciarSessaoAdmin();
                loginOverlay.style.display = 'flex';
                adminContent.classList.remove('active');
                logoutBtn.style.display = 'none';
            }
        });

        // Alternar visibilidade de senha
        const togglePasswordBtn = document.getElementById('togglePasswordBtn');
        if (togglePasswordBtn) {
            togglePasswordBtn.addEventListener('click', () => {
                const passInput = document.getElementById('password');
                const icon = togglePasswordBtn.querySelector('i');
                if (!passInput) return;
                if (passInput.type === 'password') {
                    passInput.type = 'text';
                    icon.classList.remove('fa-eye');
                    icon.classList.add('fa-eye-slash');
                    togglePasswordBtn.style.color = '#1D4ED8';
                } else {
                    passInput.type = 'password';
                    icon.classList.remove('fa-eye-slash');
                    icon.classList.add('fa-eye');
                    togglePasswordBtn.style.color = '#64748B';
                }
            });
        }

        // Login
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const loginBtn = document.getElementById('loginBtn');

            loginBtn.disabled = true;
            loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Entrando...';
            errorMessage.style.display = 'none';

            try {
                await auth.signInWithEmailAndPassword(email, password);
            } catch (error) {
                console.error("Erro de autenticação:", error);
                let errorMsg = 'E-mail ou senha incorretos. Por favor, verifique os dados e tente novamente.';

                const code = error && error.code ? String(error.code).toLowerCase() : '';
                const msg = error && error.message ? String(error.message).toUpperCase() : '';

                // Verifica se é erro de credencial incorreta (inclui casos onde Identity Toolkit retorna internal-error com payload JSON)
                const isCredencialInvalida =
                    code === 'auth/user-not-found' ||
                    code === 'auth/wrong-password' ||
                    code === 'auth/invalid-credential' ||
                    code === 'auth/invalid-login-credentials' ||
                    msg.includes('INVALID_LOGIN_CREDENTIALS') ||
                    msg.includes('INVALID_PASSWORD') ||
                    msg.includes('EMAIL_NOT_FOUND') ||
                    msg.includes('INVALID_CREDENTIAL');

                if (isCredencialInvalida) {
                    errorMsg = 'E-mail ou senha incorretos. Por favor, verifique os dados e tente novamente.';
                } else if (code === 'auth/invalid-email') {
                    errorMsg = 'O formato do e-mail é inválido.';
                } else if (code === 'auth/too-many-requests') {
                    errorMsg = 'Acesso temporariamente bloqueado devido a muitas tentativas. Tente novamente mais tarde.';
                } else if (code === 'auth/user-disabled') {
                    errorMsg = 'Esta conta foi desativada. Contate o administrador do sistema.';
                } else if (code === 'auth/network-request-failed') {
                    errorMsg = 'Falha de conexão com a internet. Verifique sua rede e tente novamente.';
                } else {
                    errorMsg = 'E-mail ou senha incorretos. Por favor, verifique os dados e tente novamente.';
                }

                errorMessage.textContent = errorMsg;
                errorMessage.style.display = 'block';
                document.getElementById('password').value = '';
            } finally {
                loginBtn.disabled = false;
                loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Entrar';
            }
        });

        // Logout
        logoutBtn.addEventListener('click', async () => {
            if (confirm('Tem certeza que deseja sair?')) {
                try {
                    await auth.signOut();
                } catch (error) {
                    alert('Erro ao fazer logout');
                }
            }
        });

        // Função para inicializar admin (código completo)
        function inicializarAdmin() {
            // --- VARIÁVEIS GLOBAIS ---
            const hospitaisCollection = db.collection('hospitais');
            let dadosHospitais = [];
            let dadosUpload = [];
            const repositorio = RedeData.criarRepositorio(hospitaisCollection);
            let operacaoEmAndamento = false;
            let importacaoPendente = null;
            let errosPlanilha = [];
            let ignoradosUpload = 0;
            let versaoSessao = 0;
            function exigirSessao(versao) {
                if (versao !== versaoSessao || !auth.currentUser) throw new Error('Sessão alterada. Entre novamente.');
            }
            function definirOcupado(ocupado) {
                operacaoEmAndamento = ocupado;
                logoutBtn.disabled = ocupado;
                confirmUploadBtn.disabled = ocupado || errosPlanilha.length > 0;
                cancelUploadBtn.disabled = ocupado;
                fileInput.disabled = ocupado;
                uploadArea.setAttribute('aria-disabled', String(ocupado));
                manualForm.querySelector('button[type="submit"]').disabled = ocupado;
                reloadViewDataBtn.disabled = ocupado;
                document.querySelectorAll('.tab-btn').forEach(btn => { btn.disabled = ocupado; });
            }
            function atualizarDadosLocais(dados) {
                dadosHospitais = dados;
                popularFiltroEstados(); popularFiltroCidades(); aplicarFiltrosETabela(false);
            }
            reiniciarSessaoAdmin = () => {
                versaoSessao++;
                repositorio.limpar(); dadosHospitais = []; dadosUpload = []; errosPlanilha = [];
                importacaoPendente = null;
                itensSelecionados.clear(); paginaAtual = 1;
                uploadPreview.classList.add('hidden'); fileInput.value = '';
                document.getElementById('duplicateModal')?.remove();
                document.getElementById('bulkDeleteModal')?.remove();
                definirOcupado(false); atualizarBadgeSelecionados();
                if (auth.currentUser) carregarDadosIniciais().catch(() => {});
            };

            // --- ELEMENTOS DO DOM ---
            const confirmUploadBtn = document.getElementById('confirmUpload');
            const cancelUploadBtn = document.getElementById('cancelUpload');
            const fileInput = document.getElementById('fileInput');
            const uploadArea = document.getElementById('uploadArea');
            const uploadPreview = document.getElementById('uploadPreview');
            const previewTableContainer = document.getElementById('previewTableContainer');
            const manualForm = document.getElementById('manualForm');
            const dataTable = document.getElementById('dataTable');
            const viewSearch = document.getElementById('viewSearch');
            const viewEstado = document.getElementById('viewEstado');
            const viewCidade = document.getElementById('viewCidade');
            const viewFilter = document.getElementById('viewFilter');
            const clearViewFiltersBtn = document.getElementById('clearViewFiltersBtn');
            const reloadViewDataBtn = document.getElementById('reloadViewDataBtn');
            const viewCountBadge = document.getElementById('viewCountBadge');
            const selectedCountBadge = document.getElementById('selectedCountBadge');
            const btnExcluirSelecionados = document.getElementById('btnExcluirSelecionados');
            const btnSelectedCount = document.getElementById('btnSelectedCount');
            const btnExcluirGrupo = document.getElementById('btnExcluirGrupo');
            const viewPagination = document.getElementById('viewPagination');
            const paginationInfo = document.getElementById('paginationInfo');
            const btnPrevPage = document.getElementById('btnPrevPage');
            const btnNextPage = document.getElementById('btnNextPage');
            const paginationPageNum = document.getElementById('paginationPageNum');

            // --- ESTADO DA TABELA DE VISUALIZAÇÃO ---
            let itensSelecionados = new Set();
            let paginaAtual = 1;
            const ITENS_POR_PAGINA = 50;
            let dadosFiltrados = [];

            // --- FUNÇÃO HANDLEFILE (ADICIONAR ESTA FUNÇÃO) ---
            function handleFile(file) {
                if (operacaoEmAndamento) return;
                if (importacaoPendente && !confirm('Há uma importação pendente. Substituir a planilha? Os lotes já confirmados permanecerão salvos.')) return;
                if (!file || !file.name.match(/\.(xlsx|xls)$/)) {
                    alert('Por favor, selecione um arquivo Excel (.xlsx ou .xls).');
                return;
                }

                const reader = new FileReader();
                    reader.onload = (e) => {
                try {
                    const workbook = XLSX.read(new Uint8Array(e.target.result), { type: 'array' });
                    const sheetName = workbook.SheetNames[0];
                    const sheet = workbook.Sheets[sheetName];
                    const matriz = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', blankrows: true });
                    const cabecalhos = (matriz[0] || []).map(v => String(v).trim());
                    const obrigatorios = ['Nome', 'Estado', 'Cidade', 'Tipo', 'Operadoras'];
                    if (obrigatorios.some(c => !cabecalhos.includes(c))) throw new Error('Colunas obrigatórias: ' + obrigatorios.join(', '));
                    const primeiraLinha = XLSX.utils.decode_range(sheet['!ref'] || 'A1').s.r + 1;
                    const jsonData = matriz.slice(1).map((values, index) => Object.assign(
                        { __linha: primeiraLinha + index + 1 }, Object.fromEntries(cabecalhos.map((c, i) => [c, values[i] ?? '']))
                    )).filter(row => cabecalhos.some(c => String(row[c]).trim()));
                        processarDadosPlanilha(jsonData);
                    } catch (error) {
                        console.error('Erro ao processar arquivo:', error);
                        alert('Erro ao processar o arquivo: ' + error.message);
                    }
                };
                    reader.readAsArrayBuffer(file);
            }

            // --- SISTEMA DE ABAS ---
            const tabButtons = document.querySelectorAll('.tab-btn');
            const tabContents = document.querySelectorAll('.tab-content');

            function switchTab(targetTab) {
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabContents.forEach(content => content.classList.remove('active'));

                const activeButton = document.querySelector(`[data-tab="${targetTab}"]`);
                const activeContent = document.getElementById(targetTab);

                if (activeButton && activeContent) {
                    activeButton.classList.add('active');
                    activeContent.classList.add('active');

                    if (targetTab === 'view') {
                        carregarTabelaDados();
                    }
                }
            }

            // Event listeners para as abas
            tabButtons.forEach(button => {
                button.addEventListener('click', () => {
                    const targetTab = button.getAttribute('data-tab');
                    switchTab(targetTab);
                });
            });

            // --- CARREGAMENTO INICIAL DOS DADOS ---
            async function carregarDadosIniciais(forcar = false) {
                try {
                    atualizarDadosLocais(await repositorio.carregar(forcar));
                } catch (error) {
                    console.error('Erro ao carregar dados:', error);
                    if (auth.currentUser) viewCountBadge.textContent = 'Falha ao carregar. Use Recarregar dados para tentar novamente.';
                    throw error;
                }
            }

            // --- FORMULÁRIO MANUAL ---
            if (manualForm) {
                // Sincroniza classes visuais dos checkboxes de operadora no formulário manual
                const operadoraCheckboxes = manualForm.querySelectorAll('.operadora-checkbox');
                operadoraCheckboxes.forEach(cb => {
                    const input = cb.querySelector('input[type="checkbox"]');
                    if (input) {
                        input.addEventListener('change', () => {
                            cb.classList.toggle('selected', input.checked);
                        });
                    }
                });

                manualForm.addEventListener('reset', () => {
                    setTimeout(() => {
                        operadoraCheckboxes.forEach(cb => cb.classList.remove('selected'));
                    }, 10);
                });

                manualForm.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    if (operacaoEmAndamento) return;
                    const formData = new FormData(manualForm);
                    const registro = {
                        nome: String(formData.get('nome') || '').trim(),
                        estado: String(formData.get('estado') || '').trim().toUpperCase(),
                        cidade: String(formData.get('cidade') || '').trim(),
                        tipo: normalizarString(formData.get('tipo')),
                        operadoras: formData.getAll('operadoras'),
                        modalidades: String(formData.get('modalidades') || '').trim(),
                        planos: String(formData.get('planos') || '').trim()
                    };
                    const erros = RedeData.validar(registro);
                    if (erros.length) { alert(erros.join('\n')); return; }
                    const sessao = versaoSessao;
                    definirOcupado(true);
                    try {
                        const dados = await repositorio.carregar(true);
                        atualizarDadosLocais(dados);
                        const duplicatas = RedeData.indice(dados).get(chaveRegistro(registro)) || [];
                        if (duplicatas.length) {
                            const acao = await solicitarAcaoDuplicatas(duplicatas.map(existente => ({
                                novoRegistro: registro, registroExistente: existente
                            })));
                            if (acao !== 'prosseguir') return;
                        }
                        exigirSessao(sessao);
                        const ref = await hospitaisCollection.add(registro);
                        exigirSessao(sessao);
                        atualizarDadosLocais(repositorio.adicionar([{ ...registro, id: ref.id }]));
                        manualForm.reset(); alert('Cadastro realizado com sucesso!');
                    } catch (error) {
                        console.error(error); alert('Cadastro interrompido: ' + error.message);
                    } finally { if (sessao === versaoSessao) definirOcupado(false); }
                });
            }


            // --- MODELO DE PLANILHA (.XLSX) ---
            function baixarModeloExcel() {
                if (typeof XLSX === 'undefined') {
                    alert('Biblioteca de planilhas não carregou. Recarregue a página (Ctrl+Shift+R) e tente novamente.');
                    return;
                }
                const cabecalhos = ['Nome', 'Estado', 'Cidade', 'Tipo', 'Operadoras', 'Modalidades', 'Planos'];
                const exemplos = [
                    { Nome: 'Hospital Santa Casa (exemplo - apague esta linha)', Estado: 'SP', Cidade: 'São Paulo', Tipo: 'hospital', Operadoras: 'Amil, Bradesco, SulAmérica', Modalidades: 'Enfermaria, Apartamento', Planos: 'Amil One, Bradesco Top Nacional' },
                    { Nome: 'Clínica Vida (exemplo - apague esta linha)', Estado: 'RJ', Cidade: 'Rio de Janeiro', Tipo: 'clinica', Operadoras: 'amil-selecionada, liv-saude', Modalidades: 'Ambulatorial', Planos: 'Plano exemplo' }
                ];
                const ws = XLSX.utils.json_to_sheet(exemplos, { header: cabecalhos });
                ws['!cols'] = [{ wch: 40 }, { wch: 8 }, { wch: 20 }, { wch: 12 }, { wch: 35 }, { wch: 30 }, { wch: 40 }];
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, 'Hospitais');
                XLSX.writeFile(wb, 'modelo_upload_hospitais.xlsx');
            }

            // --- LÓGICA DE UPLOAD DE PLANILHA ---
            function processarDadosPlanilha(jsonData) {
                importacaoPendente = null;
                const resultado = RedeData.processarLinhas(jsonData);
                dadosUpload = resultado.registros;
                errosPlanilha = resultado.erros;
                ignoradosUpload = resultado.duplicatasInternas.length;
                previewTableContainer.innerHTML =
                    '<p>' + dadosUpload.length + ' registros válidos; ' + ignoradosUpload + ' duplicatas internas removidas.</p>' +
                    (errosPlanilha.length ? '<div role="alert"><strong>Corrija as linhas abaixo e selecione a planilha novamente:</strong><ul>' +
                        errosPlanilha.map(erro => '<li>Linha ' + erro.linha + ': ' + escaparHTML(erro.problemas.join('; ')) + '</li>').join('') + '</ul></div>' : '') +
                    '<ul>' + dadosUpload.slice(0, 5).map(item => '<li>' + escaparHTML(item.nome) + ' — ' +
                        escaparHTML(item.cidade) + ', ' + escaparHTML(item.estado) + '</li>').join('') + '</ul>';
                uploadPreview.classList.remove('hidden');
                confirmUploadBtn.textContent = 'Confirmar Upload';
                confirmUploadBtn.disabled = errosPlanilha.length > 0 || dadosUpload.length === 0;
                if (!jsonData.length) previewTableContainer.textContent = 'A planilha está vazia.';
            }


            // --- GESTÃO E FILTROS DA TABELA DE VISUALIZAÇÃO ---

            function getOperadoraNome(op) {
                const nomes = {
                    'amil': 'Amil',
                    'amil-selecionada': 'Amil Selecionada',
                    'bradesco': 'Bradesco',
                    'sulamerica': 'Sul América',
                    'hapvida': 'Hapvida',
                    'liv-saude': 'Liv Saúde'
                };
                return nomes[op] || op;
            }

            function popularFiltroEstados() {
                if (!viewEstado) return;
                const estadoSelecionadoAnterior = viewEstado.value;
                const estadosSet = new Set();

                dadosHospitais.forEach(item => {
                    if (item.estado && item.estado.trim()) {
                        estadosSet.add(item.estado.trim().toUpperCase());
                    }
                });

                const estadosOrdenados = Array.from(estadosSet).sort();
                let html = '<option value="">Todos os Estados</option>';
                estadosOrdenados.forEach(uf => {
                    html += `<option value="${escaparHTML(uf)}">${escaparHTML(uf)}</option>`;
                });
                viewEstado.innerHTML = html;

                if (estadoSelecionadoAnterior && estadosSet.has(estadoSelecionadoAnterior)) {
                    viewEstado.value = estadoSelecionadoAnterior;
                }
            }

            function popularFiltroCidades() {
                if (!viewCidade) return;
                const cidadeSelecionadaAnterior = viewCidade.value;
                const estadoFiltro = viewEstado ? viewEstado.value.trim().toUpperCase() : '';
                const cidadesSet = new Set();

                dadosHospitais.forEach(item => {
                    const itemEstado = (item.estado || '').trim().toUpperCase();
                    if (!estadoFiltro || itemEstado === estadoFiltro) {
                        if (item.cidade && item.cidade.trim()) {
                            cidadesSet.add(item.cidade.trim());
                        }
                    }
                });

                const cidadesOrdenadas = Array.from(cidadesSet).sort((a, b) => a.localeCompare(b, 'pt-BR'));
                let html = '<option value="">Todas as Cidades</option>';
                cidadesOrdenadas.forEach(cid => {
                    html += `<option value="${escaparHTML(cid)}">${escaparHTML(cid)}</option>`;
                });
                viewCidade.innerHTML = html;

                if (cidadeSelecionadaAnterior && cidadesSet.has(cidadeSelecionadaAnterior)) {
                    viewCidade.value = cidadeSelecionadaAnterior;
                }
            }

            async function carregarTabelaDados(forcarRecarregar = false) {
                if (!dataTable) return;
                try { await carregarDadosIniciais(forcarRecarregar); }
                catch (_) { if (auth.currentUser) dataTable.textContent = 'Não foi possível carregar os dados. Tente recarregar.'; }
            }


            function aplicarFiltrosETabela(resetarPagina = false) {
                if (resetarPagina) {
                    paginaAtual = 1;
                }

                const termo = viewSearch ? normalizarString(viewSearch.value) : '';
                const estado = viewEstado ? viewEstado.value.trim().toUpperCase() : '';
                const cidade = viewCidade ? normalizarString(viewCidade.value) : '';
                const operadora = viewFilter ? viewFilter.value.trim() : '';

                const temFiltroAtivo = !!(termo || estado || cidade || operadora);

                dadosFiltrados = dadosHospitais.filter(item => {
                    if (termo) {
                        const matchNome = normalizarString(item.nome).includes(termo);
                        const matchCidade = normalizarString(item.cidade).includes(termo);
                        const matchEstado = normalizarString(item.estado).includes(termo);
                        const matchTipo = normalizarString(item.tipo).includes(termo);
                        const matchPlanos = normalizarString(item.planos).includes(termo);
                        const matchModalidades = normalizarString(item.modalidades).includes(termo);
                        if (!matchNome && !matchCidade && !matchEstado && !matchTipo && !matchPlanos && !matchModalidades) {
                            return false;
                        }
                    }

                    if (estado) {
                        const itemEstado = (item.estado || '').trim().toUpperCase();
                        if (itemEstado !== estado) return false;
                    }

                    if (cidade) {
                        if (normalizarString(item.cidade) !== cidade) return false;
                    }

                    if (operadora) {
                        if (!item.operadoras || !Array.isArray(item.operadoras) || !item.operadoras.includes(operadora)) {
                            return false;
                        }
                    }

                    return true;
                });

                // Ordenar por nome
                dadosFiltrados.sort((a, b) => normalizarString(a.nome).localeCompare(normalizarString(b.nome)));

                // Atualizar badge de contagem
                if (viewCountBadge) {
                    if (temFiltroAtivo) {
                        viewCountBadge.textContent = `Exibindo ${dadosFiltrados.length} de ${dadosHospitais.length} registros (filtrado)`;
                    } else {
                        viewCountBadge.textContent = `Total de ${dadosHospitais.length} registros cadastrados`;
                    }
                }

                // Configurar botão de exclusão de grupo filtrado
                if (btnExcluirGrupo) {
                    if (temFiltroAtivo && dadosFiltrados.length > 0) {
                        btnExcluirGrupo.disabled = false;
                        btnExcluirGrupo.innerHTML = `<i class="fas fa-trash-alt"></i> Excluir Grupo (${dadosFiltrados.length})`;

                        let rotulos = [];
                        if (estado) rotulos.push(`Estado: ${estado}`);
                        if (cidade && viewCidade) rotulos.push(`Cidade: ${viewCidade.value}`);
                        if (operadora) rotulos.push(`Operadora: ${getOperadoraNome(operadora)}`);
                        if (termo && viewSearch) rotulos.push(`Busca: "${viewSearch.value}"`);

                        btnExcluirGrupo.title = `Excluir todos os ${dadosFiltrados.length} estabelecimentos filtrados (${rotulos.join(', ')})`;
                    } else {
                        btnExcluirGrupo.disabled = true;
                        btnExcluirGrupo.innerHTML = `<i class="fas fa-trash-alt"></i> Excluir Grupo Filtrado`;
                        btnExcluirGrupo.title = "Aplique um filtro de Estado, Cidade, Operadora ou Busca para excluir em grupo";
                    }
                }

                atualizarBadgeSelecionados();
                renderizarTabela();
            }

            function atualizarBadgeSelecionados() {
                const total = itensSelecionados.size;
                if (selectedCountBadge) {
                    if (total > 0) {
                        selectedCountBadge.style.display = 'inline-flex';
                        selectedCountBadge.textContent = `${total} selecionado(s)`;
                    } else {
                        selectedCountBadge.style.display = 'none';
                    }
                }

                if (btnExcluirSelecionados) {
                    if (total > 0) {
                        btnExcluirSelecionados.style.display = 'inline-flex';
                        if (btnSelectedCount) btnSelectedCount.textContent = total;
                    } else {
                        btnExcluirSelecionados.style.display = 'none';
                    }
                }
            }

            function renderizarTabela() {
                if (!dataTable) return;

                if (dadosFiltrados.length === 0) {
                    dataTable.innerHTML = '<div style="padding: 48px; text-align: center; color: #64748B;"><i class="fas fa-search fa-2x" style="color: #94A3B8; margin-bottom: 12px;"></i><br>Nenhum registro encontrado com os filtros selecionados.</div>';
                    if (viewPagination) viewPagination.style.display = 'none';
                    return;
                }

                const totalItens = dadosFiltrados.length;
                const totalPaginas = Math.ceil(totalItens / ITENS_POR_PAGINA);
                if (paginaAtual > totalPaginas) paginaAtual = totalPaginas;
                if (paginaAtual < 1) paginaAtual = 1;

                const inicio = (paginaAtual - 1) * ITENS_POR_PAGINA;
                const fim = Math.min(inicio + ITENS_POR_PAGINA, totalItens);
                const itensPagina = dadosFiltrados.slice(inicio, fim);

                const todosPaginaSelecionados = itensPagina.length > 0 && itensPagina.every(item => itensSelecionados.has(item.id));

                const tableHTML = `
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="background: #F8FAFC; border-bottom: 2px solid #E2E8F0;">
                                <th style="padding: 14px 16px; border-bottom: 2px solid #E2E8F0; width: 45px; text-align: center;">
                                    <input type="checkbox" id="selectAllPageCheckbox" class="admin-checkbox" ${todosPaginaSelecionados ? 'checked' : ''} title="Selecionar todos desta página">
                                </th>
                                <th style="padding: 14px 16px; border-bottom: 2px solid #E2E8F0; color: #475569; font-weight: 700; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.05em;">Nome</th>
                                <th style="padding: 14px 16px; border-bottom: 2px solid #E2E8F0; color: #475569; font-weight: 700; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.05em;">Localização</th>
                                <th style="padding: 14px 16px; border-bottom: 2px solid #E2E8F0; color: #475569; font-weight: 700; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.05em;">Tipo</th>
                                <th style="padding: 14px 16px; border-bottom: 2px solid #E2E8F0; color: #475569; font-weight: 700; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.05em;">Operadoras</th>
                                <th style="padding: 14px 16px; border-bottom: 2px solid #E2E8F0; color: #475569; font-weight: 700; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.05em; width: 90px; text-align: center;">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${itensPagina.map(item => {
                                const isSelected = itensSelecionados.has(item.id);

                                return `
                                    <tr style="transition: background 0.15s ease; ${isSelected ? 'background: #EFF6FF;' : 'background: #FFFFFF;'}" onmouseover="if (!this.dataset.selected) this.style.background='#F8FAFC'" onmouseout="if (!this.dataset.selected) this.style.background='${isSelected ? '#EFF6FF' : '#FFFFFF'}'" data-selected="${isSelected ? 'true' : ''}">
                                        <td style="padding: 14px 16px; border-bottom: 1px solid #E2E8F0; text-align: center;">
                                            <input type="checkbox" class="admin-checkbox row-select-checkbox" data-id="${escaparHTML(item.id)}" ${isSelected ? 'checked' : ''}>
                                        </td>
                                        <td style="padding: 14px 16px; border-bottom: 1px solid #E2E8F0; color: #0F172A; font-weight: 600;">
                                            ${escaparHTML(item.nome || 'Sem nome')}
                                            ${item.planos ? `<div style="font-size: 0.82rem; color: #64748B; font-weight: normal; margin-top: 3px;">Planos: ${escaparHTML(item.planos)}</div>` : ''}
                                        </td>
                                        <td style="padding: 14px 16px; border-bottom: 1px solid #E2E8F0; color: #475569; font-size: 0.9rem;">
                                            ${escaparHTML(item.cidade || '—')}, ${escaparHTML(item.estado || '—')}
                                        </td>
                                        <td style="padding: 14px 16px; border-bottom: 1px solid #E2E8F0; color: #475569; font-size: 0.9rem;">
                                            <span style="text-transform: capitalize; background: #F1F5F9; color: #334155; padding: 2px 8px; border-radius: 4px; font-size: 0.8rem; font-weight: 500;">${escaparHTML(item.tipo || '—')}</span>
                                        </td>
                                        <td style="padding: 14px 16px; border-bottom: 1px solid #E2E8F0;">
                                            ${(item.operadoras || []).map(op =>
                                                `<span class="operadora-badge ${escaparHTML(op)}" style="margin-right: 4px; margin-bottom: 2px;">${escaparHTML(getOperadoraNome(op))}</span>`
                                            ).join('')}
                                        </td>
                                        <td style="padding: 14px 16px; border-bottom: 1px solid #E2E8F0; text-align: center;">
                                            <button data-delete-id="${escaparHTML(item.id)}" class="btn-action btn-delete" title="Excluir estabelecimento">
                                                <i class="fas fa-trash"></i>
                                            </button>
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                `;

                dataTable.innerHTML = tableHTML;

                dataTable.querySelectorAll('[data-delete-id]').forEach(btn => {
                    btn.addEventListener('click', () => {
                        const item = dadosHospitais.find(item => item.id === btn.dataset.deleteId);
                        if (item) window.excluirItem(item.id, item.nome);
                    });
                });

                // Event listener checkbox "Selecionar Todos da Página"
                const selectAllCb = document.getElementById('selectAllPageCheckbox');
                if (selectAllCb) {
                    selectAllCb.addEventListener('change', (e) => {
                        const checked = e.target.checked;
                        itensPagina.forEach(it => {
                            if (checked) {
                                itensSelecionados.add(it.id);
                            } else {
                                itensSelecionados.delete(it.id);
                            }
                        });
                        atualizarBadgeSelecionados();
                        renderizarTabela();
                    });
                }

                // Event listeners checkboxes individuais de cada linha
                document.querySelectorAll('.row-select-checkbox').forEach(cb => {
                    cb.addEventListener('change', (e) => {
                        const id = e.target.getAttribute('data-id');
                        if (e.target.checked) {
                            itensSelecionados.add(id);
                        } else {
                            itensSelecionados.delete(id);
                        }
                        atualizarBadgeSelecionados();
                        const todosMarcados = itensPagina.every(it => itensSelecionados.has(it.id));
                        if (selectAllCb) selectAllCb.checked = todosMarcados;
                    });
                });

                // Paginação
                if (viewPagination) {
                    if (totalItens > ITENS_POR_PAGINA) {
                        viewPagination.style.display = 'flex';
                        if (paginationInfo) paginationInfo.textContent = `Mostrando ${inicio + 1}–${fim} de ${totalItens} registros`;
                        if (paginationPageNum) paginationPageNum.textContent = `Página ${paginaAtual} de ${totalPaginas}`;
                        if (btnPrevPage) btnPrevPage.disabled = paginaAtual <= 1;
                        if (btnNextPage) btnNextPage.disabled = paginaAtual >= totalPaginas;
                    } else {
                        viewPagination.style.display = 'none';
                    }
                }
            }

            // Exclusão individual
            window.excluirItem = async function(id, nome) {
                if (operacaoEmAndamento) return;
                const label = nome ? `"${nome}"` : 'este estabelecimento';
                if (confirm(`Tem certeza que deseja excluir ${label}? Esta ação é permanente.`)) {
                    definirOcupado(true);
                    await hospitaisCollection.doc(id).delete().then(() => {
                        alert('Item excluído com sucesso!');
                        dadosHospitais = repositorio.remover([id]);
                        itensSelecionados.delete(id);
                        popularFiltroEstados();
                        popularFiltroCidades();
                        aplicarFiltrosETabela(false);
                    }).catch(error => {
                        console.error("Erro ao excluir:", error);
                        alert('Erro ao excluir o item.');
                    }).finally(() => definirOcupado(false));
                }
            };

            // Modal de confirmação segura para exclusão em lote
            function abrirModalConfirmacaoExclusao({ titulo, descricaoFiltros, idsParaExcluir, onConfirmado }) {
                const total = idsParaExcluir.length;
                if (total === 0) return;

                const modalExistente = document.getElementById('bulkDeleteModal');
                if (modalExistente) modalExistente.remove();

                const modal = document.createElement('div');
                modal.id = 'bulkDeleteModal';
                modal.style.cssText = `
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.85);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 10002;
                    padding: 20px;
                `;

                // Amostra dos registros afetados
                const amostra = dadosHospitais.filter(h => idsParaExcluir.includes(h.id)).slice(0, 4);

                modal.innerHTML = `
                    <div style="
                        background: #FFFFFF;
                        border: 1px solid #E2E8F0;
                        border-radius: 16px;
                        padding: 32px;
                        max-width: 560px;
                        width: 100%;
                        color: #0F172A;
                        box-shadow: 0 25px 50px -12px rgba(15, 23, 42, 0.25);
                    ">
                        <div style="display: flex; align-items: center; gap: 14px; margin-bottom: 20px;">
                            <div style="background: #FEF2F2; width: 48px; height: 48px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 1px solid #FECACA; flex-shrink: 0;">
                                <i class="fas fa-exclamation-triangle" style="color: #DC2626; font-size: 1.4rem;"></i>
                            </div>
                            <div>
                                <h3 style="margin: 0; font-size: 1.3rem; font-weight: 700; color: #0F172A;">${escaparHTML(titulo)}</h3>
                                <div style="color: #DC2626; font-weight: 600; font-size: 0.88rem; margin-top: 2px;">
                                    Atenção: Esta ação é definitiva e não poderá ser desfeita!
                                </div>
                            </div>
                        </div>

                        <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 16px; margin-bottom: 20px;">
                            <div style="font-size: 0.95rem; margin-bottom: 6px;">
                                <strong>Total a excluir:</strong> <span style="color: #DC2626; font-weight: 700; font-size: 1.1rem;">${total} registro(s)</span>
                            </div>
                            <div style="font-size: 0.9rem; color: #475569; margin-bottom: 10px;">
                                <strong>Critérios:</strong> <span style="color: #1D4ED8; font-weight: 600;">${escaparHTML(descricaoFiltros)}</span>
                            </div>
                            <div style="font-size: 0.85rem; color: #64748B;">
                                <strong>Exemplos de estabelecimentos afetados:</strong>
                                <ul style="margin: 6px 0 0 18px; padding: 0;">
                                    ${amostra.map(a => `<li style="margin-bottom: 3px;"><strong style="color: #0F172A;">${escaparHTML(a.nome)}</strong> (${escaparHTML(a.cidade || '—')}, ${escaparHTML(a.estado || '—')})</li>`).join('')}
                                    ${total > 4 ? `<li>... e mais ${total - 4} estabelecimento(s)</li>` : ''}
                                </ul>
                            </div>
                        </div>

                        <div style="margin-bottom: 22px;">
                            <label style="display: block; font-size: 0.88rem; font-weight: 600; margin-bottom: 8px; color: #0F172A;">
                                Para confirmar a exclusão, digite a palavra <strong style="color: #DC2626; letter-spacing: 0.5px;">EXCLUIR</strong> abaixo:
                            </label>
                            <input type="text" id="confirmDeleteWordInput" placeholder="Digite EXCLUIR" autocomplete="off" style="
                                width: 100%;
                                padding: 12px 14px;
                                border: 1.5px solid #E2E8F0;
                                border-radius: 8px;
                                background: #FFFFFF;
                                color: #0F172A;
                                font-size: 0.95rem;
                                outline: none;
                                box-sizing: border-box;
                            ">
                        </div>

                        <div id="deleteProgressBox" style="display: none; margin-bottom: 18px; text-align: center; color: #DC2626; font-weight: 600;">
                            <i class="fas fa-spinner fa-spin"></i> <span id="deleteProgressText">Excluindo registros...</span>
                        </div>

                        <div style="display: flex; justify-content: flex-end; gap: 10px;">
                            <button type="button" id="btnCancelBulkDelete" class="btn btn-secondary btn-sm">Cancelar</button>
                            <button type="button" id="btnConfirmBulkDelete" class="btn btn-danger btn-sm" disabled>
                                <i class="fas fa-trash-alt"></i> Confirmar Exclusão
                            </button>
                        </div>
                    </div>
                `;

                document.body.appendChild(modal);

                const inputWord = document.getElementById('confirmDeleteWordInput');
                const btnConfirm = document.getElementById('btnConfirmBulkDelete');
                const btnCancel = document.getElementById('btnCancelBulkDelete');
                const progressBox = document.getElementById('deleteProgressBox');
                const progressText = document.getElementById('deleteProgressText');

                inputWord.focus();
                inputWord.addEventListener('input', () => {
                    const match = inputWord.value.trim().toUpperCase() === 'EXCLUIR';
                    btnConfirm.disabled = !match;
                });

                btnCancel.addEventListener('click', () => {
                    modal.remove();
                });

                btnConfirm.addEventListener('click', async () => {
                    if (operacaoEmAndamento) return;
                    definirOcupado(true);
                    btnConfirm.disabled = true;
                    btnCancel.disabled = true;
                    inputWord.disabled = true;
                    progressBox.style.display = 'block';

                    try {
                        await onConfirmado((msg) => {
                            if (progressText) progressText.textContent = msg;
                        });
                        modal.remove();
                    } catch (err) {
                        console.error('Erro na exclusão em lote:', err);
                        alert('Ocorreu um erro ao excluir os dados: ' + err.message);
                        btnConfirm.disabled = false;
                        btnCancel.disabled = false;
                        inputWord.disabled = false;
                        progressBox.style.display = 'none';
                    } finally { definirOcupado(false); }
                });
            }

            // Rotina de exclusão em lotes (batch chunks de até 400 docs para segurança no Firestore)
            async function processarExclusaoEmLotesFirestore(ids, onProgresso) {
                const CHUNK_SIZE = 400;
                const total = ids.length;

                for (let i = 0; i < total; i += CHUNK_SIZE) {
                    const chunk = ids.slice(i, i + CHUNK_SIZE);
                    if (onProgresso) {
                        onProgresso(`Excluindo ${Math.min(i + chunk.length, total)} de ${total} registros...`);
                    }

                    const batch = db.batch();
                    chunk.forEach(id => {
                        const ref = hospitaisCollection.doc(id);
                        batch.delete(ref);
                    });

                    await batch.commit();
                    dadosHospitais = repositorio.remover(chunk);
                    chunk.forEach(id => itensSelecionados.delete(id));
                    atualizarDadosLocais(dadosHospitais);
                }

                // Atualizar cache local
                dadosHospitais = repositorio.remover(ids);

                // Limpar seleção
                ids.forEach(id => itensSelecionados.delete(id));

                // Atualizar filtros e interface
                popularFiltroEstados();
                popularFiltroCidades();
                aplicarFiltrosETabela(false);

                alert(`${total} registro(s) excluído(s) com sucesso!`);
            }

            // --- EVENT LISTENERS ---

            // Baixar modelo Excel
            const baixarModeloBtn = document.getElementById('baixarModelo');
            if (baixarModeloBtn) {
                baixarModeloBtn.addEventListener('click', baixarModeloExcel);
            }

            // Upload de arquivo
                if (fileInput) {
                    fileInput.addEventListener('change', (e) => {
                        if (e.target.files.length > 0) {
                            handleFile(e.target.files[0]);
                        }
                    });
                }

                // Drag and drop
                if (uploadArea) {
                    uploadArea.addEventListener('dragover', (e) => {
                        e.preventDefault();
                        uploadArea.classList.add('dragover');
                    });

                    uploadArea.addEventListener('dragleave', () => {
                        uploadArea.classList.remove('dragover');
                    });

                    uploadArea.addEventListener('drop', (e) => {
                        e.preventDefault();
                        uploadArea.classList.remove('dragover');
                        if (e.dataTransfer.files.length > 0) {
                            handleFile(e.dataTransfer.files[0]);
                        }
                    });
                }

            // Botão cancelar upload
            if (cancelUploadBtn) {
                cancelUploadBtn.addEventListener('click', () => {
                    if (operacaoEmAndamento) return;
                    importacaoPendente = null; errosPlanilha = []; ignoradosUpload = 0;
                    uploadPreview.classList.add('hidden');
                    if (fileInput) fileInput.value = '';
                    dadosUpload = [];
                });
            }

            // One server snapshot per import; all duplicate checks are local.
            confirmUploadBtn.addEventListener('click', async () => {
                if (operacaoEmAndamento || errosPlanilha.length || !dadosUpload.length) return;
                const sessao = versaoSessao;
                definirOcupado(true);
                try {
                    if (!importacaoPendente) {
                        confirmUploadBtn.textContent = 'Verificando duplicatas...';
                        const dados = await repositorio.carregar(true);
                        atualizarDadosLocais(dados);
                        const indice = RedeData.indice(dados);
                        const duplicatas = dadosUpload.flatMap(registro =>
                            (indice.get(chaveRegistro(registro)) || []).map(existente => ({
                                novoRegistro: registro, registroExistente: existente
                            })));
                        if (duplicatas.length) {
                            const acao = await solicitarAcaoDuplicatas(duplicatas);
                            if (acao === 'cancelar') return;
                            if (acao === 'ignorar') {
                                const antes = dadosUpload.length;
                                dadosUpload = dadosUpload.filter(registro => !indice.has(chaveRegistro(registro)));
                                ignoradosUpload += antes - dadosUpload.length;
                            }
                        }
                        if (!dadosUpload.length) {
                            alert('Todos os registros já existem. Nenhum registro enviado.');
                            uploadPreview.classList.add('hidden'); return;
                        }
                        importacaoPendente = RedeData.criarImportacao(hospitaisCollection, dadosUpload);
                    }
                    exigirSessao(sessao);
                    await RedeData.enviarImportacao(db, importacaoPendente,
                        registros => atualizarDadosLocais(repositorio.adicionar(registros)),
                        (salvos, total) => {
                            confirmUploadBtn.textContent = 'Enviados ' + salvos + ' de ' + total;
                            previewTableContainer.textContent = 'Enviados ' + salvos + ' de ' + total + '. Ignorados: ' + ignoradosUpload;
                        }, () => exigirSessao(sessao));
                    alert(importacaoPendente.confirmados + ' registros confirmados. Ignorados: ' + ignoradosUpload + '.');
                    importacaoPendente = null; dadosUpload = []; fileInput.value = '';
                    uploadPreview.classList.add('hidden');
                } catch (error) {
                    console.error(error);
                    if (sessao !== versaoSessao) return;
                    const confirmados = importacaoPendente?.confirmados || 0;
                    const pendentes = importacaoPendente ? importacaoPendente.itens.length - confirmados : dadosUpload.length;
                    previewTableContainer.textContent = 'Importação interrompida. Confirmados: ' + confirmados +
                        '. Pendentes: ' + pendentes + '. ' + error.message +
                        '. Use Confirmar/Retomar Upload para continuar na mesma sessão.';
                    alert('Importação interrompida: ' + error.message);
                } finally {
                    if (sessao !== versaoSessao) return;
                    definirOcupado(false);
                    confirmUploadBtn.textContent = importacaoPendente ? 'Retomar Upload' : 'Confirmar Upload';
                    confirmUploadBtn.disabled = !dadosUpload.length || errosPlanilha.length > 0;
                }
            });


            // --- EVENT LISTENERS DA ABA VISUALIZAR DADOS ---

            // Debounce para busca de texto
            let searchTimeout = null;
            if (viewSearch) {
                viewSearch.addEventListener('input', () => {
                    clearTimeout(searchTimeout);
                    searchTimeout = setTimeout(() => {
                        aplicarFiltrosETabela(true);
                    }, 250);
                });
            }

            // Filtro de Estado: atualiza as cidades disponíveis e reaplica filtros
            if (viewEstado) {
                viewEstado.addEventListener('change', () => {
                    popularFiltroCidades();
                    aplicarFiltrosETabela(true);
                });
            }

            // Filtro de Cidade
            if (viewCidade) {
                viewCidade.addEventListener('change', () => {
                    aplicarFiltrosETabela(true);
                });
            }

            // Filtro de Operadora
            if (viewFilter) {
                viewFilter.addEventListener('change', () => {
                    aplicarFiltrosETabela(true);
                });
            }

            // Botão Limpar Filtros
            if (clearViewFiltersBtn) {
                clearViewFiltersBtn.addEventListener('click', () => {
                    if (viewSearch) viewSearch.value = '';
                    if (viewEstado) viewEstado.value = '';
                    popularFiltroCidades();
                    if (viewCidade) viewCidade.value = '';
                    if (viewFilter) viewFilter.value = '';
                    aplicarFiltrosETabela(true);
                });
            }

            // Botão Atualizar Dados do Banco
            if (reloadViewDataBtn) {
                reloadViewDataBtn.addEventListener('click', async () => {
                    if (operacaoEmAndamento) return;
                    definirOcupado(true);
                    const icone = reloadViewDataBtn.querySelector('i');
                    if (icone) icone.classList.add('fa-spin');
                    reloadViewDataBtn.disabled = true;

                    try { await carregarTabelaDados(true); } finally {
                        definirOcupado(false);
                        if (icone) icone.classList.remove('fa-spin');
                        reloadViewDataBtn.disabled = false;
                    }
                });
            }

            // Botão Excluir Grupo Filtrado
            if (btnExcluirGrupo) {
                btnExcluirGrupo.addEventListener('click', () => {
                    const total = dadosFiltrados.length;
                    if (total === 0) {
                        alert('Nenhum registro selecionado pelos filtros atuais.');
                        return;
                    }

                    const estado = viewEstado ? viewEstado.value.trim().toUpperCase() : '';
                    const cidade = viewCidade ? viewCidade.value.trim() : '';
                    const operadora = viewFilter ? viewFilter.value.trim() : '';
                    const busca = viewSearch ? viewSearch.value.trim() : '';

                    let rotulosFiltro = [];
                    if (estado) rotulosFiltro.push(`Estado: ${estado}`);
                    if (cidade) rotulosFiltro.push(`Cidade: ${escaparHTML(cidade)}`);
                    if (operadora) rotulosFiltro.push(`Operadora: ${getOperadoraNome(operadora)}`);
                    if (busca) rotulosFiltro.push(`Busca: "${busca}"`);

                    const descricaoFiltros = rotulosFiltro.length > 0
                        ? rotulosFiltro.join(' | ')
                        : 'Todos os registros exibidos';

                    const idsParaExcluir = dadosFiltrados.map(d => d.id);

                    abrirModalConfirmacaoExclusao({
                        titulo: `Exclusão em Grupo (${total} registros)`,
                        descricaoFiltros: descricaoFiltros,
                        idsParaExcluir: idsParaExcluir,
                        onConfirmado: async (onProgresso) => {
                            await processarExclusaoEmLotesFirestore(idsParaExcluir, onProgresso);
                        }
                    });
                });
            }

            // Botão Excluir Selecionados via Checkbox
            if (btnExcluirSelecionados) {
                btnExcluirSelecionados.addEventListener('click', () => {
                    const idsParaExcluir = Array.from(itensSelecionados);
                    const total = idsParaExcluir.length;
                    if (total === 0) {
                        alert('Nenhum registro marcado para exclusão.');
                        return;
                    }

                    abrirModalConfirmacaoExclusao({
                        titulo: `Exclusão de Registros Selecionados`,
                        descricaoFiltros: `${total} estabelecimento(s) selecionado(s) individualmente via caixa de seleção`,
                        idsParaExcluir: idsParaExcluir,
                        onConfirmado: async (onProgresso) => {
                            await processarExclusaoEmLotesFirestore(idsParaExcluir, onProgresso);
                        }
                    });
                });
            }

            // Paginação: Botão Anterior
            if (btnPrevPage) {
                btnPrevPage.addEventListener('click', () => {
                    if (paginaAtual > 1) {
                        paginaAtual--;
                        renderizarTabela();
                    }
                });
            }

            // Paginação: Botão Próxima
            if (btnNextPage) {
                btnNextPage.addEventListener('click', () => {
                    const totalPaginas = Math.ceil(dadosFiltrados.length / ITENS_POR_PAGINA);
                    if (paginaAtual < totalPaginas) {
                        paginaAtual++;
                        renderizarTabela();
                    }
                });
            }

            // --- INICIALIZAÇÃO ---
            console.log('Admin inicializado com sucesso!');
        }
