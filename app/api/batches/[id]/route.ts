import { NextResponse } from 'next/server';
import { getBatches, saveBatches } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const batches = await getBatches();
    const batch = batches.find((b: any) => b.id === params.id);
    
    if (!batch) {
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
    }
    
    return NextResponse.json(batch);
  } catch (error) {
    console.error('Error fetching batch:', error);
    return NextResponse.json({ error: 'Failed to fetch batch' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const batches = await getBatches();
    const index = batches.findIndex((b: any) => b.id === params.id);
    
    if (index === -1) {
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
    }
    
    batches[index] = {
      ...batches[index],
      ...body,
      id: params.id,
      updatedAt: new Date().toISOString(),
    };
    
    await saveBatches(batches);
    
    return NextResponse.json(batches[index]);
  } catch (error) {
    console.error('Error updating batch:', error);
    return NextResponse.json({ error: 'Failed to update batch' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const batches = await getBatches();
    const filtered = batches.filter((b: any) => b.id !== params.id);
    
    if (filtered.length === batches.length) {
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
    }
    
    await saveBatches(filtered);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting batch:', error);
    return NextResponse.json({ error: 'Failed to delete batch' }, { status: 500 });
  }
}
