import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getAllGroupedByCategory } from '@/lib/db/queries/taxonomies';

const SYSTEM_PROMPT = `You are a culinary expert helping fill in details for an artisan ice cream shop's ingredient database.
Given an ingredient name (and optional hints), return a JSON object with suggested values.
Be concise, accurate, and appropriate for a high-quality artisan food context.
Only return valid JSON — no markdown, no explanation.
IMPORTANT: You must only use values from the provided lists. Do not invent new values.`;

interface TaxonomyValue { value: string; label: string; archived?: boolean; }
type Taxonomies = Record<string, TaxonomyValue[]>

function getOptions(taxonomies: Taxonomies, category: string): string {
  const values = (taxonomies[category] ?? []).filter((v) => !v.archived);
  return values.length
    ? values.map((v) => v.value).join(', ')
    : 'none configured';
}

function buildUserPrompt(name: string, taxonomies: Taxonomies, latinName?: string, origin?: string) {
  const hints = [latinName && `Latin name: ${latinName}`, origin && `Origin: ${origin}`]
    .filter(Boolean).join(', ');

  return `Ingredient: "${name}"${hints ? ` (${hints})` : ''}

Return a JSON object with these fields (omit any you're unsure about):
{
  "latinName": "scientific name if applicable",
  "origin": "typical geographic origin (city/region/country)",
  "description": "one concise sentence describing this ingredient for a food context",
  "story": "2-3 sentences about provenance, who grows/makes it, why it matters for artisan food",
  "tastingNotes": ["values from allowed list only"],
  "texture": ["values from allowed list only"],
  "process": ["values from allowed list only"],
  "attributes": ["values from allowed list only"],
  "availableMonths": [0,1,2]
}

You MUST only pick from these existing values (use exactly as shown):
tastingNotes allowed: ${getOptions(taxonomies, 'tastingNotes')}
texture allowed: ${getOptions(taxonomies, 'ingredientTextures')}
process allowed: ${getOptions(taxonomies, 'ingredientProcesses')}
attributes allowed: ${getOptions(taxonomies, 'ingredientAttributes')}

For availableMonths use 0-indexed month numbers (0=Jan). Omit if available year-round.`;
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'AI autofill is not configured. Add OPENAI_API_KEY to your environment.' },
      { status: 503 }
    );
  }

  try {
    const { name, latinName, origin } = await request.json();
    if (!name?.trim()) {
      return NextResponse.json({ error: 'Ingredient name is required' }, { status: 400 });
    }

    // Fetch existing taxonomy values to constrain the AI
    const taxonomyData = await getAllGroupedByCategory() as Taxonomies;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: buildUserPrompt(name, taxonomyData, latinName, origin) },
        ],
        temperature: 0.3,
        max_tokens: 600,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      console.error('OpenAI error:', err);
      return NextResponse.json({ error: 'AI request failed' }, { status: 502 });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    const suggestions = JSON.parse(content);

    // Filter arrays to only include values that actually exist in taxonomies
    const validValues = (category: string, arr?: string[]) => {
      if (!arr?.length) return undefined;
      const allowed = new Set(
        (taxonomyData[category] ?? [])
          .filter((v: TaxonomyValue) => !v.archived)
          .map((v: TaxonomyValue) => v.value)
      );
      return arr.filter((v) => allowed.has(v));
    };

    return NextResponse.json({
      ...suggestions,
      tastingNotes: validValues('tastingNotes', suggestions.tastingNotes),
      texture: validValues('ingredientTextures', suggestions.texture),
      process: validValues('ingredientProcesses', suggestions.process),
      attributes: validValues('ingredientAttributes', suggestions.attributes),
    });
  } catch (err) {
    console.error('Autofill error:', err);
    return NextResponse.json({ error: 'Failed to generate suggestions' }, { status: 500 });
  }
}
