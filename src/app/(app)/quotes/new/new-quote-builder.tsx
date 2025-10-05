"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Plus, Trash2, FileText, Play, Grid3x3, ArrowRight, Package } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { QuoteFlowMap } from "@/components/quote-flow-map";
import { CatalogItemSelector } from "@/components/catalog-item-selector";

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
  unitPrice: number;
  currency: string;
  variants?: ItemVariant[];
}

interface SlideOption {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  nextSlideId?: string; // Conditional path
  catalogItemId?: string; // Link to catalog item
}

type QuoteSlideType = "intro" | "addon" | "review";

interface QuoteSlide {
  id: string;
  title: string;
  subtitle?: string;
  type: QuoteSlideType;
  position: number;
  catalogItemId?: string; // Link to catalog item
  catalogItemName?: string; // Display name
  options: SlideOption[];
}

interface QuoteFormData {
  title: string;
  clientName: string;
  clientEmail: string;
  clientCompany: string;
  description: string;
  slides: QuoteSlide[];
  currency: string;
  expiresAt: string;
}

function generateId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function createOption(overrides: Partial<SlideOption> = {}): SlideOption {
  return {
    id: generateId(),
    name: "",
    description: "",
    price: 0,
    ...overrides,
  };
}

const DEFAULT_NEXT_SLIDE = "__default_next__";

function createSlide(type: QuoteSlideType, position: number): QuoteSlide {
  return {
    id: generateId(),
    title: "",
    subtitle: "",
    type,
    position,
    options: type === "addon" ? [createOption()] : [],
  };
}

