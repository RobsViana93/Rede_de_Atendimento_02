# Rede de Atendimento — Pesquisa de Planos de Saúde

Portal de consulta de hospitais, clínicas e laboratórios, com painel de cadastro,
importação de Excel e exclusão de registros. HTML, CSS e JavaScript puro, Firebase
Authentication e Firestore. Não há servidor próprio nem compilação obrigatória.

## Estrutura

| Arquivo | Responsabilidade |
|---|---|
| `index.html` | Consulta pública e botão Atualizar dados |
| `script.js` | Busca, filtros e exibição em grupos de 50 |
| `admin.html` | Interface e estilos específicos do login |
| `admin.js` | Autenticação, tabela, cadastro, importação e exclusão |
| `rede-data.js` | Validação, normalização, índice de duplicatas, repositório e lotes |
| `styles.css` | Estilos compartilhados e responsividade |
| `firebase-config.js` | Configuração local, ignorada pelo Git e publicada no Hosting |
| `firebase-config.example.js`, `env.example` | Modelos de configuração |
| `generate-config.sh` | Geração de configuração a partir de `.env` |
| `firebase.json` | Hosting, cache, cabeçalhos e caminho das regras |
| `firebase.emulator.json` | Configuração isolada dos testes do Firestore em localhost |
| `firestore.rules` | Segurança e validação do Firestore, na raiz |
| `.firebaserc` | Projeto padrão: `rede-de-atendimento-saude` |
| `_config.yml` | Compatibilidade com GitHub Pages/Jekyll |
| `tests/` | Testes offline com Node, sem acessar o Firebase |

Bibliotecas via CDN: Firebase SDK 8.10.1, SheetJS 0.18.5, Font Awesome e Inter.
O arquivo `download` é um arquivo de texto legado, não o modelo Excel; é excluído
da publicação. O modelo Excel é gerado pelo botão do painel.

## Leituras e fluxo de importação

Antes, cada linha da planilha provocava uma consulta de toda a coleção. Para uma
base de N documentos e M linhas, a verificação podia ler aproximadamente N × M
documentos quando atendida pelo servidor.

Agora:

1. O login carrega a coleção uma vez. Consultas concorrentes compartilham a mesma promessa.
2. Uma nova importação faz uma consulta ao servidor, compartilhando um carregamento que já esteja em andamento.
3. Um `Map` agrupa a base por nome, cidade e estado normalizados. Todas as linhas são comparadas em memória.
4. Duplicatas internas são removidas. Duplicatas da base podem ser ignoradas, canceladas ou enviadas por escolha explícita.
5. A gravação usa até 400 documentos por lote e uma estimativa conservadora de 4 MiB em UTF-8 para limitar o tamanho dos pedidos.
6. Cada lote confirmado atualiza a memória e a tabela. Não há consulta completa após gravar ou excluir.

Filtros, paginação e mudança de aba reutilizam os dados da sessão. Recarregar dados
consulta o servidor explicitamente. Uma coleção vazia também fica em memória.
Se a leitura falhar, a importação é interrompida; a falha não significa base vazia.

Exemplo: uma base de 2.000 documentos e uma planilha de 500 registros passam de
aproximadamente 1.000.000 para 2.000 leituras na etapa de verificação. O carregamento
do login e os acessos públicos são operações adicionais. Esta é uma estimativa,
não um contador de faturamento. Consulte o uso real no console Firebase.

### Falha parcial e retomada

Lotes são atômicos individualmente; a planilha inteira não é uma única transação.
O painel informa confirmados, ignorados e pendentes. Use **Retomar Upload** na mesma
sessão: as referências são geradas antes do envio e reutilizadas se a resposta
de um lote for perdida, evitando novos documentos na repetição da tentativa.
A repetição de uma gravação ainda pode contar como outra escrita.

Não feche/recarregue a página nem saia da sessão para retomar a tentativa existente.
Os IDs pendentes são mantidos em memória. Ao sair, a tentativa é descartada; os lotes
já salvos permanecem no banco. Para reimportar depois, confira os registros existentes
e escolha ignorar duplicadas. Operações e uploads simultâneos no mesmo painel ficam bloqueados.

## Consulta pública

O site carrega a coleção uma vez por abertura, sem assinatura `onSnapshot`.
Busca sem acentos, filtros e Mostrar mais trabalham localmente. Para obter novos
cadastros sem reabrir a página, use **Atualizar dados**. Se a atualização falhar,
os últimos resultados bem-sucedidos são preservados e a falha é informada.
As mudanças do banco não são mais recebidas automaticamente por todos os visitantes
durante uma importação.

## Planilha e dados

Cabeçalhos obrigatórios: `Nome`, `Estado`, `Cidade`, `Tipo`, `Operadoras`.
Cabeçalhos opcionais: `Modalidades`, `Planos`. A primeira aba é importada.
Linhas completamente vazias são ignoradas. Erros indicam a linha original da planilha
e bloqueiam o envio até a correção e nova seleção do arquivo.

| Campo no Firestore | Validação |
|---|---|
| `nome`, `cidade` | Texto obrigatório, até 300 caracteres |
| `estado` | Uma das 27 UFs, em maiúsculas |
| `tipo` | `hospital`, `clinica`, `laboratorio`; tipo vazio na planilha assume hospital |
| `operadoras` | Lista com pelo menos uma operadora válida |
| `modalidades`, `planos` | Texto opcional, até 10.000 caracteres por campo |

