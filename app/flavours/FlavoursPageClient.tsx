'use client';

import { useT } from '@/lib/i18n/useT';
import { t } from '@/lib/i18n';

export default function FlavoursPageClient({
  flavours,
  ingredients,
}: {
  flavours: any[];
  ingredients: any[];
}) {
  const { T, locale } = useT();

  const ingredientMap = Object.fromEntries(ingredients.map((i: any) => [i.id, i]));

  const activeFlavours = flavours
    .filter((f) => f.status !== 'archived')
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <main className="bg-white min-h-screen">
      <div className="px-4 md:px-8 pt-[100px] md:pt-[120px] pb-24">
        <p
          className="text-[#333112] text-[16px] tracking-[0.32px] mb-16"
          style={{ fontFamily: 'var(--font-diatype-mono)', fontWeight: 500 }}
        >
          {T.flavours.title}
        </p>

        {activeFlavours.length > 0 && (
          <section className="mb-20">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-[#333112]/10">
              {activeFlavours.map((flavour: any) => (
                <FlavourCard key={flavour.id} flavour={flavour} ingredientMap={ingredientMap} locale={locale} T={T} />
              ))}
            </div>
          </section>
        )}

        {ingredients.length > 0 && (
          <section>
            <p
              className="text-[#333112] text-[16px] tracking-[0.32px] mb-8 border-b border-[#333112]/10 pb-4"
              style={{ fontFamily: 'var(--font-diatype-mono)', fontWeight: 500 }}
            >
              {T.flavours.ingredients}
            </p>
            <div className="flex flex-col">
              {ingredients
                .filter((i) => i.status !== 'archived')
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((ing: any) => (
                  <div key={ing.id}>
                    <div className="h-px bg-[#333112] opacity-10" />
                    <div className="flex items-start justify-between py-4 gap-4">
                      <div className="flex flex-col gap-1">
                        <p
                          className="text-[#333112] text-[16px] uppercase leading-none"
                          style={{ fontFamily: 'var(--font-neue-montreal)', fontWeight: 600 }}
                        >
                          {t(ing, 'name', locale as any) || ing.name}
                          {ing.latinName && (
                            <span
                              className="ml-3 text-[#333112]/30 text-[12px] normal-case italic"
                              style={{ fontFamily: 'var(--font-neue-montreal)', fontWeight: 400 }}
                            >
                              {ing.latinName}
                            </span>
                          )}
                        </p>
                        {ing.description && (
                          <p
                            className="text-[#333112]/50 text-[13px] leading-[1.4] max-w-lg"
                            style={{ fontFamily: 'var(--font-neue-montreal)', fontWeight: 400 }}
                          >
                            {t(ing, 'description', locale as any)}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        {ing.origin && (
                          <span
                            className="text-[#333112]/40 text-[11px] tracking-[0.22px] uppercase"
                            style={{ fontFamily: 'var(--font-diatype-mono)', fontWeight: 500 }}
                          >
                            {ing.origin}
                          </span>
                        )}
                        {ing.category && (
                          <span
                            className="text-[#333112]/30 text-[11px] tracking-[0.22px] uppercase"
                            style={{ fontFamily: 'var(--font-diatype-mono)', fontWeight: 500 }}
                          >
                            {ing.category}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              <div className="h-px bg-[#333112] opacity-10" />
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

function FlavourCard({
  flavour,
  ingredientMap,
  locale,
  T,
}: {
  flavour: any;
  ingredientMap: Record<string, any>;
  locale: string;
  T: any;
}) {
  const resolvedIngredients = (flavour.ingredients || [])
    .sort((a: any, b: any) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
    .map((i: any) => ingredientMap[i.ingredientId] || { name: i.ingredientId.replace(/-/g, ' ') });

  const description = t(flavour, 'description', locale as any);

  return (
    <div className="bg-white p-6 md:p-8">
      <div className="flex items-center gap-4 mb-5">
        <div className="w-8 h-8 rounded-full shrink-0" style={{ backgroundColor: flavour.colour || '#dad5bb' }} />
        <div>
          <p className="text-[#333112] text-[20px] leading-none uppercase" style={{ fontFamily: 'var(--font-neue-montreal)', fontWeight: 700 }}>
            {t(flavour, 'name', locale as any) || flavour.name}
          </p>
          <p className="text-[#333112]/40 text-[11px] tracking-[0.22px] uppercase mt-1" style={{ fontFamily: 'var(--font-diatype-mono)', fontWeight: 500 }}>
            {[flavour.type, flavour.baseStyle].filter(Boolean).join(' · ')}
          </p>
        </div>
      </div>

      {description && (
        <p className="text-[#333112]/70 text-[14px] leading-[1.6] mb-5" style={{ fontFamily: 'var(--font-neue-montreal)', fontWeight: 400 }}>
          {description}
        </p>
      )}

      {flavour.keyNotes?.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-5">
          {flavour.keyNotes.map((note: string) => (
            <span key={note} className="px-2 py-1 border border-[#333112]/15 text-[#333112]/50 text-[10px] tracking-[0.2px] uppercase" style={{ fontFamily: 'var(--font-diatype-mono)', fontWeight: 500 }}>
              {note}
            </span>
          ))}
        </div>
      )}

      {resolvedIngredients.length > 0 && (
        <div>
          <p className="text-[#333112]/30 text-[10px] tracking-[0.2px] uppercase mb-2" style={{ fontFamily: 'var(--font-diatype-mono)', fontWeight: 500 }}>
            {T.flavours.ingredientsLabel}
          </p>
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            {resolvedIngredients.map((ing: any, idx: number) => (
              <span key={idx} className="text-[#333112] text-[12px] tracking-[0.24px] uppercase" style={{ fontFamily: 'var(--font-diatype-mono)', fontWeight: 500 }}>
                {t(ing, 'name', locale as any) || ing.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
