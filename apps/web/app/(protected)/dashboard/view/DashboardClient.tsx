import type { Dictionary } from '@/lib/i18n';
import type { DashboardSummary } from '../types';

interface DashboardClientProps {
  dict: Dictionary['dashboard'];
  summary: DashboardSummary;
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-line bg-surface-card p-4">
      <div className="text-xs text-ink-muted">{label}</div>
      <div className="text-[23px] font-semibold text-ink">{value}</div>
    </div>
  );
}

function occupancyBarColor(currentCount: number, maxCapacity: number): string {
  const ratio = maxCapacity > 0 ? currentCount / maxCapacity : 0;
  return ratio >= 0.8 ? 'bg-badge-warning-bg' : 'bg-btn-primary-bg';
}

export default function DashboardClient({ dict, summary }: DashboardClientProps) {
  return (
    <main className="flex flex-1 flex-col gap-4 bg-surface-page p-6">
      <h1 className="text-2xl font-semibold text-ink">{dict.title}</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label={dict.metricActiveStudents} value={summary.activeStudentsCount} />
        <MetricCard label={dict.metricActiveEmployees} value={summary.activeEmployeesCount} />
        <MetricCard
          label={`${dict.metricClasses} (${summary.currentSchoolYear})`}
          value={summary.currentYearClassesCount}
        />
        <MetricCard label={dict.metricActiveEnrollments} value={summary.activeEnrollmentsCount} />
      </div>

      <div className="rounded-xl border border-line bg-surface-card p-4">
        <h2 className="mb-3 text-sm font-medium text-ink">
          {dict.occupancyTitle} — {summary.currentSchoolYear}
        </h2>

        {summary.classOccupancy.length === 0 ? (
          <p className="text-sm text-ink-muted">{dict.occupancyEmpty}</p>
        ) : (
          <div className="flex flex-col gap-3">
            {summary.classOccupancy.map((schoolClass) => {
              const ratio =
                schoolClass.maxCapacity > 0
                  ? Math.min(schoolClass.currentCount / schoolClass.maxCapacity, 1)
                  : 0;

              return (
                <div key={schoolClass.id} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-ink">{schoolClass.name}</span>
                    <span className="text-ink-muted">
                      {schoolClass.currentCount}/{schoolClass.maxCapacity}
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-surface-row-header">
                    <div
                      className={`h-full rounded-full transition-all ${occupancyBarColor(schoolClass.currentCount, schoolClass.maxCapacity)}`}
                      style={{ width: `${ratio * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-line bg-surface-card p-4">
        <h2 className="mb-3 text-sm font-medium text-ink">{dict.recentEnrollmentsTitle}</h2>

        {summary.recentEnrollments.length === 0 ? (
          <p className="text-sm text-ink-muted">{dict.recentEnrollmentsEmpty}</p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-line">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-row-header text-ink-muted">
                <tr>
                  <th className="px-3 py-2 font-medium">{dict.columnStudent}</th>
                  <th className="px-3 py-2 font-medium">{dict.columnClass}</th>
                  <th className="px-3 py-2 font-medium">{dict.columnStartDate}</th>
                </tr>
              </thead>
              <tbody>
                {summary.recentEnrollments.map((enrollment, index) => (
                  <tr key={index} className="border-t border-line">
                    <td className="px-3 py-2 text-ink">{enrollment.studentName}</td>
                    <td className="px-3 py-2 text-ink-muted">{enrollment.className}</td>
                    <td className="px-3 py-2 text-ink-muted">
                      {enrollment.startDate.slice(0, 10)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
