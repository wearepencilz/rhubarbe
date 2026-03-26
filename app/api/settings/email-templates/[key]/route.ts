import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { emailTemplates } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

/**
 * GET /api/settings/email-templates/[key]
 *
 * Returns an email template by its unique key.
 * Returns 404 if not found.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { key: string } }
) {
  try {
    const [template] = await db
      .select()
      .from(emailTemplates)
      .where(eq(emailTemplates.templateKey, params.key));

    if (!template) {
      return NextResponse.json(
        { error: 'Email template not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(template);
  } catch (error) {
    console.error('Error fetching email template:', error);
    return NextResponse.json(
      { error: 'Failed to fetch email template' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/settings/email-templates/[key]
 *
 * Updates (or creates) an email template by key.
 * Body: { subject: { en, fr }, body: { en, fr } }
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { key: string } }
) {
  try {
    const data = await request.json();

    if (!data.subject || !data.subject.en) {
      return NextResponse.json(
        { error: 'Subject (English) is required' },
        { status: 400 }
      );
    }
    if (!data.body || !data.body.en) {
      return NextResponse.json(
        { error: 'Body (English) is required' },
        { status: 400 }
      );
    }

    const subject = { en: data.subject.en, fr: data.subject.fr || '' };
    const body = { en: data.body.en, fr: data.body.fr || '' };

    // Upsert: update if exists, insert if not
    const [existing] = await db
      .select()
      .from(emailTemplates)
      .where(eq(emailTemplates.templateKey, params.key));

    let result;
    if (existing) {
      [result] = await db
        .update(emailTemplates)
        .set({ subject, body, updatedAt: new Date() })
        .where(eq(emailTemplates.templateKey, params.key))
        .returning();
    } else {
      [result] = await db
        .insert(emailTemplates)
        .values({ templateKey: params.key, subject, body })
        .returning();
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error updating email template:', error);
    return NextResponse.json(
      { error: 'Failed to update email template' },
      { status: 500 }
    );
  }
}
