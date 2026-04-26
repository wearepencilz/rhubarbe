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
    label: 'Products',
    cards: [
      { title: 'Products', description: 'Products linked to Shopify', href: '/admin/products', icon: '🎁' },
    ],
  },
  {
    label: 'Ordering',
    cards: [
      { title: 'Menus', description: 'Weekly preorder menus and launches', href: '/admin/menus', icon: '📅' },
      { title: 'Catering', description: 'Catering products and lead times', href: '/admin/volume-products', icon: '📦' },
      { title: 'Cake', description: 'Signature cake products and pricing', href: '/admin/cake-products', icon: '🎂' },
      { title: 'Orders', description: 'Preorders, prep sheets, and pickup lists', href: '/admin/orders', icon: '🧾' },
      { title: 'Pickup Locations', description: 'Physical pickup points', href: '/admin/pickup-locations', icon: '📍' },
    ],
  },
  {
    label: 'Content',
    cards: [
      { title: 'Journal', description: 'Editorial journal entries', href: '/admin/journal', icon: '📖' },
      { title: 'Recipes', description: 'Recipes and culinary content', href: '/admin/recipes', icon: '🍳' },
      { title: 'FAQs', description: 'FAQ topics and questions', href: '/admin/faqs', icon: '❓' },
      { title: 'Pages', description: 'Compose pages with sections', href: '/admin/pages', icon: '📄' },
      { title: 'Requests', description: 'Catering and cake enquiries', href: '/admin/requests', icon: '📬' },
    ],
  },
  {
    label: 'System',
    cards: [
      { title: 'Design', description: 'Typography and design tokens', href: '/admin/design', icon: '🎨' },
      { title: 'Translations', description: 'UI labels per locale', href: '/admin/translations', icon: '🌐' },
      { title: 'Users', description: 'Admin users and access', href: '/admin/users', icon: '👤' },
      { title: 'Taxonomies', description: 'Tags, types, and values', href: '/admin/taxonomies', icon: '🏷️' },
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
        <p className="text-sm text-gray-500 mt-1">Welcome to Rhubarbe CMS</p>
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
