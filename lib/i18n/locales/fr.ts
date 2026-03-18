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
} as const;

export default fr;
export type Translations = typeof fr;
