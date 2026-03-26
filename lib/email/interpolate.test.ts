import { describe, it, expect } from 'vitest';
import { interpolateTemplate } from './interpolate';

describe('interpolateTemplate', () => {
  it('replaces known placeholders with values', () => {
    const template = 'Hello {{customerName}}, your order {{orderNumber}} is confirmed.';
    const result = interpolateTemplate(template, {
      customerName: 'Alice',
      orderNumber: '#1234',
    });
    expect(result).toBe('Hello Alice, your order #1234 is confirmed.');
  });

  it('leaves unknown placeholders untouched', () => {
    const template = 'Hi {{name}}, see you on {{date}}.';
    const result = interpolateTemplate(template, { name: 'Bob' });
    expect(result).toBe('Hi Bob, see you on {{date}}.');
  });

  it('handles templates with no placeholders', () => {
    const template = 'No variables here.';
    expect(interpolateTemplate(template, { foo: 'bar' })).toBe('No variables here.');
  });

  it('handles empty variables object', () => {
    const template = '{{a}} and {{b}}';
    expect(interpolateTemplate(template, {})).toBe('{{a}} and {{b}}');
  });

  it('replaces multiple occurrences of the same variable', () => {
    const template = '{{x}} + {{x}} = 2{{x}}';
    expect(interpolateTemplate(template, { x: '5' })).toBe('5 + 5 = 25');
  });

  it('handles empty string values', () => {
    const template = 'Note: {{allergenNote}}';
    expect(interpolateTemplate(template, { allergenNote: '' })).toBe('Note: ');
  });
});
