// French UI strings — frontend default locale
const fr = {
  nav: {
    order: 'Commander',
    catering: 'Traiteur',
    signatureCakes: 'Gâteaux signatures',
    about: 'À propos',
    cart: 'Panier',
    cartCount: (n: number) => `Panier (${n})`,
  },
  cart: {
    open: 'Ouvrir le panier',
    openWithItems: (n: number) => `Ouvrir le panier, ${n} article${n > 1 ? 's' : ''}`,
  },
  product: {
    addToCart: 'Ajouter au panier',
    adding: 'Ajout en cours...',
    soldOut: 'Épuisé',
    preorder: 'Précommander',
    quantity: 'Quantité',
    inStock: 'En stock',
    noImage: 'Aucune image disponible',
    orderComingSoon: 'Commande en ligne bientôt disponible. Contactez-nous pour passer une commande.',
    serves: (n: string) => `Pour ${n}`,
  },
  order: {
    title: 'Commander',
    preordersOnly: 'Précommandes seulement',
    pickup: 'Cueillette chaque samedi entre 9h et 12h au 1320 rue Charlevoix, Pointe Saint-Charles.',
    sweet: 'Sucré',
    savory: 'Salé',
    other: 'Autre',
  },
  flavours: {
    title: '[SAVEURS]',
    ingredients: '[INGRÉDIENTS]',
    ingredientsLabel: 'Ingrédients',
  },
  stories: {
    read: 'Lire →',
    moreStories: 'Plus de récits',
    nothingYet: 'Rien pour l\'instant.',
    wordBy: (name: string) => `Texte de ${name}`,
  },
  availability: {
    inStock: 'En stock',
    preorder: 'Précommande',
    soldOut: 'Épuisé',
    ships: (date: string) => `Expédition le ${date}`,
  },
  footer: {
    copyright: (year: number, name: string) => `© ${year} ${name}`,
  },
  form: {
    traiteur: {
      heading: 'Traiteur',
      intro: 'Rhubarbe offre un service de traiteur pour tous types d\'événements — réunions d\'affaires, rassemblements familiaux, et même à domicile.',
      menuNote: 'télécharger le menu (bientôt disponible)',
      contactNote: 'contactez-nous via le formulaire ci-dessous',
    },
    gateaux: {
      heading: 'Gâteaux signatures',
      intro: 'Rhubarbe offre également un service de gâteaux signatures pour les mariages et occasions spéciales.',
      menuNote: 'télécharger le menu (bientôt disponible)',
      contactNote: 'contactez-nous via le formulaire ci-dessous',
    },
    fields: {
      name: 'Prénom et nom',
      email: 'Courriel',
      phone: 'Téléphone',
      date: 'Date',
      time: 'Heure',
      guests: 'Nombre de personnes',
      eventType: 'Type d\'événement',
      delivery: 'Livraison?',
      deliveryAddress: 'Adresse de livraison (si vous avez coché « Oui »)',
      notes: 'Autres informations',
      yes: 'Oui',
      no: 'Non',
      select: '— sélectionner —',
      submit: 'envoyer',
      sending: 'envoi en cours...',
      success: 'Merci! Nous vous contacterons sous peu.',
      error: 'Une erreur s\'est produite. Veuillez réessayer.',
    },
  },
} satisfies Record<string, any>;

export default fr;

export type Translations = {
  nav: { order: string; catering: string; signatureCakes: string; about: string; cart: string; cartCount: (n: number) => string };
  cart: { open: string; openWithItems: (n: number) => string };
  product: { addToCart: string; adding: string; soldOut: string; preorder: string; quantity: string; inStock: string; noImage: string; orderComingSoon: string; serves: (n: string) => string };
  order: { title: string; preordersOnly: string; pickup: string; sweet: string; savory: string; other: string };
  flavours: { title: string; ingredients: string; ingredientsLabel: string };
  stories: { read: string; moreStories: string; nothingYet: string; wordBy: (name: string) => string };
  availability: { inStock: string; preorder: string; soldOut: string; ships: (date: string) => string };
  footer: { copyright: (year: number, name: string) => string };
  form: {
    traiteur: { heading: string; intro: string; menuNote: string; contactNote: string };
    gateaux: { heading: string; intro: string; menuNote: string; contactNote: string };
    fields: { name: string; email: string; phone: string; date: string; time: string; guests: string; eventType: string; delivery: string; deliveryAddress: string; notes: string; yes: string; no: string; select: string; submit: string; sending: string; success: string; error: string };
  };
};
