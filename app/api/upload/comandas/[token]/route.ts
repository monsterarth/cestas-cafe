// Arquivo: app/api/comandas/[token]/route.ts
import { getFirebaseDb } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { token: string } }
) {
  try {
    const token = params.token.toUpperCase();

    if (!token) {
      return NextResponse.json({ error: "Token não fornecido." }, { status: 400 });
    }

    // CORREÇÃO APLICADA AQUI
    const db = await getFirebaseDb();
    if (!db) {
        return NextResponse.json({ error: "Falha na conexão com o banco de dados." }, { status: 500 });
    }

    const q = query(
      collection(db, "comandas"),
      where("token", "==", token),
      where("isActive", "==", true)
    );

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return NextResponse.json({ error: "Comanda inválida ou expirada." }, { status: 404 });
    }
    
    const doc = querySnapshot.docs[0];
    const comandaData = doc.data();
    
    const response = {
      token: comandaData.token,
      guestName: comandaData.guestName,
      cabin: comandaData.cabin,
      numberOfGuests: comandaData.numberOfGuests,
    }

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error("Erro ao validar comanda:", error);
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
  }
}