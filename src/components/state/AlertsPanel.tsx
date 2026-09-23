'use client';

import { AlertRow } from '@/components/ui/AlertRow';
import type { Alert } from '@/data/types';
import { getPersonaById } from '@/data';
import { ageDays } from '@/lib/metrics';

export function AlertsPanel({ alerts }: { alerts: Alert[] }) {
  if (alerts.length === 0) {
    return (
      <div className="rounded-card border border-line bg-surface p-8 text-center">
        <p className="text-body font-medium text-ink">No active alerts</p>
        <p className="mt-1 text-caption text-ink-2">All statewide metrics are within normal bounds.</p>
      </div>
    );
  }

  const sortedAlerts = [...alerts].sort((a, b) => {
    const severityWeight = { RISK: 3, WARN: 2, INFO: 1 };
    if (severityWeight[a.severity] !== severityWeight[b.severity]) {
      return severityWeight[b.severity] - severityWeight[a.severity];
    }
    return Date.parse(b.createdAt) - Date.parse(a.createdAt);
  });

  return (
    <section>
      <h2 className="text-h2 text-ink">Action required</h2>
      <div className="mt-4 flex flex-col gap-3">
        {sortedAlerts.map((alert) => {
          const owner = alert.ownerPersonaId ? getPersonaById(alert.ownerPersonaId) : null;
          const ownerLabel = owner ? `${owner.displayName} (${owner.title})` : 'Unassigned';
          
          const age = Math.round(ageDays({ submittedAt: alert.createdAt }));
          const ageLabel = age === 0 ? 'Today' : `${age}d ago`;

          return (
            <AlertRow
              key={alert.id}
              message={alert.message}
              severity={alert.severity}
              ageLabel={ageLabel}
              ownerLabel={ownerLabel}
              linkTo={alert.linkTo}
            />
          );
        })}
      </div>
    </section>
  );
}
