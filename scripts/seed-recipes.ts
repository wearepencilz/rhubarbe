import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { db } from '../lib/db/client';
import { recipes } from '../lib/db/schema';

const bi = (en: string, fr: string) => ({ en, fr });
const img = (url: string) => ({ url, alt: bi('', '') });
const id = (n: number) => `r-${Date.now()}-${n}`;

const RECIPES = [
  {
    title: 'Paris-Brest', slug: 'paris-brest', category: 'Pastry',
    coverImage: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&h=500&fit=crop',
    sections: [
      { id: id(1), type: 'heading-content', title: bi('Paris-Brest', 'Paris-Brest'), category: bi('Pastry', 'Pâtisserie'), date: 'Serves 4–6 · 3 hours · Intermediate' },
      { id: id(2), type: 'text', title: bi('The Idea', 'L\'idée'), body: bi('This is the gateway drug to French pastry. Choux is wild — you make it, it puffs up in the oven, you fill it with praline cream and almonds. Everyone tastes it and thinks you\'re a wizard.', 'C\'est la porte d\'entrée de la pâtisserie française. La pâte à choux est magique — vous la faites, elle gonfle au four, vous la remplissez de crème pralinée et d\'amandes. Tout le monde pense que vous êtes un magicien.') },
      { id: id(3), type: 'two-column-text', title: bi('Ingredients', 'Ingrédients'), columnLeft: bi('Choux pastry\n100 ml water\n50 g butter\n3 g salt\n2.5 g sugar\n60 g all-purpose flour\n2 eggs\n40 g sliced almonds', 'Pâte à choux\n100 ml eau\n50 g beurre\n3 g sel\n2,5 g sucre\n60 g farine\n2 œufs\n40 g amandes effilées'), columnRight: bi('Praline cream\n250 ml heavy cream (cold)\n30 g hazelnut praline paste\n5 g powdered sugar\nA pinch of fleur de sel', 'Crème pralinée\n250 ml crème épaisse (froide)\n30 g pâte de praliné noisette\n5 g sucre glace\nUne pincée de fleur de sel') },
      { id: id(4), type: 'instructions', title: bi('Choux Pastry', 'Pâte à choux'), steps: [bi('Heat water, butter, salt, and sugar to 100°C. Remove from heat.', 'Chauffer eau, beurre, sel et sucre à 100°C. Retirer du feu.'), bi('Add flour all at once, stir hard until it forms a ball.', 'Ajouter la farine d\'un coup, remuer vigoureusement.'), bi('Return to low heat and stir for 30 seconds to dry the paste.', 'Remettre à feu doux 30 secondes pour dessécher.'), bi('Cool 2 minutes, then add eggs one at a time.', 'Refroidir 2 minutes, puis ajouter les œufs un à un.'), bi('Pipe a 10 cm ring on parchment. Brush with water, cover with almonds.', 'Pocher un anneau de 10 cm. Badigeonner d\'eau, couvrir d\'amandes.'), bi('Bake at 190°C for 30–35 minutes until deep golden.', 'Cuire à 190°C pendant 30-35 minutes.'), bi('Cool completely (at least 30 minutes).', 'Refroidir complètement (au moins 30 minutes).')] },
      { id: id(5), type: 'quote', text: bi('"Patient cooling is everything. Warm choux + cold cream = disaster. Cold choux + cold cream = magic."', '"La patience au refroidissement est tout. Choux chaud + crème froide = désastre. Choux froid + crème froide = magie."') },
    ],
  },
  {
    title: 'Financier', slug: 'financier', category: 'Cake',
    coverImage: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=800&h=500&fit=crop',
    sections: [
      { id: id(10), type: 'heading-content', title: bi('Financier', 'Financier'), category: bi('Cake', 'Gâteau'), date: 'Makes 12 · 45 min · Easy' },
      { id: id(11), type: 'text', title: bi('The Idea', 'L\'idée'), body: bi('Entry-level French pastry. You dump ingredients together, bake them in a mold, and suddenly you have 12 perfect little cakes. They taste expensive. They\'re actually just almonds and butter.', 'Pâtisserie française pour débutants. Vous mélangez les ingrédients, vous les cuisez dans un moule, et vous avez 12 petits gâteaux parfaits. Ils ont un goût luxueux. Ce ne sont que des amandes et du beurre.') },
      { id: id(12), type: 'text', title: bi('Ingredients', 'Ingrédients'), body: bi('100 g butter\n100 g ground almonds\n100 g powdered sugar\n30 g all-purpose flour\n3 egg whites (room temperature)\n1 g salt\n5 ml vanilla extract', '100 g beurre\n100 g amandes moulues\n100 g sucre glace\n30 g farine\n3 blancs d\'œufs (température ambiante)\n1 g sel\n5 ml extrait de vanille') },
      { id: id(13), type: 'steps', steps: [{ label: bi('01', '01'), body: bi('Melt butter gently, let it cool slightly.', 'Fondre le beurre doucement, laisser refroidir.') }, { label: bi('02', '02'), body: bi('Mix ground almonds, powdered sugar, flour, and salt.', 'Mélanger amandes, sucre glace, farine et sel.') }, { label: bi('03', '03'), body: bi('Add egg whites and vanilla, stir until smooth. Add cooled butter.', 'Ajouter les blancs et la vanille. Incorporer le beurre refroidi.') }, { label: bi('04', '04'), body: bi('Pour into mold three-quarters full. Bake at 180°C for 12–15 minutes.', 'Verser dans le moule aux trois quarts. Cuire à 180°C pendant 12-15 minutes.') }] },
      { id: id(14), type: 'quote', text: bi('"Don\'t overbake. The centre should still be slightly soft when you pull it out."', '"Ne pas trop cuire. Le centre doit être encore légèrement mou à la sortie du four."') },
    ],
  },
  {
    title: 'Tropézienne', slug: 'tropezienne', category: 'Pastry',
    coverImage: 'https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e?w=800&h=500&fit=crop',
    sections: [
      { id: id(20), type: 'heading-content', title: bi('Tropézienne', 'Tropézienne'), category: bi('Pastry', 'Pâtisserie'), date: 'Serves 6–8 · 4 hours · Intermediate' },
      { id: id(21), type: 'text', title: bi('The Idea', 'L\'idée'), body: bi('Soft brioche. Fragrant orange-blossom cream. Whipped cream. Simplicity that tastes like you spent all day on it. You didn\'t.', 'Brioche moelleuse. Crème parfumée à la fleur d\'oranger. Crème fouettée. Une simplicité qui a le goût d\'une journée de travail. Ce n\'est pas le cas.') },
      { id: id(22), type: 'two-column-text', title: bi('Ingredients', 'Ingrédients'), columnLeft: bi('Brioche\n250 g flour\n5 g salt\n7 g instant yeast\n50 g sugar\n3 eggs\n100 ml warm milk\n100 g soft butter\nPearl sugar', 'Brioche\n250 g farine\n5 g sel\n7 g levure instantanée\n50 g sucre\n3 œufs\n100 ml lait tiède\n100 g beurre mou\nSucre perlé'), columnRight: bi('Orange-blossom cream\n250 ml milk\n1 vanilla pod\n15 ml orange-blossom water\n4 egg yolks\n50 g sugar\n20 g cornstarch\n20 g flour\n20 g butter\n\nAssembly\n200 ml heavy cream\n10 g powdered sugar', 'Crème fleur d\'oranger\n250 ml lait\n1 gousse de vanille\n15 ml eau de fleur d\'oranger\n4 jaunes d\'œufs\n50 g sucre\n20 g fécule\n20 g farine\n20 g beurre\n\nMontage\n200 ml crème\n10 g sucre glace') },
      { id: id(23), type: 'instructions', title: bi('Brioche', 'Brioche'), steps: [bi('Mix flour, salt, yeast, sugar. Add eggs and warm milk.', 'Mélanger farine, sel, levure, sucre. Ajouter œufs et lait tiède.'), bi('Knead 5 minutes. Add soft butter in pieces, work in until smooth (10 min).', 'Pétrir 5 minutes. Ajouter le beurre en morceaux (10 min).'), bi('Bulk ferment 1 hour. Shape into rounds, final proof 1.5–2 hours.', 'Lever 1 heure. Former des boules, lever 1,5-2 heures.'), bi('Egg wash, pearl sugar, bake at 180°C for 18–20 minutes.', 'Dorure, sucre perlé, cuire à 180°C pendant 18-20 minutes.')] },
      { id: id(24), type: 'quote', text: bi('"Orange-blossom water is potent. Start with what we listed and taste as you go."', '"L\'eau de fleur d\'oranger est puissante. Commencez avec la quantité indiquée et goûtez au fur et à mesure."') },
    ],
  },
  {
    title: 'Macarons', slug: 'macarons', category: 'Pastry',
    coverImage: 'https://images.unsplash.com/photo-1569864358642-9d1684040f43?w=800&h=500&fit=crop',
    sections: [
      { id: id(30), type: 'heading-content', title: bi('Macarons', 'Macarons'), category: bi('Pastry', 'Pâtisserie'), date: 'Makes 30 pairs · 2 hours · Fiddly but doable' },
      { id: id(31), type: 'text', title: bi('The Idea', 'L\'idée'), body: bi('Delicate, chewy almond meringues with a crisp shell. The secret is learning to recognize the right batter consistency — once you see it once, you\'ll see it every time.', 'Meringues aux amandes délicates et moelleuses avec une coque croustillante. Le secret est d\'apprendre à reconnaître la bonne consistance de la pâte.') },
      { id: id(32), type: 'two-column-text', title: bi('Ingredients', 'Ingrédients'), columnLeft: bi('Shells\n100 g ground almonds (sifted twice)\n100 g powdered sugar (sifted)\n100 g egg whites (aged 2–3 days)\n100 g caster sugar\n1 g salt\nVanilla extract\nFood colouring (optional)', 'Coques\n100 g amandes moulues (tamisées 2x)\n100 g sucre glace (tamisé)\n100 g blancs d\'œufs (vieillis 2-3 jours)\n100 g sucre en poudre\n1 g sel\nExtrait de vanille\nColorant (optionnel)'), columnRight: bi('Ganache (dark chocolate)\n100 g dark chocolate (chopped)\n80 ml heavy cream\n10 g butter', 'Ganache (chocolat noir)\n100 g chocolat noir (haché)\n80 ml crème\n10 g beurre') },
      { id: id(33), type: 'steps', steps: [{ label: bi('01', '01'), body: bi('Sift almonds and powdered sugar together twice.', 'Tamiser amandes et sucre glace ensemble deux fois.') }, { label: bi('02', '02'), body: bi('Whip egg whites to stiff glossy peaks with caster sugar.', 'Monter les blancs en neige ferme et brillante avec le sucre.') }, { label: bi('03', '03'), body: bi('Fold in almond mixture — batter should fall in a ribbon from the spatula.', 'Incorporer le mélange d\'amandes — la pâte doit couler en ruban.') }, { label: bi('04', '04'), body: bi('Pipe 3 cm rounds. Rest 20–30 min until dry to touch. Bake at 150°C for 13–15 min.', 'Pocher des ronds de 3 cm. Repos 20-30 min. Cuire à 150°C pendant 13-15 min.') }] },
      { id: id(34), type: 'quote', text: bi('"Aged egg whites are a game-changer. Separate eggs, cover loosely, let them sit 2–3 days."', '"Les blancs d\'œufs vieillis changent tout. Séparez les œufs, couvrez, laissez reposer 2-3 jours."') },
    ],
  },
  {
    title: 'Zucchini Flan', slug: 'zucchini-flan', category: 'Savoury',
    coverImage: 'https://images.unsplash.com/photo-1476718406336-bb5a9690ee2a?w=800&h=500&fit=crop',
    sections: [
      { id: id(40), type: 'heading-content', title: bi('Zucchini Flan', 'Flan aux courgettes'), category: bi('Savoury', 'Salé'), date: 'Serves 6–8 · 1.5 hours · Easy' },
      { id: id(41), type: 'text', title: bi('The Idea', 'L\'idée'), body: bi('This is a ringer. Looks fancy, tastes incredible, technically one of the easiest things you can make. Rich custard, bright zucchini, cheese. Done.', 'C\'est un coup sûr. Ça a l\'air chic, c\'est incroyable, et c\'est techniquement l\'une des choses les plus faciles à faire. Crème riche, courgettes fraîches, fromage. Terminé.') },
      { id: id(42), type: 'text', title: bi('Ingredients', 'Ingrédients'), body: bi('300 g zucchini (grated)\n5 g salt\n200 ml heavy cream\n100 ml whole milk\n3 eggs\n50 g Gruyère (grated)\n20 g Parmesan (grated)\n1 g white pepper\nA pinch of nutmeg\n10 g butter (for the dish)', '300 g courgettes (râpées)\n5 g sel\n200 ml crème\n100 ml lait entier\n3 œufs\n50 g Gruyère (râpé)\n20 g Parmesan (râpé)\n1 g poivre blanc\nUne pincée de muscade\n10 g beurre') },
      { id: id(43), type: 'steps', steps: [{ label: bi('01', '01'), body: bi('Grate zucchini, salt it, squeeze out water. Sauté 3 minutes.', 'Râper les courgettes, saler, essorer. Faire sauter 3 minutes.') }, { label: bi('02', '02'), body: bi('Whisk eggs, cream, milk. Add cheeses, pepper, nutmeg.', 'Fouetter œufs, crème, lait. Ajouter fromages, poivre, muscade.') }, { label: bi('03', '03'), body: bi('Fold in cooled zucchini. Pour into buttered dish.', 'Incorporer les courgettes refroidies. Verser dans le plat beurré.') }, { label: bi('04', '04'), body: bi('Bake in water bath at 160°C for 25–40 min until just set. Chill before serving.', 'Cuire au bain-marie à 160°C pendant 25-40 min. Réfrigérer avant de servir.') }] },
      { id: id(44), type: 'quote', text: bi('"Water removal from the zucchini is everything. Squeeze it hard. Then sauté it. This step is not optional."', '"L\'élimination de l\'eau des courgettes est primordiale. Essorez bien. Puis faites sauter. Cette étape n\'est pas optionnelle."') },
    ],
  },
];

async function seed() {
  for (const r of RECIPES) {
    await db.insert(recipes).values({
      title: r.title,
      slug: r.slug,
      category: r.category,
      coverImage: r.coverImage,
      status: 'published',
      publishedAt: new Date(),
      content: { sections: r.sections },
    }).onConflictDoNothing();
    console.log(`✅ ${r.title}`);
  }
  console.log(`Done — ${RECIPES.length} recipes seeded`);
  process.exit(0);
}
seed();
