"use client";

import { useState, useEffect } from "react";
import { Search, Package, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";

interface ItemVariant {
  id: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  priceOverride?: number | null;
  position: number;
}

interface CatalogItem {
  id: string;
  name: string;
  description?: string | null;
  code?: string | null;
  unitPrice: number;
  currency: string;
  active: boolean;
  tags: string[];
  variants?: ItemVariant[];
}

interface CatalogItemSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectItem: (item: CatalogItem) => void;
  selectedItemId?: string;
}

export function CatalogItemSelector({
  open,
  onOpenChange,
  onSelectItem,
  selectedItemId,
}: CatalogItemSelectorProps) {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (open) {
      fetchItems();
    }
  }, [open]);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/items");
      if (!response.ok) throw new Error("Failed to fetch items");
      const data = await response.json();
      setItems(data.items || []);
    } catch (error) {
      console.error("Error fetching items:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number, currency = "EUR") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const filteredItems = items.filter(
    (item) =>
      item.active &&
      (item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tags.some((tag) =>
          tag.toLowerCase().includes(searchQuery.toLowerCase())
        ))
  );

  const handleSelect = (item: CatalogItem) => {
    onSelectItem(item);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Select Catalog Item</DialogTitle>
          <DialogDescription>
            Choose a product or service from your catalog to add to this slide
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search items by name, description, or tags..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              Loading catalog items...
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Package className="mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold">
                {searchQuery ? "No items found" : "No catalog items"}
              </h3>
              <p className="max-w-md text-muted-foreground">
                {searchQuery
                  ? "Try a different search term"
                  : "Create catalog items first to add them to your quotes"}
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[400px] pr-4">
              <div className="grid gap-3">
                {filteredItems.map((item) => (
                  <Card
                    key={item.id}
                    className={`cursor-pointer transition-all hover:border-primary ${
                      selectedItemId === item.id ? "border-primary bg-primary/5" : ""
                    }`}
                    onClick={() => handleSelect(item)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        {/* Item Variants Preview */}
                        <div className="flex gap-2 shrink-0">
                          {item.variants?.slice(0, 2).map((variant, idx) => (
                            <div
                              key={variant.id}
                              className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex items-center justify-center"
                            >
                              {variant.imageUrl ? (
                                <img
                                  src={variant.imageUrl}
                                  alt={variant.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="text-xs text-muted-foreground">
                                  {idx === 0 ? "A" : "B"}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Item Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <h4 className="font-semibold flex items-center gap-2">
                                {item.name}
                                {selectedItemId === item.id && (
                                  <Check className="h-4 w-4 text-primary" />
                                )}
                              </h4>
                              {item.description && (
                                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                                  {item.description}
                                </p>
                              )}
                            </div>
                            <div className="text-right shrink-0">
                              <div className="font-semibold">
                                {formatCurrency(Number(item.unitPrice), item.currency)}
                              </div>
                              {item.code && (
                                <div className="text-xs text-muted-foreground">
                                  {item.code}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Variants */}
                          {item.variants && item.variants.length > 0 && (
                            <div className="mt-3 space-y-2">
                              {item.variants.map((variant, idx) => (
                                <div
                                  key={variant.id}
                                  className="text-sm flex items-center gap-2"
                                >
                                  <Badge variant="outline" className="text-xs">
                                    {idx === 0 ? "Option A" : "Option B"}
                                  </Badge>
                                  <span className="font-medium">{variant.name}</span>
                                  {variant.priceOverride && (
                                    <span className="text-muted-foreground">
                                      ({formatCurrency(Number(variant.priceOverride), item.currency)})
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Tags */}
                          {item.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {item.tags.slice(0, 4).map((tag) => (
                                <Badge
                                  key={tag}
                                  variant="secondary"
                                  className="text-xs"
                                >
                                  {tag}
                                </Badge>
                              ))}
                              {item.tags.length > 4 && (
                                <Badge variant="outline" className="text-xs">
                                  +{item.tags.length - 4}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
