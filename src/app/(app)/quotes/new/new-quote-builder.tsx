"use client";

import { useState } from "react";
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

interface QuoteSlide {
  id: string;
  title: string;
  subtitle?: string;
  type: "intro" | "choice" | "addon" | "review";
  position: number;
  catalogItemId?: string; // Link to catalog item
  catalogItemName?: string; // Display name
  optionA?: SlideOption;
  optionB?: SlideOption;
  allowMultiple?: boolean; // For addon slides
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

  const addSlide = (type: QuoteSlide["type"]) => {
    const newSlide: QuoteSlide = {
      id: crypto.randomUUID(),
      title: "",
      subtitle: "",
      type,
      position: formData.slides.length,
      optionA: type === "choice" || type === "addon" ? {
        id: crypto.randomUUID(),
        name: "",
        description: "",
        price: 0,
      } : undefined,
      optionB: type === "choice" ? {
        id: crypto.randomUUID(),
        name: "",
        description: "",
        price: 0,
      } : undefined,
      allowMultiple: type === "addon",
    };
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

  const updateOption = (slideId: string, optionKey: "optionA" | "optionB", updates: Partial<SlideOption>) => {
    setFormData(prev => ({
      ...prev,
      slides: prev.slides.map(slide => {
        if (slide.id === slideId && slide[optionKey]) {
          return {
            ...slide,
            [optionKey]: { ...slide[optionKey]!, ...updates },
          };
        }
        return slide;
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

    // Auto-populate options from catalog item variants
    const variants = item.variants || [];
    const variantA = variants[0];
    const variantB = variants[1];

    const updates: Partial<QuoteSlide> = {
      catalogItemId: item.id,
      catalogItemName: item.name,
      title: slide.title || item.name,
    };

    if (slide.type === "choice" || slide.type === "addon") {
      if (variantA) {
        updates.optionA = {
          id: crypto.randomUUID(),
          name: variantA.name,
          description: variantA.description || item.description || "",
          price: variantA.priceOverride ? Number(variantA.priceOverride) : Number(item.unitPrice),
          imageUrl: variantA.imageUrl || undefined,
          catalogItemId: item.id,
        };
      }

      if (slide.type === "choice" && variantB) {
        updates.optionB = {
          id: crypto.randomUUID(),
          name: variantB.name,
          description: variantB.description || item.description || "",
          price: variantB.priceOverride ? Number(variantB.priceOverride) : Number(item.unitPrice),
          imageUrl: variantB.imageUrl || undefined,
          catalogItemId: item.id,
        };
      }
    }

    updateSlide(selectingForSlideId, updates);
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

  const handlePreview = () => {
    setActiveView("preview");
    setCurrentSlideIndex(0);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: formData.currency,
    }).format(amount);
  };

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
              <Button size="lg" onClick={() => setCurrentSlideIndex(currentSlideIndex + 1)} className="w-full sm:w-auto">
                Get Started <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </CardContent>
          </Card>
        );

      case "choice":
        return (
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-6 sm:mb-8 px-4">
              <h2 className="text-2xl sm:text-3xl font-bold mb-2">{slide.title || "Choose Your Option"}</h2>
              {slide.subtitle && (
                <p className="text-sm sm:text-base text-muted-foreground">{slide.subtitle}</p>
              )}
            </div>
            <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
              {slide.optionA && (
                <Card className="cursor-pointer hover:border-primary transition-all hover:shadow-lg">
                  <CardHeader className="px-4 sm:px-6">
                    <CardTitle className="text-xl sm:text-2xl">{slide.optionA.name || "Option A"}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 sm:space-y-4 px-4 sm:px-6">
                    <p className="text-sm sm:text-base text-muted-foreground">{slide.optionA.description}</p>
                    <div className="text-2xl sm:text-3xl font-bold">{formatCurrency(slide.optionA.price)}</div>
                    <Button className="w-full" size="lg">
                      Select This Option
                    </Button>
                  </CardContent>
                </Card>
              )}
              {slide.optionB && (
                <Card className="cursor-pointer hover:border-primary transition-all hover:shadow-lg">
                  <CardHeader className="px-4 sm:px-6">
                    <CardTitle className="text-xl sm:text-2xl">{slide.optionB.name || "Option B"}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 sm:space-y-4 px-4 sm:px-6">
                    <p className="text-sm sm:text-base text-muted-foreground">{slide.optionB.description}</p>
                    <div className="text-2xl sm:text-3xl font-bold">{formatCurrency(slide.optionB.price)}</div>
                    <Button className="w-full" size="lg">
                      Select This Option
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
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
            {slide.optionA && (
              <Card className="mb-4 sm:mb-6">
                <CardHeader className="px-4 sm:px-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <CardTitle className="text-lg sm:text-xl">{slide.optionA.name || "Add-on Option"}</CardTitle>
                    <div className="text-xl sm:text-2xl font-bold">{formatCurrency(slide.optionA.price)}</div>
                  </div>
                </CardHeader>
                <CardContent className="px-4 sm:px-6">
                  <p className="text-sm sm:text-base text-muted-foreground mb-4">{slide.optionA.description}</p>
                  <Button variant="outline" className="w-full">
                    Add to Selection
                  </Button>
                </CardContent>
              </Card>
            )}
            <Button
              className="w-full"
              size="lg"
              onClick={() => setCurrentSlideIndex(currentSlideIndex + 1)}
            >
              Continue <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
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
                      <Button onClick={() => addSlide("choice")} size="sm" variant="outline" className="flex-1 sm:flex-none">
                        Choice
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

                              {/* Catalog Item Selector for Choice & Addon slides */}
                              {(slide.type === "choice" || slide.type === "addon") && (
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
                                      Options below are auto-populated from catalog item variants. You can still edit them manually.
                                    </p>
                                  )}
                                </div>
                              )}

                              {/* Option A */}
                              {slide.optionA && (
                                <div className="border rounded-lg p-4 space-y-3">
                                  <h4 className="font-semibold">Option A</h4>
                                  <div className="grid gap-3 sm:grid-cols-2">
                                    <div className="space-y-2">
                                      <Label>Name</Label>
                                      <Input
                                        placeholder="Option name"
                                        value={slide.optionA.name}
                                        onChange={(e) =>
                                          updateOption(slide.id, "optionA", { name: e.target.value })
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
                                        value={slide.optionA.price}
                                        onChange={(e) =>
                                          updateOption(slide.id, "optionA", { price: parseFloat(e.target.value) || 0 })
                                        }
                                      />
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Description</Label>
                                    <Textarea
                                      placeholder="Describe this option"
                                      value={slide.optionA.description}
                                      onChange={(e) =>
                                        updateOption(slide.id, "optionA", { description: e.target.value })
                                      }
                                    />
                                  </div>
                                  {slide.type === "choice" && (
                                    <div className="space-y-2">
                                      <Label>Next Slide (Conditional Path)</Label>
                                      <Select
                                        value={slide.optionA.nextSlideId || ""}
                                        onValueChange={(value) =>
                                          updateOption(slide.id, "optionA", { nextSlideId: value || undefined })
                                        }
                                      >
                                        <SelectTrigger>
                                          <SelectValue placeholder="Continue to next slide" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="">Next slide in order</SelectItem>
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
                                  )}
                                </div>
                              )}

                              {/* Option B */}
                              {slide.optionB && (
                                <div className="border rounded-lg p-4 space-y-3">
                                  <h4 className="font-semibold">Option B</h4>
                                  <div className="grid gap-3 sm:grid-cols-2">
                                    <div className="space-y-2">
                                      <Label>Name</Label>
                                      <Input
                                        placeholder="Option name"
                                        value={slide.optionB.name}
                                        onChange={(e) =>
                                          updateOption(slide.id, "optionB", { name: e.target.value })
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
                                        value={slide.optionB.price}
                                        onChange={(e) =>
                                          updateOption(slide.id, "optionB", { price: parseFloat(e.target.value) || 0 })
                                        }
                                      />
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Description</Label>
                                    <Textarea
                                      placeholder="Describe this option"
                                      value={slide.optionB.description}
                                      onChange={(e) =>
                                        updateOption(slide.id, "optionB", { description: e.target.value })
                                      }
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Next Slide (Conditional Path)</Label>
                                    <Select
                                      value={slide.optionB.nextSlideId || ""}
                                      onValueChange={(value) =>
                                        updateOption(slide.id, "optionB", { nextSlideId: value || undefined })
                                      }
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder="Continue to next slide" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="">Next slide in order</SelectItem>
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
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Choice Slides:</span>
                        <span className="font-medium">
                          {formData.slides.filter(s => s.type === "choice").length}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Add-on Slides:</span>
                        <span className="font-medium">
                          {formData.slides.filter(s => s.type === "addon").length}
                        </span>
                      </div>
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
                    <p>• Use <strong>Choice slides</strong> for either/or decisions</p>
                    <p>• Use <strong>Add-on slides</strong> for optional extras</p>
                    <p>• Set conditional paths to create dynamic flows</p>
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
                onClick={() => setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1))}
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
                onClick={() =>
                  setCurrentSlideIndex(Math.min(formData.slides.length - 1, currentSlideIndex + 1))
                }
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
