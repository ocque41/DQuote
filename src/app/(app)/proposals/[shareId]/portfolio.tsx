import Image from "next/image";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export type PortfolioAsset = {
  id: string;
  title?: string | null;
  type: string;
  url: string;
  tags?: string[];
};

export function PortfolioGrid({ assets }: { assets: PortfolioAsset[] }) {
  if (!assets.length) {
    return (
      <Card className="bg-muted/30 text-muted-foreground">
        <CardHeader>
          <CardTitle>No assets yet</CardTitle>
          <CardDescription>
            As you add catalog items and tag them, matching proof points will surface here automatically.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {assets.map((asset) => (
        <Card key={asset.id} className="overflow-hidden">
          <CardHeader className="space-y-1">
            <CardTitle className="text-base font-semibold">{asset.title ?? "Featured moment"}</CardTitle>
            <CardDescription className="capitalize">{asset.type}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {asset.type === "image" ? (
              <div className="relative h-48 w-full overflow-hidden rounded-xl">
                <Image src={`${asset.url}?auto=format&fit=crop&w=640&q=60`} alt={asset.title ?? "Portfolio asset"} fill className="object-cover" />
              </div>
            ) : (
              <div className="relative flex h-48 w-full items-center justify-center rounded-xl border border-dashed">
                <span className="text-sm text-muted-foreground">{asset.url}</span>
              </div>
            )}
            {asset.tags?.length ? (
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                {asset.tags.map((tag) => (
                  <span key={tag} className="rounded-full bg-muted px-2 py-1">
                    #{tag}
                  </span>
                ))}
              </div>
            ) : null}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
