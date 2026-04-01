'use client';

function Bone({ className }: { className?: string }) {
  return <div className={`bg-gray-200 rounded animate-pulse ${className || ''}`} />;
}

/** Skeleton for product card grids (regular orders, cakes) */
export function ProductGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="border border-gray-200 rounded-lg p-2">
          <Bone className="w-full aspect-[4/5] rounded-md mb-3" />
          <Bone className="h-3 w-3/4 mb-2" />
          <Bone className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}

/** Skeleton for catering-style stacked cards */
export function CateringCardSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="border border-gray-200 rounded-lg p-3 md:flex md:gap-4">
          <div className="flex gap-3 md:w-1/3 md:shrink-0">
            <Bone className="w-[96px] h-[120px] shrink-0 rounded-md" />
            <div className="flex-1 space-y-2 py-1">
              <Bone className="h-3 w-3/4" />
              <Bone className="h-3 w-full" />
              <Bone className="h-2 w-1/2" />
            </div>
          </div>
          <div className="mt-3 md:mt-0 md:flex-1 space-y-2 md:py-1">
            <Bone className="h-7 w-full" />
            <Bone className="h-7 w-full" />
            <Bone className="h-7 w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Skeleton for the sidebar cart */
export function CartSidebarSkeleton() {
  return (
    <div className="bg-white border border-gray-200 rounded-lg sticky top-20 p-5 space-y-4">
      <Bone className="h-3 w-24" />
      <Bone className="h-16 w-full rounded" />
      <Bone className="h-10 w-full rounded" />
      <Bone className="h-10 w-full rounded" />
    </div>
  );
}

/** Full page skeleton with title + grid + sidebar */
export function OrderPageSkeleton({ variant = 'grid' }: { variant?: 'grid' | 'catering' }) {
  return (
    <main className="pt-20 pb-24 px-4 md:px-8 max-w-[1600px] mx-auto">
      <div className="flex gap-8">
        <div className="flex-1 min-w-0">
          <Bone className="h-6 w-48 mb-2" />
          <Bone className="h-4 w-72 mb-10" />
          {variant === 'catering' ? <CateringCardSkeleton /> : <ProductGridSkeleton />}
        </div>
        <div className="hidden lg:block w-80 shrink-0">
          <CartSidebarSkeleton />
        </div>
      </div>
    </main>
  );
}
