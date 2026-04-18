"use client";

import { RefreshCw } from "lucide-react";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";

type Props = {
  onRegenerate: () => Promise<void> | void;
  disabled?: boolean;
};

export function RegenerateButton({ onRegenerate, disabled }: Props) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      size="sm"
      variant="outline"
      disabled={disabled || isPending}
      onClick={() =>
        startTransition(async () => {
          await onRegenerate();
        })
      }
    >
      <RefreshCw
        className={isPending ? "size-4 animate-spin" : "size-4"}
      />
      Regenerate
    </Button>
  );
}
