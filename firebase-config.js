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
    apiKey: "AIzaSyBFZx74qysIKcIaGf3_A6wQlaL9kiQs8-M",          // 
    authDomain: "rede-de-atendimento-saude.firebaseapp.com",       // 
    projectId: "rede-de-atendimento-saude",                        // 
    storageBucket: "rede-de-atendimento-saude.firebasestorage.app",        // 
    messagingSenderId: "1097115884518",                           // 
    appId: "1:1097115884518:web:197b7281c5e56a54369427"           // 
};

firebase.initializeApp(firebaseConfig);
