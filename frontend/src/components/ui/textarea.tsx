import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-md border border-[hsl(var(--input))] bg-transparent px-3 py-2 text-base shadow-sm",
          "text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))]",
          "outline-none focus-visible:ring-1 focus-visible:ring-[hsl(var(--ring))]",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "md:text-sm resize-none",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
