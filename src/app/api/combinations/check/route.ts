import { NextRequest, NextResponse } from 'next/server';
import { checkCombinations } from '@/lib/combinations';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const ingredientsParam = searchParams.get('ingredients');

    if (!ingredientsParam) {
      return NextResponse.json(
        { error: 'ingredients query parameter is required' },
        { status: 400 }
      );
    }

    const ingredients = ingredientsParam.split(',').map((s) => s.trim());

    if (ingredients.length < 2) {
      return NextResponse.json(
        { error: 'At least 2 ingredients are required' },
        { status: 400 }
      );
    }

    const results = await checkCombinations(ingredients);
    return NextResponse.json(results);
  } catch (error) {
    console.error('Failed to check combinations:', error);
    return NextResponse.json(
      { error: 'Failed to check combinations' },
      { status: 500 }
    );
  }
}
