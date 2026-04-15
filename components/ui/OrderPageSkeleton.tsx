// Pure rendering — no client interactivity needed

function Bone({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <div className={`animate-pulse ${className || ''}`} style={{ backgroundColor: 'rgba(26,56,33,0.08)', ...style }} />;
}

/** Skeleton for product card grids (regular orders + cakes) */
export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <>
      <Bone className="h-12 w-56 mb-8" style={{ marginTop: 180 }} />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-x-3 gap-y-6">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i}>
            <Bone className="w-full aspect-[4/5] mb-2.5" />
            <Bone className="h-4 w-3/4 mb-1.5" />
            <Bone className="h-4 w-1/3" />
          </div>
        ))}
      </div>
    </>
  );
}

/** Skeleton for catering page — type headings + card grids */
export function CateringCardSkeleton() {
  return (
    <>
      <div className="flex gap-8" style={{ paddingTop: 180, marginBottom: 32 }}>
        {['w-24', 'w-20', 'w-28'].map((w, i) => (
          <Bone key={i} className={`h-12 ${w}`} />
        ))}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-x-3 gap-y-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i}>
            <Bone className="w-full aspect-[4/5] mb-2.5" />
            <Bone className="h-4 w-3/4 mb-1" />
            <Bone className="h-4 w-1/3" />
          </div>
        ))}
      </div>
    </>
  );
}

/** Full page skeleton wrapper */
export function OrderPageSkeleton({ variant = 'grid' }: { variant?: 'grid' | 'catering' }) {
  return (
    <main className="pt-20 pb-24 px-4 md:px-8 max-w-[1600px] mx-auto">
      {variant === 'catering' ? <CateringCardSkeleton /> : <ProductGridSkeleton />}
    </main>
  );
}
