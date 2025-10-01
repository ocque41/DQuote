import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { requireUser } from "@/auth/requireUser";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  mainNavigation,
  resourceNavigation,
  secondaryNavigation,
} from "@/lib/navigation";
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
    <SidebarProvider>
      <AppSidebar
        variant="inset"
        orgName={viewer.org.name}
        navMain={mainNavigation}
        resources={resourceNavigation}
        navSecondary={secondaryNavigation}
        user={{
          name: viewer.sessionUser.name,
          email: viewer.sessionUser.email,
        }}
      />
      <SidebarInset className="bg-muted/20 min-w-0">
        <SiteHeader
          title="Settings"
          subtitle="Manage your organization preferences and account settings."
          orgName={viewer.org.name}
        />
        <div className="flex flex-1 flex-col gap-6 px-3 py-4 sm:px-4 sm:py-4 lg:px-6 xl:px-8 2xl:px-10 max-w-[min(100%,theme(screens.4xl))] mx-auto w-full">
          {/* Organization Settings */}
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

          {/* Proposal Settings */}
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

          {/* Branding Settings */}
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
                      className="w-16 h-10 p-1"
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
                      className="w-16 h-10 p-1"
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
                  type="url"
                />
                <div className="text-sm text-muted-foreground">
                  Recommended size: 200x60px. Supports PNG, JPG, and SVG formats.
                </div>
              </div>

              <Button>Save Branding Settings</Button>
            </CardContent>
          </Card>

          {/* Integration Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Integrations</CardTitle>
              <CardDescription>
                Connect your external services and configure API settings.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <div className="font-medium">Stripe Payment Processing</div>
                    <div className="text-sm text-muted-foreground">
                      Process payments through Stripe Checkout
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-sm text-green-600">Connected</div>
                    <Switch defaultChecked />
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <div className="font-medium">Email Service (SMTP)</div>
                    <div className="text-sm text-muted-foreground">
                      Send proposal notifications and receipts
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-sm text-green-600">Connected</div>
                    <Switch defaultChecked />
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <div className="font-medium">Vercel Blob Storage</div>
                    <div className="text-sm text-muted-foreground">
                      Store proposal assets and generated PDFs
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-sm text-green-600">Connected</div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </div>

              <Button variant="outline">Manage Integrations</Button>
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}