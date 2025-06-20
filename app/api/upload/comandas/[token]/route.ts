import { getFirebaseDb } from "@/lib/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { NextResponse } from "next/server";

// Função para gerar um token alfanumérico amigável. Ex: A4B9C
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
    const body = await request.json();
    const { guestName, cabin, numberOfGuests } = body;

    if (!guestName || !cabin || !numberOfGuests) {
      return NextResponse.json({ error: "Dados da comanda incompletos." }, { status: 400 });
    }
    
    // Pega a instância do banco de dados
    const db = await getFirebaseDb();
    if (!db) {
        throw new Error("Falha na conexão com o banco de dados.");
    }

    const token = generateToken();

    // Monta o objeto que será salvo no Firestore
    const newComandaData = {
      token,
      guestName,
      cabin,
      numberOfGuests: Number(numberOfGuests),
      isActive: true, // A comanda já nasce ativa
      createdAt: serverTimestamp(), // Usa o timestamp do servidor
    };

    // Adiciona o novo documento na coleção 'comandas'
    const docRef = await addDoc(collection(db, "comandas"), newComandaData);

    // Retorna a comanda completa com seu novo ID para o frontend
    return NextResponse.json({ id: docRef.id, ...newComandaData }, { status: 201 });

  } catch (error) {
    console.error("Erro ao criar comanda:", error);
    // Retorna uma mensagem de erro genérica para o cliente
    return NextResponse.json({ error: "Ocorreu um erro interno ao criar a comanda." }, { status: 500 });
  }
}