import * as settingsQueries from '@/lib/db/queries/settings';
import { DEFAULT_TOKENS, tokensToCss, type TypeToken } from '@/lib/design/tokens';

/**
 * Injects design token CSS vars into :root.
 * Only overrides existing theme.css vars if the admin explicitly set font stacks.
 * Token vars are namespaced (--type-*) and never collide with existing styles.
 */
export default async function DesignTokensStyle() {
  let tokens: TypeToken[] = DEFAULT_TOKENS;
  let fontOverrides: Record<string, string> = {};
  try {
    const settings = await settingsQueries.getAll();
    const s = settings as any;
    if (s?.typographyTokens?.length) tokens = s.typographyTokens;
    if (s?.fontStacks) fontOverrides = s.fontStacks;
  } catch {}

  const css = tokensToCss(tokens, fontOverrides);
  if (!css) return null;
  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}
