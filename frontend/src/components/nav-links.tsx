"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import { navItems } from "@/config/navigation";
import { cn } from "@/lib/utils";

function isActivePath(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function NavLinks() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1">
      {navItems.map((item) => {
        const isActive = isActivePath(pathname, item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            prefetch
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              isActive && "bg-muted text-foreground",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
