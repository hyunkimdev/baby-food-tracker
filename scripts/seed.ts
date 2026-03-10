import { readFileSync } from 'fs';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';

// Load .env.local manually
const envPath = resolve(__dirname, '..', '.env.local');
const envContent = readFileSync(envPath, 'utf-8');
for (const line of envContent.split('\n')) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) process.env[match[1].trim()] = match[2].trim();
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(url, key);

const SEED_CUBES = [
  // 곡류
  { name: '쌀미음', weight: 30, quantity: 8, color: '#F5E6CC', category: '곡류', min_quantity: 2 },
  { name: '오트밀', weight: 25, quantity: 5, color: '#D4A574', category: '곡류', min_quantity: 2 },
  { name: '찹쌀', weight: 30, quantity: 3, color: '#F0E4D4', category: '곡류', min_quantity: 2 },
  // 단백질
  { name: '소고기', weight: 20, quantity: 6, color: '#C0392B', category: '단백질', min_quantity: 3 },
  { name: '닭고기', weight: 20, quantity: 4, color: '#E8AE68', category: '단백질', min_quantity: 2 },
  { name: '두부', weight: 25, quantity: 2, color: '#FFF8E7', category: '단백질', min_quantity: 2 },
  // 잎채소
  { name: '시금치', weight: 15, quantity: 5, color: '#27AE60', category: '잎채소', min_quantity: 2 },
  { name: '양배추', weight: 15, quantity: 3, color: '#82E0AA', category: '잎채소', min_quantity: 2 },
  { name: '브로콜리', weight: 15, quantity: 7, color: '#1E8449', category: '잎채소', min_quantity: 2 },
  // 노란채소
  { name: '당근', weight: 15, quantity: 6, color: '#E67E22', category: '노란채소', min_quantity: 2 },
  { name: '고구마', weight: 30, quantity: 4, color: '#AF601A', category: '노란채소', min_quantity: 2 },
  { name: '감자', weight: 30, quantity: 1, color: '#D4C088', category: '노란채소', min_quantity: 3 },
  // 과일
  { name: '사과', weight: 20, quantity: 3, color: '#EC4899', category: '과일', min_quantity: 2 },
  { name: '바나나', weight: 20, quantity: 0, color: '#F9E154', category: '과일', min_quantity: 2 },
  { name: '배', weight: 20, quantity: 4, color: '#C8D96F', category: '과일', min_quantity: 2 },
  // 유제품
  { name: '치즈', weight: 10, quantity: 3, color: '#F4D35E', category: '유제품', min_quantity: 2 },
];

async function seed() {
  console.log('Seeding cubes...');

  // Clear existing
  const { error: delErr } = await supabase.from('cubes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (delErr) console.warn('Clear warning:', delErr.message);

  const { data, error } = await supabase.from('cubes').insert(SEED_CUBES).select();
  if (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
  console.log(`Seeded ${data.length} cubes successfully!`);
}

seed();
