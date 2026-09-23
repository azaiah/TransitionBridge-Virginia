'use client';

import { useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ExplainThis } from '@/components/ui/ExplainThis';
import { CURRENT_PERIOD, demoData, getVendorById } from '@/data';
import { referrals } from '@/data/records';
import { serviceRecords } from '@/data/services';
import { explain } from '@/lib/definitions';
import { periodsInCurrentFederalFy } from '@/lib/fiscal';
import {
  RSA911_COLUMNS,
  buildRsa911Rows,
  rsa911RowValues,
  toRsa911Csv,
} from '@/lib/rsa911';

const PREVIEW_ROWS = 20;

/** Which quarter a service date falls in. Kept local so the component stays self-contained. */
function periodOf(iso: string): string {
  const date = new Date(iso);
  return `${date.getUTCFullYear()}-Q${Math.floor(date.getUTCMonth() / 3) + 1}`;
}

/**
 * Builds the RSA-911 aligned file for a chosen district and quarter, shows the first rows
 * so nobody downloads blind, and exports the rest as CSV.
 */
export function Rsa911Export() {
  const [districtId, setDistrictId] = useState<string>('all');
  const [period, setPeriod] = useState<string>(CURRENT_PERIOD);

  const referralById = useMemo(() => new Map(referrals.map((r) => [r.id, r])), []);

  const rows = useMemo(() => {
    const scoped = serviceRecords.filter((service) => {
      if (periodOf(service.serviceDate) !== period) return false;
      if (districtId === 'all') return true;
      return referralById.get(service.referralId)?.darsDistrictId === districtId;
    });

    return buildRsa911Rows(scoped, referralById, (vendorId, deliveredInHouse) => {
      if (deliveredInHouse) return 'DARS (delivered in house)';
      return vendorId ? (getVendorById(vendorId)?.name ?? 'Unknown provider') : 'Unknown provider';
    });
  }, [districtId, period, referralById]);

  function download() {
    const blob = new Blob([toRsa911Csv(rows)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `rsa-911-aligned-${districtId}-${period}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  const fyPeriods = periodsInCurrentFederalFy(demoData.periods);

  return (
    <div className="space-y-6">
      <div className="rounded-card border border-line bg-surface p-[var(--tb-card-pad)] shadow-sm">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="export-district" className="meta-label block">
              DARS district
            </label>
            <select
              id="export-district"
              value={districtId}
              onChange={(e) => setDistrictId(e.target.value)}
              className="mt-2 w-full rounded-control border border-line bg-surface px-3 py-2 text-body text-ink"
            >
              <option value="all">All districts</option>
              {demoData.districts.map((district) => (
                <option key={district.id} value={district.id}>
                  {district.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="export-period" className="meta-label block">
              Quarter
            </label>
            <select
              id="export-period"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="mt-2 w-full rounded-control border border-line bg-surface px-3 py-2 text-body text-ink"
            >
              {demoData.periods.map((p) => (
                <option key={p} value={p}>
                  {p}
                  {fyPeriods.includes(p) ? ' — current fiscal year' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button variant="primary" onClick={download} disabled={rows.length === 0}>
            <Download className="h-4 w-4" aria-hidden="true" />
            Download {rows.length.toLocaleString()} service records
          </Button>
          <p aria-live="polite" className="text-caption text-ink-2">
            {rows.length.toLocaleString()} rows match this selection.
          </p>
        </div>
      </div>

      <section aria-labelledby="export-preview">
        <div className="flex items-start gap-2">
          <h2 id="export-preview" className="text-h3 text-ink">
            First {Math.min(PREVIEW_ROWS, rows.length)} rows
          </h2>
          <ExplainThis {...explain('rsa911Export')} />
        </div>

        {rows.length === 0 ? (
          <EmptyState
            className="mt-3"
            title="No service records in this selection"
            description="No Pre-ETS services were delivered in that district during that quarter. Choose a different quarter or select all districts."
          />
        ) : (
          <div className="mt-3 overflow-x-auto rounded-table border border-line bg-surface">
            <table className="w-full min-w-[900px] border-collapse text-caption">
              <caption className="sr-only">
                Preview of the RSA-911 aligned export. Demonstration data.
              </caption>
              <thead className="bg-surface-sunken">
                <tr>
                  {RSA911_COLUMNS.map((header) => (
                    <th
                      key={header}
                      scope="col"
                      className="border-b border-line px-3 py-2 text-left text-label font-semibold text-ink-2"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, PREVIEW_ROWS).map((row, index) => (
                  <tr key={`${row.recordIdentifier}-${index}`} className="border-b border-line-hair">
                    {rsa911RowValues(row).map((value, cellIndex) => (
                      <td key={cellIndex} className="whitespace-nowrap px-3 py-2 tabular text-ink">
                        {value}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
