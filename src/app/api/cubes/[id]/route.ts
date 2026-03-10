import { NextResponse } from 'next/server';
import { updateCube, deleteCube } from '@/lib/supabase-cubes';
import type { CubeFormData } from '@/types';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body: Partial<CubeFormData> = await request.json();
    const cube = await updateCube(id, body);
    return NextResponse.json(cube);
  } catch (error) {
    console.error('Failed to update cube:', error);
    return NextResponse.json(
      { error: 'Failed to update cube' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await deleteCube(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to archive cube:', error);
    return NextResponse.json(
      { error: 'Failed to archive cube' },
      { status: 500 }
    );
  }
}
