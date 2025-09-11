import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';

// Carrega as variáveis de ambiente do arquivo .env
dotenv.config();

// Verifica se a chave da conta de serviço do Firebase está definida
if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
  throw new Error('A variável de ambiente FIREBASE_SERVICE_ACCOUNT_KEY não foi definida.');
}

// Converte a string da chave do .env para um objeto JSON
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);

// Inicializa o app do Firebase Admin apenas se ainda não houver sido inicializado
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

// Exporta a instância inicializada do admin
export { admin };

