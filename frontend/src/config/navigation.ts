export const navItems = [
  { href: "/", label: "Dashboard" },
  { href: "/portfolios", label: "Portfolios" },
  { href: "/watchlist", label: "Watchlist" },
] as const;

export type NavItem = (typeof navItems)[number];
