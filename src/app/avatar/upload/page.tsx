'use client';

import type { PutBlobResult } from '@vercel/blob';
import { useRef, useState } from 'react';

export default function AvatarUploadPage() {
  const inputFileRef = useRef<HTMLInputElement>(null);
  const [blob, setBlob] = useState<PutBlobResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col gap-6 px-6 py-12">
      <section className="space-y-2 text-center">
        <h1 className="text-3xl font-semibold">Upload Your Avatar</h1>
        <p className="text-sm text-muted-foreground">
          This demo routes files through the Next.js server before storing them in Vercel Blob. Server uploads are limited to
          4.5 MB.
        </p>
      </section>
      <form
        className="space-y-4 rounded-lg border border-border bg-card p-6 shadow"
        onSubmit={async (event) => {
          event.preventDefault();

          if (!inputFileRef.current?.files?.length) {
            setError('Please choose an image before uploading.');
            return;
          }

          const file = inputFileRef.current.files[0];

          setIsSubmitting(true);
          setError(null);
          try {
            const response = await fetch(`/api/avatar/upload?filename=${encodeURIComponent(file.name)}`, {
              method: 'POST',
              body: file,
            });

            if (!response.ok) {
              const body = await response.json().catch(() => ({}));
              throw new Error(body?.error ?? 'Upload failed');
            }

            const newBlob = (await response.json()) as PutBlobResult;
            setBlob(newBlob);
          } catch (err) {
            setBlob(null);
            setError(err instanceof Error ? err.message : 'Upload failed');
          } finally {
            setIsSubmitting(false);
          }
        }}
      >
        <div className="space-y-2">
          <label className="block text-sm font-medium" htmlFor="avatar">
            Avatar image
          </label>
          <input
            className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
            id="avatar"
            name="file"
            ref={inputFileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            required
          />
          <p className="text-xs text-muted-foreground">
            Accepted formats: JPEG, PNG, or WebP. Max size 4.5 MB for server uploads.
          </p>
        </div>
        <button
          className="w-full rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Uploading…' : 'Upload'}
        </button>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </form>
      {blob && (
        <div className="space-y-1 rounded-lg border border-border bg-card p-4 text-sm">
          <p className="font-medium">Upload complete!</p>
          <p>
            Blob URL:{' '}
            <a className="text-primary underline" href={blob.url} rel="noreferrer" target="_blank">
              {blob.url}
            </a>
          </p>
        </div>
      )}
    </main>
  );
}
