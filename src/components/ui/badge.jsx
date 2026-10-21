import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "../../lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-slate-900 text-slate-50 hover:bg-slate-800",
        secondary:
          "border-transparent bg-slate-100 text-slate-800 hover:bg-slate-200/80",
        destructive:
          "border-transparent bg-rose-50 text-rose-700 border-rose-200",
        outline: "text-slate-700 border-slate-200 bg-white",
        success: "border-emerald-200 bg-emerald-50 text-emerald-700",
        sky: "border-sky-200 bg-sky-50 text-sky-700",
        amber: "border-amber-200 bg-amber-50 text-amber-700"
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

function Badge({ className, variant, ...props }) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
