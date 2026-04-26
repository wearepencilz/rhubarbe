import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { db } from '../lib/db/client';
import { journal } from '../lib/db/schema';

const bi = (en: string, fr: string) => ({ en, fr });
const id = (n: number) => `j-${Date.now()}-${n}`;

const ENTRIES = [
  {
    slug: 'friday-deadline-better-pastry',
    title: bi('Why a Friday Deadline Makes Better Pastry', 'Pourquoi une date limite le vendredi fait de meilleure pâtisserie'),
    category: 'behind-the-scenes',
    tags: ['process', 'ordering', 'quality'],
    coverImage: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&h=500&fit=crop',
    intro: 'A note on why we close orders Friday at noon, and what it means for what shows up on your plate Saturday morning.',
    sections: [
      { id: id(1), type: 'heading-content', title: bi('Why a Friday Deadline Makes Better Pastry', 'Pourquoi une date limite le vendredi fait de meilleure pâtisserie'), category: bi('Behind the Scenes', 'En coulisses'), date: '' },
      { id: id(2), type: 'text', title: bi('', ''), body: bi('There is a moment, around 4 p.m. on Thursday, when our production list crystallizes. The week of orders has built itself, slowly, and now we know what Saturday looks like. Eighteen pavlovas. Twenty-two paris-brests. Six birthday cakes for six different families. The weekly menu is no longer a hypothesis. It\'s a list.\n\nThis is the moment we wait for all week. Because once it exists, everything else becomes simple. The mise en place writes itself. The flour orders are settled. The fridge gets organized around what\'s coming next, not what might come.', 'Il y a un moment, vers 16h le jeudi, où notre liste de production se cristallise. La semaine de commandes s\'est construite, lentement, et maintenant nous savons à quoi ressemble samedi. Dix-huit pavlovas. Vingt-deux paris-brests. Six gâteaux d\'anniversaire pour six familles différentes. Le menu hebdomadaire n\'est plus une hypothèse. C\'est une liste.') },
      { id: id(3), type: 'quote', text: bi('"When you order on Wednesday, you\'re not buying a pavlova off a shelf. You\'re commissioning one. We bake it knowing it has your name on it."', '"Quand vous commandez mercredi, vous n\'achetez pas une pavlova sur une étagère. Vous en commandez une. Nous la cuisinons en sachant qu\'elle porte votre nom."') },
      { id: id(4), type: 'text', title: bi('', ''), body: bi('Working without that list is a different kind of cooking. You\'re forecasting. You\'re guessing. You\'re making a few extra of everything in case someone walks in. And in pastry, that "in case" creates an enormous amount of waste.\n\nThe Friday at noon deadline is not about us. It\'s about you. It\'s about the pavlova being made on Friday afternoon for you, specifically, in the quantity we know we need. It\'s about the cream being whipped fresh, the chantilly being held only as long as chantilly wants to be held.\n\nThe honest answer to "why can\'t I order Saturday morning?" is: because we\'d have to start guessing again. And we\'re not very good at guessing.\n\nWe\'re good at lists.', 'Travailler sans cette liste est un autre type de cuisine. Vous prévoyez. Vous devinez. Vous faites quelques extras de tout au cas où quelqu\'un passerait.\n\nLa date limite du vendredi midi n\'est pas pour nous. C\'est pour vous. C\'est pour que la pavlova soit faite vendredi après-midi pour vous, spécifiquement.\n\nLa réponse honnête à « pourquoi je ne peux pas commander samedi matin ? » est : parce qu\'il faudrait recommencer à deviner. Et nous ne sommes pas très bons pour deviner.\n\nNous sommes bons avec les listes.') },
    ],
  },
  {
    slug: 'case-against-freezing',
    title: bi('The Case Against Freezing', 'Le plaidoyer contre la congélation'),
    category: 'process',
    tags: ['quality', 'process', 'croissant'],
    coverImage: 'https://images.unsplash.com/photo-1555507036-ab1f4038024a?w=800&h=500&fit=crop',
    intro: 'Why we bake fresh every week, and what actually happens when butter pastries are frozen and thawed.',
    sections: [
      { id: id(10), type: 'heading-content', title: bi('The Case Against Freezing', 'Le plaidoyer contre la congélation'), category: bi('Process', 'Processus'), date: '' },
      { id: id(11), type: 'text', title: bi('', ''), body: bi('A croissant, properly made, is mostly water and air held in a structure of butter and gluten. The lamination gives it everything: the crackle, the pull, the way the inside seems to vanish on the tongue. That structure is fragile.\n\nFreezing it changes the math.\n\nWater in the dough crystallizes. The crystals puncture cell walls in the gluten network. When the croissant thaws, that water escapes. The butter has separated slightly. It\'s no longer in clean sheets.', 'Un croissant, bien fait, est principalement de l\'eau et de l\'air maintenus dans une structure de beurre et de gluten. Le feuilletage lui donne tout : le craquant, l\'étirement, la façon dont l\'intérieur semble fondre sur la langue.\n\nLa congélation change l\'équation.\n\nL\'eau dans la pâte cristallise. Les cristaux percent les parois cellulaires du réseau de gluten. Quand le croissant décongèle, cette eau s\'échappe. Le beurre s\'est légèrement séparé.') },
      { id: id(12), type: 'quote', text: bi('"A croissant baked Saturday morning has a specific shimmer when you tear it open. The interior is glossy with steam. A croissant frozen and thawed has none of these qualities."', '"Un croissant cuit samedi matin a un éclat particulier quand on le déchire. L\'intérieur est brillant de vapeur. Un croissant congelé et décongelé n\'a aucune de ces qualités."') },
      { id: id(13), type: 'text', title: bi('', ''), body: bi('This is why we don\'t freeze. Not because we\'re purists, but because freezing is a one-way trade: convenience for our side, quality for yours. We\'d rather take the operational hit and do it the right way.\n\nIt also means our menu changes. Last week\'s production was different from this week\'s. Some of that is seasonal. Some of it is whim. The result is a menu that\'s slightly different every time, which some people find difficult and which we find essential.\n\nBuy from somewhere that freezes and you\'ll have predictability. Buy from us and you\'ll have a moving target. Both are legitimate. We\'ve just made our choice clear.', 'C\'est pourquoi nous ne congelons pas. Pas parce que nous sommes puristes, mais parce que la congélation est un échange à sens unique : commodité pour nous, qualité pour vous.\n\nCela signifie aussi que notre menu change. La production de la semaine dernière était différente de celle de cette semaine. Le résultat est un menu légèrement différent à chaque fois.\n\nAchetez ailleurs et vous aurez de la prévisibilité. Achetez chez nous et vous aurez une cible mouvante. Les deux sont légitimes.') },
    ],
  },
  {
    slug: 'easter-dinner-twenty-times',
    title: bi('What We Learned Cooking Easter Dinner Twenty Times', 'Ce que nous avons appris en cuisinant le dîner de Pâques vingt fois'),
    category: 'behind-the-scenes',
    tags: ['catering', 'easter', 'lessons'],
    coverImage: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=500&fit=crop',
    intro: 'The first time we built a complete dinner for pickup, we did it twenty times in three days.',
    sections: [
      { id: id(20), type: 'heading-content', title: bi('What We Learned Cooking Easter Dinner Twenty Times', 'Ce que nous avons appris en cuisinant le dîner de Pâques vingt fois'), category: bi('Behind the Scenes', 'En coulisses'), date: '' },
      { id: id(21), type: 'text', title: bi('', ''), body: bi('The Easter dinner was an experiment. One menu, designed as a single meal: salmon with cucumber scales, lamb with persillade and guanciale, zucchini flan with Louis D\'or crumble, paris-brest, macarons. Twenty households ordered it.\n\nThe first thing we learned was that catering is not cooking with bigger pots.', 'Le dîner de Pâques était une expérience. Un menu, conçu comme un repas complet : saumon aux écailles de concombre, agneau à la persillade et guanciale, flan aux courgettes avec crumble Louis D\'or, paris-brest, macarons. Vingt ménages l\'ont commandé.\n\nLa première chose que nous avons apprise : le traiteur n\'est pas de la cuisine avec de plus gros chaudrons.') },
      { id: id(22), type: 'steps', steps: [{ label: bi('01', '01'), body: bi('The lamb wanted to come out slightly underdone. Residual heat in a sealed container would carry it the rest of the way.', 'L\'agneau devait sortir légèrement sous-cuit. La chaleur résiduelle dans un contenant scellé ferait le reste.') }, { label: bi('02', '02'), body: bi('The cucumber scales held their shape through transit if we layered them with parchment.', 'Les écailles de concombre gardaient leur forme pendant le transport si on les séparait avec du papier parchemin.') }, { label: bi('03', '03'), body: bi('The flan needed to be fully cooled and refrigerated. Warm in the container meant condensation pooling on the lid.', 'Le flan devait être complètement refroidi et réfrigéré. Chaud dans le contenant signifiait de la condensation sur le couvercle.') }] },
      { id: id(23), type: 'quote', text: bi('"Designing a meal for someone else\'s table is a different discipline. You\'re cooking, but you\'re also engineering."', '"Concevoir un repas pour la table de quelqu\'un d\'autre est une discipline différente. Vous cuisinez, mais vous faites aussi de l\'ingénierie."') },
    ],
  },
  {
    slug: 'how-much-to-bake',
    title: bi('On Knowing How Much to Bake', 'Savoir combien cuire'),
    category: 'philosophy',
    tags: ['waste', 'production', 'philosophy'],
    coverImage: 'https://images.unsplash.com/photo-1486427944544-d2c246c4df4e?w=800&h=500&fit=crop',
    intro: 'A short note on production, waste, and the difference between baking for people and baking for inventory.',
    sections: [
      { id: id(30), type: 'heading-content', title: bi('On Knowing How Much to Bake', 'Savoir combien cuire'), category: bi('Philosophy', 'Philosophie'), date: '' },
      { id: id(31), type: 'text', title: bi('', ''), body: bi('We made three extra loaves of sourdough last week. There was a gap in the production schedule and it seemed prudent to fill it.\n\nBy Wednesday, two of the three were still on the rack. They were perfect — the same loaves we\'d sold seven of on Saturday — but they hadn\'t found anyone. We turned them into croutons.\n\nThe instinct to bake "just a few extra" feels like generosity. In practice, it\'s a hedge. It\'s the bakery telling itself a story about a customer who might walk in.', 'Nous avons fait trois pains au levain de plus la semaine dernière. Il y avait un trou dans le calendrier de production et il semblait prudent de le combler.\n\nMercredi, deux des trois étaient encore sur le présentoir. Ils étaient parfaits — les mêmes pains dont nous en avions vendu sept samedi — mais ils n\'avaient trouvé personne. Nous les avons transformés en croûtons.') },
      { id: id(32), type: 'quote', text: bi('"There\'s a tendency to confuse abundance with quality. A full case looks better than an empty one. But what you\'re watching is a business that doesn\'t trust its own forecast."', '"Il y a une tendance à confondre abondance et qualité. Un présentoir plein a meilleure allure qu\'un vide. Mais ce que vous voyez, c\'est une entreprise qui ne fait pas confiance à ses propres prévisions."') },
      { id: id(33), type: 'text', title: bi('', ''), body: bi('We\'d rather be honest about our scale. We\'re a small team baking small batches. The thing we make well is what we make. When it\'s gone, it\'s gone.\n\nThe three extra loaves taught us that lesson again. We needed the reminder.', 'Nous préférons être honnêtes sur notre échelle. Nous sommes une petite équipe qui cuit en petits lots. Ce que nous faisons bien, c\'est ce que nous faisons. Quand c\'est parti, c\'est parti.\n\nLes trois pains de plus nous ont rappelé cette leçon. Nous en avions besoin.') },
    ],
  },
  {
    slug: 'notes-on-the-terrazzo',
    title: bi('Notes on the Terrazzo', 'Notes sur le Terrazzo'),
    category: 'signature-cake',
    tags: ['terrazzo', 'signature', 'process'],
    coverImage: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&h=500&fit=crop',
    intro: 'The Terrazzo has been on our menu for three years. We\'ve never made it the same way twice.',
    sections: [
      { id: id(40), type: 'heading-content', title: bi('Notes on the Terrazzo', 'Notes sur le Terrazzo'), category: bi('Signature Cake', 'Gâteau signature'), date: '' },
      { id: id(41), type: 'text', title: bi('', ''), body: bi('The Terrazzo is built in four layers: almond génoise, mascarpone cream, candied citrus, dark chocolate. The top is scattered with honeycomb, pistachios, and fleur de sel. It\'s served at room temperature, cut into uneven slices.\n\nThe structure is fixed. The execution is not.', 'Le Terrazzo est construit en quatre couches : génoise aux amandes, crème mascarpone, agrumes confits, chocolat noir. Le dessus est parsemé de nid d\'abeilles, pistaches et fleur de sel. Il est servi à température ambiante, coupé en tranches irrégulières.\n\nLa structure est fixe. L\'exécution ne l\'est pas.') },
      { id: id(42), type: 'text', title: bi('', ''), body: bi('Some weeks the citrus dominates: bright, tart. Other weeks we pull back, let the mascarpone breathe. The honeycomb might be brittle and shatter when you cut it; in humid weather, it softens into something more chewy. Both are good. They\'re different cakes that happen to share a name.\n\nWe tried to nail down the recipe, write specifications for the citrus, calibrate the honeycomb to a target moisture content. It didn\'t work.', 'Certaines semaines, les agrumes dominent : vifs, acidulés. D\'autres semaines, nous reculons, laissons le mascarpone respirer. Le nid d\'abeilles peut être cassant et se briser quand on le coupe ; par temps humide, il ramollit en quelque chose de plus moelleux. Les deux sont bons. Ce sont des gâteaux différents qui partagent un nom.') },
      { id: id(43), type: 'quote', text: bi('"What stays consistent is the idea. A cake that celebrates imperfection. Layers that don\'t line up. Edges that aren\'t clean. This is what we mean by imparfaitement beau."', '"Ce qui reste constant, c\'est l\'idée. Un gâteau qui célèbre l\'imperfection. Des couches qui ne s\'alignent pas. Des bords qui ne sont pas nets. C\'est ce que nous entendons par imparfaitement beau."') },
      { id: id(44), type: 'text', title: bi('', ''), body: bi('If you\'ve had the Terrazzo before, the next one will be different. Probably better. Probably worse, by some measures. Definitely more interesting.\n\nThat\'s the deal.', 'Si vous avez déjà goûté le Terrazzo, le prochain sera différent. Probablement meilleur. Probablement pire, selon certains critères. Définitivement plus intéressant.\n\nC\'est le marché.') },
    ],
  },
];

async function seed() {
  for (const e of ENTRIES) {
    await db.insert(journal).values({
      slug: e.slug,
      title: e.title,
      category: e.category,
      tags: e.tags,
      coverImage: e.coverImage,
      status: 'published',
      publishedAt: new Date(),
      content: { intro: e.intro, sections: e.sections },
    }).onConflictDoNothing();
    console.log(`✅ ${e.title.en}`);
  }
  console.log(`Done — ${ENTRIES.length} journal entries seeded`);
  process.exit(0);
}
seed();
