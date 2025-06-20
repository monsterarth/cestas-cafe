import { getFirebaseDb } from "@/lib/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { NextResponse } from "next/server";

// ===================================================================
// FUNÇÃO DE TESTE GET
// ===================================================================
export async function GET(request: Request) {
  // Esta função serve apenas para testar se a rota está acessível.
  return NextResponse.json(
    { 
      status: "sucesso",
      message: "A rota /api/comandas está no ar e respondendo a requisições GET!",
      timestamp: new Date().toISOString()
    },
    { status: 200 }
  );
}
// ===================================================================

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
    
    const db = await getFirebaseDb();
    if (!db) {
        throw new Error("Falha na conexão com o banco de dados.");
    }

    const token = generateToken();
    const newComandaData = {
      token,
      guestName,
      cabin,
      numberOfGuests: Number(numberOfGuests),
      isActive: true,
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, "comandas"), newComandaData);

    return NextResponse.json({ id: docRef.id, ...newComandaData }, { status: 201 });

  } catch (error) {
    console.error("Erro interno na API /api/comandas [POST]:", error);
    if (error instanceof Error) {
        return NextResponse.json({ error: `Erro no servidor: ${error.message}` }, { status: 500 });
    }
    return NextResponse.json({ error: "Ocorreu um erro interno desconhecido." }, { status: 500 });
  }
}