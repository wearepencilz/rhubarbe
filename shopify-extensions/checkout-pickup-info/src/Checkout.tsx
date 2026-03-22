import {
  reactExtension,
  Banner,
  BlockStack,
  Text,
  InlineStack,
  Icon,
  useCartAttributes,
} from '@shopify/ui-extensions-react/checkout';

export default reactExtension('purchase.checkout.block.render', () => <PickupDetails />);

function PickupDetails() {
  const attributes = useCartAttributes();

  // Read the attributes set by the preorder flow
  const getValue = (key: string) =>
    attributes?.find((a) => a.key === key)?.value || null;

  const menu = getValue('Menu');
  const pickupDate = getValue('Pickup Date');
  const pickupLocation = getValue('Pickup Location');
  const pickupAddress = getValue('Pickup Address');
  const pickupSlot = getValue('Pickup Slot');

  // Don't render if no pickup attributes are present (regular checkout)
  if (!pickupDate && !pickupLocation) return null;

  return (
    <Banner title="Pickup details" status="info">
      <BlockStack spacing="tight">
        {menu && (
          <InlineStack spacing="tight">
            <Text size="small" emphasis="bold">Menu:</Text>
            <Text size="small">{menu}</Text>
          </InlineStack>
        )}
        {pickupDate && (
          <InlineStack spacing="tight">
            <Text size="small" emphasis="bold">Date:</Text>
            <Text size="small">{pickupDate}</Text>
          </InlineStack>
        )}
        {pickupSlot && (
          <InlineStack spacing="tight">
            <Text size="small" emphasis="bold">Time:</Text>
            <Text size="small">{pickupSlot}</Text>
          </InlineStack>
        )}
        {pickupLocation && (
          <InlineStack spacing="tight">
            <Text size="small" emphasis="bold">Location:</Text>
            <Text size="small">{pickupLocation}</Text>
          </InlineStack>
        )}
        {pickupAddress && (
          <Text size="small" appearance="subdued">{pickupAddress}</Text>
        )}
      </BlockStack>
    </Banner>
  );
}
