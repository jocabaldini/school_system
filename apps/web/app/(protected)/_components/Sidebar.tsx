'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Dictionary } from '@/lib/i18n';

interface SidebarProps {
  dict: Dictionary['sidebar'];
}

// Add each menu item alongside its module (Items 3-6 of the backlog) to avoid broken links.
const NAV_ITEMS = [
  { href: '/dashboard', label: 'dashboard' as const },
  { href: '/alunos', label: 'alunos' as const },
];

export default function Sidebar({ dict }: SidebarProps) {
  const pathname = usePathname();

  return (
    <nav className="flex h-screen w-56 shrink-0 flex-col bg-surface-sidebar">
      <div className="flex h-14 items-center justify-center">
        <Image
          src="/logo.png"
          alt="Recanto da Criança"
          width={900}
          height={287}
          className="h-10 w-auto"
          priority
        />
      </div>

      <ul className="flex flex-col gap-1 px-3 py-4">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`block rounded-md px-3 py-2 text-sm font-medium transition ${
                  isActive
                    ? 'bg-surface-sidebar-active text-ink-sidebar-active'
                    : 'text-ink-sidebar hover:bg-surface-sidebar-active/50'
                }`}
              >
                {dict[item.label]}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
