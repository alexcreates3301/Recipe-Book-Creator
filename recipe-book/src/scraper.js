const CORS_PROXY = 'https://api.allorigins.win/get?url=';

const UNITS = new Set([
  'cup', 'cups', 'tablespoon', 'tablespoons', 'tbsp', 'tbs',
  'teaspoon', 'teaspoons', 'tsp',
  'oz', 'ounce', 'ounces',
  'lb', 'lbs', 'pound', 'pounds',
  'g', 'gram', 'grams',
  'kg', 'kilogram', 'kilograms',
  'ml', 'milliliter', 'milliliters', 'millilitre', 'millilitres',
  'l', 'liter', 'liters', 'litre', 'litres',
  'pinch', 'pinches', 'dash', 'dashes',
  'clove', 'cloves', 'can', 'cans',
  'package', 'packages', 'pkg',
  'slice', 'slices', 'piece', 'pieces',
  'strip', 'strips', 'bunch', 'bunches',
  'sprig', 'sprigs', 'handful', 'handfuls',
  'quart', 'quarts', 'qt',
  'pint', 'pints', 'pt',
  'stick', 'sticks',
]);

const UNICODE_FRACTIONS = {
  '½': '1/2', '⅓': '1/3', '⅔': '2/3',
  '¼': '1/4', '¾': '3/4',
  '⅛': '1/8', '⅜': '3/8', '⅝': '5/8', '⅞': '7/8',
};

function normalizeFractions(str) {
  return str.replace(/[½⅓⅔¼¾⅛⅜⅝⅞]/g, (ch) => UNICODE_FRACTIONS[ch] || ch);
}

function parseISO8601Duration(duration) {
  if (!duration) return '';
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/i);
  if (!match) return '';
  const hours = parseInt(match[1] || 0);
  const minutes = parseInt(match[2] || 0);
  const total = hours * 60 + minutes;
  return total > 0 ? String(total) : '';
}

function parseIngredient(raw) {
  const str = normalizeFractions(raw.trim());
  const amountMatch = str.match(/^(\d+(?:[./]\d+)?(?:\s+\d+\/\d+)?)\s*/);
  let amount = '';
  let rest = str;

  if (amountMatch) {
    amount = amountMatch[1].trim();
    rest = str.slice(amountMatch[0].length);
  }

  const words = rest.split(/\s+/);
  let unit = '';
  let nameWords = words;

  if (words.length > 0 && UNITS.has(words[0].toLowerCase().replace(/[.,]$/, ''))) {
    unit = words[0];
    nameWords = words.slice(1);
  }

  const name = nameWords.join(' ').replace(/^[,\s]+/, '').trim();
  return { amount, unit, name };
}

function parseServings(yieldVal) {
  if (!yieldVal) return '';
  const str = Array.isArray(yieldVal) ? yieldVal[0] : yieldVal;
  const match = String(str).match(/\d+/);
  return match ? match[0] : '';
}

function mapCategory(categories) {
  if (!categories) return 'Other';
  const cats = Array.isArray(categories) ? categories : [categories];
  const map = {
    breakfast: 'Breakfast', brunch: 'Breakfast',
    lunch: 'Lunch',
    dinner: 'Dinner', supper: 'Dinner',
    dessert: 'Dessert', cake: 'Dessert', cookie: 'Dessert', sweet: 'Dessert',
    snack: 'Snack', appetizer: 'Snack', starter: 'Snack',
  };
  for (const cat of cats) {
    const lower = String(cat).toLowerCase();
    for (const [key, val] of Object.entries(map)) {
      if (lower.includes(key)) return val;
    }
  }
  return 'Other';
}

function parseInstructions(instructions) {
  if (!instructions) return [];
  if (typeof instructions === 'string') {
    return instructions.split(/\n+/).map((s) => s.trim()).filter(Boolean);
  }
  if (Array.isArray(instructions)) {
    return instructions.flatMap((item) => {
      if (typeof item === 'string') return [item.trim()];
      if (item['@type'] === 'HowToSection' && item.itemListElement) {
        return item.itemListElement.map((s) =>
          (typeof s === 'string' ? s : s.text || '').trim()
        );
      }
      return [(item.text || item.name || '').trim()];
    }).filter(Boolean);
  }
  return [];
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function extractRecipeSchema(html) {
  const scriptRegex = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = scriptRegex.exec(html)) !== null) {
    try {
      const data = JSON.parse(match[1]);
      const items = Array.isArray(data) ? data : (data['@graph'] || [data]);
      for (const item of items) {
        const type = item['@type'];
        if (type === 'Recipe' || (Array.isArray(type) && type.includes('Recipe'))) {
          return item;
        }
      }
    } catch {}
  }
  return null;
}

export async function scrapeRecipe(url) {
  let res;
  try {
    res = await fetch(`${CORS_PROXY}${encodeURIComponent(url)}`);
  } catch {
    throw new Error('Network error — check your internet connection and try again.');
  }

  if (!res.ok) throw new Error(`Could not fetch the page (HTTP ${res.status}).`);

  const { contents: html } = await res.json();
  if (!html) throw new Error('The page returned no content.');

  const schema = extractRecipeSchema(html);
  if (!schema) {
    throw new Error(
      'No recipe data found on this page. Try a link from AllRecipes, Serious Eats, BBC Good Food, or similar sites.'
    );
  }

  const ingredients = (schema.recipeIngredient || []).map((raw) => {
    const { amount, unit, name } = parseIngredient(raw);
    return { id: uid(), amount, unit, name };
  });

  if (ingredients.length === 0) {
    ingredients.push({ id: uid(), amount: '', unit: '', name: '' });
  }

  const stepTexts = parseInstructions(schema.recipeInstructions);
  const steps = stepTexts.length > 0
    ? stepTexts.map((text) => ({ id: uid(), text }))
    : [{ id: uid(), text: '' }];

  return {
    id: uid(),
    name: schema.name || '',
    description: schema.description || '',
    category: mapCategory(schema.recipeCategory),
    servings: parseServings(schema.recipeYield),
    prepTime: parseISO8601Duration(schema.prepTime),
    cookTime: parseISO8601Duration(schema.cookTime),
    ingredients,
    steps,
    notes: '',
  };
}
