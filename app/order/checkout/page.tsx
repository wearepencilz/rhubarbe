import CheckoutFlowContainer from '@/components/checkout/CheckoutFlowContainer';

export const metadata = {
  title: 'Checkout / Paiement - Rhubarbe',
  description: 'Review your order and proceed to payment.',
};

export default function OrderCheckoutPage() {
  return <CheckoutFlowContainer orderType="regular" />;
}
