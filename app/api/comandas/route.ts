import { NextResponse } from 'next/server';

// Função de teste para o método GET
export async function GET(request: Request) {
  return NextResponse.json({ 
    message: 'SUCESSO! O arquivo da rota foi encontrado e o método GET funciona!' 
  });
}

// Função de teste para o método POST
export async function POST(request: Request) {
  const data = await request.json();
  return NextResponse.json({ 
    message: 'SUCESSO! O método POST funciona!',
    dadosRecebidos: data 
  });
}