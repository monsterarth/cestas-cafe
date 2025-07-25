// cestas-cafe/app/api/pre-check-in/[id]/route.ts
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { z } from 'zod';

const updateSchema = z.object({
  status: z.enum(['recebido', 'concluido', 'arquivado']),
});

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  if (!id) {
    return NextResponse.json({ message: 'ID do documento é obrigatório' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const parsedData = updateSchema.safeParse(body);

    if (!parsedData.success) {
      return NextResponse.json({ message: 'Dados inválidos', errors: parsedData.error.errors }, { status: 400 });
    }
    
    const { status } = parsedData.data;

    const docRef = adminDb.collection('pre_check_ins').doc(id);

    await docRef.update({ status });

    return NextResponse.json({ message: `Status atualizado para ${status}` }, { status: 200 });

  } catch (error) {
    console.error(`Erro ao atualizar o pré-check-in ${id}:`, error);
    return NextResponse.json({ message: 'Erro interno do servidor.' }, { status: 500 });
  }
}