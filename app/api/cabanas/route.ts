// Arquivo: app/api/cabanas/route.ts
import { NextResponse } from 'next/server';
import { getFirebaseDb } from '@/lib/firebase';
import { collection, getDocs, addDoc, query, orderBy } from 'firebase/firestore';
import { Cabin } from '@/types';

export async function GET() {
    try {
        const db = await getFirebaseDb();
        if (!db) throw new Error("DB connection failed");

        const q = query(collection(db, 'cabanas'), orderBy('posicao', 'asc'));
        const querySnapshot = await getDocs(q);
        const cabanas = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Cabin[];
        
        return NextResponse.json(cabanas);

    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const db = await getFirebaseDb();
        if (!db) throw new Error("DB connection failed");

        const newCabin = await request.json();
        if (!newCabin.name || !newCabin.capacity) {
            return NextResponse.json({ message: 'Nome e capacidade são obrigatórios.' }, { status: 400 });
        }

        const docRef = await addDoc(collection(db, 'cabanas'), newCabin);
        return NextResponse.json({ id: docRef.id, ...newCabin }, { status: 201 });
    
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}