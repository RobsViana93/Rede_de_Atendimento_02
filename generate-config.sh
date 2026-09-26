#!/usr/bin/env bash
# Gera firebase-config.js a partir do arquivo .env (uso local / CI).
set -euo pipefail
[ -f .env ] || { echo "Erro: crie o arquivo .env a partir de .env.example"; exit 1; }
set -a; source .env; set +a
cat > firebase-config.js <<JS
// ARQUIVO GERADO automaticamente por generate-config.sh — não edite, não versione.
const firebaseConfig = {
    apiKey:            "${FIREBASE_API_KEY}",
    authDomain:        "${FIREBASE_AUTH_DOMAIN}",
    projectId:         "${FIREBASE_PROJECT_ID}",
    storageBucket:     "${FIREBASE_STORAGE_BUCKET}",
    messagingSenderId: "${FIREBASE_MESSAGING_SENDER_ID}",
    appId:             "${FIREBASE_APP_ID}"
};
firebase.initializeApp(firebaseConfig);
JS
echo "OK: firebase-config.js gerado (fora do Git pelo .gitignore)."
