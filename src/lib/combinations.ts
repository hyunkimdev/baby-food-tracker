import { CombinationResult } from '@/types';

const BAD_COMBINATIONS: [string, string, string][] = [
  ['시금치', '두부', '시금치의 옥살산이 두부의 칼슘 흡수를 방해합니다'],
  ['당근', '오이', '오이의 아스코르비나아제가 당근의 비타민C를 파괴합니다'],
  ['시금치', '근대', '옥살산이 과다해질 수 있습니다'],
  ['우유', '시금치', '시금치의 옥살산이 우유의 칼슘 흡수를 방해합니다'],
  ['토마토', '오이', '오이의 효소가 토마토의 비타민C를 파괴합니다'],
  ['당근', '무', '함께 조리 시 비타민C가 파괴될 수 있습니다'],
];

const GOOD_COMBINATIONS: [string, string, string][] = [
  ['쌀', '소고기', '철분과 탄수화물의 균형 잡힌 조합입니다'],
  ['고구마', '사과', '달콤한 맛으로 아기가 좋아하는 조합입니다'],
  ['브로콜리', '감자', '비타민C와 탄수화물의 좋은 조합입니다'],
  ['당근', '감자', '부드러운 식감의 궁합 좋은 조합입니다'],
  ['소고기', '브로콜리', '철분 흡수를 비타민C가 도와줍니다'],
  ['닭고기', '고구마', '단백질과 탄수화물의 균형 조합입니다'],
  ['쌀', '닭고기', '소화가 잘 되는 기본 조합입니다'],
  ['애호박', '감자', '부드럽고 소화가 잘 되는 조합입니다'],
  ['양배추', '사과', '달콤하고 소화에 좋은 조합입니다'],
  ['오트밀', '바나나', '식이섬유와 칼륨이 풍부한 조합입니다'],
  ['쌀', '배', '위에 부담 없는 순한 조합입니다'],
  ['소고기', '감자', '든든한 한 끼가 되는 조합입니다'],
];

export function checkCombinations(ingredients: string[]): CombinationResult[] {
  const results: CombinationResult[] = [];
  const normalizedIngredients = ingredients.map(i => i.trim().toLowerCase());

  for (let i = 0; i < normalizedIngredients.length; i++) {
    for (let j = i + 1; j < normalizedIngredients.length; j++) {
      const a = normalizedIngredients[i];
      const b = normalizedIngredients[j];

      for (const [x, y, message] of BAD_COMBINATIONS) {
        if ((a === x && b === y) || (a === y && b === x)) {
          results.push({
            type: 'bad',
            message,
            ingredients: [ingredients[i], ingredients[j]],
          });
        }
      }

      for (const [x, y, message] of GOOD_COMBINATIONS) {
        if ((a === x && b === y) || (a === y && b === x)) {
          results.push({
            type: 'good',
            message,
            ingredients: [ingredients[i], ingredients[j]],
          });
        }
      }
    }
  }

  return results;
}
