import { parseCakeMetadata } from '@/lib/utils/parse-cake-metadata';

describe('parseCakeMetadata', () => {
  it('parses valid specialInstructions with number of people and event type', () => {
    const input = 'Number of People: 25\nEvent Type: birthday\nSome other note';
    expect(parseCakeMetadata(input)).toEqual({
      numberOfPeople: 25,
      eventType: 'birthday',
    });
  });

  it('returns null for both fields when input is null', () => {
    expect(parseCakeMetadata(null)).toEqual({
      numberOfPeople: null,
      eventType: null,
    });
  });

  it('returns null for both fields when input is empty string', () => {
    expect(parseCakeMetadata('')).toEqual({
      numberOfPeople: null,
      eventType: null,
    });
  });

  it('returns null for numberOfPeople when value is not a number', () => {
    const input = 'Number of People: many\nEvent Type: wedding';
    expect(parseCakeMetadata(input)).toEqual({
      numberOfPeople: null,
      eventType: 'wedding',
    });
  });

  it('returns null for eventType when value is empty', () => {
    const input = 'Number of People: 10\nEvent Type: ';
    expect(parseCakeMetadata(input)).toEqual({
      numberOfPeople: 10,
      eventType: null,
    });
  });

  it('handles case-insensitive keys', () => {
    const input = 'number of people: 50\nevent type: corporate';
    expect(parseCakeMetadata(input)).toEqual({
      numberOfPeople: 50,
      eventType: 'corporate',
    });
  });

  it('handles lines without colons gracefully', () => {
    const input = 'No colon here\nNumber of People: 8\nEvent Type: party';
    expect(parseCakeMetadata(input)).toEqual({
      numberOfPeople: 8,
      eventType: 'party',
    });
  });

  it('handles only number of people present', () => {
    const input = 'Number of People: 15\nSome random note';
    expect(parseCakeMetadata(input)).toEqual({
      numberOfPeople: 15,
      eventType: null,
    });
  });

  it('handles only event type present', () => {
    const input = 'Event Type: anniversary\nSome random note';
    expect(parseCakeMetadata(input)).toEqual({
      numberOfPeople: null,
      eventType: 'anniversary',
    });
  });
});
