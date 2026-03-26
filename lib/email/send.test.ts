import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the database client so we don't hit a real DB
vi.mock('@/lib/db/client', () => ({
  db: {
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockResolvedValue(undefined),
    }),
  },
}));

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

import { sendEmail, isValidEmail, type SendEmailOptions } from './send';
import { db } from '@/lib/db/client';

const mockInsert = db.insert as ReturnType<typeof vi.fn>;

// Helper to build a mock insert chain
function setupDbMock() {
  const valuesFn = vi.fn().mockResolvedValue(undefined);
  mockInsert.mockReturnValue({ values: valuesFn });
  return valuesFn;
}

const baseOptions: SendEmailOptions = {
  to: 'customer@example.com',
  subject: 'Order Confirmation',
  html: '<h1>Thanks!</h1>',
  templateKey: 'volume-order-confirmation',
  orderId: 'order-123',
};

describe('isValidEmail', () => {
  it('accepts valid email addresses', () => {
    expect(isValidEmail('user@example.com')).toBe(true);
    expect(isValidEmail('name+tag@domain.co')).toBe(true);
    expect(isValidEmail('a@b.c')).toBe(true);
  });

  it('rejects invalid email addresses', () => {
    expect(isValidEmail('')).toBe(false);
    expect(isValidEmail('not-an-email')).toBe(false);
    expect(isValidEmail('@missing-local.com')).toBe(false);
    expect(isValidEmail('missing@')).toBe(false);
    expect(isValidEmail('spaces in@email.com')).toBe(false);
    expect(isValidEmail('no-tld@domain')).toBe(false);
  });
});

describe('sendEmail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
    process.env.RESEND_API_KEY = 'test-api-key';
    setupDbMock();
  });

  afterEach(() => {
    vi.useRealTimers();
    delete process.env.RESEND_API_KEY;
  });

  it('returns false and logs failure for invalid email address', async () => {
    const valuesFn = setupDbMock();

    const result = await sendEmail({ ...baseOptions, to: 'bad-email' });

    expect(result).toBe(false);
    expect(mockFetch).not.toHaveBeenCalled();
    expect(valuesFn).toHaveBeenCalledWith(
      expect.objectContaining({
        recipientEmail: 'bad-email',
        status: 'failed',
        errorMessage: 'Invalid email address format',
      }),
    );
  });

  it('sends email successfully and logs with status "sent"', async () => {
    const valuesFn = setupDbMock();
    mockFetch.mockResolvedValueOnce({ ok: true, status: 200 });

    const result = await sendEmail(baseOptions);

    expect(result).toBe(true);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(valuesFn).toHaveBeenCalledWith(
      expect.objectContaining({
        recipientEmail: 'customer@example.com',
        templateKey: 'volume-order-confirmation',
        orderId: 'order-123',
        status: 'sent',
      }),
    );
  });

  it('retries up to 3 times on failure then logs "failed"', async () => {
    const valuesFn = setupDbMock();
    mockFetch
      .mockResolvedValueOnce({ ok: false, status: 500, text: () => Promise.resolve('Server Error') })
      .mockResolvedValueOnce({ ok: false, status: 500, text: () => Promise.resolve('Server Error') })
      .mockResolvedValueOnce({ ok: false, status: 500, text: () => Promise.resolve('Server Error') });

    const result = await sendEmail(baseOptions);

    expect(result).toBe(false);
    expect(mockFetch).toHaveBeenCalledTimes(3);
    expect(valuesFn).toHaveBeenCalledWith(
      expect.objectContaining({
        recipientEmail: 'customer@example.com',
        status: 'failed',
        errorMessage: expect.stringContaining('Resend API error'),
      }),
    );
  });

  it('succeeds on retry after initial failures', async () => {
    const valuesFn = setupDbMock();
    mockFetch
      .mockResolvedValueOnce({ ok: false, status: 503, text: () => Promise.resolve('Unavailable') })
      .mockResolvedValueOnce({ ok: true, status: 200 });

    const result = await sendEmail(baseOptions);

    expect(result).toBe(true);
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(valuesFn).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'sent' }),
    );
  });

  it('uses default templateKey "unknown" when not provided', async () => {
    const valuesFn = setupDbMock();
    mockFetch.mockResolvedValueOnce({ ok: true, status: 200 });

    await sendEmail({ to: 'a@b.com', subject: 'Hi', html: '<p>Hi</p>' });

    expect(valuesFn).toHaveBeenCalledWith(
      expect.objectContaining({ templateKey: 'unknown' }),
    );
  });
});
