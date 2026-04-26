import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { db } from '../lib/db/client';
import { faqs } from '../lib/db/schema';
import { sql } from 'drizzle-orm';

const DATA: Record<string, { q: string; a: string; qfr: string; afr: string }[]> = {
  'Ordering & Timing': [
    { q: 'When does the weekly menu drop?', a: 'Every Tuesday. We post on this site and also email our subscribers. Check back mid-morning.', qfr: 'Quand le menu de la semaine est-il publié?', afr: 'Chaque mardi. Nous publions sur ce site et envoyons un courriel à nos abonnés. Revenez en milieu de matinée.' },
    { q: "When's the cut-off for weekend pickup?", a: "Friday at noon. Orders placed after 12 p.m. Friday will be ready the following Saturday. No exceptions — this keeps our baking schedule honest.", qfr: 'Quelle est la date limite pour la cueillette du week-end?', afr: 'Vendredi à midi. Les commandes passées après 12h le vendredi seront prêtes le samedi suivant. Aucune exception.' },
    { q: 'How much advance notice do you need for catering?', a: "48 hours minimum for everything on the B2B side: lunch boxes, buffets, breakfast service, cocktail dînatoire. Signature cakes need 7 days. Weekends don't count as business days.", qfr: 'Combien de temps à l\'avance pour le traiteur?', afr: '48 heures minimum pour le B2B : boîtes à lunch, buffets, petit-déjeuner, cocktail dînatoire. Les gâteaux signatures nécessitent 7 jours.' },
    { q: 'Can I order for a Sunday pickup?', a: "No. We're closed Sundays for production. Pickup is always Saturday for the weekly menu. For B2B catering, we take orders for Monday–Friday delivery only.", qfr: 'Puis-je commander pour le dimanche?', afr: 'Non. Nous sommes fermés le dimanche pour la production. La cueillette est toujours le samedi.' },
    { q: 'What if I missed the Friday deadline?', a: "You've got options. Reach out directly — we'll see what's left in production or if we can fit you in next week. No promises, but no harm in asking.", qfr: 'Et si j\'ai raté la date limite du vendredi?', afr: 'Contactez-nous directement — nous verrons ce qui reste en production. Aucune promesse, mais ça ne coûte rien de demander.' },
  ],
  'Delivery & Pickup': [
    { q: 'Do you deliver?', a: 'Yes. All catering orders include delivery. Weekly menu items are pickup only from our shop at 1320 rue Charlevoix.', qfr: 'Livrez-vous?', afr: 'Oui. Toutes les commandes traiteur incluent la livraison. Le menu hebdomadaire est en cueillette seulement au 1320 rue Charlevoix.' },
    { q: "What's your delivery area?", a: "Greater Montreal. Specific neighbourhoods and minimums vary. If you're ordering catering, you'll see delivery options at checkout.", qfr: 'Quelle est votre zone de livraison?', afr: 'Grand Montréal. Les quartiers et minimums varient. Les options de livraison apparaissent à la caisse.' },
    { q: 'What if I want to order a cake for Saturday but also grab something from the weekly menu?', a: "Each order can have its own pickup date. You can place them in the same cart and pick up when each item is ready.", qfr: 'Puis-je commander un gâteau et le menu hebdomadaire?', afr: 'Chaque commande peut avoir sa propre date de cueillette. Vous pouvez les mettre dans le même panier.' },
    { q: "How's the food packaged?", a: "Weekly menu items come in branded boxes. Catering is packed to travel — whether it's boxes, boards, or containers depends on the order.", qfr: 'Comment la nourriture est-elle emballée?', afr: 'Le menu hebdomadaire est dans des boîtes de marque. Le traiteur est emballé pour le transport.' },
  ],
  'Weekly Menu': [
    { q: "Items always sell out. What if my favourite's gone?", a: "That's the point — small batches, high quality, things move fast. If something sells out, email us. We also rotate seasonal specials.", qfr: 'Les articles se vendent vite. Et si mon favori est épuisé?', afr: 'C\'est le principe — petits lots, haute qualité. Si un article est épuisé, écrivez-nous. Nous alternons les spéciaux saisonniers.' },
    { q: 'Are there allergen warnings?', a: "Yes. Every product lists major allergens (nuts, gluten, dairy, eggs, etc.). Check the product page. If you need more detail, email before you order.", qfr: 'Y a-t-il des avertissements d\'allergènes?', afr: 'Oui. Chaque produit liste les allergènes majeurs. Consultez la page produit. Pour plus de détails, écrivez-nous.' },
    { q: 'Can you do custom flavours for the weekly menu?', a: "No. What you see is what we're baking that week. But if you want something specific for 6+ people, our signature cake team can help.", qfr: 'Pouvez-vous faire des saveurs personnalisées?', afr: 'Non. Ce que vous voyez est ce que nous cuisinons cette semaine. Pour 6+ personnes, notre équipe gâteaux signatures peut aider.' },
  ],
  'Signature Cakes': [
    { q: 'What makes a signature cake different from the birthday cake on the menu?', a: "The birthday cake is made-to-order but ready-made in a basic design. A signature cake is fully custom: your choice of cake, filling, decoration, size.", qfr: 'Quelle est la différence entre un gâteau signature et le gâteau d\'anniversaire?', afr: 'Le gâteau d\'anniversaire est prêt-à-porter. Un gâteau signature est entièrement personnalisé : choix du gâteau, garniture, décoration, taille.' },
    { q: 'How big can they get?', a: "We start at 30 people and scale up. Wedding cakes, XXL celebrations, croquembouche towers — whatever you're imagining, we can probably do it.", qfr: 'Quelle taille maximale?', afr: 'Nous commençons à 30 personnes. Gâteaux de mariage, célébrations XXL, croquembouche — tout est possible.' },
    { q: 'Can I do a cake tasting?', a: "Yes. You can book a tasting session (up to 3 flavours) and we'll reserve a production slot for you.", qfr: 'Puis-je faire une dégustation?', afr: 'Oui. Vous pouvez réserver une séance de dégustation (jusqu\'à 3 saveurs) et nous réserverons un créneau de production.' },
    { q: 'Do you ship cakes?', a: 'No. Local pickup or delivery only. Cakes are fragile and best eaten fresh.', qfr: 'Expédiez-vous les gâteaux?', afr: 'Non. Cueillette locale ou livraison seulement. Les gâteaux sont fragiles et meilleurs frais.' },
  ],
  'Catering': [
    { q: "What's the minimum order for catering?", a: "Depends on what you're ordering:\n- Lunch boxes: 12 minimum\n- Breakfast & buffet: roughly 15+ people\n- Cocktail dînatoire: 12 pieces per item\n- Custom: we'll talk to you", qfr: 'Quel est le minimum pour le traiteur?', afr: 'Selon la commande :\n- Boîtes à lunch : 12 minimum\n- Petit-déjeuner et buffet : environ 15+ personnes\n- Cocktail dînatoire : 12 pièces par article\n- Sur mesure : on en discute' },
    { q: 'Can we do pick-and-choose from the catering menu?', a: "Some items, yes. Lunch boxes and cocktail dînatoire let you select. Breakfast and buffet are curated formats.", qfr: 'Peut-on choisir à la carte?', afr: 'Certains articles, oui. Les boîtes à lunch et cocktails dînatoires permettent de choisir. Petit-déjeuner et buffet sont des formats curatés.' },
    { q: 'What dietary options do you have?', a: "Lunch boxes come in vegetarian, omnivore, pescatarian, and vegan. For buffets, tell us your group's needs.", qfr: 'Quelles options diététiques offrez-vous?', afr: 'Boîtes à lunch : végétarien, omnivore, pescatarien, végétalien. Pour les buffets, indiquez-nous les besoins de votre groupe.' },
    { q: 'Do you do allergies and dietary restrictions?', a: "Absolutely. Just flag it when you order. We keep detailed notes and work around common allergens.", qfr: 'Gérez-vous les allergies et restrictions?', afr: 'Absolument. Signalez-le lors de la commande. Nous prenons des notes détaillées et contournons les allergènes courants.' },
    { q: 'Can you do delivery on a weekend?', a: "Not normally. But if your catering order is large enough, reach out. We might be able to work something out.", qfr: 'Livrez-vous le week-end?', afr: 'Pas normalement. Mais pour une grosse commande traiteur, contactez-nous. On peut peut-être s\'arranger.' },
  ],
  'Billing & Payment': [
    { q: 'What payment methods do you take?', a: 'Credit card (Visa, Mastercard, Amex) via our online checkout.', qfr: 'Quels modes de paiement acceptez-vous?', afr: 'Carte de crédit (Visa, Mastercard, Amex) via notre paiement en ligne.' },
    { q: 'Is tax included in the price?', a: 'No. Tax is calculated at checkout based on your order type.', qfr: 'Les taxes sont-elles incluses?', afr: 'Non. Les taxes sont calculées à la caisse selon le type de commande.' },
    { q: 'Can I get an invoice for a B2B order?', a: "Yes. Generate it from your account after checkout, or email us for a formal invoice.", qfr: 'Puis-je obtenir une facture B2B?', afr: 'Oui. Générez-la depuis votre compte après la commande, ou écrivez-nous pour une facture formelle.' },
  ],
  'Account & Orders': [
    { q: 'Do I need to create an account?', a: "For weekly menu: no, you can checkout as a guest.\nFor B2B catering: yes, you'll get an account to browse the portal, track orders, and reorder.", qfr: 'Dois-je créer un compte?', afr: 'Menu hebdomadaire : non, vous pouvez payer en tant qu\'invité.\nTraiteur B2B : oui, vous aurez un compte pour naviguer, suivre et recommander.' },
    { q: 'Can I modify my order after placing it?', a: "Weekly menu: email immediately. Catering: same — we'll adjust if we haven't started production. Cakes: we confirm details before baking.", qfr: 'Puis-je modifier ma commande?', afr: 'Menu hebdomadaire : écrivez immédiatement. Traiteur : pareil. Gâteaux : nous confirmons les détails avant la cuisson.' },
    { q: 'How do I track my order?', a: "You'll get an order confirmation email with pickup/delivery details and a reference number.", qfr: 'Comment suivre ma commande?', afr: 'Vous recevrez un courriel de confirmation avec les détails de cueillette/livraison et un numéro de référence.' },
    { q: "What's your refund policy?", a: "Cancellations more than 48 hours out: full refund. Less than 48 hours: voucher credit. Already picked up: no refunds. Call us if there's a problem.", qfr: 'Quelle est votre politique de remboursement?', afr: 'Annulation 48h+ à l\'avance : remboursement complet. Moins de 48h : crédit. Déjà récupéré : pas de remboursement. Appelez-nous en cas de problème.' },
  ],
  'About Us & Sourcing': [
    { q: 'Where are you located?', a: '1320 rue Charlevoix, Montréal. Come visit.', qfr: 'Où êtes-vous situés?', afr: '1320 rue Charlevoix, Montréal. Venez nous visiter.' },
    { q: "Who's behind Rhubarbe?", a: "A small team of bakers, cooks, and people who care about feeding Montrealers well.", qfr: 'Qui est derrière Rhubarbe?', afr: 'Une petite équipe de boulangers, cuisiniers et passionnés qui veulent bien nourrir les Montréalais.' },
    { q: 'Are your ingredients local?', a: "As much as we can. We source seasonally and work with suppliers we know and trust across Quebec.", qfr: 'Vos ingrédients sont-ils locaux?', afr: 'Autant que possible. Nous nous approvisionnons de façon saisonnière auprès de fournisseurs de confiance au Québec.' },
    { q: 'Do you do wholesale or bulk supplies?', a: "Not really. We're batch-focused. But if you're a restaurant or retailer, get in touch.", qfr: 'Faites-vous de la vente en gros?', afr: 'Pas vraiment. Nous travaillons par lots. Mais si vous êtes restaurateur ou détaillant, contactez-nous.' },
  ],
  'Trouble & Support': [
    { q: 'I have questions not answered here.', a: 'Email info@rhubarbe.ca or call 514 316-2935. We\'re around Tuesday–Friday.', qfr: 'J\'ai des questions non couvertes ici.', afr: 'Écrivez à info@rhubarbe.ca ou appelez le 514 316-2935. Nous sommes disponibles du mardi au vendredi.' },
    { q: 'Something arrived damaged or wrong.', a: "Email photos and your order number right away. We'll make it right — redelivery, replacement, credit, whatever makes sense.", qfr: 'Ma commande est arrivée endommagée.', afr: 'Envoyez des photos et votre numéro de commande immédiatement. Nous corrigerons — relivraison, remplacement ou crédit.' },
    { q: "The website isn't working or I can't check out.", a: "Try a different browser or clear your cache. If that doesn't help, email us and place your order by phone.", qfr: 'Le site ne fonctionne pas.', afr: 'Essayez un autre navigateur ou videz votre cache. Sinon, écrivez-nous et passez votre commande par téléphone.' },
  ],
};

async function seed() {
  // Clear existing
  await db.execute(sql`DELETE FROM faqs`);
  let total = 0;
  for (const [topic, items] of Object.entries(DATA)) {
    for (let i = 0; i < items.length; i++) {
      const { q, a, qfr, afr } = items[i];
      await db.insert(faqs).values({
        topic, sortOrder: i,
        question: { en: q, fr: qfr },
        answer: { en: a, fr: afr },
      });
      total++;
    }
  }
  console.log(`✅ Seeded ${total} FAQs across ${Object.keys(DATA).length} topics`);
  process.exit(0);
}
seed();
