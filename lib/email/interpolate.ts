/**
 * Template interpolation for email templates.
 * Replaces {{variableName}} placeholders with values from the variables object.
 */

/**
 * Interpolates a template string by replacing {{variableName}} placeholders
 * with corresponding values from the variables object.
 *
 * @param template - The template string containing {{variableName}} placeholders
 * @param variables - A record mapping variable names to their string values
 * @returns The interpolated string with all known placeholders replaced
 */
export function interpolateTemplate(
  template: string,
  variables: Record<string, string>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return Object.prototype.hasOwnProperty.call(variables, key)
      ? variables[key]
      : match;
  });
}
