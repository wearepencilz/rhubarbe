import * as settingsQueries from '@/lib/db/queries/settings';

const defaultColumns = [
  {
    text: '<p>For our inspiration our chef kept her habit from the south to go directly to the market to source the best flavours of perfectly ripped season fruits.</p><p>The fruits are the main character in the creation process and we pair the fruit sorbet with a creamy jersey cow milk based gelato infused with spices or native herbs that will marry perfectly and balanced the acidity or the overly sweet power of fruit.</p>',
    image: '',
  },
  {
    text: '<p>Our jersey milk comes from MC dairy, a coop from small farmer that provide a great environment for cow, that spend their summer in pasture for incredible product with ethical animal care value.</p><p>An Ontario-based producer, offers "Naturally Golden Yolks" eggs from free-run hens fed a diet containing marigold petals, which are rich in lutein for eye health.</p>',
    image: '',
  },
  {
    text: '<p>All our supplier are selected for their locality (when season allowed) and that care about the product and the well being of the planet and animal.</p><p>Our main supplier is mediserre, a small Montreal base supplier on the rise created by two chef, Andrew and Olivier that provide the best product from small Canadian producer.</p>',
    image: '',
  },
];

export default async function EditorialColumns() {
  const settings = await settingsQueries.getAll().catch(() => ({}));
  const raw = (settings as any)?.home?.editorial;
  const columns = Array.isArray(raw) && raw.length === 3
    ? raw.map((col: any, i: number) => ({ ...defaultColumns[i], ...col }))
    : defaultColumns;

  return (
    <section className="flex flex-col gap-4 px-4 md:px-[252px] py-12 md:py-16">
      {columns.map((col, i) => (
        <div key={i} className="flex flex-col md:flex-row gap-8 md:gap-16">
          <div className="w-full md:flex-none md:w-[578px] h-[280px] md:h-[702px] overflow-hidden bg-[#dad5bb]">
            {col.image && <img src={col.image} alt="" className="w-full h-full object-cover" />}
          </div>
          <div className="flex items-start md:items-center">
            <div
              className="text-[#333112] text-[14px] leading-[22px] md:w-[399px] [&_p]:mb-4 [&_p:last-child]:mb-0"
              style={{ fontFamily: 'var(--font-neue-montreal)', fontWeight: 400 }}
              dangerouslySetInnerHTML={{ __html: col.text }}
            />
          </div>
        </div>
      ))}
    </section>
  );
}
