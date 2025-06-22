// Arquivo: lib/firebase-admin.ts
import admin from 'firebase-admin';

// Esta verificação evita que a aplicação seja inicializada múltiplas vezes
// em ambiente de desenvolvimento, o que causaria erros.
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // O replace é importante para formatar corretamente a chave privada
        // que está como uma string no .env.local
        privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
      }),
    });
    console.log('Firebase Admin SDK inicializado com sucesso.');
  } catch (error: any) {
    console.error('Falha na inicialização do Firebase Admin SDK:', error.stack);
  }
}

// Exportamos as instâncias do Firestore e Auth do Admin para serem usadas nas APIs
const adminDb = admin.firestore();
const adminAuth = admin.auth();

export { adminDb, adminAuth };