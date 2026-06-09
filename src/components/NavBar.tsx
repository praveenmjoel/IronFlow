"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Calendar, Dumbbell, BarChart3, Utensils } from "lucide-react";

const NAV = [
  { href: "/",             label: "Home",       Icon: LayoutDashboard },
  { href: "/calendar",     label: "Calendar",   Icon: Calendar },
  { href: "/exercises",    label: "Exercises",  Icon: Dumbbell },
  { href: "/analytics",    label: "Analytics",  Icon: BarChart3 },
  { href: "/nutrition",    label: "Nutrition",  Icon: Utensils },
];

export default function NavBar() {
  const path = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-white/[0.06] pb-safe">
      <div className="max-w-lg mx-auto flex items-center justify-around px-2 py-2">
        {NAV.map(({ href, label, Icon }) => {
          const active = path === href || (href !== "/" && path.startsWith(href));
          return (
            <Link key={href} href={href} className={`nav-item ${active ? "active" : ""}`}>
              <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
