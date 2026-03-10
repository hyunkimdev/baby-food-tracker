import { getSupabase } from './supabase';
import { Cube, CubeFormData, ItemType, StorageType } from '@/types';

interface CubeRow {
  id: string;
  name: string;
  weight: number;
  quantity: number;
  color: string;
  category: string;
  storage: string;
  min_quantity: number;
  expiry_date: string | null;
  made_date: string | null;
  item_type: string;
}

function mapCategory(raw: string): Cube['category'] {
  if (raw === '채소') return '잎채소';
  if (raw === '기타') return '곡류';
  return raw as Cube['category'];
}

function rowToCube(row: CubeRow): Cube {
  return {
    id: row.id,
    name: row.name,
    weight: row.weight,
    quantity: row.quantity,
    color: row.color,
    category: mapCategory(row.category),
    storage: (row.storage || 'freezer') as StorageType,
    minQuantity: row.min_quantity,
    expiryDate: row.expiry_date,
    madeDate: row.made_date,
    itemType: (row.item_type || 'cube') as ItemType,
  };
}

export async function getAllCubes(): Promise<Cube[]> {
  const { data, error } = await getSupabase()
    .from('cubes')
    .select('*')
    .order('category', { ascending: true });

  if (error) throw error;
  return (data as CubeRow[]).map(rowToCube);
}

export async function createCube(data: CubeFormData): Promise<Cube> {
  const { data: row, error } = await getSupabase()
    .from('cubes')
    .insert({
      name: data.name,
      weight: data.weight,
      quantity: data.quantity,
      color: data.color,
      category: data.category,
      storage: data.storage ?? 'freezer',
      min_quantity: data.minQuantity,
      expiry_date: data.expiryDate ?? null,
      made_date: data.madeDate ?? null,
      item_type: data.itemType ?? 'cube',
    })
    .select()
    .single();

  if (error) throw error;
  return rowToCube(row as CubeRow);
}

export async function updateCube(id: string, data: Partial<CubeFormData>): Promise<Cube> {
  const update: Record<string, unknown> = {};
  if (data.name !== undefined) update.name = data.name;
  if (data.weight !== undefined) update.weight = data.weight;
  if (data.quantity !== undefined) update.quantity = data.quantity;
  if (data.color !== undefined) update.color = data.color;
  if (data.category !== undefined) update.category = data.category;
  if (data.storage !== undefined) update.storage = data.storage;
  if (data.minQuantity !== undefined) update.min_quantity = data.minQuantity;
  if (data.expiryDate !== undefined) update.expiry_date = data.expiryDate ?? null;
  if (data.madeDate !== undefined) update.made_date = data.madeDate ?? null;
  if (data.itemType !== undefined) update.item_type = data.itemType;

  const { data: row, error } = await getSupabase()
    .from('cubes')
    .update(update)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return rowToCube(row as CubeRow);
}

export async function deleteCube(id: string): Promise<void> {
  const { error } = await getSupabase().from('cubes').delete().eq('id', id);
  if (error) throw error;
}

export async function incrementOrCreateCube(
  cubeId: string,
  amount: number,
  fallback: { name: string; weight: number; color: string; category: string; itemType?: string },
): Promise<Cube> {
  // Try to find existing cube
  const { data: existing } = await getSupabase()
    .from('cubes')
    .select('quantity')
    .eq('id', cubeId)
    .single();

  if (existing) {
    const newQty = (existing as { quantity: number }).quantity + amount;
    return updateCube(cubeId, { quantity: newQty });
  }

  // Cube was deleted — re-create it
  const { data: row, error } = await getSupabase()
    .from('cubes')
    .insert({
      id: cubeId,
      name: fallback.name,
      weight: fallback.weight,
      quantity: amount,
      color: fallback.color,
      category: fallback.category,
      storage: 'freezer',
      min_quantity: 0,
      expiry_date: null,
      made_date: null,
      item_type: fallback.itemType ?? 'cube',
    })
    .select()
    .single();

  if (error) throw error;
  return rowToCube(row as CubeRow);
}

export async function decrementCubeQuantity(id: string, amount: number): Promise<Cube | null> {
  const { data: current, error: fetchError } = await getSupabase()
    .from('cubes')
    .select('quantity')
    .eq('id', id)
    .single();

  if (fetchError) throw fetchError;

  const newQty = Math.max(0, (current as { quantity: number }).quantity - amount);
  if (newQty === 0) {
    await deleteCube(id);
    return null;
  }
  return updateCube(id, { quantity: newQty });
}
