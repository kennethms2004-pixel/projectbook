"use client";

import {
  Show,
  SignInButton,
  SignUpButton,
  useUser,
  UserButton,
} from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/", label: "Library" },
  { href: "/books/new", label: "Add New" },
] as const;

function SignedInUser() {
  const { user, isLoaded } = useUser();
  const { firstName, lastName, fullName, username } = user ?? {};

  if (!isLoaded) {
    return null;
  }

  const name =
    fullName ||
    [firstName, lastName].filter(Boolean).join(" ").trim() ||
    username ||
    "Account";

  return (
    <div className="text-foreground/90 flex min-w-0 max-w-[10rem] items-center gap-2.5 sm:max-w-xs">
      <UserButton />
      <span className="truncate text-sm font-medium" title={name}>
        {name}
      </span>
    </div>
  );
}

export function Navbar() {
  const pathname = usePathname();

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full",
        "border-b border-border bg-[color-mix(in_oklab,var(--background)_88%,transparent)]",
        "backdrop-blur-md supports-[backdrop-filter]:bg-[color-mix(in_oklab,var(--background)_80%,transparent)]"
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="text-foreground flex items-center gap-2.5 font-sans font-bold transition-opacity hover:opacity-80"
        >
          <Image
            src="/assets/logo.png"
            alt="Bookified"
            width={42}
            height={26}
            className="h-[26px] w-auto"
            priority
          />
          <span className="text-lg font-bold tracking-tight not-underline sm:text-[1.05rem]">
            Bookified
          </span>
        </Link>

        <nav
          className="hidden items-center gap-0 md:flex"
          aria-label="Main"
        >
          {navLinks.map(({ href, label }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "rounded-none border-b-2 px-4 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "text-foreground border-foreground"
                    : "text-muted-foreground border-transparent hover:text-foreground"
                )}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <Show when="signed-out">
            <div className="flex items-center gap-2">
              <SignInButton mode="modal">
                <Button
                  variant="ghost"
                  size="sm"
                  className="hidden sm:inline-flex"
                >
                  Sign in
                </Button>
              </SignInButton>
              <SignUpButton mode="modal">
                <Button size="sm">Get started</Button>
              </SignUpButton>
            </div>
          </Show>
          <Show when="signed-in">
            <SignedInUser />
          </Show>
        </div>
      </div>

      <nav
        className="flex gap-1 overflow-x-auto border-t border-border px-4 py-2 md:hidden"
        aria-label="Mobile sections"
      >
        {navLinks.map(({ href, label }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "shrink-0 rounded-md px-3 py-1.5 text-sm font-medium",
                isActive
                  ? "text-foreground"
                  : "text-muted-foreground hover:bg-muted/60"
              )}
            >
              {label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
