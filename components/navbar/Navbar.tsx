"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();
  const isActive = (path: string) => pathname === path;

  return (
    <nav className="h-16 bg-white border-b border-zinc-300 flex items-center justify-between px-8 sticky top-0 z-50 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-zinc-800 rounded-lg flex items-center justify-center text-white font-bold text-lg">
          G
        </div>
        <span className="font-bold text-xl tracking-tight text-zinc-800">
          GenAI Platform
        </span>
      </div>

      <div className="flex gap-2">
        <NavLink href="/" active={isActive("/")}>Chat</NavLink>
        <NavLink href="/rag" active={isActive("/rag")}>RAG Manager</NavLink>
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