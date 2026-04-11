'use client';

function Bone({ className }: { className?: string }) {
  return <div className={`animate-pulse ${className || ''}`} style={{ backgroundColor: 'rgba(26,56,33,0.08)' }} />;
}

/** Skeleton for product card grids (regular orders) */
export function ProductGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-x-3 gap-y-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}>
          <Bone className="w-full aspect-[4/5] mb-2.5" />
          <Bone className="h-4 w-3/4 mb-1.5" />
          <Bone className="h-4 w-1/3" />
        </div>
      ))}
    </div>
  );
}

/** Skeleton for catering page — type headings + card grids */
export function CateringCardSkeleton() {
  return (
    <div className="space-y-12">
      {[8, 6, 10].map((count, gi) => (
        <div key={gi}>
          <Bone className="h-10 w-48 mb-4" />
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5">
            {Array.from({ length: count }).map((_, i) => (
              <div key={i}>
                <Bone className="w-full aspect-[4/5] mb-2.5" />
                <Bone className="h-4 w-3/4 mb-1" />
                <Bone className="h-4 w-1/3" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/** Full page skeleton — no sidebar */
export function OrderPageSkeleton({ variant = 'grid' }: { variant?: 'grid' | 'catering' }) {
  return (
    <main className="pt-20 pb-24 px-4 md:px-8 max-w-[1600px] mx-auto">
      <Bone className="h-12 w-64 mb-8" />
      {variant === 'catering' ? <CateringCardSkeleton /> : <ProductGridSkeleton />}
    </main>
  );
}
