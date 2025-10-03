"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Plus, Upload, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const variantSchema = z.object({
  name: z.string().min(1, "Variant name is required"),
  description: z.string().optional(),
  imageUrl: z.string().url().optional(),
  priceOverride: z.coerce.number().positive().optional(),
  position: z.number().int().min(0).max(1),
});

const itemFormSchema = z.object({
  name: z.string().min(1, "Item name is required"),
  description: z.string().optional(),
  code: z.string().optional(),
  unit: z.string().optional(),
  unitPrice: z.coerce.number().positive("Price must be greater than 0"),
  currency: z.string().default("EUR"),
  active: z.boolean().default(true),
  tags: z.string().optional(),
  variants: z.array(variantSchema).min(1, "At least one variant is required").max(2, "Maximum 2 variants allowed"),
});

type ItemFormValues = z.infer<typeof itemFormSchema>;

interface CatalogItemWithVariants {
  id: string;
  name: string;
  description?: string | null;
  code?: string | null;
  unit?: string | null;
  unitPrice: number;
  currency: string;
  active: boolean;
  tags: string[];
  variants?: {
    id: string;
    name: string;
    description?: string | null;
    imageUrl?: string | null;
    priceOverride?: number | null;
    position: number;
  }[];
}

interface ItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: CatalogItemWithVariants;
}

export function ItemDialog({ open, onOpenChange, item }: ItemDialogProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState<number | null>(null);

  const isEditMode = !!item;

  const form = useForm<ItemFormValues>({
    resolver: zodResolver(itemFormSchema) as Resolver<ItemFormValues>,
    defaultValues: item
      ? {
          name: item.name,
          description: item.description ?? "",
          code: item.code ?? "",
          unit: item.unit ?? "",
          unitPrice: Number(item.unitPrice),
          currency: item.currency,
          active: item.active,
          tags: item.tags?.join(", ") ?? "",
          variants:
            item.variants && item.variants.length > 0
              ? item.variants.map((variant, index) => ({
                  name: variant.name,
                  description: variant.description ?? "",
                  imageUrl: variant.imageUrl ?? "",
                  priceOverride:
                    typeof variant.priceOverride === "number"
                      ? Number(variant.priceOverride)
                      : undefined,
                  position: typeof variant.position === "number" ? variant.position : index,
                }))
              : [{ name: "", description: "", imageUrl: "", position: 0, priceOverride: undefined }],
        }
      : {
          name: "",
          description: "",
          code: "",
          unit: "",
          unitPrice: 0,
          currency: "EUR",
          active: true,
          tags: "",
          variants: [{ name: "", description: "", imageUrl: "", position: 0, priceOverride: undefined }],
        },
  });

  const variants = form.watch("variants");

  const handleImageUpload = async (file: File, variantIndex: number) => {
    setUploadingImage(variantIndex);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/items/upload-image", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Upload failed");
      }

      const { url } = await response.json();
      form.setValue(`variants.${variantIndex}.imageUrl`, url);
    } catch (error) {
      console.error("Error uploading image:", error);
      alert(error instanceof Error ? error.message : "Failed to upload image");
    } finally {
      setUploadingImage(null);
    }
  };

  const addVariant = () => {
    const currentVariants = form.getValues("variants");
    if (currentVariants.length < 2) {
      form.setValue("variants", [
        ...currentVariants,
        { name: "", description: "", imageUrl: "", position: currentVariants.length, priceOverride: undefined },
      ]);
    }
  };

  const removeVariant = (index: number) => {
    const currentVariants = form.getValues("variants");
    if (currentVariants.length > 1) {
      const newVariants = currentVariants.filter((_, i) => i !== index);
      // Reindex positions
      newVariants.forEach((v, i) => (v.position = i));
      form.setValue("variants", newVariants);
    }
  };

  const onSubmit = async (values: ItemFormValues) => {
    setIsSubmitting(true);

    try {
      const payload = {
        ...values,
        tags: values.tags
          ? values.tags.split(",").map((t) => t.trim()).filter(Boolean)
          : [],
      };

      const url = isEditMode ? `/api/items/${item.id}` : "/api/items";
      const method = isEditMode ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save item");
      }

      onOpenChange(false);
      form.reset();
      router.refresh();
    } catch (error) {
      console.error("Error saving item:", error);
      alert(error instanceof Error ? error.message : "Failed to save item");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit Item" : "Create New Item"}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Update your catalog item and variants."
              : "Add a new product or service to your catalog with 1-2 variants."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Basic Information</h3>

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Item Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Premium DJ Package" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Full-day DJ and MC with custom intros..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SKU / Code (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="DJ-PRO" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="unit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="package, hour, etc." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="unitPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Base Price</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="2100" {...field} />
                      </FormControl>
                      <FormDescription>
                        Variants can override this price
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Currency</FormLabel>
                      <FormControl>
                        <Input placeholder="EUR" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tags</FormLabel>
                    <FormControl>
                      <Input placeholder="dj, premium, music" {...field} />
                    </FormControl>
                    <FormDescription>
                      Comma-separated tags for filtering and portfolio matching
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="active"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Active</FormLabel>
                      <FormDescription>
                        Make this item available for proposals
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Variants */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium">Product Variants</h3>
                  <p className="text-sm text-muted-foreground">
                    Add 1-2 variants with images to show in proposals
                  </p>
                </div>
                {variants.length < 2 && (
                  <Button type="button" variant="outline" size="sm" onClick={addVariant}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Variant
                  </Button>
                )}
              </div>

              {variants.map((variant, index) => (
                <div key={index} className="rounded-lg border p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary">
                      Variant {index + 1} {index === 0 ? "(Option A)" : "(Option B)"}
                    </Badge>
                    {variants.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeVariant(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <FormField
                    control={form.control}
                    name={`variants.${index}.name`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Variant Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Gold Package" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`variants.${index}.description`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enhanced features included..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`variants.${index}.priceOverride`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price Override (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="Leave empty to use base price"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Override the base price for this variant
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Image Upload */}
                  <FormField
                    control={form.control}
                    name={`variants.${index}.imageUrl`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product Image</FormLabel>
                        <FormControl>
                          <div className="space-y-2">
                            {field.value ? (
                              <div className="relative">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={field.value}
                                  alt={`${form.watch(`variants.${index}.name`) || "Variant"} preview`}
                                  className="h-40 w-full rounded-lg object-cover"
                                />
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="sm"
                                  className="absolute top-2 right-2"
                                  onClick={() => field.onChange("")}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : (
                              <label className="flex h-40 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed hover:border-primary">
                                <input
                                  type="file"
                                  accept="image/jpeg,image/png,image/webp"
                                  className="hidden"
                                  disabled={uploadingImage === index}
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      handleImageUpload(file, index);
                                    }
                                  }}
                                />
                                {uploadingImage === index ? (
                                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                ) : (
                                  <>
                                    <Upload className="h-8 w-8 text-muted-foreground" />
                                    <div className="text-center">
                                      <p className="text-sm font-medium">
                                        Click to upload image
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        JPEG, PNG, WebP (max 5MB)
                                      </p>
                                    </div>
                                  </>
                                )}
                              </label>
                            )}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              ))}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditMode ? "Update Item" : "Create Item"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
