// ============================================================
// CONFIGURAÇÃO ÚNICA DO FIREBASE — edite APENAS este arquivo
// quando criar/migrar para outro projeto do Firebase.
//
// Onde encontrar os valores:
//   Console Firebase -> ícone da engrenagem -> Configurações do
//   projeto -> "Seus apps" (Web) -> snippet firebaseConfig
//
// ATENÇÃO: após substituir os valores, publique as regras do
// firestore/firestore.rules no NOVO projeto (Console -> Cloud
// Firestore -> Regras), senão qualquer pessoa poderá escrever
// no seu banco.
// ============================================================

const firebaseConfig = {
    apiKey: "AIzaSyBLjxxFLwx9VU23VyYpjsVjcdVB98Pzls4",          // <-- troque
    authDomain: "rede-atendimento-planos.firebaseapp.com",       // <-- troque
    projectId: "rede-atendimento-planos",                        // <-- troque
    storageBucket: "rede-atendimento-planos.appspot.com",        // <-- troque
    messagingSenderId: "805398823851",                           // <-- troque
    appId: "1:805398823851:web:c8edb87faa4483490688ee"           // <-- troque
};

firebase.initializeApp(firebaseConfig);
