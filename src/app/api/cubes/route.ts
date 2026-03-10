import { NextResponse } from 'next/server';
import { getAllCubes, createCube } from '@/lib/supabase-cubes';
import type { CubeFormData } from '@/types';

export async function GET() {
  try {
    const cubes = await getAllCubes();
    return NextResponse.json(cubes);
  } catch (error) {
    console.error('Failed to fetch cubes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cubes' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body: CubeFormData = await request.json();
    const cube = await createCube(body);
    return NextResponse.json(cube, { status: 201 });
  } catch (error) {
    console.error('Failed to create cube:', error);
    return NextResponse.json(
      { error: 'Failed to create cube', detail: JSON.stringify(error) },
      { status: 500 }
    );
  }
}
