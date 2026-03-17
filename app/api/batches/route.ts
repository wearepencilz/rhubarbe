import { NextResponse } from 'next/server';
import { getBatches, saveBatches, getFlavours } from '@/lib/db';

export async function GET() {
  try {
    const batches = await getBatches();
    const flavours = await getFlavours();
    
    // Enrich batches with flavour names
    const enriched = batches.map((batch: any) => {
      const flavour = flavours.find((f: any) => f.id === batch.flavourId);
      return {
        ...batch,
        flavourName: flavour?.name || 'Unknown',
      };
    });
    
    return NextResponse.json(enriched);
  } catch (error) {
    console.error('Error fetching batches:', error);
    return NextResponse.json({ error: 'Failed to fetch batches' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const batches = await getBatches();
    
    const newBatch = {
      id: Date.now().toString(),
      ...body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    batches.push(newBatch);
    await saveBatches(batches);
    
    return NextResponse.json(newBatch, { status: 201 });
  } catch (error) {
    console.error('Error creating batch:', error);
    return NextResponse.json({ error: 'Failed to create batch' }, { status: 500 });
  }
}
