import { NextResponse } from 'next/server';
import { getMeals, createMeal, updateMeal, setMealStatus } from '@/lib/supabase-meals';
import { decrementCubeQuantity, incrementOrCreateCube } from '@/lib/supabase-cubes';
import type { CubeUsage, MealType } from '@/types';

export async function GET() {
  try {
    const meals = await getMeals();
    return NextResponse.json(meals);
  } catch (error) {
    console.error('Failed to fetch meals:', error);
    return NextResponse.json({ error: 'Failed to fetch meals' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body: { cubes: CubeUsage[]; memo: string; date: string; mealType: MealType } = await request.json();
    const { cubes, memo, date, mealType } = body;
    // Save as planned — no cube deduction
    const meal = await createMeal(cubes, memo, date, mealType);
    return NextResponse.json(meal, { status: 201 });
  } catch (error) {
    console.error('Failed to create meal:', error);
    return NextResponse.json({ error: 'Failed to create meal' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();

    // Defrost action: deduct cubes and mark as used
    if (body.action === 'defrost') {
      const { id, cubes } = body as { id: string; cubes: CubeUsage[] };
      // Sequential with rollback tracking to avoid partial deductions
      const decremented: { cube: CubeUsage }[] = [];
      try {
        for (const cube of cubes) {
          await decrementCubeQuantity(cube.cubeId, cube.quantity);
          decremented.push({ cube });
        }
      } catch (err) {
        // Rollback successful decrements
        for (const { cube } of decremented) {
          try {
            await incrementOrCreateCube(cube.cubeId, cube.quantity, {
              name: cube.name, weight: cube.weight, color: cube.color,
              category: cube.category ?? '곡류', itemType: cube.itemType ?? 'cube',
            });
          } catch { /* best-effort rollback */ }
        }
        throw err;
      }
      const meal = await setMealStatus(id, 'used');
      return NextResponse.json(meal);
    }

    // Undo-defrost / unlock: restore cubes and mark as planned (editable)
    if (body.action === 'undo-defrost') {
      const { id, cubes } = body as { id: string; cubes: CubeUsage[] };
      for (const cube of cubes) {
        await incrementOrCreateCube(cube.cubeId, cube.quantity, {
          name: cube.name,
          weight: cube.weight,
          color: cube.color,
          category: cube.category ?? '곡류',
          itemType: cube.itemType ?? 'cube',
        });
      }
      const meal = await setMealStatus(id, 'planned');
      return NextResponse.json(meal);
    }

    if (body.action && body.action !== 'defrost' && body.action !== 'undo-defrost') {
      return NextResponse.json({ error: `Unknown action: ${body.action}` }, { status: 400 });
    }

    // Update meal
    const { id, cubes, memo, date, mealType } = body as {
      id: string; cubes: CubeUsage[]; memo: string; date: string; mealType: MealType;
    };
    const meal = await updateMeal(id, cubes, memo, date, mealType);
    return NextResponse.json(meal);
  } catch (error) {
    console.error('Failed to update meal:', error);
    return NextResponse.json({ error: 'Failed to update meal' }, { status: 500 });
  }
}
