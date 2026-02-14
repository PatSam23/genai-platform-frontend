"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore, useAuthActions } from "@/lib/store/authStore";
import { useEffect, useState } from "react";
import { LogOut, User } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const { logout, checkAuth } = useAuthActions();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch by waiting for mount
  useEffect(() => {
    setMounted(true);
    checkAuth();
  }, [checkAuth]);

  const isActive = (path: string) => pathname === path;

  // Don't show navbar on login/register pages
  if (pathname === '/login' || pathname === '/register') return null;

  return (
    <nav className="h-16 bg-white border-b border-zinc-300 flex items-center justify-between px-8 sticky top-0 z-50 shadow-sm">
      <div className="flex items-center gap-3">
        <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 bg-zinc-800 rounded-lg flex items-center justify-center text-white font-bold text-lg">
            G
          </div>
          <span className="font-bold text-xl tracking-tight text-zinc-800">
            GenAI Platform
          </span>
        </Link>
      </div>

      <div className="flex gap-2 items-center">
        {mounted && isAuthenticated ? (
          <>
            <NavLink href="/" active={isActive("/")}>Chat</NavLink>
            <NavLink href="/rag" active={isActive("/rag")}>RAG Manager</NavLink>
            
            <div className="h-6 w-px bg-zinc-200 mx-2"></div>
            
            <div className="flex items-center gap-3 px-3">
              <div className="flex items-center gap-2 text-sm font-medium text-zinc-600">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                  <User className="w-4 h-4" />
                </div>
                <span className="hidden md:inline">{user?.email || 'User'}</span>
              </div>
              
              <button 
                onClick={() => logout()}
                className="p-2 text-zinc-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </>
        ) : (
          mounted && (
            <>
              <Link
                href="/login"
                className="px-5 py-2.5 rounded-lg text-base font-medium text-zinc-600 hover:text-zinc-900 transition-colors"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="px-5 py-2.5 rounded-lg text-base font-medium bg-zinc-900 text-white hover:bg-zinc-800 transition-colors shadow-sm"
              >
                 Get Started
              </Link>
            </>
          )
        )}
      </div>
    </nav>
  );
}

function NavLink({ href, children, active }: { href: string; children: React.ReactNode; active: boolean }) {
  return (
    <Link
      href={href}
      className={`px-5 py-2.5 rounded-lg text-base font-medium transition-all duration-200 border ${
        active
          ? "bg-zinc-100 text-zinc-900 border-zinc-300 shadow-sm"
          : "text-zinc-500 border-transparent hover:bg-zinc-50 hover:text-zinc-900"
      }`}
    >
      {children}
    </Link>
  );
}