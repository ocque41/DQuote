import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { requireUser } from "@/auth/requireUser";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { getViewerContext } from "@/server/auth";

export const metadata: Metadata = {
  title: "Settings | DQuote",
};

export default async function SettingsPage() {
  const session = await requireUser({ returnTo: "/settings" });

  if ("redirect" in session) {
    redirect(session.redirect);
  }

  const viewer = await getViewerContext(session.user);

  if (!viewer) {
    redirect("/login?redirect=/settings");
  }

  return (
    <AppShell
      viewer={viewer}
      title="Settings"
      subtitle="Manage your organization preferences and account settings."
    >
      <Card>
        <CardHeader>
          <CardTitle>Organization</CardTitle>
          <CardDescription>
            Manage your organization profile and general settings.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="org-name">Organization Name</Label>
              <Input
                id="org-name"
                placeholder="Enter organization name"
                defaultValue={viewer.org.name}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="org-slug">Organization Slug</Label>
              <Input
                id="org-slug"
                placeholder="organization-slug"
                defaultValue={viewer.org.slug}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="org-description">Description</Label>
            <Textarea
              id="org-description"
              placeholder="Tell us about your organization..."
              className="min-h-[100px]"
            />
          </div>
          <Button>Save Organization Settings</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Proposal Settings</CardTitle>
          <CardDescription>
            Configure default settings for your proposals and quotes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="default-currency">Default Currency</Label>
              <Input id="default-currency" defaultValue="EUR" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="proposal-expiry">Default Expiry (days)</Label>
              <Input
                id="proposal-expiry"
                type="number"
                defaultValue="30"
                placeholder="30"
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Email Notifications</Label>
                <div className="text-sm text-muted-foreground">
                  Receive email notifications when proposals are viewed or accepted.
                </div>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Analytics Tracking</Label>
                <div className="text-sm text-muted-foreground">
                  Track detailed analytics for proposal interactions.
                </div>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Auto-save Drafts</Label>
                <div className="text-sm text-muted-foreground">
                  Automatically save proposal drafts while editing.
                </div>
              </div>
              <Switch defaultChecked />
            </div>
          </div>

          <Button>Save Proposal Settings</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Branding</CardTitle>
          <CardDescription>
            Customize the appearance of your proposals with your brand colors and logo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="primary-color">Primary Color</Label>
              <div className="flex gap-2">
                <Input
                  id="primary-color"
                  type="color"
                  defaultValue="#22c55e"
                  className="h-10 w-16 p-1"
                />
                <Input defaultValue="#22c55e" placeholder="#22c55e" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="secondary-color">Secondary Color</Label>
              <div className="flex gap-2">
                <Input
                  id="secondary-color"
                  type="color"
                  defaultValue="#16a34a"
                  className="h-10 w-16 p-1"
                />
                <Input defaultValue="#16a34a" placeholder="#16a34a" />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="logo-url">Logo URL</Label>
            <Input
              id="logo-url"
              placeholder="https://example.com/logo.png"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="brand-font">Brand Font</Label>
            <Input
              id="brand-font"
              placeholder="Inter, Work Sans, etc."
            />
          </div>

          <Button>Save Branding Settings</Button>
        </CardContent>
      </Card>
    </AppShell>
  );
}
