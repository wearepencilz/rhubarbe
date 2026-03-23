import * as pageQueries from '@/lib/db/queries/pages';
import ThankYouClient from './ThankYouClient';

export const metadata = {
  title: 'Merci / Thank You – Rhubarbe',
  description: 'Your order has been confirmed.',
};

const FR_DEFAULTS = {
  heading: 'Merci pour votre commande!',
  message: 'Votre commande a été confirmée. Vous recevrez un courriel de confirmation sous peu.',
  pickupReminder: 'N\'oubliez pas de vous présenter à l\'heure de cueillette choisie.',
  backToMenu: '← Retour au menu',
  orderSummary: 'Résumé de la commande',
  pickupDetails: 'Détails de cueillette',
  items: 'Articles',
  subtotal: 'Sous-total',
  date: 'Date',
  location: 'Lieu',
  timeSlot: 'Créneau',
  menu: 'Menu',
};

const EN_DEFAULTS = {
  heading: 'Thank you for your order!',
  message: 'Your order has been confirmed. You\'ll receive a confirmation email shortly.',
  pickupReminder: 'Don\'t forget to arrive at your chosen pickup time.',
  backToMenu: '← Back to menu',
  orderSummary: 'Order summary',
  pickupDetails: 'Pickup details',
  items: 'Items',
  subtotal: 'Subtotal',
  date: 'Date',
  location: 'Location',
  timeSlot: 'Time slot',
  menu: 'Menu',
};

export default async function ThankYouPage() {
  const page = await pageQueries.getByName('thank-you').catch(() => null);
  const raw = page?.content ?? {};

  const en = { ...EN_DEFAULTS, ...(raw as any).en };
  const fr = { ...FR_DEFAULTS, ...(raw as any).fr };

  return <ThankYouClient en={en} fr={fr} />;
}
