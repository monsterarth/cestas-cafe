// Arquivo: app/api/upload/route.ts
import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function POST(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const filename = searchParams.get('filename');

  // O corpo da requisição é o arquivo
  const body = request.body;

  if (!filename || !body) {
    return NextResponse.json(
      { error: 'Nome do arquivo ou corpo da requisição ausente.' },
      { status: 400 },
    );
  }

  try {
    const blob = await put(filename, body, {
      access: 'public',
    });

    return NextResponse.json(blob);

  } catch (error) {
    console.error('Erro no upload para o Vercel Blob:', error);
    return NextResponse.json(
      { error: 'Ocorreu um erro interno durante o upload.' },
      { status: 500 },
    );
  }
}