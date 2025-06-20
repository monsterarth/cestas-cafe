import { getFirebaseDb } from "@/lib/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { NextResponse } from "next/server";

// Função para gerar um token alfanumérico amigável
function generateToken(length = 5) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let token = '';
  for (let i = 0; i < length; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

// Esta é a função que lida com requisições POST
export async function POST(request: Request) {
  try {
    // 1. Pega os dados enviados pelo formulário do painel admin
    const body = await request.json();
    const { guestName, cabin, numberOfGuests } = body;

    // 2. Valida se todos os dados necessários foram recebidos
    if (!guestName || !cabin || !numberOfGuests) {
      return NextResponse.json({ error: "Dados da comanda incompletos." }, { status: 400 });
    }
    
    // 3. Conecta ao banco de dados do Firebase
    const db = await getFirebaseDb();
    if (!db) {
        throw new Error("Falha na conexão com o banco de dados.");
    }

    // 4. Cria a nova comanda com um token aleatório
    const token = generateToken();
    const newComandaData = {
      token,
      guestName,
      cabin,
      numberOfGuests: Number(numberOfGuests),
      isActive: true, // A comanda já nasce ativa
      createdAt: serverTimestamp(), // Usa o timestamp do servidor para a data de criação
    };

    // 5. Salva a nova comanda na sua coleção 'comandas' do Firestore
    const docRef = await addDoc(collection(db, "comandas"), newComandaData);

    console.log("Comanda criada com sucesso no Firestore:", docRef.id);

    // 6. Retorna a comanda completa com seu novo ID para o frontend
    return NextResponse.json({ id: docRef.id, ...newComandaData }, { status: 201 });

  } catch (error) {
    console.error("Erro interno na API /api/comandas:", error);
    if (error instanceof Error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: "Ocorreu um erro interno desconhecido." }, { status: 500 });
  }
}