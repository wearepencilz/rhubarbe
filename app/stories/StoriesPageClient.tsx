'use client';

import Link from 'next/link';
import { useT } from '@/lib/i18n/useT';
import { t } from '@/lib/i18n';

export default function StoriesPageClient({ stories }: { stories: any[] }) {
  const { T, locale } = useT();

  const sorted = [...stories].sort(
    (a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime()
  );
  const [hero, ...rest] = sorted;

  const heroTitle = hero ? t(hero, 'title', locale as any) : '';
  const heroIntro = hero ? t(hero, 'intro', locale as any) : '';

  return (
    <main className="bg-white min-h-screen">
      {hero ? (
        <Link href={`/stories/${hero.slug}`} className="block group relative w-full overflow-hidden" style={{ height: 'clamp(480px, 75vh, 860px)' }}>
          {hero.coverImage ? (
            <img
              src={hero.coverImage}
              alt={hero.coverImageAlt || heroTitle}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-1000 ease-out"
            />
          ) : (
            <div className="absolute inset-0 bg-[#333112]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute top-0 left-0 right-0 flex items-start justify-between px-4 md:px-8 pt-20">
            <p className="text-white/60 text-[11px] tracking-[0.22px] uppercase" style={{ fontFamily: 'var(--font-diatype-mono)', fontWeight: 500 }}>
              [{locale === 'fr' ? 'Récits' : 'Stories'}]
            </p>
            {hero.category && (
              <p className="text-white/60 text-[11px] tracking-[0.22px] uppercase" style={{ fontFamily: 'var(--font-diatype-mono)', fontWeight: 500 }}>
                {hero.category.replace(/-/g, ' ')}
              </p>
            )}
          </div>
          <div className="absolute bottom-0 left-0 right-0 px-4 md:px-8 pb-10 md:pb-14">
            {hero.tags?.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-5">
                {hero.tags.slice(0, 4).map((tag: string) => (
                  <span key={tag} className="text-white/60 text-[10px] tracking-[0.2px] uppercase border border-white/25 px-2 py-0.5" style={{ fontFamily: 'var(--font-diatype-mono)' }}>
                    {tag}
                  </span>
                ))}
              </div>
            )}
            <h1 className="text-white text-[clamp(32px,6vw,80px)] leading-[0.95] uppercase tracking-tight max-w-3xl" style={{ fontFamily: 'var(--font-neue-montreal)', fontWeight: 700 }}>
              {heroTitle}
            </h1>
            {heroIntro && (
              <p className="mt-4 text-white/70 text-[15px] md:text-[17px] leading-[1.6] max-w-md" style={{ fontFamily: 'var(--font-neue-montreal)', fontWeight: 400 }}>
                {heroIntro}
              </p>
            )}
            <p className="mt-5 text-white/50 text-[11px] tracking-[0.22px] uppercase" style={{ fontFamily: 'var(--font-diatype-mono)' }}>
              {T.stories.read}
            </p>
          </div>
        </Link>
      ) : (
        <div className="px-4 md:px-8 pt-20 pb-12">
          <p className="text-[#333112] text-[13px] tracking-[0.26px] uppercase" style={{ fontFamily: 'var(--font-diatype-mono)', fontWeight: 500 }}>
            [{locale === 'fr' ? 'Récits' : 'Stories'}]
          </p>
        </div>
      )}

      <div className="px-4 md:px-8 pt-16 pb-24">
        {sorted.length === 0 ? (
          <p className="text-[#333112]/40 text-[14px]" style={{ fontFamily: 'var(--font-neue-montreal)' }}>
            {T.stories.nothingYet}
          </p>
        ) : rest.length > 0 ? (
          <>
            <div className="flex items-center justify-between mb-10">
              <p className="text-[#333112]/40 text-[11px] tracking-[0.22px] uppercase" style={{ fontFamily: 'var(--font-diatype-mono)', fontWeight: 500 }}>
                {T.stories.moreStories}
              </p>
              <div className="h-px flex-1 bg-[#333112]/10 mx-6" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-16">
              {rest.map((story: any, i: number) => (
                <StoryCard key={story.id} story={story} featured={i === 0 && rest.length > 3} locale={locale} T={T} />
              ))}
            </div>
          </>
        ) : null}
      </div>
    </main>
  );
}

function StoryCard({ story, featured, locale, T }: { story: any; featured?: boolean; locale: string; T: any }) {
  const title = t(story, 'title', locale as any);
  const intro = t(story, 'intro', locale as any);

  return (
    <Link href={`/stories/${story.slug}`} className={`group block ${featured ? 'md:col-span-2' : ''}`}>
      {story.coverImage && (
        <div className="overflow-hidden mb-5">
          <img
            src={story.coverImage}
            alt={story.coverImageAlt || title}
            className={`w-full object-cover group-hover:scale-[1.03] transition-transform duration-700 ${featured ? 'aspect-[16/9]' : 'aspect-[4/3]'}`}
          />
        </div>
      )}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {story.category && (
            <p className="text-[#333112]/40 text-[10px] tracking-[0.2px] uppercase mb-2" style={{ fontFamily: 'var(--font-diatype-mono)', fontWeight: 500 }}>
              {story.category.replace(/-/g, ' ')}
            </p>
          )}
          <h2 className={`text-[#333112] leading-[1.05] uppercase mb-3 ${featured ? 'text-[28px] md:text-[36px]' : 'text-[20px] md:text-[22px]'}`} style={{ fontFamily: 'var(--font-neue-montreal)', fontWeight: 700 }}>
            {title}
          </h2>
          {intro && (
            <p className="text-[#333112]/55 text-[14px] leading-[1.65] line-clamp-2" style={{ fontFamily: 'var(--font-neue-montreal)', fontWeight: 400 }}>
              {intro}
            </p>
          )}
        </div>
      </div>
      {story.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-4">
          {story.tags.slice(0, 3).map((tag: string) => (
            <span key={tag} className="text-[#333112]/40 text-[10px] tracking-[0.2px] uppercase border border-[#333112]/15 px-2 py-0.5" style={{ fontFamily: 'var(--font-diatype-mono)' }}>
              {tag}
            </span>
          ))}
        </div>
      )}
      {story.wordBy && (
        <p className="mt-3 text-[#333112]/30 text-[10px] tracking-[0.2px] uppercase" style={{ fontFamily: 'var(--font-diatype-mono)' }}>
          {T.stories.wordBy(story.wordBy)}
        </p>
      )}
    </Link>
  );
}
