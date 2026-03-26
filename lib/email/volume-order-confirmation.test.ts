import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mocks — vi.mock factories are hoisted, so keep them self-contained
// ---------------------------------------------------------------------------

vi.mock('@/lib/db/client', () => {
  const mockWhere = vi.fn();
  const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
  const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });
  return { db: { select: mockSelect } };
});

vi.mock('@/lib/email/send', () => ({
  sendEmail: vi.fn().mockResolvedValue(true),
}));

import {
  sendVolumeOrderConfirmation,
  type OrderWithItems,
} from './volume-order-confirmation';
import { db } from '@/lib/db/client';
import { sendEmail } from '@/lib/email/send';

// Typed references to the mocked functions
const mockSendEmail = sendEmail as ReturnType<typeof vi.fn>;
const mockSelect = db.select as ReturnType<typeof vi.fn>;

/** Helper to configure the template query mock return value. */
function mockTemplateQuery(result: unknown[]) {
  const mockWhere = vi.fn().mockResolvedValue(result);
  const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
  mockSelect.mockReturnValue({ from: mockFrom });
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const MOCK_TEMPLATE = {
  id: 'tpl-1',
  templateKey: 'volume-order-confirmation',
  subject: {
    en: 'Order {{orderNumber}} confirmed for {{customerName}}',
    fr: 'Commande {{orderNumber}} confirmée pour {{customerName}}',
  },
  body: {
    en: [
      'Hi {{customerName}},',
      'Your order {{orderNumber}} for {{totalQuantity}} items is confirmed.',
      'Fulfillment: {{fulfillmentDate}} at {{fulfillmentTime}}.',
      'Items:\n{{variantBreakdown}}',
      'Allergen note: {{allergenNote}}',
    ].join('\n'),
    fr: [
      'Bonjour {{customerName}},',
      'Votre commande {{orderNumber}} de {{totalQuantity}} articles est confirmée.',
      'Date: {{fulfillmentDate}} à {{fulfillmentTime}}.',
      'Articles:\n{{variantBreakdown}}',
      'Note allergène: {{allergenNote}}',
    ].join('\n'),
  },
  updatedAt: new Date(),
};

function buildOrder(overrides: Partial<OrderWithItems> = {}): OrderWithItems {
  return {
    id: 'order-1',
    orderNumber: 'VOL-1001',
    customerName: 'Alice Dupont',
    customerEmail: 'alice@example.com',
    fulfillmentDate: new Date('2026-03-28T10:00:00Z'),
    allergenNotes: 'No peanuts',
    items: [
      { productName: "Lunch Box — Chef's Choice", quantity: 10 },
      { productName: 'Lunch Box — Vegetarian', quantity: 5 },
    ],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('sendVolumeOrderConfirmation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTemplateQuery([MOCK_TEMPLATE]);
    mockSendEmail.mockResolvedValue(true);
  });

  // Requirement 5.2, 5.4 — all variables interpolated
  it('interpolates all variables into the EN template', async () => {
    const order = buildOrder();
    await sendVolumeOrderConfirmation(order, 'en');

    expect(mockSendEmail).toHaveBeenCalledTimes(1);
    const call = mockSendEmail.mock.calls[0][0];

    // Subject
    expect(call.subject).toContain('VOL-1001');
    expect(call.subject).toContain('Alice Dupont');
    expect(call.subject).not.toContain('{{');

    // Body — order number, customer name, total quantity
    expect(call.html).toContain('VOL-1001');
    expect(call.html).toContain('Alice Dupont');
    expect(call.html).toContain('15'); // 10 + 5

    // Variant breakdown
    expect(call.html).toContain("10× Lunch Box — Chef's Choice");
    expect(call.html).toContain('5× Lunch Box — Vegetarian');

    // Allergen note
    expect(call.html).toContain('No peanuts');

    // Fulfillment date/time present (locale-formatted)
    expect(call.html).toContain('2026');

    // No leftover placeholders
    expect(call.html).not.toContain('{{');

    // Metadata
    expect(call.to).toBe('alice@example.com');
    expect(call.templateKey).toBe('volume-order-confirmation');
    expect(call.orderId).toBe('order-1');
  });

  // Requirement 5.3 — French locale selects FR template
  it('selects the French template subject and body for FR orders', async () => {
    const order = buildOrder();
    await sendVolumeOrderConfirmation(order, 'fr');

    const call = mockSendEmail.mock.calls[0][0];

    // FR subject
    expect(call.subject).toContain('Commande');
    expect(call.subject).toContain('confirmée');

    // FR body
    expect(call.html).toContain('Bonjour');
    expect(call.html).toContain('Note allergène');

    // Should NOT contain EN-only text
    expect(call.subject).not.toContain('confirmed for');
    expect(call.html).not.toContain('Hi Alice');
  });

  // Requirement 5.2 — allergen note omitted when not present
  it('interpolates allergenNote as empty string when allergenNotes is null', async () => {
    const order = buildOrder({ allergenNotes: null });
    await sendVolumeOrderConfirmation(order, 'en');

    const call = mockSendEmail.mock.calls[0][0];

    // The placeholder is replaced with empty string
    expect(call.html).toContain('Allergen note: ');
    expect(call.html).not.toContain('{{allergenNote}}');
  });

  it('interpolates allergenNote as empty string when allergenNotes is empty string', async () => {
    const order = buildOrder({ allergenNotes: '' });
    await sendVolumeOrderConfirmation(order, 'en');

    const call = mockSendEmail.mock.calls[0][0];
    expect(call.html).not.toContain('{{allergenNote}}');
  });

  // Template not found
  it('throws an error when the email template is not found', async () => {
    mockTemplateQuery([]);

    await expect(
      sendVolumeOrderConfirmation(buildOrder(), 'en'),
    ).rejects.toThrow('Email template "volume-order-confirmation" not found');
  });
});
