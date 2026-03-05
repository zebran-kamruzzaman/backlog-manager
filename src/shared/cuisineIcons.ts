const CUISINE_MAP: Record<string, string> = {
  // Coffee
  coffee: '☕', cafes: '☕', coffeeroasteries: '☕',
  bubbletea: '🧋', juicebars: '🧃',
  // Burgers / Fast food
  burgers: '🍔', hotdogs: '🌭', sandwiches: '🥪', fastfood: '🍟',
  // Pizza
  pizza: '🍕',
  // Asian
  sushi: '🍣', japanese: '🍱', ramen: '🍜', chinese: '🥡',
  dimsum: '🥟', korean: '🥘', thai: '🍛', vietnamese: '🍜',
  indpak: '🍛', indian: '🍛',
  // Mexican / Latin
  mexican: '🌮', tacos: '🌮', burritos: '🌯', latin: '🫔',
  // Italian / Mediterranean
  italian: '🍝', pasta: '🍝', mediterranean: '🫒', greek: '🫒',
  mideastern: '🧆',
  // Seafood / Meat
  seafood: '🦞', steak: '🥩', bbq: '🍖', smokehouse: '🍖',
  // Breakfast
  breakfast_brunch: '🍳', pancakes: '🥞', waffles: '🧇',
  // Bakery / Desserts
  bakeries: '🥐', desserts: '🍰', icecream: '🍦', donuts: '🍩',
  // Bars
  bars: '🍺', pubs: '🍺', wine_bars: '🍷', cocktailbars: '🍸',
  breweries: '🍻',
  // Healthy
  salad: '🥗', vegan: '🥦', vegetarian: '🥦',
  // Fallback
  newamerican: '🍽️', tradamerican: '🍽️', french: '🥖',
  restaurants: '🍽️',
};

export function getCuisineIcon(aliases: string[]): string {
  for (const alias of aliases) {
    const icon = CUISINE_MAP[alias.toLowerCase()];
    if (icon) return icon;
  }
  return '🍽️';
}

// We encode cuisine aliases into the heroImageUrl field using this prefix
// so we can recover the icon without adding new DB columns.
export const CUISINE_PREFIX = 'cuisine:';

export function encodeCuisineUrl(aliases: string[]): string {
  return CUISINE_PREFIX + aliases.join(',');
}

export function decodeCuisineIcon(url: string): string | null {
  if (!url.startsWith(CUISINE_PREFIX)) return null;
  const aliases = url.slice(CUISINE_PREFIX.length).split(',');
  return getCuisineIcon(aliases);
}