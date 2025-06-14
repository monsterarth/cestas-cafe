import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

// Esta é uma função "chamável". Ela é segura e só pode ser
// invocada por usuários autenticados no seu app.
export const addAdminRole = functions.https.onCall(async (data, context) => {
  // 1. Verificação de Segurança: Garante que o usuário que está
  //    chamando esta função JÁ É um admin. Isso impede que qualquer
  //    usuário possa se promover ou promover outros.
  if (context.auth?.token?.admin !== true) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Apenas administradores podem adicionar outros administradores.",
    );
  }

  // 2. Pega o email do usuário que deve se tornar admin.
  const email = data.email;
  if (!email) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "O e-mail é obrigatório.",
    );
  }

  try {
    // 3. Encontra o usuário no Firebase Authentication pelo email.
    const user = await admin.auth().getUserByEmail(email);

    // 4. Adiciona o "custom claim" de admin para esse usuário.
    await admin.auth().setCustomUserClaims(user.uid, { admin: true });

    // 5. Retorna uma mensagem de sucesso.
    return {
      message: `Sucesso! O usuário ${email} agora é um administrador.`,
    };
  } catch (err) {
    console.error(err);
    throw new functions.https.HttpsError(
      "internal",
      "Ocorreu um erro ao tentar definir o papel de administrador.",
    );
  }
});