import Image from "next/image";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { PortfolioAsset } from "./types";

interface PortfolioPanelProps {
  assets: PortfolioAsset[];
  activeTags: string[];
}

export function PortfolioPanel({ assets, activeTags }: PortfolioPanelProps) {
  const visibleAssets = assets.slice(0, 4);
  const tagsToShow = activeTags.length ? activeTags : ["all"];

  return (
    <div className="space-y-4 rounded-2xl border bg-card/30 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium">Portfolio matches</p>
          <p className="text-xs text-muted-foreground">Refreshed automatically as you adjust your picks.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {tagsToShow.map((tag) => (
            <Badge key={tag} variant="secondary" className="capitalize">
              {tag}
            </Badge>
          ))}
        </div>
      </div>

      {visibleAssets.length ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {visibleAssets.map((asset) => (
            <Card key={asset.id} className="overflow-hidden">
              <CardHeader className="space-y-1">
                <CardTitle className="text-sm font-semibold">{asset.title ?? "Featured moment"}</CardTitle>
                <CardDescription className="capitalize text-xs">{asset.type}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {asset.type === "image" ? (
                  <div className="relative h-32 w-full overflow-hidden rounded-xl">
                    <Image
                      src={`${asset.url}?auto=format&fit=crop&w=640&q=60`}
                      alt={asset.title ?? "Portfolio asset"}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="relative flex h-32 w-full items-center justify-center rounded-xl border border-dashed">
                    <span className="text-xs text-muted-foreground">{asset.url}</span>
                  </div>
                )}
                {asset.tags?.length ? (
                  <div className="flex flex-wrap gap-1 text-[10px] text-muted-foreground">
                    {asset.tags.map((tag) => (
                      <span key={tag} className="rounded-full bg-muted px-2 py-0.5 capitalize">
                        #{tag}
                      </span>
                    ))}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-sm">No portfolio matches yet</CardTitle>
            <CardDescription className="text-xs">
              Select a package or add-on to unlock curated proof points.
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  );
}
