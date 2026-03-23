import Link from 'next/link';

const PAGES = [
  {
    key: 'home',
    label: 'Home',
    description: 'About section and homepage content',
    href: '/admin/pages/home',
  },
  {
    key: 'about',
    label: 'About',
    description: 'The /about page — story, team, address',
    href: '/admin/pages/about',
  },
  {
    key: 'come-see-us',
    label: 'Come See Us',
    description: 'The /visit page — hours, address, photo',
    href: '/admin/pages/come-see-us',
  },
  {
    key: 'traiteur',
    label: 'Traiteur / Catering',
    description: 'The /traiteur page — heading, intro, form labels (FR & EN)',
    href: '/admin/pages/traiteur',
  },
  {
    key: 'gateaux',
    label: 'Gâteaux signatures / Signature Cakes',
    description: 'The /gateaux-signatures page — heading, intro, form labels (FR & EN)',
    href: '/admin/pages/gateaux',
  },
  {
    key: 'thank-you',
    label: 'Thank You / Merci',
    description: 'Post-checkout confirmation — heading, message, pickup reminder (FR & EN)',
    href: '/admin/pages/thank-you',
  },
];

export default function PagesIndex() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-gray-900">Pages</h1>
        <p className="text-gray-600 mt-1">Manage content for each page of the site</p>
      </div>

      <div className="space-y-3 max-w-2xl">
        {PAGES.map((page) => (
          <Link
            key={page.key}
            href={page.href}
            className="flex items-center justify-between bg-white rounded-lg border border-gray-200 px-5 py-4 hover:border-gray-300 hover:shadow-sm transition-all group"
          >
            <div>
              <p className="text-sm font-medium text-gray-900">{page.label}</p>
              <p className="text-sm text-gray-500 mt-0.5">{page.description}</p>
            </div>
            <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        ))}
      </div>
    </div>
  );
}
