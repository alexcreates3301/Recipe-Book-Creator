import { useState, useEffect } from 'react';
import { sampleRecipe } from './data.js';
import { scrapeRecipe } from './scraper.js';
import './App.css';

const CATEGORIES = ['Breakfast', 'Lunch', 'Dinner', 'Dessert', 'Snack', 'Other'];

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function blankRecipe() {
  return {
    id: uid(),
    name: '',
    description: '',
    category: 'Other',
    servings: '',
    prepTime: '',
    cookTime: '',
    ingredients: [{ id: uid(), name: '', amount: '', unit: '' }],
    steps: [{ id: uid(), text: '' }],
    notes: '',
  };
}

function loadRecipes() {
  try {
    const stored = localStorage.getItem('recipes');
    if (stored) return JSON.parse(stored);
  } catch {}
  return [sampleRecipe];
}

function saveRecipes(recipes) {
  localStorage.setItem('recipes', JSON.stringify(recipes));
}

// ── Category badge ──────────────────────────────────────────────────────────

function CategoryBadge({ category }) {
  return (
    <span className={`badge badge--${(category || 'other').toLowerCase()}`}>
      {category}
    </span>
  );
}

// ── Sidebar ─────────────────────────────────────────────────────────────────

function ImportModal({ onImport, onClose }) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!url.trim()) return;
    setLoading(true);
    setError('');
    try {
      const recipe = await scrapeRecipe(url.trim());
      onImport(recipe);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal__title">Import from URL</h2>
        <p className="modal__hint">
          Paste a link from AllRecipes, Serious Eats, BBC Good Food, Bon Appétit, and more.
        </p>
        <form onSubmit={handleSubmit}>
          <input
            className="input modal__input"
            type="url"
            placeholder="https://www.allrecipes.com/recipe/..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            autoFocus
            disabled={loading}
          />
          {error && <p className="modal__error">{error}</p>}
          <div className="modal__actions">
            <button type="button" className="btn btn--ghost" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn--save" disabled={loading || !url.trim()}>
              {loading ? <span className="spinner" /> : null}
              {loading ? 'Importing…' : 'Import recipe'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Sidebar({ recipes, activeId, onSelect, onNew, onImportUrl }) {
  return (
    <aside className="sidebar">
      <div className="sidebar__header">
        <h1 className="sidebar__title">My Cookbook</h1>
        <span className="sidebar__count">
          {recipes.length} {recipes.length === 1 ? 'recipe' : 'recipes'}
        </span>
      </div>
      <ul className="sidebar__list">
        {recipes.map((r) => (
          <li
            key={r.id}
            className={`sidebar__item${r.id === activeId ? ' sidebar__item--active' : ''}`}
            onClick={() => onSelect(r.id)}
          >
            <span className="sidebar__name">{r.name || <em>Untitled recipe</em>}</span>
            <CategoryBadge category={r.category} />
          </li>
        ))}
      </ul>
      <div className="sidebar__footer">
        <button className="btn btn--new" onClick={onNew}>+ New recipe</button>
        <button className="btn btn--import" onClick={onImportUrl}>Import from URL</button>
      </div>
    </aside>
  );
}

// ── Edit tab ────────────────────────────────────────────────────────────────

function EditTab({ recipe, onChange, onSave }) {
  function field(key) {
    return (val) => onChange({ ...recipe, [key]: val });
  }

  function updateIngredient(index, key, val) {
    const updated = recipe.ingredients.map((ing, i) =>
      i === index ? { ...ing, [key]: val } : ing
    );
    onChange({ ...recipe, ingredients: updated });
  }

  function addIngredient() {
    onChange({
      ...recipe,
      ingredients: [...recipe.ingredients, { id: uid(), name: '', amount: '', unit: '' }],
    });
  }

  function removeIngredient(index) {
    onChange({ ...recipe, ingredients: recipe.ingredients.filter((_, i) => i !== index) });
  }

  function updateStep(index, val) {
    const updated = recipe.steps.map((s, i) => (i === index ? { ...s, text: val } : s));
    onChange({ ...recipe, steps: updated });
  }

  function addStep() {
    onChange({ ...recipe, steps: [...recipe.steps, { id: uid(), text: '' }] });
  }

  function removeStep(index) {
    onChange({ ...recipe, steps: recipe.steps.filter((_, i) => i !== index) });
  }

  return (
    <div className="edit-tab">
      <div className="form-group form-group--name">
        <input
          className="input input--title"
          type="text"
          placeholder="Recipe name"
          value={recipe.name}
          onChange={(e) => field('name')(e.target.value)}
        />
      </div>

      <div className="form-group">
        <label className="label">Description</label>
        <textarea
          className="input input--textarea"
          placeholder="Short description of this recipe…"
          rows={2}
          value={recipe.description}
          onChange={(e) => field('description')(e.target.value)}
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="label">Category</label>
          <select
            className="input input--select"
            value={recipe.category}
            onChange={(e) => field('category')(e.target.value)}
          >
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="label">Servings</label>
          <input
            className="input"
            type="number"
            min="1"
            placeholder="4"
            value={recipe.servings}
            onChange={(e) => field('servings')(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label className="label">Prep (min)</label>
          <input
            className="input"
            type="number"
            min="0"
            placeholder="10"
            value={recipe.prepTime}
            onChange={(e) => field('prepTime')(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label className="label">Cook (min)</label>
          <input
            className="input"
            type="number"
            min="0"
            placeholder="30"
            value={recipe.cookTime}
            onChange={(e) => field('cookTime')(e.target.value)}
          />
        </div>
      </div>

      <div className="form-group">
        <label className="label">Ingredients</label>
        <div className="ingredient-list">
          {recipe.ingredients.map((ing, i) => (
            <div key={ing.id} className="ingredient-row">
              <input
                className="input ingredient-amount"
                type="text"
                placeholder="Qty"
                value={ing.amount}
                onChange={(e) => updateIngredient(i, 'amount', e.target.value)}
              />
              <input
                className="input ingredient-unit"
                type="text"
                placeholder="Unit / note"
                value={ing.unit}
                onChange={(e) => updateIngredient(i, 'unit', e.target.value)}
              />
              <input
                className="input ingredient-name"
                type="text"
                placeholder="Ingredient name"
                value={ing.name}
                onChange={(e) => updateIngredient(i, 'name', e.target.value)}
              />
              <button
                className="btn btn--remove"
                onClick={() => removeIngredient(i)}
                aria-label="Remove ingredient"
                disabled={recipe.ingredients.length === 1}
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <button className="btn btn--add" onClick={addIngredient}>
          + Add ingredient
        </button>
      </div>

      <div className="form-group">
        <label className="label">Steps</label>
        <div className="step-list">
          {recipe.steps.map((step, i) => (
            <div key={step.id} className="step-row">
              <span className="step-number">{i + 1}</span>
              <textarea
                className="input input--textarea step-textarea"
                rows={2}
                placeholder={`Step ${i + 1}…`}
                value={step.text}
                onChange={(e) => updateStep(i, e.target.value)}
              />
              <button
                className="btn btn--remove"
                onClick={() => removeStep(i)}
                aria-label="Remove step"
                disabled={recipe.steps.length === 1}
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <button className="btn btn--add" onClick={addStep}>
          + Add step
        </button>
      </div>

      <div className="form-group">
        <label className="label">
          Notes &amp; tips <span className="label__optional">(optional)</span>
        </label>
        <textarea
          className="input input--textarea"
          rows={3}
          placeholder="Any extra tips or notes for this recipe…"
          value={recipe.notes}
          onChange={(e) => field('notes')(e.target.value)}
        />
      </div>

      <div className="form-actions">
        <button className="btn btn--save" onClick={onSave}>
          Save recipe
        </button>
      </div>
    </div>
  );
}

// ── Preview tab ─────────────────────────────────────────────────────────────

function formatTime(minutes) {
  const m = Number(minutes);
  if (!m) return '—';
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem ? `${h} hr ${rem} min` : `${h} hr`;
}

function RecipeCard({ recipe }) {
  const total = (Number(recipe.prepTime) || 0) + (Number(recipe.cookTime) || 0);

  return (
    <div className="recipe-page">
      <header className="recipe-page__header">
        <CategoryBadge category={recipe.category} />
        <h2 className="recipe-page__title">{recipe.name || <em>Untitled recipe</em>}</h2>
        {recipe.description && <p className="recipe-page__desc">{recipe.description}</p>}
      </header>

      <div className="recipe-page__meta">
        {recipe.servings && (
          <div className="meta-stat">
            <span className="meta-stat__label">Servings</span>
            <span className="meta-stat__value">{recipe.servings}</span>
          </div>
        )}
        {recipe.prepTime && (
          <div className="meta-stat">
            <span className="meta-stat__label">Prep</span>
            <span className="meta-stat__value">{formatTime(recipe.prepTime)}</span>
          </div>
        )}
        {recipe.cookTime && (
          <div className="meta-stat">
            <span className="meta-stat__label">Cook</span>
            <span className="meta-stat__value">{formatTime(recipe.cookTime)}</span>
          </div>
        )}
        {total > 0 && (
          <div className="meta-stat">
            <span className="meta-stat__label">Total</span>
            <span className="meta-stat__value">{formatTime(total)}</span>
          </div>
        )}
      </div>

      <div className="recipe-page__body">
        <section className="recipe-page__ingredients">
          <h3 className="section-title">Ingredients</h3>
          <ul className="ingredients-list">
            {recipe.ingredients
              .filter((i) => i.name)
              .map((ing) => (
                <li key={ing.id} className="ingredients-list__item">
                  <span className="ing-amount">
                    {ing.amount} {ing.unit}
                  </span>
                  <span className="ing-name">{ing.name}</span>
                </li>
              ))}
          </ul>
        </section>

        <section className="recipe-page__steps">
          <h3 className="section-title">Method</h3>
          <ol className="steps-list">
            {recipe.steps
              .filter((s) => s.text)
              .map((step, i) => (
                <li key={step.id} className="steps-list__item">
                  <span className="step-num">{i + 1}</span>
                  <p>{step.text}</p>
                </li>
              ))}
          </ol>
        </section>
      </div>

      {recipe.notes && (
        <section className="recipe-page__notes">
          <h3 className="section-title">Notes &amp; tips</h3>
          <p>{recipe.notes}</p>
        </section>
      )}
    </div>
  );
}

function PreviewTab({ recipe }) {
  return (
    <div className="preview-tab">
      <RecipeCard recipe={recipe} />
    </div>
  );
}

// ── Print view (hidden on screen, shown when printing) ───────────────────────

function PrintView({ recipes }) {
  return (
    <div id="print-view">
      {recipes.map((recipe) => (
        <div key={recipe.id} className="print-page">
          <RecipeCard recipe={recipe} />
        </div>
      ))}
    </div>
  );
}

// ── Root App ─────────────────────────────────────────────────────────────────

export default function App() {
  const [recipes, setRecipes] = useState(loadRecipes);
  const [activeId, setActiveId] = useState(() => loadRecipes()[0]?.id ?? null);
  const [tab, setTab] = useState('preview');
  const [draft, setDraft] = useState(null);
  const [saved, setSaved] = useState(false);
  const [showImport, setShowImport] = useState(false);

  const activeRecipe = recipes.find((r) => r.id === activeId) ?? null;

  useEffect(() => {
    if (activeRecipe) setDraft({ ...activeRecipe });
  }, [activeId]);

  useEffect(() => {
    saveRecipes(recipes);
  }, [recipes]);

  function handleSelect(id) {
    setActiveId(id);
    setSaved(false);
  }

  function handleNew() {
    const r = blankRecipe();
    setRecipes((prev) => [...prev, r]);
    setActiveId(r.id);
    setDraft(r);
    setTab('edit');
    setSaved(false);
  }

  function handleSave() {
    if (!draft) return;
    setRecipes((prev) => prev.map((r) => (r.id === draft.id ? { ...draft } : r)));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleImportUrl(recipe) {
    setRecipes((prev) => [...prev, recipe]);
    setActiveId(recipe.id);
    setDraft(recipe);
    setTab('preview');
    setShowImport(false);
  }

  function handleExport() {
    window.print();
  }

  const currentDraft = draft ?? blankRecipe();

  return (
    <>
      <div className="app">
        <Sidebar
          recipes={recipes}
          activeId={activeId}
          onSelect={handleSelect}
          onNew={handleNew}
          onImportUrl={() => setShowImport(true)}
        />

        <div className="main">
          <div className="toolbar">
            <div className="tabs">
              <button
                className={`tab${tab === 'edit' ? ' tab--active' : ''}`}
                onClick={() => setTab('edit')}
              >
                Edit
              </button>
              <button
                className={`tab${tab === 'preview' ? ' tab--active' : ''}`}
                onClick={() => setTab('preview')}
              >
                Preview
              </button>
            </div>
            <button className="btn btn--export" onClick={handleExport}>
              Export cookbook
            </button>
          </div>

          <div className="content">
            {tab === 'edit' ? (
              <EditTab
                key={activeId}
                recipe={currentDraft}
                onChange={setDraft}
                onSave={handleSave}
              />
            ) : (
              <PreviewTab recipe={activeRecipe ?? currentDraft} />
            )}
          </div>

          {saved && <div className="toast">Recipe saved!</div>}
        </div>
      </div>

      <PrintView recipes={recipes} />

      {showImport && (
        <ImportModal
          onImport={handleImportUrl}
          onClose={() => setShowImport(false)}
        />
      )}
    </>
  );
}
