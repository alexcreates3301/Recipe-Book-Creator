const MODEL = 'claude-haiku-4-5-20251001';
const VALID_CATEGORIES = ['Breakfast', 'Lunch', 'Dinner', 'Dessert', 'Snack', 'Other'];

const PROMPT = `Extract the recipe from this image. Return ONLY a valid JSON object — no markdown fences, no explanation — with exactly these fields:
{
  "name": "recipe name or empty string",
  "description": "one or two sentence description, or empty string",
  "category": "one of: Breakfast, Lunch, Dinner, Dessert, Snack, Other",
  "servings": "serving count as a plain number string, or empty string",
  "prepTime": "prep time in minutes as a plain number string, or empty string",
  "cookTime": "cook time in minutes as a plain number string, or empty string",
  "ingredients": [
    {"amount": "quantity only e.g. 1 or 1/2", "unit": "unit e.g. cup or tablespoon, or empty string", "name": "ingredient name"}
  ],
  "steps": [
    {"text": "full step text"}
  ],
  "notes": "any tips, notes, or variations visible in the image, or empty string"
}`;

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = () => reject(new Error('Failed to read the image file.'));
    reader.readAsDataURL(file);
  });
}

export async function extractRecipeFromImage(file, apiKey) {
  const base64 = await fileToBase64(file);

  let res;
  try {
    res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 2048,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: file.type, data: base64 },
            },
            { type: 'text', text: PROMPT },
          ],
        }],
      }),
    });
  } catch {
    throw new Error('Network error — check your internet connection and try again.');
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    if (res.status === 401) throw new Error('Invalid API key. Double-check your Anthropic API key.');
    if (res.status === 429) throw new Error('Rate limit reached. Wait a moment and try again.');
    throw new Error(body.error?.message || `API error (${res.status})`);
  }

  const data = await res.json();
  const text = (data.content?.[0]?.text || '').trim()
    .replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('Could not read recipe data from this image. Try a clearer, better-lit photo.');
  }

  const ingredients = (parsed.ingredients || []).map((ing) => ({
    id: uid(),
    amount: String(ing.amount ?? ''),
    unit: String(ing.unit ?? ''),
    name: String(ing.name ?? ''),
  }));

  const steps = (parsed.steps || []).map((s) => ({
    id: uid(),
    text: String(s.text ?? ''),
  }));

  return {
    id: uid(),
    name: parsed.name || '',
    description: parsed.description || '',
    category: VALID_CATEGORIES.includes(parsed.category) ? parsed.category : 'Other',
    servings: String(parsed.servings ?? ''),
    prepTime: String(parsed.prepTime ?? ''),
    cookTime: String(parsed.cookTime ?? ''),
    ingredients: ingredients.length > 0 ? ingredients : [{ id: uid(), amount: '', unit: '', name: '' }],
    steps: steps.length > 0 ? steps : [{ id: uid(), text: '' }],
    notes: parsed.notes || '',
  };
}
