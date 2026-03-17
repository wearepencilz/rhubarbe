import Link from 'next/link';

interface DashboardCard {
  title: string;
  description: string;
  href: string;
  icon: string;
}

interface DashboardGroup {
  label: string;
  cards: DashboardCard[];
}

const groups: DashboardGroup[] = [
  {
    label: 'Commerce',
    cards: [
      { title: 'Launches', description: 'Create and manage product launches', href: '/admin/launches', icon: '🚀' },
      { title: 'Products', description: 'Generated products linked to Shopify', href: '/admin/products', icon: '🎁' },
    ],
  },
  {
    label: 'Archive',
    cards: [
      { title: 'Flavours', description: 'Flavour archive and recipe management', href: '/admin/flavours', icon: '🍦' },
      { title: 'Batches', description: 'Test kitchen batch tracking', href: '/admin/batches', icon: '🧪' },
      { title: 'Modifiers', description: 'Toppings, sauces, and add-ons', href: '/admin/modifiers', icon: '✨' },
      { title: 'Ingredients', description: 'Ingredient library with provenance', href: '/admin/ingredients', icon: '🌿' },
    ],
  },
  {
    label: 'Content',
    cards: [
      { title: 'Stories', description: 'Brand stories and editorial features', href: '/admin/stories', icon: '📖' },
      { title: 'News', description: 'Editorial content and updates', href: '/admin/news', icon: '📰' },
      { title: 'Pages', description: 'Static page content management', href: '/admin/pages', icon: '📄' },
      { title: 'Games', description: 'Interactive game experiences', href: '/admin/games', icon: '🎮' },
    ],
  },
  {
    label: 'System',
    cards: [
      { title: 'Users', description: 'Manage admin users and access', href: '/admin/users', icon: '👤' },
      { title: 'Formats', description: 'Product format templates', href: '/admin/formats', icon: '📦' },
      { title: 'Taxonomies', description: 'Tags, types, and classification values', href: '/admin/taxonomies', icon: '🏷️' },
      { title: 'Settings', description: 'Global configuration', href: '/admin/settings', icon: '⚙️' },
    ],
  },
];

export default function AdminDashboard() {
  const visibleGroups = groups.filter((g) => g.cards.length > 0);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Welcome to Janine CMS</p>
      </div>

      {visibleGroups.map((group) => (
        <div key={group.label}>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">{group.label}</p>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {group.cards.map((card) => (
              <Link
                key={card.href}
                href={card.href}
                className="group bg-white rounded-lg border border-gray-200 p-5 hover:border-blue-400 hover:shadow-sm transition-all"
              >
                <div className="text-2xl mb-3">{card.icon}</div>
                <p className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{card.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{card.description}</p>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
