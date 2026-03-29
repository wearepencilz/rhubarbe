import CheckoutFlowContainer from '@/components/checkout/CheckoutFlowContainer';

export const metadata = {
  title: 'Checkout gâteau / Cake Checkout - Rhubarbe',
  description: 'Review your cake order and proceed to payment.',
};

export default function CakeOrderCheckoutPage() {
  return <CheckoutFlowContainer orderType="cake" />;
}
