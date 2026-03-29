"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  FolderTree,
  Tags,
  Image as ImageIcon,
  FileText,
  Newspaper,
  Megaphone,
  Settings,
  Menu,
  X,
  ChevronRight,
  LogOut,
  Bell,
  Search,
  Sparkles,
} from "lucide-react";
import { Input } from "@/components/ui/input";

const sidebarLinks = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/categories", label: "Categories", icon: FolderTree },
  { href: "/admin/brands", label: "Brands", icon: Tags },
  { href: "/admin/hero-slides", label: "Hero Slides", icon: ImageIcon },
  { href: "/admin/banners", label: "Banners", icon: ImageIcon },
  { href: "/admin/pages", label: "Pages", icon: FileText },
  { href: "/admin/news", label: "News & Blog", icon: Newspaper },
  { href: "/admin/promotions", label: "Promotions", icon: Megaphone },
  { href: "/admin/ai-tools", label: "AI Tools", icon: Sparkles },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [adminUser, setAdminUser] = useState<{ name: string; email: string } | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(d => {
      if (d.user && d.user.role === "admin") {
        setAdminUser({ name: d.user.name, email: d.user.email });
      } else {
        router.replace("/account?redirect=/admin");
      }
    }).catch(() => {
      router.replace("/account?redirect=/admin");
    }).finally(() => setAuthChecked(true));
  }, [router]);

  if (!authChecked || !adminUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text-muted text-sm">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-primary text-white fixed h-full z-30">
        <div className="p-5 border-b border-white/10">
          <Link href="/admin" className="flex items-center gap-3">
            <Image src="/logo.png" alt="Intact Ghana" width={120} height={40} className="h-8 w-auto brightness-0 invert" />
          </Link>
          <p className="text-xs text-white/50 mt-1">Content Management System</p>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <div className="space-y-1">
            {sidebarLinks.map((link) => {
              const isActive = pathname === link.href || (link.href !== "/admin" && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? "bg-accent text-white shadow-md"
                      : "text-white/70 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <link.icon className="w-4.5 h-4.5 shrink-0" />
                  {link.label}
                  {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="p-4 border-t border-white/10">
          <Link href="/" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/10 transition-all">
            <LogOut className="w-4 h-4" />
            Back to Store
          </Link>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed left-0 top-0 h-full w-64 bg-primary text-white z-50 lg:hidden overflow-y-auto"
            >
              <div className="p-5 flex items-center justify-between border-b border-white/10">
                <Image src="/logo.png" alt="Intact Ghana" width={120} height={40} className="h-8 w-auto brightness-0 invert" />
                <button onClick={() => setSidebarOpen(false)}>
                  <X className="w-5 h-5 text-white/60" />
                </button>
              </div>
              <nav className="py-4 px-3 space-y-1">
                {sidebarLinks.map((link) => {
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        isActive ? "bg-accent text-white" : "text-white/70 hover:text-white hover:bg-white/10"
                      }`}
                    >
                      <link.icon className="w-4.5 h-4.5" />
                      {link.label}
                    </Link>
                  );
                })}
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 lg:ml-64">
        {/* Top Bar */}
        <header className="bg-white border-b border-border sticky top-0 z-20">
          <div className="flex items-center justify-between px-4 md:px-6 h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 hover:bg-surface rounded-lg"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="hidden md:block relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <Input
                  placeholder="Search anything..."
                  className="pl-10 w-72 rounded-full bg-surface border-0 text-sm"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button className="relative p-2 hover:bg-surface rounded-lg transition-colors">
                <Bell className="w-5 h-5 text-text-muted" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-accent rounded-full" />
              </button>
              <div className="flex items-center gap-3 pl-3 border-l border-border">
                <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center text-white text-sm font-bold">
                  A
                </div>
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-text">Admin</p>
                  <p className="text-xs text-text-muted">admin@intactghana.com</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
