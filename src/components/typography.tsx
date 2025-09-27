import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Eyebrow({
  className,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn(
        "text-primary text-xs font-semibold tracking-wide uppercase",
        className,
      )}
      {...props}
    />
  );
}

export function H1({
  className,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h1
      className={cn(
        "text-foreground text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl",
        className,
      )}
      {...props}
    />
  );
}

export function H2({
  className,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={cn(
        "text-foreground text-3xl font-semibold tracking-tight sm:text-4xl",
        className,
      )}
      {...props}
    />
  );
}

export function Lead({
  className,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn("text-muted-foreground text-lg sm:text-xl", className)}
      {...props}
    />
  );
}

export function Muted({
  className,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("text-muted-foreground text-sm", className)} {...props} />
  );
}