Chaves aceitas: `amil`, `amil-selecionada`, `bradesco`, `sulamerica`, `hapvida`, `liv-saude`.
Aliases como Sul América, SulAmérica, Amil Selecionada, Liv Saúde e Clínica são
padronizados automaticamente. Operadoras desconhecidas, como Unimed, precisam ser
corrigidas; elas não são silenciosamente cadastradas.

Na leitura, grafias reconhecidas de documentos antigos são normalizadas apenas
em memória. Nenhum documento existente é migrado ou sobrescrito automaticamente.
Duplicatas existentes são preservadas para revisão manual.

## Segurança

Leitura de `hospitais` é pública. Criação e atualização exigem autenticação pelo
provedor e-mail/senha e os campos/tipos acima. Exclusão exige o mesmo provedor,
mas pode remover documentos antigos fora do novo formato. Outras coleções são negadas.
As regras não consultam documentos auxiliares, evitando leituras adicionais para autorização.

**O provedor de login não é um papel administrativo.** Todas as contas e-mail/senha
do projeto continuam podendo administrar a coleção. Mantenha essas contas restritas
à equipe. Caso existam contas de clientes nesse provedor, defina uma autorização
explícita por UID ou custom claim antes de publicar. Não foi inventada uma lista de
administradores sem conhecer os usuários reais do projeto.

Os valores da configuração web são entregues ao navegador. A proteção está nas
regras e na autorização. `.env`, logs, testes e arquivos internos são excluídos do
Firebase Hosting. Dados interpolados em HTML são escapados; o botão de exclusão
usa um listener em vez de inserir nome/ID dentro de JavaScript inline.

## Configuração e execução

1. Copie `firebase-config.example.js` para `firebase-config.js` e preencha os valores do console Firebase.
2. Ative Authentication por e-mail/senha e crie as contas da equipe.
3. Confirme o projeto em `.firebaserc`, os domínios autorizados e as regras.
4. Sirva a pasta por HTTP. Exemplo: `npx --yes serve .`.

Alternativamente, copie `env.example` para `.env`, preencha os valores e execute
`bash generate-config.sh` em um ambiente com Bash. Ao mudar de projeto, atualize
também `.firebaserc`; a configuração do navegador não altera o destino da CLI.

HTMLs não contêm front matter de Jekyll. Firebase Hosting é o destino configurado.
Em GitHub Pages, `firebase-config.js` precisa ser gerado/incluído no artefato de
publicação; um simples push do repositório não envia o arquivo ignorado pelo Git.
JavaScript/CSS usam revalidação de cache para evitar versões antigas após publicação.

## Validação e publicação

Testes offline, sem dependências npm nem consumo da quota:

```bash
node --test tests/*.test.cjs
node --check admin.js
node --check rede-data.js
node --check script.js
```

Eles cobrem uma consulta para a verificação de 500 registros contra uma base de
2.000, importação de 850, retomada com resposta perdida, erros de leitura,
padronização, sessão, cancelamento/ignorar duplicatas e filtros sem consultas.
Os testes de interface usam DOM/Firebase simulados; não substituem uma validação
visual no navegador nem a compilação das regras no emulador.

Testes das regras no Firestore Emulator, com Java 21 e Firebase CLI:

```bash
firebase emulators:exec --only firestore --project demo-rede-tests --config firebase.emulator.json "node --test tests/firestore-rules.emulator.cjs"
```

No PowerShell, use `firebase.cmd` caso a política de execução bloqueie o wrapper
`firebase.ps1`. O primeiro uso pode baixar o componente do emulador.
A configuração usa somente localhost e o projeto fictício `demo-rede-tests`.
Os testes recusam execução sem `FIRESTORE_EMULATOR_HOST` em loopback e não acessam
o banco de produção. A limpeza de dados acontece apenas nessa base emulada.

Os 10 testes de regras foram executados com sucesso: leitura pública de documento
e coleção, rejeição de escrita sem login/anônima, criação/atualização/exclusão por
e-mail/senha, rejeição de outros provedores, campos obrigatórios, formatos inválidos,
limites de texto, opcionais ausentes, exclusão de legado e bloqueio de outras coleções.
O emulador carregou e avaliou o arquivo `firestore.rules` da raiz sem erro de compilação.
Repita essa validação após alterar as regras e antes de publicar.

Publicação, quando autorizada:

```bash
firebase deploy --only firestore:rules,hosting --project rede-de-atendimento-saude
```

Depois, faça uma importação controlada e confira as métricas de leituras/escritas
no console. As alterações locais não modificam regras ou arquivos já publicados.

## Limites e evolução

Cada nova importação ainda lê toda a coleção uma vez. Cada visitante público
também a carrega uma vez por abertura/atualização. A paginação limita a exibição,
não a consulta. Para bases muito grandes, a evolução exige busca/paginação no
servidor ou um catálogo estático versionado, preservando o comportamento de busca.

A checagem de duplicatas usa uma fotografia da base; não garante unicidade entre
dois administradores simultâneos. Também preserva a opção de inserir duplicatas
intencionalmente. Unicidade obrigatória ou consultas por chave requerem uma decisão
sobre esse comportamento, autorização e migração dos documentos legados. Não há
migração remota nem alteração dos IDs antigos nesta implementação.

## Autor e licença

RobsViana93. Projeto interno da corretora — uso restrito.
