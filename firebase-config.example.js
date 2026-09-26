// ============================================================
// TEMPLATE DE CONFIGURAÇÃO DO FIREBASE (seguro para subir ao GitHub)
//
// Este arquivo NÃO contém chaves reais — pode ser versionado.
//
// COMO USAR:
//   1. Copie este arquivo com o nome:  firebase-config.js
//      (firebase-config.js está no .gitignore e NUNCA vai ao GitHub)
//   2. Preencha com os valores do SEU projeto:
//        Console Firebase -> ícone da engrenagem -> Configurações
//        do projeto -> "Seus apps" (Web) -> snippet firebaseConfig
//   3. Ao publicar no GitHub Pages, faça o upload de
//      firebase-config.js pelo painel do Render/Netlify OU gere-o
//      em build-time (ver README). Em deploy estático simples,
//      você precisará subir o firebase-config.js preenchido junto
//      com os demais arquivos UMA ÚNICA VEZ — ele ficará fora do
//      histórico do Git porque está no .gitignore.
//
// LEMBRETE CRÍTICO: a apiKey do Firebase NÃO é um segredo — ela é
// entregue ao navegador de todo visitante de qualquer site Firebase
// do mundo. A proteção real dos dados são as REGRAS DO FIRESTORE
// (firestore.rules) + Authentication. Mesmo assim, manter o valor
// fora do repositório evita poluição do histórico e confusão.
// ============================================================

const firebaseConfig = {
    apiKey:            "COLE_AQUI_SUA_API_KEY",
    authDomain:        "SEU-PROJETO.firebaseapp.com",
    projectId:         "SEU-PROJETO",
    storageBucket:     "SEU-PROJETO.firebasestorage.app",
    messagingSenderId: "SEU_MESSAGING_SENDER_ID",
    appId:             "SEU_APP_ID"
};

firebase.initializeApp(firebaseConfig);