export function NewQuoteBuilder() {
  const router = useRouter();
  const [formData, setFormData] = useState<QuoteFormData>({
    title: "",
    clientName: "",
    clientEmail: "",
    clientCompany: "",
    description: "",
    slides: [],
    currency: "EUR",
    expiresAt: "",
  });

  const [activeView, setActiveView] = useState<"builder" | "flow" | "preview">("builder");
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [editingSlideId, setEditingSlideId] = useState<string | null>(null);
  const [catalogSelectorOpen, setCatalogSelectorOpen] = useState(false);
  const [selectingForSlideId, setSelectingForSlideId] = useState<string | null>(null);

  useEffect(() => {
    if (formData.slides.length === 0) {
      setCurrentSlideIndex(0);
      return;
    }

    if (currentSlideIndex > formData.slides.length - 1) {
      setCurrentSlideIndex(formData.slides.length - 1);
    }
  }, [formData.slides.length, currentSlideIndex]);

  const addSlide = (type: QuoteSlideType) => {
    const newSlide = createSlide(type, formData.slides.length);
    setFormData(prev => ({
      ...prev,
      slides: [...prev.slides, newSlide],
    }));
    setEditingSlideId(newSlide.id);
  };

  const updateSlide = (slideId: string, updates: Partial<QuoteSlide>) => {
    setFormData(prev => ({
      ...prev,
      slides: prev.slides.map(slide =>
        slide.id === slideId ? { ...slide, ...updates } : slide
      ),
    }));
  };

  const removeSlide = (slideId: string) => {
    setFormData(prev => ({
      ...prev,
      slides: prev.slides.filter(slide => slide.id !== slideId)
        .map((slide, index) => ({ ...slide, position: index })),
    }));
    setEditingSlideId(null);
  };

  const updateOption = (slideId: string, optionId: string, updates: Partial<SlideOption>) => {
    setFormData(prev => ({
      ...prev,
      slides: prev.slides.map((slide) => {
        if (slide.id !== slideId) return slide;
        return {
          ...slide,
          options: slide.options.map((option) =>
            option.id === optionId ? { ...option, ...updates } : option
          ),
        };
      }),
    }));
  };

  const addOption = (slideId: string) => {
    setFormData(prev => ({
      ...prev,
      slides: prev.slides.map((slide) => {
        if (slide.id !== slideId) return slide;
        return {
          ...slide,
          options: [...slide.options, createOption()],
        };
      }),
    }));
  };

  const removeOption = (slideId: string, optionId: string) => {
    setFormData(prev => ({
      ...prev,
      slides: prev.slides.map((slide) => {
        if (slide.id !== slideId) return slide;
        const remaining = slide.options.filter((option) => option.id !== optionId);
        return {
          ...slide,
          options: remaining.length > 0 ? remaining : [createOption()],
        };
      }),
    }));
  };

  const moveSlide = (slideId: string, direction: "up" | "down") => {
    setFormData(prev => {
      const slides = [...prev.slides];
      const index = slides.findIndex(s => s.id === slideId);
      if (index === -1) return prev;

      const newIndex = direction === "up" ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= slides.length) return prev;

      [slides[index], slides[newIndex]] = [slides[newIndex], slides[index]];
      slides.forEach((slide, i) => {
        slide.position = i;
      });

      return { ...prev, slides };
    });
  };

  const handleSelectCatalogItem = (slideId: string) => {
    setSelectingForSlideId(slideId);
    setCatalogSelectorOpen(true);
  };

  const handleCatalogItemSelected = (item: CatalogItem) => {
    if (!selectingForSlideId) return;

    const slide = formData.slides.find(s => s.id === selectingForSlideId);
    if (!slide) return;

    const basePrice = Number(item.unitPrice);
    const baseDescription = item.description || "";
    const variants = item.variants ?? [];

    const populatedOptions = variants.length
      ? variants.map((variant) =>
          createOption({
            name: variant.name,
            description: variant.description || baseDescription,
            price: variant.priceOverride ? Number(variant.priceOverride) : basePrice,
            imageUrl: variant.imageUrl || undefined,
            catalogItemId: item.id,
          })
        )
      : [
          createOption({
            name: item.name,
            description: baseDescription,
            price: basePrice,
            catalogItemId: item.id,
          }),
        ];

    updateSlide(selectingForSlideId, {
      catalogItemId: item.id,
      catalogItemName: item.name,
      title: slide.title || item.name,
      options: slide.type === "addon" ? populatedOptions : slide.options,
    });
    setSelectingForSlideId(null);
  };

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    // Validation
    if (!formData.title) {
      alert("Please enter a quote title");
      return;
    }
    if (!formData.clientName) {
      alert("Please enter a client name");
      return;
    }
    if (formData.slides.length === 0) {
      alert("Please add at least one slide");
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save quote");
      }

      const result = await response.json();

      // Redirect to quotes list or to the proposal view
      router.push(`/quotes?success=created&shareId=${result.proposal.shareId}`);
    } catch (error) {
      console.error("Error saving quote:", error);
      alert(error instanceof Error ? error.message : "Failed to save quote");
    } finally {
      setIsSaving(false);
    }
  };

  const goToNextSlide = () => {
    setCurrentSlideIndex(prev => {
      if (formData.slides.length === 0) return 0;
      return Math.min(prev + 1, formData.slides.length - 1);
    });
  };

  const goToPreviousSlide = () => {
    setCurrentSlideIndex(prev => Math.max(0, prev - 1));
  };

  const handlePreview = () => {
    setActiveView("preview");
    setCurrentSlideIndex(0);
  };

  const formatCurrency = (amount: number) => {
    if (!Number.isFinite(amount)) {
      return "—";
    }

    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: formData.currency,
    }).format(amount);
  };

  const totalSlidesByType = useMemo(() => {
    return formData.slides.reduce(
      (acc, slide) => {
        acc[slide.type] = (acc[slide.type] || 0) + 1;
        return acc;
      },
      {} as Record<QuoteSlide["type"], number>
    );
  }, [formData.slides]);

  const renderPreviewSlide = (slide: QuoteSlide) => {
    switch (slide.type) {
      case "intro":
        return (
          <Card className="max-w-3xl mx-auto">
            <CardHeader className="text-center space-y-4 pb-6 sm:pb-8 px-4 sm:px-6">
              <CardTitle className="text-2xl sm:text-3xl lg:text-4xl font-bold">{slide.title || "Welcome"}</CardTitle>
              {slide.subtitle && (
                <p className="text-base sm:text-lg text-muted-foreground">{slide.subtitle}</p>
              )}
            </CardHeader>
            <CardContent className="text-center px-4 sm:px-6">
              <Button size="lg" onClick={goToNextSlide} className="w-full sm:w-auto">
                Get Started <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </CardContent>
          </Card>
        );

      case "addon":
        return (
          <div className="max-w-3xl mx-auto px-4">
            <div className="text-center mb-6 sm:mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold mb-2">{slide.title || "Add-ons"}</h2>
              {slide.subtitle && (
                <p className="text-sm sm:text-base text-muted-foreground">{slide.subtitle}</p>
              )}
            </div>
            <div className="space-y-4 sm:space-y-6">
              {slide.options.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="py-8 text-center text-sm text-muted-foreground">
                    No add-ons configured yet. Use the builder to add options from your catalog.
                  </CardContent>
                </Card>
              ) : (
                slide.options.map((option) => (
                  <Card key={option.id} className="mb-2">
                    <CardHeader className="px-4 sm:px-6">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <CardTitle className="text-lg sm:text-xl">{option.name || "Add-on Option"}</CardTitle>
                        <div className="text-xl sm:text-2xl font-bold">{formatCurrency(option.price)}</div>
                      </div>
                    </CardHeader>
                    <CardContent className="px-4 sm:px-6">
                      <p className="text-sm sm:text-base text-muted-foreground mb-4">{option.description}</p>
                      <Button variant="outline" className="w-full">
                        Add to Selection
                      </Button>
                    </CardContent>
                  </Card>
                ))
              )}
              <Button className="w-full" size="lg" onClick={goToNextSlide}>
                Continue <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        );

      case "review":
        return (
          <Card className="max-w-3xl mx-auto">
            <CardHeader className="text-center px-4 sm:px-6">
              <CardTitle className="text-2xl sm:text-3xl font-bold">{slide.title || "Review Your Selection"}</CardTitle>
              {slide.subtitle && (
                <p className="text-sm sm:text-base text-muted-foreground">{slide.subtitle}</p>
              )}
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6">
              <div className="text-center">
                <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4">This is a preview of the review slide</p>
                <Button size="lg" className="w-full sm:w-auto">Accept & Continue</Button>
              </div>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center justify-between px-3 sm:px-6 gap-2">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/quotes")}
              className="gap-2 shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back to Quotes</span>
            </Button>
            <Separator orientation="vertical" className="h-6 hidden sm:block" />
            <div className="flex items-center gap-2 min-w-0">
              <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
              <span className="font-semibold truncate text-sm sm:text-base">
                {formData.title || "New Quote Builder"}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Tabs value={activeView} onValueChange={(v) => setActiveView(v as typeof activeView)} className="w-auto">
              <TabsList className="h-9">
                <TabsTrigger value="builder" className="text-xs sm:text-sm px-2 sm:px-3">
                  <span className="hidden sm:inline">Builder</span>
                  <span className="sm:hidden">Build</span>
                </TabsTrigger>
                <TabsTrigger value="flow" className="text-xs sm:text-sm px-2 sm:px-3">
                  <span className="hidden sm:inline">Flow Map</span>
                  <span className="sm:hidden">Flow</span>
                </TabsTrigger>
                <TabsTrigger value="preview" className="text-xs sm:text-sm px-2 sm:px-3">
                  <span className="hidden sm:inline">Preview</span>
                  <span className="sm:hidden">View</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <Button onClick={handleSave} className="gap-2" size="sm" disabled={isSaving}>
              <Save className="h-4 w-4" />
              <span className="hidden md:inline">{isSaving ? "Saving..." : "Save Quote"}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {activeView === "builder" && (
        <div className="container mx-auto p-3 sm:p-6">
          <div className="grid gap-4 sm:gap-6 lg:gap-8 lg:grid-cols-3">
            {/* Quote Builder */}
            <div className="lg:col-span-2 space-y-4 sm:space-y-6">
              {/* Basic Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Quote Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="title">Quote Title</Label>
                      <Input
                        id="title"
                        placeholder="Custom Event Package"
                        value={formData.title}
                        onChange={(e) =>
                          setFormData(prev => ({ ...prev, title: e.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="clientName">Client Name</Label>
                      <Input
                        id="clientName"
                        placeholder="John Doe"
                        value={formData.clientName}
                        onChange={(e) =>
                          setFormData(prev => ({ ...prev, clientName: e.target.value }))
                        }
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Slide Builder */}
              <Card>
                <CardHeader className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <CardTitle>Slides</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        Build your quote presentation flow
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button onClick={() => addSlide("intro")} size="sm" variant="outline" className="flex-1 sm:flex-none">
                        Intro
                      </Button>
                      <Button onClick={() => addSlide("addon")} size="sm" variant="outline" className="flex-1 sm:flex-none">
                        Add-on
                      </Button>
                      <Button onClick={() => addSlide("review")} size="sm" variant="outline" className="flex-1 sm:flex-none">
                        Review
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {formData.slides.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Grid3x3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="mb-4">No slides yet. Add slides to build your interactive quote.</p>
                      <div className="flex gap-2 justify-center">
                        <Button onClick={() => addSlide("intro")} size="sm">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Intro Slide
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {formData.slides.map((slide, index) => (
                        <Card key={slide.id} className={editingSlideId === slide.id ? "border-primary" : ""}>
                          <CardHeader>
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <Badge className="shrink-0">{slide.type}</Badge>
                                <span className="font-medium text-sm sm:text-base truncate">Slide {index + 1}</span>
                              </div>
                              <div className="flex gap-1 shrink-0">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => moveSlide(slide.id, "up")}
                                  disabled={index === 0}
                                  className="h-8 w-8 p-0 sm:h-9 sm:w-9"
                                >
                                  ↑
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => moveSlide(slide.id, "down")}
                                  disabled={index === formData.slides.length - 1}
                                  className="h-8 w-8 p-0 sm:h-9 sm:w-9"
                                >
                                  ↓
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setEditingSlideId(editingSlideId === slide.id ? null : slide.id)}
                                  className="hidden sm:flex"
                                >
                                  {editingSlideId === slide.id ? "Collapse" : "Edit"}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setEditingSlideId(editingSlideId === slide.id ? null : slide.id)}
                                  className="sm:hidden h-8 w-8 p-0"
                                >
                                  {editingSlideId === slide.id ? "−" : "+"}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeSlide(slide.id)}
                                  className="text-destructive hover:text-destructive h-8 w-8 p-0 sm:h-9 sm:w-9"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardHeader>
                          {editingSlideId === slide.id && (
                            <CardContent className="space-y-4 pt-0">
                              <div className="space-y-2">
                                <Label>Slide Title</Label>
                                <Input
                                  placeholder="Enter slide title"
                                  value={slide.title}
                                  onChange={(e) =>
                                    updateSlide(slide.id, { title: e.target.value })
                                  }
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Subtitle (optional)</Label>
                                <Input
                                  placeholder="Enter subtitle"
                                  value={slide.subtitle || ""}
                                  onChange={(e) =>
                                    updateSlide(slide.id, { subtitle: e.target.value })
                                  }
                                />
                              </div>

                              {/* Catalog Item Selector for Add-on slides */}
                              {slide.type === "addon" && (
                                <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
                                  <div className="flex items-center justify-between">
                                    <Label className="text-sm font-medium">Product / Service</Label>
                                    {slide.catalogItemId && (
                                      <Badge variant="secondary" className="gap-1">
                                        <Package className="h-3 w-3" />
                                        {slide.catalogItemName}
                                      </Badge>
                                    )}
                                  </div>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full"
                                    onClick={() => handleSelectCatalogItem(slide.id)}
                                  >
                                    <Package className="mr-2 h-4 w-4" />
                                    {slide.catalogItemId ? "Change Catalog Item" : "Select from Catalog"}
                                  </Button>
                                  {slide.catalogItemId && (
                                    <p className="text-xs text-muted-foreground">
                                      Options below are auto-populated from catalog item variants. Edit or add more to tailor the bundle.
                                    </p>
                                  )}
                                </div>
                              )}

                              {slide.type === "addon" && (
                                <div className="space-y-4">
                                  {slide.options.map((option, optionIndex) => (
                                    <div key={option.id} className="border rounded-lg p-4 space-y-3">
                                      <div className="flex items-start justify-between gap-3">
                                        <div>
                                          <h4 className="font-semibold">Add-on Option {optionIndex + 1}</h4>
                                          {option.catalogItemId && (
                                            <p className="text-xs text-muted-foreground">
                                              Linked to catalog item • edits stay local to this quote
                                            </p>
                                          )}
                                        </div>
                                        {slide.options.length > 1 && (
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeOption(slide.id, option.id)}
                                            className="text-muted-foreground hover:text-destructive"
                                          >
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Remove
                                          </Button>
                                        )}
                                      </div>
                                      <div className="grid gap-3 sm:grid-cols-2">
                                        <div className="space-y-2">
                                          <Label>Name</Label>
                                          <Input
                                            placeholder="Option name"
                                            value={option.name}
                                            onChange={(e) =>
                                              updateOption(slide.id, option.id, { name: e.target.value })
                                            }
                                          />
                                        </div>
                                        <div className="space-y-2">
                                          <Label>Price</Label>
                                          <Input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            placeholder="0.00"
                                            value={option.price}
                                            onChange={(e) =>
                                              updateOption(slide.id, option.id, {
                                                price: Number.isNaN(parseFloat(e.target.value))
                                                  ? 0
                                                  : parseFloat(e.target.value),
                                              })
                                            }
                                          />
                                        </div>
                                      </div>
                                      <div className="space-y-2">
                                        <Label>Description</Label>
                                        <Textarea
                                          placeholder="Describe this option"
                                          value={option.description}
                                          onChange={(e) =>
                                            updateOption(slide.id, option.id, { description: e.target.value })
                                          }
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label>Next Slide (conditional)</Label>
                                        <Select
                                          value={option.nextSlideId ?? DEFAULT_NEXT_SLIDE}
                                          onValueChange={(value) =>
                                            updateOption(slide.id, option.id, {
                                              nextSlideId:
                                                value === DEFAULT_NEXT_SLIDE ? undefined : value,
                                            })
                                          }
                                        >
                                          <SelectTrigger>
                                            <SelectValue placeholder="Continue in order" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value={DEFAULT_NEXT_SLIDE}>Next slide in order</SelectItem>
                                            {formData.slides
                                              .filter(s => s.id !== slide.id)
                                              .map(s => (
                                                <SelectItem key={s.id} value={s.id}>
                                                  Slide {s.position + 1}: {s.title || s.type}
                                                </SelectItem>
                                              ))}
                                          </SelectContent>
                                        </Select>
                                      </div>
                                    </div>
                                  ))}
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="gap-2"
                                    onClick={() => addOption(slide.id)}
                                  >
                                    <Plus className="h-4 w-4" />
                                    Add another add-on
                                  </Button>
                                </div>
                              )}
                            </CardContent>
                          )}
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Quote Summary Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Quote Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Slides:</span>
                        <span className="font-medium">{formData.slides.length}</span>
                      </div>
                      {(["intro", "addon", "review"] as QuoteSlideType[]).map(type => (
                        <div key={type} className="flex justify-between text-xs">
                          <span className="text-muted-foreground capitalize">{type}</span>
                          <span className="font-medium text-foreground">
                            {totalSlidesByType[type] ?? 0}
                          </span>
                        </div>
                      ))}
                    </div>
                    <Separator />
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex justify-between">
                        <span>Client:</span>
                        <span>{formData.clientName || "—"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Currency:</span>
                        <span>{formData.currency}</span>
                      </div>
                    </div>
                    <Separator />
                    <Button
                      className="w-full"
                      variant="outline"
                      onClick={handlePreview}
                      disabled={formData.slides.length === 0}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Preview Presentation
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Quick Tips</CardTitle>
                  </CardHeader>
                  <CardContent className="text-xs text-muted-foreground space-y-2">
                    <p>• Use <strong>Add-on slides</strong> to bundle optional upgrades</p>
                    <p>• Link catalog items to pull pricing and descriptions instantly</p>
                    <p>• Set conditional paths on add-ons to jump to targeted follow-ups</p>
                    <p>• Preview to see the client experience</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Flow Map View */}
      {activeView === "flow" && (
        <div className="container mx-auto p-3 sm:p-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Quote Flow Map</CardTitle>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Visual representation of your quote&apos;s path logic and slide connections
              </p>
            </CardHeader>
            <CardContent className="min-h-[400px] sm:min-h-[500px]">
              <QuoteFlowMap slides={formData.slides} />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Preview Mode */}
      {activeView === "preview" && (
        <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-background to-muted/20 py-6 sm:py-12 px-3 sm:px-4">
          <div className="max-w-6xl mx-auto">
            {/* Progress Indicator */}
            <div className="mb-6 sm:mb-8 flex items-center justify-center gap-1 sm:gap-2 overflow-x-auto pb-2">
              {formData.slides.map((slide, index) => (
                <div
                  key={slide.id}
                  className={`h-2 w-8 sm:w-12 rounded-full transition-all shrink-0 ${
                    index === currentSlideIndex
                      ? "bg-primary"
                      : index < currentSlideIndex
                      ? "bg-primary/50"
                      : "bg-muted"
                  }`}
                />
              ))}
            </div>

            {/* Current Slide */}
            {formData.slides[currentSlideIndex] && renderPreviewSlide(formData.slides[currentSlideIndex])}

            {/* Navigation */}
            <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
              <Button
                variant="outline"
                onClick={goToPreviousSlide}
                disabled={currentSlideIndex === 0}
                className="w-full sm:w-auto"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
              <span className="text-xs sm:text-sm text-muted-foreground order-first sm:order-none">
                {currentSlideIndex + 1} / {formData.slides.length}
              </span>
              <Button
                variant="outline"
                onClick={goToNextSlide}
                disabled={currentSlideIndex === formData.slides.length - 1}
                className="w-full sm:w-auto"
              >
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Catalog Item Selector Dialog */}
      <CatalogItemSelector
        open={catalogSelectorOpen}
        onOpenChange={setCatalogSelectorOpen}
        onSelectItem={handleCatalogItemSelected}
        selectedItemId={
          selectingForSlideId
            ? formData.slides.find(s => s.id === selectingForSlideId)?.catalogItemId
            : undefined
        }
      />
    </div>
  );
}
