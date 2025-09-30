"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Eye, Plus, Trash2, FileText } from "lucide-react";

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
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

interface QuoteItem {
  id: string;
  name: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface QuoteFormData {
  title: string;
  clientName: string;
  clientEmail: string;
  clientCompany: string;
  description: string;
  items: QuoteItem[];
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
  expiresAt: string;
}

export default function NewQuotePage() {
  const router = useRouter();
  const [formData, setFormData] = useState<QuoteFormData>({
    title: "",
    clientName: "",
    clientEmail: "",
    clientCompany: "",
    description: "",
    items: [],
    subtotal: 0,
    tax: 0,
    total: 0,
    currency: "EUR",
    expiresAt: "",
  });

  const [activeTab, setActiveTab] = useState("details");

  const addItem = () => {
    const newItem: QuoteItem = {
      id: crypto.randomUUID(),
      name: "",
      description: "",
      quantity: 1,
      unitPrice: 0,
      total: 0,
    };
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem],
    }));
  };

  const updateItem = (id: string, updates: Partial<QuoteItem>) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item => {
        if (item.id === id) {
          const updated = { ...item, ...updates };
          updated.total = updated.quantity * updated.unitPrice;
          return updated;
        }
        return item;
      }),
    }));

    // Recalculate totals
    setTimeout(() => {
      setFormData(prev => {
        const subtotal = prev.items.reduce((sum, item) => sum + item.total, 0);
        const tax = subtotal * 0.21; // 21% VAT
        const total = subtotal + tax;
        return { ...prev, subtotal, tax, total };
      });
    });
  };

  const removeItem = (id: string) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== id),
    }));
  };

  const handleSave = async () => {
    // TODO: Implement save functionality
    console.log("Saving quote:", formData);
    // Redirect back to quotes list after saving
    router.push("/quotes");
  };

  const handlePreview = () => {
    // TODO: Implement preview functionality
    console.log("Preview quote:", formData);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: formData.currency,
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/quotes")}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Quotes
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <span className="font-semibold">
                {formData.title || "New Quote"}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handlePreview} className="gap-2">
              <Eye className="h-4 w-4" />
              Preview
            </Button>
            <Button onClick={handleSave} className="gap-2">
              <Save className="h-4 w-4" />
              Save Quote
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto p-6">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Quote Builder */}
          <div className="lg:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="details">Quote Details</TabsTrigger>
                <TabsTrigger value="items">Items & Pricing</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Basic Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Quote Title</Label>
                      <Input
                        id="title"
                        placeholder="Website Development Project"
                        value={formData.title}
                        onChange={(e) =>
                          setFormData(prev => ({ ...prev, title: e.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        placeholder="Describe the project or services..."
                        className="min-h-[100px]"
                        value={formData.description}
                        onChange={(e) =>
                          setFormData(prev => ({ ...prev, description: e.target.value }))
                        }
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Client Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
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
                      <div className="space-y-2">
                        <Label htmlFor="clientEmail">Email</Label>
                        <Input
                          id="clientEmail"
                          type="email"
                          placeholder="john@example.com"
                          value={formData.clientEmail}
                          onChange={(e) =>
                            setFormData(prev => ({ ...prev, clientEmail: e.target.value }))
                          }
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="clientCompany">Company</Label>
                      <Input
                        id="clientCompany"
                        placeholder="Acme Corp"
                        value={formData.clientCompany}
                        onChange={(e) =>
                          setFormData(prev => ({ ...prev, clientCompany: e.target.value }))
                        }
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="items" className="space-y-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Quote Items</CardTitle>
                    <Button onClick={addItem} size="sm" className="gap-2">
                      <Plus className="h-4 w-4" />
                      Add Item
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {formData.items.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <p>No items added yet. Click &quot;Add Item&quot; to get started.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {formData.items.map((item, index) => (
                          <div key={item.id} className="border rounded-lg p-4 space-y-4">
                            <div className="flex items-center justify-between">
                              <Badge variant="outline">Item {index + 1}</Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeItem(item.id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                              <div className="space-y-2">
                                <Label>Item Name</Label>
                                <Input
                                  placeholder="Service or product name"
                                  value={item.name}
                                  onChange={(e) =>
                                    updateItem(item.id, { name: e.target.value })
                                  }
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Description</Label>
                                <Input
                                  placeholder="Brief description"
                                  value={item.description}
                                  onChange={(e) =>
                                    updateItem(item.id, { description: e.target.value })
                                  }
                                />
                              </div>
                            </div>
                            <div className="grid gap-4 sm:grid-cols-3">
                              <div className="space-y-2">
                                <Label>Quantity</Label>
                                <Input
                                  type="number"
                                  min="1"
                                  value={item.quantity}
                                  onChange={(e) =>
                                    updateItem(item.id, { quantity: parseInt(e.target.value) || 1 })
                                  }
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Unit Price</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={item.unitPrice}
                                  onChange={(e) =>
                                    updateItem(item.id, { unitPrice: parseFloat(e.target.value) || 0 })
                                  }
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Total</Label>
                                <div className="h-10 flex items-center px-3 border rounded-md bg-muted">
                                  {formatCurrency(item.total)}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="settings" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Quote Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="currency">Currency</Label>
                        <Select
                          value={formData.currency}
                          onValueChange={(value) =>
                            setFormData(prev => ({ ...prev, currency: value }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="EUR">EUR (€)</SelectItem>
                            <SelectItem value="USD">USD ($)</SelectItem>
                            <SelectItem value="GBP">GBP (£)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="expiresAt">Expires At</Label>
                        <Input
                          id="expiresAt"
                          type="date"
                          value={formData.expiresAt}
                          onChange={(e) =>
                            setFormData(prev => ({ ...prev, expiresAt: e.target.value }))
                          }
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Quote Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <Card>
                <CardHeader>
                  <CardTitle>Quote Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal:</span>
                      <span>{formatCurrency(formData.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Tax (21%):</span>
                      <span>{formatCurrency(formData.tax)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-semibold">
                      <span>Total:</span>
                      <span>{formatCurrency(formData.total)}</span>
                    </div>
                  </div>

                  {formData.items.length > 0 && (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">Items ({formData.items.length})</h4>
                        {formData.items.map((item, index) => (
                          <div key={item.id} className="text-sm text-muted-foreground">
                            <div className="flex justify-between">
                              <span className="truncate mr-2">
                                {item.name || `Item ${index + 1}`}
                              </span>
                              <span>{formatCurrency(item.total)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

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
                    <div className="flex justify-between">
                      <span>Expires:</span>
                      <span>{formData.expiresAt || "—"}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}