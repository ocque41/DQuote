import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { requireUser } from "@/auth/requireUser";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Edit, MoreVertical, Package, Plus, Search, Trash2 } from "lucide-react";

import { getViewerContext } from "@/server/auth";
import { prisma } from "@/server/prisma";

export const metadata: Metadata = {
  title: "Items | DQuote",
};

export default async function ItemsPage() {
  const session = await requireUser({ returnTo: "/items" });

  if ("redirect" in session) {
    redirect(session.redirect);
  }

  const viewer = await getViewerContext(session.user);

  if (!viewer) {
    redirect("/login?redirect=/items");
  }

  let catalogItems: Awaited<ReturnType<typeof prisma.catalogItem.findMany>> = [];
  let databaseError = false;

  try {
    catalogItems = await prisma.catalogItem.findMany({
      where: {
        orgId: viewer.org.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  } catch (error) {
    console.error("Items page database error:", error);
    databaseError = true;
  }

  if (databaseError) {
    return (
      <AppShell
        viewer={viewer}
        title="Catalog Items"
        subtitle="Manage your product and service catalog for proposals."
        contentClassName="items-center justify-center gap-4 text-center"
      >
        <h1 className="text-2xl font-semibold">Database connection issue</h1>
        <p className="max-w-2xl text-muted-foreground">
          We&apos;re having trouble loading your catalog items. Please try refreshing the page.
        </p>
      </AppShell>
    );
  }

  const formatCurrency = (value: number, currency = "EUR") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <AppShell
      viewer={viewer}
      title="Catalog Items"
      subtitle="Manage your product and service catalog for proposals."
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search items..." className="pl-9" />
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Item
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Catalog Items ({catalogItems.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {catalogItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Package className="mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold">No items yet</h3>
              <p className="mb-4 max-w-md text-muted-foreground">
                Start building your catalog by adding products and services that you can include in proposals.
              </p>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Item
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto lg:overflow-x-visible">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Tags</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {catalogItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="max-w-[300px]">
                        <div className="truncate text-muted-foreground">{item.description || "—"}</div>
                      </TableCell>
                      <TableCell>
                        {formatCurrency(Number(item.unitPrice), item.currency)}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {item.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {item.tags.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{item.tags.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={item.active ? "default" : "outline"}>
                          {item.active ? "active" : "inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                              <span className="sr-only">Open menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Item
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Package className="mr-2 h-4 w-4" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Item
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {catalogItems.length > 0 && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Total Items</span>
              </div>
              <div className="mt-2 text-2xl font-bold">{catalogItems.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Active Items</span>
              </div>
              <div className="mt-2 text-2xl font-bold">
                {catalogItems.filter((item) => item.active).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Inactive Items</span>
              </div>
              <div className="mt-2 text-2xl font-bold">
                {catalogItems.filter((item) => !item.active).length}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </AppShell>
  );
}
