import type { Dictionary } from '@/lib/i18n';

interface DashboardClientProps {
  dict: Dictionary['dashboard'];
}

export default function DashboardClient({ dict }: DashboardClientProps) {
  return (
    <main className="flex flex-1 items-center justify-center bg-surface-page">
      <h1 className="text-3xl font-semibold tracking-tight text-ink">{dict.title}</h1>
    </main>
  );
}
