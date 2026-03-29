import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import FulfillmentToggle from '../FulfillmentToggle';

// @vitest-environment jsdom

describe('FulfillmentToggle', () => {
  const defaultProps = {
    value: 'pickup' as const,
    onChange: vi.fn(),
    deliveryDisabled: false,
    locale: 'en',
  };

  it('renders pickup and delivery buttons with English labels', () => {
    render(<FulfillmentToggle {...defaultProps} />);
    expect(screen.getByText('Pickup')).toBeDefined();
    expect(screen.getByText('Delivery')).toBeDefined();
    expect(screen.getByText('Fulfillment')).toBeDefined();
  });

  it('renders French labels when locale is fr', () => {
    render(<FulfillmentToggle {...defaultProps} locale="fr" />);
    expect(screen.getByText('Cueillette')).toBeDefined();
    expect(screen.getByText('Livraison')).toBeDefined();
    expect(screen.getByText('Mode de livraison')).toBeDefined();
  });

  it('calls onChange when a button is clicked', () => {
    const onChange = vi.fn();
    render(<FulfillmentToggle {...defaultProps} onChange={onChange} />);
    fireEvent.click(screen.getByText('Delivery'));
    expect(onChange).toHaveBeenCalledWith('delivery');
  });

  it('disables delivery button when deliveryDisabled is true', () => {
    render(<FulfillmentToggle {...defaultProps} deliveryDisabled />);
    const deliveryBtn = screen.getByText('Delivery');
    expect(deliveryBtn).toHaveProperty('disabled', true);
  });

  it('shows deliveryDisabledMessage when delivery is disabled', () => {
    render(
      <FulfillmentToggle
        {...defaultProps}
        deliveryDisabled
        deliveryDisabledMessage="Pickup only for this item"
      />,
    );
    expect(screen.getByText('Pickup only for this item')).toBeDefined();
  });

  it('does not show message when delivery is not disabled', () => {
    render(
      <FulfillmentToggle
        {...defaultProps}
        deliveryDisabled={false}
        deliveryDisabledMessage="Pickup only for this item"
      />,
    );
    expect(screen.queryByText('Pickup only for this item')).toBeNull();
  });

  it('applies active styling to the selected value', () => {
    render(<FulfillmentToggle {...defaultProps} value="delivery" />);
    const deliveryBtn = screen.getByText('Delivery');
    expect(deliveryBtn.className).toContain('bg-[#333112]');
    expect(deliveryBtn.className).toContain('text-white');
  });
});
