"use client";

type Props = {
  src: string | null;
};

export function PdfIframe({ src }: Props) {
  if (!src) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        No PDF to display.
      </div>
    );
  }
  return (
    <iframe
      src={src}
      title="Quote PDF preview"
      className="h-full w-full border-0 bg-background"
    />
  );
}
