export interface CateringMenuProduct {
  id: string;
  name: string;
  cateringType: string;
  dietaryTags: string[];
  temperatureTags: string[];
  [key: string]: unknown;
}

export interface MenuFilters {
  dietaryTags?: string[];
  temperatureTag?: string;
}

export function filterCateringMenu<T extends CateringMenuProduct>(
  products: T[],
  filters: MenuFilters,
): T[] {
  return products.filter((p) => {
    if (filters.dietaryTags?.length) {
      if (!filters.dietaryTags.every((tag) => p.dietaryTags.includes(tag))) return false;
    }
    if (filters.temperatureTag) {
      if (!p.temperatureTags.includes(filters.temperatureTag)) return false;
    }
    return true;
  });
}
