export const navItems = [
  { href: "/", label: "Dashboard" },
  { href: "/portfolios", label: "Portfolios" },
] as const;

export type NavItem = (typeof navItems)[number];
