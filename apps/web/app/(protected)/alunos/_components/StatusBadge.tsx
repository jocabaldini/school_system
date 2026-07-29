import type { StatusAluno } from '../types';

interface StatusBadgeProps {
  status: StatusAluno;
  activeLabel: string;
  inactiveLabel: string;
}

export function StatusBadge({ status, activeLabel, inactiveLabel }: StatusBadgeProps) {
  const isActive = status === 'ATIVO';

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
        isActive
          ? 'bg-badge-success-bg text-badge-success-ink'
          : 'bg-badge-danger-bg text-badge-danger-ink'
      }`}
    >
      {isActive ? activeLabel : inactiveLabel}
    </span>
  );
}
