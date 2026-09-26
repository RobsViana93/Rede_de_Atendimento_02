// =================================================
// script.js — Página pública de pesquisa
// Versão 2.0: busca sem acentos, debounce, filtros
// avançados (tipo/UF), paginação e contagem de resultados
// =================================================

document.addEventListener('DOMContentLoaded', () => {

    // --- CONFIGURAÇÃO ---
    const LOTE = 50; // resultados exibidos por página

    // --- VARIÁVEIS GLOBAIS ---
    const hospitaisCollection = db.collection('hospitais');
    let dadosHospitais = [];
    let resultadosFiltrados = [];
    let limiteExibicao = LOTE;

    // --- ELEMENTOS DO DOM ---
    const searchInput = document.getElementById('searchInput');
    const resultsContainer = document.getElementById('resultsContainer');
    const loading = document.getElementById('loading');
    const noResults = document.getElementById('noResults');
    const resultSummary = document.getElementById('resultSummary');
    const checkboxes = document.querySelectorAll('.operadora-checkbox input');
    const clearBtn = document.getElementById('clearBtn');
    const searchBtn = document.getElementById('searchBtn');
    const toggleAdvanced = document.getElementById('toggleAdvanced');
    const advancedContent = document.getElementById('advancedContent');
    const tipoFilter = document.getElementById('tipoFilter');
    const estadoFilter = document.getElementById('estadoFilter');
    const allOperatorsBtn = document.getElementById('allOperators');
    const noneOperatorsBtn = document.getElementById('noneOperators');

    // --- FUNÇÕES AUXILIARES ---
    const NOMES_OPERADORAS = {
        'amil': 'Amil',
        'amil-selecionada': 'Amil Selecionada',
        'bradesco': 'Bradesco',
        'sulamerica': 'Sul América',
        'hapvida': 'Hapvida',
        'liv-saude': 'Liv Saúde'
    };

    const NOMES_TIPOS = {
        'hospital': 'Hospital',
        'laboratorio': 'Laboratório',
        'clinica': 'Clínica'
    };

    const getOperadoraNome = (op) => NOMES_OPERADORAS[op] || op;
    const getTipoNome = (tipo) => NOMES_TIPOS[tipo] || (tipo || '').toString();

    // Normaliza texto para comparação: minúsculas, sem acentos
    function normalizar(str) {
        if (!str) return '';
        return str.toString()
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
    }

    // Escapa HTML para evitar injeção em dados cadastrados
    function escaparHTML(str) {
        if (str === null || str === undefined) return '';
        return str.toString()
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    const mostrarLoading = () => {
        loading.classList.remove('hidden');
        noResults.classList.add('hidden');
    };

    const esconderLoading = () => {
        loading.classList.add('hidden');
    };

    // Debounce para não filtrar a cada tecla
    function debounce(fn, delay = 250) {
        let timer;
        return (...args) => {
            clearTimeout(timer);
            timer = setTimeout(() => fn(...args), delay);
        };
    }

    // --- ATUALIZA ESTADO VISUAL DOS CHECKBOXES ---
    function atualizarCheckboxVisuals() {
        document.querySelectorAll('.operadora-checkbox').forEach(item => {
            const input = item.querySelector('input[type="checkbox"]');
            item.classList.toggle('selected', input.checked);
        });
    }

    // --- LÓGICA DE BUSCA E RENDERIZAÇÃO ---
    function realizarBusca() {
        const termo = normalizar(searchInput.value.trim());
        const filtros = Array.from(checkboxes).filter(cb => cb.checked).map(cb => cb.id);
        const tipoSelecionado = tipoFilter ? tipoFilter.value : '';
        const estadoSelecionado = estadoFilter ? estadoFilter.value.toUpperCase() : '';

        if (filtros.length === 0) {
            resultadosFiltrados = [];
            limiteExibicao = LOTE;
            resultSummary.classList.add('hidden');
            noResults.classList.add('hidden');
            resultsContainer.innerHTML = `
                <div class="initial-message">
                    <i class="fas fa-hand-pointer"></i>
                    <h3>Selecione ao menos uma operadora</h3>
                    <p>Escolha uma ou mais operadoras acima para visualizar a rede credenciada disponível.</p>
                </div>`;
            return;
        }

        resultadosFiltrados = dadosHospitais.filter(h => {
            if (!h.nome || !h.operadoras) return false;

            const matchTermo = !termo ||
                normalizar(h.nome).includes(termo) ||
                normalizar(h.cidade).includes(termo) ||
                normalizar(h.estado).includes(termo);

            const matchOperadoras = Array.isArray(h.operadoras) &&
                h.operadoras.some(op => filtros.includes(op));

            const matchTipo = !tipoSelecionado || normalizar(h.tipo) === normalizar(tipoSelecionado);

            const matchEstado = !estadoSelecionado ||
                normalizar(h.estado).slice(0, 2) === normalizar(estadoSelecionado);

            return matchTermo && matchOperadoras && matchTipo && matchEstado;
        });

        // Ordenação alfabética para melhor experiência
        resultadosFiltrados.sort((a, b) =>
            normalizar(a.nome).localeCompare(normalizar(b.nome)));

        limiteExibicao = LOTE;
        mostrarResultados();
    }

    function mostrarResultados() {
        esconderLoading();

        if (resultadosFiltrados.length === 0) {
            noResults.classList.remove('hidden');
            resultSummary.classList.add('hidden');
            resultsContainer.innerHTML = '';
            return;
        }

        noResults.classList.add('hidden');

        const visiveis = resultadosFiltrados.slice(0, limiteExibicao);

        // Resumo de resultados
        const termo = searchInput.value.trim();
        const total = resultadosFiltrados.length;
        let resumo = `<i class="fas fa-circle-check"></i> <strong>${total}</strong> resultado${total === 1 ? '' : 's'} encontrado${total === 1 ? '' : 's'}`;
        if (termo) resumo += ` para "<strong>${escaparHTML(termo)}</strong>"`;
        resultSummary.innerHTML = resumo;
        resultSummary.classList.remove('hidden');

        const resultadosHTML = visiveis.map(h => {
            const operadorasBadges = (h.operadoras || []).map(op =>
                `<span class="operadora-badge ${escaparHTML(op)}">${escaparHTML(getOperadoraNome(op))}</span>`
            ).join('');

            const modalidadesHTML = h.modalidades ?
                `<div class="result-modalidades"><i class="fas fa-stethoscope"></i> <strong>Modalidades:</strong> ${escaparHTML(h.modalidades)}</div>` : '';

            const planosHTML = h.planos ?
                `<div class="result-planos"><i class="fas fa-id-card"></i> <strong>Planos:</strong> ${escaparHTML(h.planos)}</div>` : '';

            return `
                <div class="result-card">
                    <div class="result-header">
                        <h3 class="result-title">${escaparHTML(h.nome)}</h3>
                        <span class="result-type">${escaparHTML(getTipoNome(h.tipo))}</span>
                    </div>
                    <p class="result-location">
                        <i class="fas fa-map-marker-alt"></i>
                        ${escaparHTML(h.cidade) || 'Cidade não informada'}${h.estado ? ', ' + escaparHTML(h.estado) : ''}
                    </p>
                    <div class="result-operadoras">${operadorasBadges}</div>
                    ${modalidadesHTML}
                    ${planosHTML}
                </div>
            `;
        }).join('');

        // Botão "carregar mais" quando houver mais resultados
        const loadMore = limiteExibicao < resultadosFiltrados.length
            ? `<button id="loadMoreBtn" class="load-more-btn">
                   <i class="fas fa-angle-double-down"></i>
                   Mostrar mais (${resultadosFiltrados.length - limiteExibicao} restantes)
               </button>`
            : '';

        resultsContainer.innerHTML = resultadosHTML + loadMore;

        const btn = document.getElementById('loadMoreBtn');
        if (btn) {
            btn.addEventListener('click', () => {
                limiteExibicao += LOTE;
                mostrarResultados();
            });
        }
    }

    // --- INICIALIZAÇÃO E CARREGAMENTO DE DADOS ---
    function inicializar() {
        mostrarLoading();
        resultsContainer.innerHTML = `
            <div class="initial-message">
                <i class="fas fa-search"></i>
                <h3>Bem-vindo à Rede de Atendimento</h3>
                <p>Digite o nome de um hospital, clínica ou cidade e filtre pelas operadoras desejadas.</p>
            </div>`;
    }

    // --- CARREGAMENTO DOS DADOS DO FIREBASE ---
    hospitaisCollection.onSnapshot(snapshot => {
        dadosHospitais = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        if (dadosHospitais.length > 0) {
            realizarBusca();
        } else {
            esconderLoading();
            resultsContainer.innerHTML = `
                <div class="initial-message">
                    <i class="fas fa-database"></i>
                    <h3>Nenhum dado encontrado</h3>
                    <p>Ainda não há estabelecimentos cadastrados no sistema.</p>
                </div>`;
        }
    }, error => {
        console.error('Erro ao conectar com Firebase:', error);
        esconderLoading();
        resultsContainer.innerHTML = `
            <div class="initial-message error-message-box">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Erro ao conectar com o banco de dados</h3>
                <p>Verifique sua conexão com a internet e tente novamente.</p>
            </div>`;
    });

    // --- EVENT LISTENERS ---
    const buscarDebounced = debounce(realizarBusca, 250);

    if (searchInput) {
        searchInput.addEventListener('input', buscarDebounced);
    }

    if (searchBtn) {
        searchBtn.addEventListener('click', realizarBusca);
    }

    if (checkboxes.length > 0) {
        checkboxes.forEach(cb => {
            cb.addEventListener('change', () => {
                atualizarCheckboxVisuals();
                realizarBusca();
            });
        });
    }

    if (allOperatorsBtn) {
        allOperatorsBtn.addEventListener('click', () => {
            checkboxes.forEach(cb => cb.checked = true);
            atualizarCheckboxVisuals();
            realizarBusca();
        });
    }

    if (noneOperatorsBtn) {
        noneOperatorsBtn.addEventListener('click', () => {
            checkboxes.forEach(cb => cb.checked = false);
            atualizarCheckboxVisuals();
            realizarBusca();
        });
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            searchInput.value = '';
            checkboxes.forEach(cb => cb.checked = true);
            if (tipoFilter) tipoFilter.value = '';
            if (estadoFilter) estadoFilter.value = '';
            atualizarCheckboxVisuals();
            realizarBusca();
            searchInput.focus();
        });
    }

    if (tipoFilter) tipoFilter.addEventListener('change', realizarBusca);
    if (estadoFilter) estadoFilter.addEventListener('change', realizarBusca);

    // Filtros avançados (gaveta)
    if (toggleAdvanced && advancedContent) {
        toggleAdvanced.addEventListener('click', () => {
            const aberto = advancedContent.classList.toggle('hidden') === false;
            toggleAdvanced.classList.toggle('active', aberto);
            toggleAdvanced.setAttribute('aria-expanded', String(aberto));
        });
    }

    // --- INICIALIZAÇÃO ---
    atualizarCheckboxVisuals();
    inicializar();
});
