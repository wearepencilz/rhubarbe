/**
 * Parse cake-specific metadata from specialInstructions text.
 * Expects key-value lines like "Number of People: 25\nEvent Type: birthday\n..."
 * Returns null for both fields if parsing fails.
 *
 * This is a pure utility — no DB imports — safe for client-side use.
 */
export function parseCakeMetadata(specialInstructions: string | null): {
  numberOfPeople: number | null;
  eventType: string | null;
} {
  if (!specialInstructions) return { numberOfPeople: null, eventType: null };
  try {
    const lines = specialInstructions.split('\n');
    let numberOfPeople: number | null = null;
    let eventType: string | null = null;
    for (const line of lines) {
      const colonIdx = line.indexOf(':');
      if (colonIdx === -1) continue;
      const key = line.slice(0, colonIdx).trim().toLowerCase();
      const value = line.slice(colonIdx + 1).trim();
      if (key === 'number of people') {
        const parsed = parseInt(value, 10);
        if (!isNaN(parsed)) numberOfPeople = parsed;
      } else if (key === 'event type') {
        if (value) eventType = value;
      }
    }
    return { numberOfPeople, eventType };
  } catch {
    return { numberOfPeople: null, eventType: null };
  }
}
