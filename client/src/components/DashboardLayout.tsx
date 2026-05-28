import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Users,
  TrendingUp,
  HelpCircle,
  FileText,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Bell,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { useQueryClient } from "@tanstack/react-query";
import ClientSelector from "./ClientSelector";

const navItems = [
  { path: "/", label: "Home", icon: LayoutDashboard },
  { path: "/clients", label: "Clients", icon: Users },
  { path: "/performance", label: "Performance", icon: TrendingUp },
  { path: "/quiz", label: "Quiz Management", icon: HelpCircle },
  { path: "/reports", label: "Reports", icon: FileText },
  { path: "/settings", label: "Settings", icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [location] = useLocation();
  const queryClient = useQueryClient();
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      queryClient.clear();
      window.location.href = "/";
    },
  });

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside
        className={cn(
          "flex flex-col bg-white border-r border-gray-200 transition-all duration-300 z-20",
          collapsed ? "w-16" : "w-60"
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-100 min-h-[64px]">
          <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-gray-900 leading-tight">Swiss Digital</p>
              <p className="text-xs text-gray-500 leading-tight">Solutions</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 overflow-y-auto">
          <ul className="space-y-1 px-2">
            {navItems.map(({ path, label, icon: Icon }) => {
              const isActive = location === path;
              return (
                <li key={path}>
                  <Link href={path}>
                    <span
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer",
                        isActive
                          ? "bg-blue-50 text-blue-700"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      )}
                    >
                      <Icon className={cn("flex-shrink-0", collapsed ? "w-5 h-5" : "w-4 h-4")} />
                      {!collapsed && <span>{label}</span>}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Logout */}
        <div className="px-2 pb-4 border-t border-gray-100 pt-3">
          <button
            onClick={() => logoutMutation.mutate()}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors w-full",
            )}
          >
            <LogOut className={cn("flex-shrink-0", collapsed ? "w-5 h-5" : "w-4 h-4")} />
            {!collapsed && <span>Déconnexion</span>}
          </button>
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute left-0 top-1/2 -translate-y-1/2 translate-x-full bg-white border border-gray-200 rounded-full p-1 shadow-sm hover:bg-gray-50 z-30"
          style={{ left: collapsed ? "3.5rem" : "14.5rem" }}
        >
          {collapsed ? (
            <ChevronRight className="w-3 h-3 text-gray-500" />
          ) : (
            <ChevronLeft className="w-3 h-3 text-gray-500" />
          )}
        </button>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-blue-600 text-white px-6 py-3 flex items-center justify-between min-h-[64px] shadow-sm">
          <div className="flex items-center gap-4">
            <h1 className="text-base font-semibold">Local Reputation Hub — Admin Panel</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded font-medium flex items-center gap-1">
              <Shield className="w-3 h-3" /> Confidential
            </span>
            <button className="relative p-1.5 rounded-lg hover:bg-blue-500 transition-colors">
              <Bell className="w-4 h-4" />
            </button>
            <div className="w-7 h-7 bg-blue-400 rounded-full flex items-center justify-center text-xs font-bold">
              V
            </div>
          </div>
        </header>

        {/* Client selector bar */}
        <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-4">
          <ClientSelector />
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
}
