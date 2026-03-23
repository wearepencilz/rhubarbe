import { notFound } from 'next/navigation';
import Link from 'next/link';
import SiteFooter from '@/components/home/SiteFooter';
import * as storiesQuery from '@/lib/db/queries/stories';
import type { StoryBlock } from '@/app/admin/components/StoryBlockBuilder';

async function getStory(slug: string) {
  try {
    return await storiesQuery.getByIdOrSlug(slug);
  } catch {
    return null;
  }
}

async function getRelatedStories(currentId: string, tags: string[]) {
  try {
    const all = (await storiesQuery.list()) as any[];
    return all
      .filter((s) => s.id !== currentId && s.status === 'published')
      .filter((s) => (s.tags as string[] | null)?.some((t: string) => tags.includes(t)))
      .slice(0, 3);
  } catch {
    return [];
  }
}

function renderBlock(block: StoryBlock) {
  switch (block.type) {
    case 'text':
      return (
        <div
          key={block.id}
          className="prose prose-lg max-w-none text-[#333112]/85 leading-[1.85] [&_p]:mb-5 [&_p:last-child]:mb-0 [&_strong]:text-[#333112] [&_strong]:font-semibold"
          style={{ fontFamily: 'var(--font-neue-montreal)', fontSize: '17px' }}
          dangerouslySetInnerHTML={{ __html: block.content || '' }}
        />
      );

    case 'image': {
      const img = block.images?.[0];
      if (!img?.url) return null;
      const isFullBleed = block.layout === 'full-bleed';
      return (
        <figure key={block.id} className={isFullBleed ? '-mx-4 md:-mx-[calc((100vw-672px)/2+32px)]' : ''}>
          <img
            src={img.url}
            alt={img.alt || ''}
            className={`w-full object-cover ${isFullBleed ? 'aspect-[16/7]' : 'aspect-[3/2]'}`}
          />
          {img.caption && (
            <figcaption
              className="mt-3 text-[#333112]/35 text-[11px] tracking-[0.22px]"
              style={{ fontFamily: 'var(--font-diatype-mono)' }}
            >
              {img.caption}
            </figcaption>
          )}
        </figure>
      );
    }

    case 'image-grid': {
      const cols = block.layout === '3-col' ? 'grid-cols-3' : 'grid-cols-2';
      return (
        <div key={block.id} className={`grid ${cols} gap-2 md:gap-3`}>
          {(block.images || []).filter((img) => img.url).map((img, j) => (
            <figure key={j}>
              <img src={img.url} alt={img.alt || ''} className="w-full aspect-square object-cover" />
              {img.caption && (
                <figcaption
                  className="mt-1.5 text-[#333112]/35 text-[10px] tracking-[0.2px]"
                  style={{ fontFamily: 'var(--font-diatype-mono)' }}
                >
                  {img.caption}
                </figcaption>
              )}
            </figure>
          ))}
        </div>
      );
    }

    case 'video': {
      if (!block.videoUrl) return null;
      let embedUrl = block.videoUrl;
      if (embedUrl.includes('youtube.com/watch')) {
        const id = new URL(embedUrl).searchParams.get('v');
        embedUrl = `https://www.youtube.com/embed/${id}`;
      } else if (embedUrl.includes('youtu.be/')) {
        embedUrl = `https://www.youtube.com/embed/${embedUrl.split('youtu.be/')[1]}`;
      } else if (embedUrl.includes('vimeo.com/')) {
        embedUrl = `https://player.vimeo.com/video/${embedUrl.split('vimeo.com/')[1]}`;
      }
      return (
        <figure key={block.id}>
          <div className="aspect-video w-full overflow-hidden">
            <iframe src={embedUrl} className="w-full h-full" allowFullScreen title="Video" />
          </div>
          {block.videoCaption && (
            <figcaption
              className="mt-3 text-[#333112]/35 text-[11px] tracking-[0.22px]"
              style={{ fontFamily: 'var(--font-diatype-mono)' }}
            >
              {block.videoCaption}
            </figcaption>
          )}
        </figure>
      );
    }

    case 'quote':
      return (
        <blockquote key={block.id} className="py-6 md:py-8">
          <p
            className="text-[#333112] text-[clamp(22px,3.5vw,34px)] leading-[1.25] italic"
            style={{ fontFamily: 'var(--font-neue-montreal)', fontWeight: 400 }}
          >
            &ldquo;{block.quote}&rdquo;
          </p>
          {block.attribution && (
            <cite
              className="block mt-4 text-[#333112]/40 text-[11px] tracking-[0.22px] not-italic uppercase"
              style={{ fontFamily: 'var(--font-diatype-mono)' }}
            >
              — {block.attribution}
            </cite>
          )}
        </blockquote>
      );

    case 'ingredient-focus':
      return (
        <div key={block.id} className="border-t border-b border-[#333112]/12 py-8 my-2">
          <p
            className="text-[#333112]/35 text-[10px] tracking-[0.2px] uppercase mb-4"
            style={{ fontFamily: 'var(--font-diatype-mono)' }}
          >
            Ingredient focus
          </p>
          <p
            className="text-[#333112] text-[clamp(28px,4vw,44px)] leading-[1.0] uppercase mb-6"
            style={{ fontFamily: 'var(--font-neue-montreal)', fontWeight: 700 }}
          >
            {block.ingredient}
          </p>
          <div className="grid grid-cols-2 gap-x-8 gap-y-4 mb-5">
            {block.origin && (
              <div>
                <p className="text-[#333112]/35 text-[10px] uppercase tracking-[0.2px] mb-1" style={{ fontFamily: 'var(--font-diatype-mono)' }}>Origin</p>
                <p className="text-[#333112] text-[15px]" style={{ fontFamily: 'var(--font-neue-montreal)' }}>{block.origin}</p>
              </div>
            )}
            {block.season && (
              <div>
                <p className="text-[#333112]/35 text-[10px] uppercase tracking-[0.2px] mb-1" style={{ fontFamily: 'var(--font-diatype-mono)' }}>Season</p>
                <p className="text-[#333112] text-[15px]" style={{ fontFamily: 'var(--font-neue-montreal)' }}>{block.season}</p>
              </div>
            )}
          </div>
          {block.why && (
            <p
              className="text-[#333112]/65 text-[15px] leading-[1.75]"
              style={{ fontFamily: 'var(--font-neue-montreal)' }}
            >
              {block.why}
            </p>
          )}
        </div>
      );

    case 'word-by':
      return (
        <div key={block.id} className="flex items-center gap-4 py-2">
          <div className="h-px flex-1 bg-[#333112]/10" />
          <p
            className="text-[#333112]/40 text-[10px] tracking-[0.2px] uppercase whitespace-nowrap"
            style={{ fontFamily: 'var(--font-diatype-mono)' }}
          >
            Word by {block.author}{block.role ? `, ${block.role}` : ''}
          </p>
          <div className="h-px flex-1 bg-[#333112]/10" />
        </div>
      );

    case 'divider':
      return <div key={block.id} className="h-px bg-[#333112]/10" />;

    default:
      return null;
  }
}

