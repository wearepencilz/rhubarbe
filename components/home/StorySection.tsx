import * as settingsQueries from '@/lib/db/queries/settings';

export default async function StorySection() {
  const settings = await settingsQueries.getAll().catch(() => ({}));
  const story = (settings as any)?.home?.story || {};

  const text: string = story.text || '<p>This is the story of a lost heritage in a southern village, nestled between the azure sea and the singing cicadas. From Marseille to La Spezia.</p><p>A frozen delight for the long summer days.</p><p>A tribute to a grandmother who loves the sea, the warm sand, and the sweetness of a gelato. It is the story of all those little moments of happiness that belong to each of us, told through frozen flavors with simplicity and honesty.</p><p>To Janine,<br>the cicadas will forever sing your name.</p>';
  const bg: string = story.bg || '#333112';
  const image: string = story.image || '';

  return (
    <section className="relative w-full min-h-[500px] md:h-[804px] overflow-hidden" style={{ backgroundColor: bg }}>
      {image && <img src={image} alt="" className="absolute inset-0 w-full h-full object-cover" />}

      <div
        className="relative z-10 px-6 md:px-[44px] pt-12 md:pt-[66px] pb-12 md:pb-16 max-w-[400px] text-white text-[15px] md:text-[16px] leading-normal [&_p]:mb-4 [&_p:last-child]:mb-0"
        style={{ fontFamily: 'var(--font-neue-montreal)', fontWeight: 400 }}
        dangerouslySetInnerHTML={{ __html: text }}
      />
    </section>
  );
}
