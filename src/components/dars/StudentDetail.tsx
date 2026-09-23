'use client';

import Link from 'next/link';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { DataTable } from '@/components/ui/DataTable';
import type { Student, ServiceRecord } from '@/data/types';
import { ACTIVITY_LABELS } from '@/data/types';
import { getVendorById } from '@/data';
import { formatDate, formatFullDate } from '@/lib/dates';

export function StudentDetail({ student, services }: { student: Student; services: ServiceRecord[] }) {
  const sortedServices = [...services].sort((a, b) => Date.parse(b.serviceDate) - Date.parse(a.serviceDate));

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6">
        <Link href="/dars/students" className="inline-flex items-center gap-1 text-label text-ink-3 hover:text-ink">
          <ArrowLeft className="h-4 w-4" />
          Back to students
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-h1 text-ink">{student.displayName}</h1>
          <p className="mt-1 text-body text-ink-2">
            ID: {student.id} · Age {student.age}
          </p>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <section className="rounded-card border border-line bg-surface p-6">
            <h2 className="text-h2 text-ink">Service history</h2>
            <div className="mt-6">
              {sortedServices.length === 0 ? (
                <p className="text-body text-ink-3">No services recorded yet.</p>
              ) : (
                <DataTable
                  columns={[
                    {
                      key: 'date',
                      header: 'Date',
                      render: (r) => (
                        <time dateTime={r.serviceDate} title={formatFullDate(r.serviceDate)}>
                          {formatDate(r.serviceDate)}
                        </time>
                      ),
                      sortValue: (r) => r.serviceDate,
                    },
                    {
                      key: 'activity',
                      header: 'Activity',
                      render: (r) => ACTIVITY_LABELS[r.activity],
                      sortValue: (r) => r.activity,
                    },
                    {
                      key: 'provider',
                      header: 'Provider',
                      render: (r) => {
                        if (r.deliveredInHouse) return 'DARS (In-house)';
                        if (r.vendorId) return getVendorById(r.vendorId)?.name ?? 'Unknown provider';
                        return 'Unknown';
                      },
                      sortValue: (r) => r.deliveredInHouse ? 'DARS' : (r.vendorId ?? ''),
                    },
                    {
                      key: 'duration',
                      header: 'Duration',
                      render: (r) => `${r.durationMinutes} min`,
                      sortValue: (r) => r.durationMinutes,
                      numeric: true,
                    },
                  ]}
                  rows={sortedServices}
                  rowKey={(r) => r.id}
                  csvFilename={`services-${student.id}.csv`}
                  caption="Services delivered to this student"
                />
              )}
            </div>
          </section>
        </div>

        <div className="space-y-8">
          <section className="rounded-card border border-line bg-surface p-6">
            <h2 className="text-h2 text-ink">RSA-911 Summary</h2>
            <p className="mt-1 text-caption text-ink-3">Federal reporting fields (Illustrative)</p>
            
            <dl className="mt-6 space-y-4">
              <div>
                <dt className="text-caption text-ink-3">Age at application</dt>
                <dd className="mt-1 text-label font-medium text-ink">
                  {student.age}
                </dd>
              </div>
              <div>
                <dt className="text-caption text-ink-3">Gender</dt>
                <dd className="mt-1 text-label font-medium text-ink">
                  Did not self-identify
                </dd>
              </div>
              <div>
                <dt className="text-caption text-ink-3">Race / Ethnicity</dt>
                <dd className="mt-1 text-label font-medium text-ink">
                  Not reported
                </dd>
              </div>
              <div>
                <dt className="text-caption text-ink-3">Student with a disability</dt>
                <dd className="mt-1 text-label font-medium text-ink">
                  Yes (Pre-ETS eligible)
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-card border border-line bg-surface p-6">
            <h2 className="text-h2 text-ink">Documents</h2>
            <ul className="mt-4 space-y-3">
              <li className="flex items-center gap-3 text-body text-ink">
                <CheckCircle2 className="h-5 w-5 text-ok" />
                <span>Eligibility documentation</span>
              </li>
              <li className="flex items-center gap-3 text-body text-ink">
                <CheckCircle2 className="h-5 w-5 text-ok" />
                <span>Consent to participate</span>
              </li>
              <li className="flex items-center gap-3 text-body text-ink-3">
                <div className="h-5 w-5 rounded-full border-2 border-line" />
                <span>Release of information (Schools)</span>
              </li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
