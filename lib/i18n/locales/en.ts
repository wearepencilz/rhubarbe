// English UI strings — CMS base locale
import type { Translations } from './fr';

const en: Translations = {
  nav: {
    order: 'Order',
    catering: 'Catering',
    signatureCakes: 'Signature Cakes',
    about: 'About',
    cart: 'Cart',
    cartCount: (n: number) => `Cart (${n})`,
  },
  cart: {
    open: 'Open cart',
    openWithItems: (n: number) => `Open cart, ${n} item${n > 1 ? 's' : ''}`,
  },
  product: {
    addToCart: 'Add to Cart',
    adding: 'Adding...',
    soldOut: 'Sold Out',
    preorder: 'Pre-order Now',
    quantity: 'Quantity',
    inStock: 'In Stock',
    noImage: 'No image available',
    orderComingSoon: 'Online ordering coming soon. Contact us to place an order.',
    serves: (n: string) => `Serves ${n}`,
  },
  order: {
    title: 'Order',
    preordersOnly: 'Pre-orders only',
    pickup: 'Pickup every Saturday between 9am and 12pm at 1320 rue Charlevoix, Pointe Saint-Charles.',
    sweet: 'Sweet',
    savory: 'Savory',
    other: 'Other',
  },
  flavours: {
    title: '[FLAVOURS]',
    ingredients: '[INGREDIENTS]',
    ingredientsLabel: 'Ingredients',
  },
  stories: {
    read: 'Read →',
    moreStories: 'More stories',
    nothingYet: 'Nothing here yet.',
    wordBy: (name: string) => `Word by ${name}`,
  },
  availability: {
    inStock: 'In Stock',
    preorder: 'Pre-order',
    soldOut: 'Sold Out',
    ships: (date: string) => `Ships ${date}`,
  },
  footer: {
    copyright: (year: number, name: string) => `© ${year} ${name}`,
  },
  form: {
    traiteur: {
      heading: 'Catering',
      intro: 'Rhubarbe offers a catering service for all types of events — business meetings, family gatherings, and even in-home service.',
      menuNote: 'download menu (coming soon)',
      contactNote: 'contact us via the form below',
    },
    gateaux: {
      heading: 'Signature Cakes',
      intro: 'Rhubarbe also offers a signature cake service for weddings and special occasions.',
      menuNote: 'download menu (coming soon)',
      contactNote: 'contact us via the form below',
    },
    fields: {
      name: 'Full name',
      email: 'Email',
      phone: 'Phone',
      date: 'Date',
      time: 'Time',
      guests: 'Number of people',
      eventType: 'Event type',
      delivery: 'Delivery?',
      deliveryAddress: 'Delivery address (if you checked "Yes")',
      notes: 'Other information',
      yes: 'Yes',
      no: 'No',
      select: '— select —',
      submit: 'send',
      sending: 'sending...',
      success: 'Thank you! We will be in touch shortly.',
      error: 'Something went wrong. Please try again.',
    },
  },
};

export default en;
