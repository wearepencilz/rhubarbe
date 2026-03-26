// French UI strings — frontend default locale
const fr = {
  nav: {
    order: 'Commander',
    volumeOrder: 'Commande en volume',
    catering: 'Traiteur',
    signatureCakes: 'Gâteaux signatures',
    cateringAndCakes: 'Traiteur & Gâteaux',
    about: 'À propos',
    cart: 'Panier',
    cartCount: (n: number) => `Panier (${n})`,
  },
  cart: {
    open: 'Ouvrir le panier',
    openWithItems: (n: number) => `Ouvrir le panier, ${n} article${n > 1 ? 's' : ''}`,
    title: 'Panier',
    close: 'Fermer le panier',
    empty: 'Votre panier est vide',
    remove: 'Retirer',
    subtotal: 'Sous-total',
    checkout: 'Passer à la caisse',
    taxNote: 'Taxes et livraison calculées à la caisse',
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
    pickupLabel: 'Cueillette:',
    orderEnded: 'La période de commande est terminée',
    ended: 'Terminé',
    daysLeft: (n: number) => `${n}j restants`,
    timeLeft: (h: number, m: number) => `${h}h ${m}m restants`,
  },
  volumeOrder: {
    title: 'Commande en volume',
    subtitle: 'Ajustez les quantités directement — votre commande se met à jour automatiquement.',
    quantity: 'Quantité',
    minimum: 'Minimum',
    leadTimeTitle: 'Délai selon quantité',
    yourOrder: 'Votre commande',
    noItems: 'Aucun article',
    startHint: 'Ajustez les quantités pour commencer',
    estTotal: 'Total estimé',
    items: 'Articles',
    taxNote: 'Taxes calculées à la caisse',
    fulfillment: 'Mode de réception',
    pickup: 'Cueillette',
    delivery: 'Livraison',
    date: 'Date',
    time: 'Heure',
    earliest: 'Dès le',
    allergenNote: 'Note allergènes',
    allergenPlaceholder: 'Ex. : Sans arachides…',
    checkout: 'Passer à la caisse',
    loading: 'Chargement…',
    minWarning: 'Certains produits n\'atteignent pas le minimum requis',
    noProducts: 'Aucun produit disponible.',
    loadError: 'Impossible de charger les produits.',
    checkoutError: 'Erreur. Réessayez.',
    mobileCheckout: 'Caisse',
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
    loading: 'Chargement...',
    unavailableInfo: 'Disponibilité non disponible',
    notAvailable: 'Non disponible',
    available: 'Disponible',
    orderBy: 'Commander avant le ',
    pickupDate: 'Date de cueillette',
    pickupLocation: 'Point de cueillette',
    timeSlot: 'Créneau horaire',
    quantity: 'Quantité',
    decreaseQty: 'Diminuer la quantité',
    increaseQty: 'Augmenter la quantité',
    multiples: (n: number) => `Par multiples de ${n}`,
  },
  footer: {
    copyright: (year: number, name: string) => `© ${year} ${name}`,
  },
  allergens: {
    title: 'Information sur les allergènes',
    contains: 'Contient:',
    dairy: 'Produits laitiers',
    egg: 'Œufs',
    'tree-nuts': 'Noix',
    peanuts: 'Arachides',
    soy: 'Soja',
    gluten: 'Gluten',
    sesame: 'Sésame',
  },
  dietary: {
    title: 'Préférences alimentaires',
    clearAll: 'Tout effacer',
    showing: (n: number) => `Affichage des produits correspondant à ${n} filtre${n > 1 ? 's' : ''}`,
    vegan: 'Végétalien',
    vegetarian: 'Végétarien',
    'gluten-free': 'Sans gluten',
    'dairy-free': 'Sans lactose',
    'nut-free': 'Sans noix',
  },
  ingredients: {
    title: 'Ingrédients',
    seasonal: 'Saisonnier',
    none: 'Aucun ingrédient listé',
    base: 'Base',
    flavor: 'Saveurs',
    'mix-in': 'Garnitures',
    topping: 'Toppings',
    spice: 'Épices',
  },
  thankYou: {
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
      eventTypes: ['mariage', 'boîte à lunch', 'buffet', 'banquet', 'cocktail dînatoire'],
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
  nav: { order: string; volumeOrder: string; catering: string; signatureCakes: string; cateringAndCakes: string; about: string; cart: string; cartCount: (n: number) => string };
  cart: { open: string; openWithItems: (n: number) => string; title: string; close: string; empty: string; remove: string; subtotal: string; checkout: string; taxNote: string };
  product: { addToCart: string; adding: string; soldOut: string; preorder: string; quantity: string; inStock: string; noImage: string; orderComingSoon: string; serves: (n: string) => string };
  order: { title: string; preordersOnly: string; pickup: string; sweet: string; savory: string; other: string; pickupLabel: string; orderEnded: string; ended: string; daysLeft: (n: number) => string; timeLeft: (h: number, m: number) => string };
  volumeOrder: { title: string; subtitle: string; quantity: string; minimum: string; leadTimeTitle: string; yourOrder: string; noItems: string; startHint: string; estTotal: string; items: string; taxNote: string; fulfillment: string; pickup: string; delivery: string; date: string; time: string; earliest: string; allergenNote: string; allergenPlaceholder: string; checkout: string; loading: string; minWarning: string; noProducts: string; loadError: string; checkoutError: string; mobileCheckout: string };
  flavours: { title: string; ingredients: string; ingredientsLabel: string };
  stories: { read: string; moreStories: string; nothingYet: string; wordBy: (name: string) => string };
  availability: { inStock: string; preorder: string; soldOut: string; ships: (date: string) => string; loading: string; unavailableInfo: string; notAvailable: string; available: string; orderBy: string; pickupDate: string; pickupLocation: string; timeSlot: string; quantity: string; decreaseQty: string; increaseQty: string; multiples: (n: number) => string };
  footer: { copyright: (year: number, name: string) => string };
  allergens: { title: string; contains: string; dairy: string; egg: string; 'tree-nuts': string; peanuts: string; soy: string; gluten: string; sesame: string };
  dietary: { title: string; clearAll: string; showing: (n: number) => string; vegan: string; vegetarian: string; 'gluten-free': string; 'dairy-free': string; 'nut-free': string };
  ingredients: { title: string; seasonal: string; none: string; base: string; flavor: string; 'mix-in': string; topping: string; spice: string };
  thankYou: { heading: string; message: string; pickupReminder: string; backToMenu: string; orderSummary: string; pickupDetails: string; items: string; subtotal: string; date: string; location: string; timeSlot: string; menu: string };
  form: {
    traiteur: { heading: string; intro: string; menuNote: string; contactNote: string };
    gateaux: { heading: string; intro: string; menuNote: string; contactNote: string };
    fields: { name: string; email: string; phone: string; date: string; time: string; guests: string; eventType: string; eventTypes: string[]; delivery: string; deliveryAddress: string; notes: string; yes: string; no: string; select: string; submit: string; sending: string; success: string; error: string };
  };
};
