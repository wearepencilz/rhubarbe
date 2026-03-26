/**
 * The Shopify option names used for tax variant switching.
 * Supports both "Tax" and "taxable" (in case the option was renamed in Shopify).
 */
export const TAX_OPTION_NAMES = ['Tax', 'taxable', 'Taxable'];

/** Check if a Shopify option name is a tax option */
export function isTaxOption(name: string): boolean {
  return TAX_OPTION_NAMES.some((n) => n.toLowerCase() === name.toLowerCase());
}

/** The option name used when creating new tax options */
export const TAX_OPTION_CREATE_NAME = 'taxable';
