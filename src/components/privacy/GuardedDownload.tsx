'use client';

import { useState } from 'react';
import { Download, Lock, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ROLE_NAMES, useViewer } from '@/context/useViewer';
import { EXPORT_PURPOSES, exportPolicy, type ExportKind } from '@/lib/access';
import { recordAudit } from '@/lib/session-store';
import { cn } from '@/lib/utils';

export interface GuardedDownloadProps {
  kind: ExportKind;
  filename: string;
  /** How many rows the file will hold, shown before anyone commits to downloading. */
  rowCount: number;
  /** Builds the CSV body only once the download is confirmed. */
  buildCsv: () => string;
  label?: string;
  /** The trigger's look. Ghost in table toolbars; primary where downloading is the job. */
  variant?: 'ghost' | 'secondary' | 'primary';
  disabled?: boolean;
  className?: string;
}

function stamp(): string {
  return new Date().toISOString().replace('T', ' ').slice(0, 16);
}

/**
 * Every download in the product goes through here. Nobody can "just take" data off a
 * dashboard: the file's contents are stated up front, a reason is required, names are never
 * included, the file is stamped with who took it and why, and the download is written to
 * the audit trail. Provider accounts cannot download student lists at all.
 */
export function GuardedDownload({
  kind,
  filename,
  rowCount,
  buildCsv,
  label = 'CSV',
  variant = 'ghost',
  disabled,
  className,
}: GuardedDownloadProps) {
  const viewer = useViewer();
  const policy = exportPolicy(viewer.role, kind);
  const [open, setOpen] = useState(false);
  const [purpose, setPurpose] = useState<string>(EXPORT_PURPOSES[0]);

  function openDialog() {
    setOpen(true);
    if (!policy.allowed && viewer.role && viewer.persona) {
      recordAudit({
        actorRole: viewer.role,
        actorPersonaId: viewer.persona.id,
        action: 'EXPORT_REFUSED',
        subject: filename,
        detail: `${rowCount.toLocaleString()} rows requested`,
      });
    }
  }

  function download() {
    if (!policy.allowed) return;
    const who = viewer.persona
      ? `${viewer.persona.displayName} (${viewer.role ? ROLE_NAMES[viewer.role] : 'viewer'})`
      : 'Unknown viewer';
    const watermark = `"Exported by ${who} on ${stamp()} UTC. Purpose: ${purpose}. DEMONSTRATION DATA: synthetic records only. Do not redistribute."`;
    const blob = new Blob([`${watermark}\n${buildCsv()}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);

    if (viewer.role && viewer.persona) {
      recordAudit({
        actorRole: viewer.role,
        actorPersonaId: viewer.persona.id,
        action: 'EXPORT_DOWNLOADED',
        subject: filename,
        reason: purpose,
        detail: `${rowCount.toLocaleString()} rows · ${kind === 'records' ? 'student-level, names removed' : 'totals only'}`,
      });
    }
    setOpen(false);
  }

  return (
    <>
      <Button
        variant={variant}
        onClick={openDialog}
        disabled={disabled}
        className={cn(variant === 'ghost' && '!px-3 !py-1.5 text-caption', className)}
        data-coach="download"
      >
        {policy.allowed ? (
          <Download className="h-4 w-4" aria-hidden="true" />
        ) : (
          <Lock className="h-4 w-4" aria-hidden="true" />
        )}
        {label}
        <span className="sr-only">
          {policy.allowed ? ` — download ${filename}` : ' — downloads are restricted for this account'}
        </span>
      </Button>

      <Modal
        open={open}
        title={policy.allowed ? 'Download this list?' : 'This list can’t be downloaded'}
        description={policy.explanation}
        onClose={() => setOpen(false)}
        footer={
          policy.allowed ? (
            <>
              <Button variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={download}>
                <Download className="h-4 w-4" aria-hidden="true" />
                Download {rowCount.toLocaleString()} {rowCount === 1 ? 'row' : 'rows'}
              </Button>
            </>
          ) : (
            <Button variant="primary" onClick={() => setOpen(false)}>
              Got it
            </Button>
          )
        }
      >
        {policy.allowed ? (
          <div className="space-y-4">
            <ul className="space-y-2 rounded-control bg-surface-sunken p-3 text-caption text-ink-2">
              <li className="flex items-start gap-2">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-ok" aria-hidden="true" />
                <span>
                  <span className="font-medium text-ink">{filename}</span> ·{' '}
                  {rowCount.toLocaleString()} {rowCount === 1 ? 'row' : 'rows'}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-ok" aria-hidden="true" />
                <span>
                  {kind === 'records'
                    ? 'No student names. Students appear by Transition ID only.'
                    : 'Totals only. No individual student is in this file.'}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-ok" aria-hidden="true" />
                <span>Stamped with your name, the time, and your reason, and recorded in the audit trail.</span>
              </li>
            </ul>
            <div>
              <label htmlFor={`purpose-${filename}`} className="text-label font-medium text-ink">
                Why are you downloading this?
              </label>
              <select
                id={`purpose-${filename}`}
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="mt-1 w-full rounded-control border border-line bg-surface px-3 py-2 text-body"
              >
                {EXPORT_PURPOSES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ) : (
          <p className="rounded-control bg-warn-bg p-3 text-caption text-ink">
            The attempt has been recorded in the audit trail. Nothing was downloaded.
          </p>
        )}
      </Modal>
    </>
  );
}
