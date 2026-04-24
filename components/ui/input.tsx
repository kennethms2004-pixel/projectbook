import * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-12 w-full min-w-0 rounded-xl border border-[rgba(15,23,42,0.12)] bg-white px-4 py-3 text-base text-[#10213f] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_1px_3px_rgba(0,0,0,0.06)] outline-none transition-[border-color,box-shadow] placeholder:text-[#94a3b8] focus-visible:border-[#1e40af] focus-visible:ring-4 focus-visible:ring-[#1e40af]/10 disabled:cursor-not-allowed disabled:opacity-60",
        className
      )}
      {...props}
    />
  );
}

export { Input };
