import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'AI translation is not configured. Add OPENAI_API_KEY to your environment.' },
      { status: 503 }
    );
  }

  try {
    const { fields, targetLocale } = await request.json() as {
      fields: Record<string, string>;
      targetLocale: 'fr' | 'en';
    };

    if (!fields || !targetLocale) {
      return NextResponse.json({ error: 'fields and targetLocale are required' }, { status: 400 });
    }

    const targetLang = targetLocale === 'fr' ? 'French' : 'English';
    const sourceLang = targetLocale === 'fr' ? 'English' : 'French';

    const fieldList = Object.entries(fields)
      .filter(([, v]) => v?.trim())
      .map(([k, v]) => `"${k}": ${JSON.stringify(v)}`)
      .join('\n');

    if (!fieldList) {
      return NextResponse.json({ error: 'No non-empty fields to translate' }, { status: 400 });
    }

    const prompt = `You are a professional translator for a high-end Montréal artisan food brand called Rhubarbe.
Translate the following ${sourceLang} content fields into ${targetLang}.
Preserve HTML tags exactly as-is (do not translate or alter them).
Keep the brand voice: warm, artisanal, slightly poetic, not corporate.
Return ONLY a valid JSON object with the same keys. No markdown, no explanation.

Fields to translate:
${fieldList}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
        max_tokens: 1000,
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
    const translated = JSON.parse(content);

    return NextResponse.json(translated);
  } catch (err) {
    console.error('Translation error:', err);
    return NextResponse.json({ error: 'Failed to translate' }, { status: 500 });
  }
}
