import * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-12 w-full min-w-0 rounded-xl border border-[rgba(33,42,59,0.12)] bg-white px-4 py-3 text-base text-[#2d251f] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_1px_3px_rgba(0,0,0,0.06)] outline-none transition-[border-color,box-shadow] placeholder:text-[#9a8f84] focus-visible:border-[#212a3b] focus-visible:ring-4 focus-visible:ring-[#212a3b]/10 disabled:cursor-not-allowed disabled:opacity-60",
        className
      )}
      {...props}
    />
  );
}

export { Input };
