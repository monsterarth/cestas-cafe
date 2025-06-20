// Arquivo: app/api/comandas/route.ts
import { getFirebaseDb } from "@/lib/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { NextResponse } from "next/server";

// Função para gerar um token amigável. Ex: A4B9C
function generateToken(length = 5) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let token = '';
  for (let i = 0; i < length; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

export async function POST(request: Request) {
  try {
    const { guestName, cabin, numberOfGuests } = await request.json();

    if (!guestName || !cabin || !numberOfGuests) {
      return NextResponse.json({ error: "Dados incompletos." }, { status: 400 });
    }
    
    // CORREÇÃO APLICADA AQUI
    const db = await getFirebaseDb();
    if (!db) {
        return NextResponse.json({ error: "Falha na conexão com o banco de dados." }, { status: 500 });
    }

    const token = generateToken();

    const comandaData = {
      token,
      guestName,
      cabin,
      numberOfGuests: Number(numberOfGuests),
      isActive: true,
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, "comandas"), comandaData);

    return NextResponse.json({ id: docRef.id, ...comandaData }, { status: 201 });

  } catch (error) {
    console.error("Erro ao criar comanda:", error);
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
  }
}