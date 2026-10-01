const firebaseConfig = {
    apiKey: "AIzaSyAzlVSFfyH_vZCzvuZME7CoaQt3R_XjHDg",
    authDomain: "rede-de-atendimento-saude.firebaseapp.com",
    projectId: "rede-de-atendimento-saude",
    storageBucket: "rede-de-atendimento-saude.firebasestorage.app",
    messagingSenderId: "1097115884518",
    appId: "1:1097115884518:web:82a52a3188126731369427",
    measurementId: "G-VCCV8ZXNNC"
};

// Inicializa o Firebase
if (typeof firebase !== 'undefined' && !firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