export default async function StoryPage({ params }: { params: { slug: string } }) {
  const story = await getStory(params.slug);
  if (!story || story.status !== 'published') notFound();

  const title = (story.title as any)?.fr || (story.title as any)?.en || '';
  const tags = story.tags ?? [];
  const related = await getRelatedStories(story.id, tags);

  return (
    <main className="bg-white min-h-screen">

      {/* Full-bleed cover */}
      <div className="relative w-full overflow-hidden" style={{ height: 'clamp(520px, 80vh, 920px)' }}>
        {story.coverImage ? (
          <img
            src={story.coverImage}
            alt={title}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-[#333112]" />
        )}

        {/* Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-black/10" />

        {/* Breadcrumb */}
        <div className="absolute top-0 left-0 right-0 px-4 md:px-8 pt-[100px] md:pt-[120px]">
          <div className="flex items-center gap-2">
            <Link
              href="/stories"
              className="text-white/50 text-[11px] tracking-[0.22px] uppercase hover:text-white/80 transition-colors"
              style={{ fontFamily: 'var(--font-diatype-mono)' }}
            >
              Stories
            </Link>
            {story.category && (
              <>
                <span className="text-white/25 text-[11px]">/</span>
                <span
                  className="text-white/50 text-[11px] tracking-[0.22px] uppercase"
                  style={{ fontFamily: 'var(--font-diatype-mono)' }}
                >
                  {story.category.replace(/-/g, ' ')}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Title block */}
        <div className="absolute bottom-0 left-0 right-0 px-4 md:px-8 pb-12 md:pb-16 max-w-5xl">
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-5">
              {tags.map((tag: string) => (
                <span
                  key={tag}
                  className="text-white/55 text-[10px] tracking-[0.2px] uppercase border border-white/20 px-2 py-0.5"
                  style={{ fontFamily: 'var(--font-diatype-mono)' }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
          <h1
            className="text-white text-[clamp(36px,6.5vw,88px)] leading-[0.95] uppercase tracking-tight"
            style={{ fontFamily: 'var(--font-neue-montreal)', fontWeight: 700 }}
          >
            {title}
          </h1>
        </div>
      </div>

      {/* Article body */}
      <div className="px-4 md:px-8 max-w-[672px] mx-auto pt-14 pb-24">

        {/* Intro + meta */}
        {story.intro && (
          <p
            className="text-[#333112] text-[19px] md:text-[21px] leading-[1.6] mb-8"
            style={{ fontFamily: 'var(--font-neue-montreal)', fontWeight: 400 }}
          >
            {story.intro}
          </p>
        )}

        {story.wordBy && (
          <div className="flex items-center gap-4 mb-12 pb-10 border-b border-[#333112]/10">
            <div className="h-px flex-1 bg-[#333112]/10" />
            <p
              className="text-[#333112]/40 text-[10px] tracking-[0.2px] uppercase whitespace-nowrap"
              style={{ fontFamily: 'var(--font-diatype-mono)' }}
            >
              Word by {story.wordBy}{story.wordByRole ? `, ${story.wordByRole}` : ''}
            </p>
            <div className="h-px flex-1 bg-[#333112]/10" />
          </div>
        )}

        {/* Content blocks */}
        <div className="space-y-10">
          {(story.blocks || []).map((block: StoryBlock) => renderBlock(block))}
        </div>

        {/* Tags footer */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-16 pt-8 border-t border-[#333112]/10">
            <p
              className="text-[#333112]/30 text-[10px] tracking-[0.2px] uppercase mr-2 self-center"
              style={{ fontFamily: 'var(--font-diatype-mono)' }}
            >
              Tagged
            </p>
            {tags.map((tag: string) => (
              <span
                key={tag}
                className="text-[#333112]/50 text-[10px] tracking-[0.2px] uppercase border border-[#333112]/20 px-2 py-0.5"
                style={{ fontFamily: 'var(--font-diatype-mono)' }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Share */}
        <div className="mt-10 pt-8 border-t border-[#333112]/10 flex items-center gap-6">
          <p
            className="text-[#333112]/30 text-[10px] tracking-[0.2px] uppercase"
            style={{ fontFamily: 'var(--font-diatype-mono)' }}
          >
            Share
          </p>
          <a
            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/stories/${story.slug}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#333112]/40 text-[10px] tracking-[0.2px] uppercase hover:text-[#333112] transition-colors"
            style={{ fontFamily: 'var(--font-diatype-mono)' }}
          >
            X / Twitter
          </a>
          <a
            href="https://www.instagram.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#333112]/40 text-[10px] tracking-[0.2px] uppercase hover:text-[#333112] transition-colors"
            style={{ fontFamily: 'var(--font-diatype-mono)' }}
          >
            Instagram
          </a>
        </div>
      </div>

      {/* Related stories */}
      {related.length > 0 && (
        <section className="border-t border-[#333112]/10 px-4 md:px-8 py-16 md:py-20">
          <div className="flex items-center gap-6 mb-12">
            <p
              className="text-[#333112]/40 text-[11px] tracking-[0.22px] uppercase whitespace-nowrap"
              style={{ fontFamily: 'var(--font-diatype-mono)' }}
            >
              Related stories
            </p>
            <div className="h-px flex-1 bg-[#333112]/10" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-12">
            {related.map((s: any) => (
              <Link key={s.id} href={`/stories/${s.slug}`} className="group block">
                {s.coverImage && (
                  <div className="overflow-hidden mb-4">
                    <img
                      src={s.coverImage}
                      alt={s.title?.fr || s.title?.en || ''}
                      className="w-full aspect-[4/3] object-cover group-hover:scale-[1.03] transition-transform duration-700"
                    />
                  </div>
                )}
                {s.category && (
                  <p
                    className="text-[#333112]/35 text-[10px] tracking-[0.2px] uppercase mb-2"
                    style={{ fontFamily: 'var(--font-diatype-mono)' }}
                  >
                    {s.category.replace(/-/g, ' ')}
                  </p>
                )}
                <h3
                  className="text-[#333112] text-[18px] md:text-[20px] leading-[1.05] uppercase mb-2"
                  style={{ fontFamily: 'var(--font-neue-montreal)', fontWeight: 700 }}
                >
                  {s.title?.fr || s.title?.en || ''}
                </h3>
                {s.intro && (
                  <p
                    className="text-[#333112]/55 text-[13px] leading-[1.65] line-clamp-2"
                    style={{ fontFamily: 'var(--font-neue-montreal)' }}
                  >
                    {s.intro}
                  </p>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

    </main>
  );
}
