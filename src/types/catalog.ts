export interface CatalogVariant {
  id: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  priceOverride?: number | null;
  position: number;
}

export interface CatalogItem {
  id: string;
  name: string;
  description?: string | null;
  code?: string | null;
  unit?: string | null;
  unitPrice: number;
  currency: string;
  active: boolean;
  tags: string[];
  variants?: CatalogVariant[];
}
