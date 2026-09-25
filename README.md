# Rede de Atendimento — Pesquisa de Planos de Saúde

Portal público de pesquisa da rede credenciada de planos de saúde (Amil, Amil Selecionada,
Bradesco, Sul América, Hapvida e Liv Saúde), com área administrativa protegida por
autenticação para cadastro manual e importação de planilhas Excel.

Projeto desenvolvido para uso em corretora de seguros.

## 🧭 Estrutura do projeto

```
.
├── index.html                  # Página pública de pesquisa
├── script.js                   # Lógica de busca/filtros da página pública
├── styles.css                  # Estilos (página pública + admin)
├── admin.html                  # Área administrativa (login Firebase Auth + CRUD)
├── firebase.json               # Config de deploy (Hosting + Firestore rules)
└── firestore/
    └── firestore.rules         # Regras de segurança do Firestore
```

> **Nota:** a pasta `admin/` antiga (versão descontinuada que usava `localStorage`)
> e o arquivo vazio `auth-protection.js` foram removidos. A versão canônica do
> painel é o `admin.html` na raiz.

## ✨ Funcionalidades

### Página pública (`index.html`)
- Busca instantânea por nome, cidade ou estado (com debounce).
- Busca **sem distinção de acentos** ("Sao Paulo" encontra "São Paulo").
- Filtros por operadora com atalhos "Todas" / "Nenhuma".
- Filtros avançados: tipo de estabelecimento (hospital/clínica/laboratório) e UF.
- Contador de resultados, ordenação alfabética e paginação "Mostrar mais".
- Layout responsivo (mobile-first nos breakpoints 768px e 480px) e acessível
  (skip-link, `aria-*`, contraste adequado).

### Área administrativa (`admin.html`)
- Login com **Firebase Authentication** (e-mail e senha).
- Cadastro manual de estabelecimentos.
- Upload de planilhas `.xlsx/.xls` com prévia dos dados.
- Verificação de duplicatas (internas e contra a base existente) antes de salvar.
- Visualização, busca e filtro dos registros cadastrados.

## 🔐 Segurança — leia antes de publicar

As credenciais do Firebase no front-end são **públicas por design** (a apiKey não é um
segredo), mas **elas só são seguras se as regras do Firestore estiverem corretas**.

O arquivo `firestore/firestore.rules` implementa:

| Operação | Quem pode |
|---|---|
| Ler `hospitais` | Qualquer visitante (site público) |
| Criar/editar/excluir `hospitais` | **Apenas usuários autenticados** (`request.auth != null`) |
| Qualquer outra coleção | Negado |

### Passos obrigatórios no console do Firebase
1. **Authentication → Sign-in method**: ative **E-mail/Senha**.
2. **Authentication → Users**: crie o usuário (e-mail/senha) que acessará o admin.
   Não use "Allow new user sign-ups" em produção — crie usuários manualmente.
3. **Firestore → Rules**: publique as regras (ver deploy abaixo) — sem isso,
   qualquer pessoa poderá escrever no seu banco de dados.
4. **Project settings → Your apps**: confirme se o domínio do site está em
   *Authorized domains* (para o Auth) e configure restrições de HTTP Referrer
   na API key no Google Cloud Console (recomendado).

## 🚀 Como executar

### Modo local (rápido)
Abra os arquivos diretamente no navegador, ou sirva a pasta:
```bash
npx --yes serve .
```

### Deploy no Firebase Hosting
```bash
npm i -g firebase-tools
firebase login
firebase init hosting        # projeto: rede-atendimento-planos, pasta pública: .
firebase deploy --only hosting
```

### Publicar as regras de segurança (essencial!)
```bash
firebase deploy --only firestore:rules
```

## 🗂️ Formato dos dados (coleção `hospitais`)

| Campo | Tipo | Obrigatório | Exemplo |
|---|---|---|---|
| `nome` | string | sim | "Hospital Albert Einstein" |
| `estado` | string (UF) | sim | "SP" |
| `cidade` | string | sim | "São Paulo" |
| `tipo` | string | sim | `hospital` \| `clinica` \| `laboratorio` |
| `operadoras` | array de strings | sim | `["amil", "bradesco"]` |
| `modalidades` | string | não | "Pronto Atendimento, UTI" |
| `planos` | string | não | "Intermédial, Nacional..." |

Chaves válidas de operadora: `amil`, `amil-selecionada`, `bradesco`, `sulamerica`,
`hapvida`, `liv-saude`.

Colunas esperadas na planilha Excel: `Nome`, `Estado`, `Cidade`, `Tipo`,
`Operadoras` (separadas por vírgula), `Modalidades`, `Planos`.

## 👤 Autor
- **RobsViana93**

## Licença
Projeto interno da corretora — uso restrito.
