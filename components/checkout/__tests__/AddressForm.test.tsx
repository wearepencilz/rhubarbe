import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AddressForm from '../AddressForm';

// @vitest-environment jsdom

describe('AddressForm', () => {
  const emptyAddress = { street: '', city: '', province: '', postalCode: '' };
  const defaultProps = {
    address: emptyAddress,
    onChange: vi.fn(),
    errors: {} as Partial<Record<'street' | 'city' | 'province' | 'postalCode', string>>,
    locale: 'en',
  };

  it('renders four input fields with English labels', () => {
    render(<AddressForm {...defaultProps} />);
    expect(screen.getByLabelText('Street address')).toBeDefined();
    expect(screen.getByLabelText('City')).toBeDefined();
    expect(screen.getByLabelText('Province')).toBeDefined();
    expect(screen.getByLabelText('Postal code')).toBeDefined();
  });

  it('renders French labels when locale is fr', () => {
    render(<AddressForm {...defaultProps} locale="fr" />);
    expect(screen.getByLabelText('Adresse')).toBeDefined();
    expect(screen.getByLabelText('Ville')).toBeDefined();
    expect(screen.getByLabelText('Province')).toBeDefined();
    expect(screen.getByLabelText('Code postal')).toBeDefined();
  });

  it('renders English placeholders', () => {
    render(<AddressForm {...defaultProps} />);
    expect(screen.getByPlaceholderText('123 Main St')).toBeDefined();
    expect(screen.getByPlaceholderText('Montreal')).toBeDefined();
    expect(screen.getByPlaceholderText('Quebec')).toBeDefined();
    expect(screen.getByPlaceholderText('H2X 1Y4')).toBeDefined();
  });

  it('renders French placeholders when locale is fr', () => {
    render(<AddressForm {...defaultProps} locale="fr" />);
    expect(screen.getByPlaceholderText('123 rue Principale')).toBeDefined();
    expect(screen.getByPlaceholderText('Montréal')).toBeDefined();
    expect(screen.getByPlaceholderText('Québec')).toBeDefined();
    expect(screen.getByPlaceholderText('H2X 1Y4')).toBeDefined();
  });

  it('calls onChange with updated address when a field changes', () => {
    const onChange = vi.fn();
    render(<AddressForm {...defaultProps} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('Street address'), {
      target: { value: '456 Oak Ave' },
    });
    expect(onChange).toHaveBeenCalledWith({
      ...emptyAddress,
      street: '456 Oak Ave',
    });
  });

  it('displays validation errors per field', () => {
    const errors = {
      street: 'Street is required',
      postalCode: 'Invalid postal code',
    };
    render(<AddressForm {...defaultProps} errors={errors} />);
    expect(screen.getByText('Street is required')).toBeDefined();
    expect(screen.getByText('Invalid postal code')).toBeDefined();
  });

  it('applies red border to fields with errors', () => {
    const errors = { city: 'City is required' };
    render(<AddressForm {...defaultProps} errors={errors} />);
    const cityInput = screen.getByLabelText('City');
    expect(cityInput.className).toContain('border-red-500');
  });

  it('applies default border to fields without errors', () => {
    render(<AddressForm {...defaultProps} />);
    const streetInput = screen.getByLabelText('Street address');
    expect(streetInput.className).toContain('border-gray-300');
    expect(streetInput.className).not.toContain('border-red-500');
  });

  it('renders street as full width and city/province side by side', () => {
    const { container } = render(<AddressForm {...defaultProps} />);
    const grid = container.firstElementChild;
    expect(grid?.className).toContain('grid-cols-2');
    // Street wrapper should span full width
    const streetWrapper = grid?.firstElementChild;
    expect(streetWrapper?.className).toContain('col-span-2');
  });
});
