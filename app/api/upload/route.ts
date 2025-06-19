import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function POST(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const filename = searchParams.get('filename');

  if (!filename || !request.body) {
    return NextResponse.json({ message: 'Nome do arquivo não encontrado.' }, { status: 400 });
  }

  // Faz o upload do corpo da requisição (o arquivo) para o Vercel Blob
  const blob = await put(filename, request.body, {
    access: 'public',
  });

  // Retorna a URL pública do arquivo
  return NextResponse.json(blob);
}