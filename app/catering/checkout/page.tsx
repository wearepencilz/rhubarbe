import CheckoutFlowContainer from '@/components/checkout/CheckoutFlowContainer';

export const metadata = {
  title: 'Checkout traiteur / Catering Checkout - Rhubarbe',
  description: 'Review your catering order and proceed to payment.',
};

export default function VolumeOrderCheckoutPage() {
  return <CheckoutFlowContainer orderType="volume" />;
}
