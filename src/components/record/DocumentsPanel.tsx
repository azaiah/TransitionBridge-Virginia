'use client';

import { useMemo, useState } from 'react';
import { Download, Eye, FilePlus2, FileText, History, Lock, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { SeverityPill } from '@/components/ui/StatusPill';
import { getPersonaById } from '@/data';
import type { Persona, Role } from '@/data/types';
import {
  ACCESS_LEVEL_LABELS,
  canAddDocuments,
  canDownloadDocument,
  canOpenDocument,
  type DocumentAccessLevel,
  type SectionAccess,
} from '@/lib/access';
import { formatFullDate } from '@/lib/dates';
import { DEMO_NOW_MS } from '@/lib/demo-clock';
import { ROLE_NAMES } from '@/context/useViewer';
import {
  AUDIT_ACTION_LABELS,
  addSessionDocument,
  formatSessionTime,
  recordAudit,
  type AuditEvent,
} from '@/lib/session-store';
import {
  DEFAULT_ACCESS,
  DOCUMENT_STATUS_LABELS,
  DOCUMENT_TYPE_LABELS,
  DOCUMENT_TYPES,
  documentStatus,
  expiresAtFor,
  type DocumentStatus,
  type DocumentType,
  type SecureDocument,
} from '@/lib/transition-record';
import { RecordCard, RestrictedNote } from './RecordCard';

const STATUS_TONE: Record<DocumentStatus, 'ok' | 'warn' | 'risk'> = {
  CURRENT: 'ok',
  EXPIRING: 'warn',
  EXPIRED: 'risk',
};

/** Which document types each role may add. DARS may add any of them. */
const ADDABLE: Record<Role, readonly DocumentType[]> = {
  school_coordinator: [
    'IEP_PLAN',
    'SECTION_504_PLAN',
    'DISABILITY_DOCUMENTATION',
    'CONSENT_FORM',
    'ACCOMMODATION_PLAN',
  ],
  dars_counselor: DOCUMENT_TYPES,
  vendor: ['PAYROLL_FORM', 'ACCOMMODATION_PLAN'],
  state_leadership: [],
};

function personaLabel(id: string): string {
  const persona = getPersonaById(id);
  return persona ? `${persona.displayName}, ${persona.title}` : 'Recorded automatically';
}

/**
 * The secure document folder. Every document carries its type, owner, date, expiration,
 * access level, and audit history. What a viewer cannot open, they cannot see the name of
 * either — a "restricted document" line is all that shows — because even the fact that
 * hospital records exist is sensitive.
 */
export function DocumentsPanel({
  documents,
  access,
  role,
  persona,
  transitionId,
  studentId,
  liveEvents,
  onAddRequest,
}: {
  documents: SecureDocument[];
  access: SectionAccess;
  role: Role;
  persona: Persona | undefined;
  transitionId: string;
  studentId: string;
  liveEvents: AuditEvent[];
  onAddRequest: () => void;
}) {
  const [viewing, setViewing] = useState<SecureDocument | null>(null);
  const [historyFor, setHistoryFor] = useState<SecureDocument | null>(null);
  const [downloading, setDownloading] = useState<SecureDocument | null>(null);

  const readable = documents.filter((d) => canOpenDocument(role, d.accessLevel));
  const restricted = documents.length - readable.length;
  const needsAttention = documents.filter((d) => documentStatus(d) !== 'CURRENT').length;

  function log(action: AuditEvent['action'], doc: SecureDocument, detail?: string) {
    if (!persona) return;
    recordAudit({
      actorRole: role,
      actorPersonaId: persona.id,
      action,
      studentId,
      subject: `${DOCUMENT_TYPE_LABELS[doc.type]} · ${transitionId}`,
      detail: detail ?? doc.id,
    });
  }

  function open(doc: SecureDocument) {
    setViewing(doc);
    log('DOCUMENT_VIEWED', doc);
  }

  function download(doc: SecureDocument) {
    const who = persona ? `${persona.displayName} (${ROLE_NAMES[role]})` : 'viewer';
    const body = [
      'DEMONSTRATION DOCUMENT — synthetic placeholder. No real student record exists.',
      `Document: ${DOCUMENT_TYPE_LABELS[doc.type]} (version ${doc.version})`,
      `Student: ${transitionId}`,
      `Access level: ${ACCESS_LEVEL_LABELS[doc.accessLevel]}`,
      `Downloaded by ${who} on ${new Date().toISOString().replace('T', ' ').slice(0, 16)} UTC.`,
      'This copy is watermarked and the download is recorded in the audit trail.',
    ].join('\n');
    const blob = new Blob([body], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${transitionId}-${doc.type.toLowerCase()}-v${doc.version}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    log('DOCUMENT_DOWNLOADED', doc);
    setDownloading(null);
  }

  if (access === 'summary') {
    return (
      <RecordCard id="documents" coach="documents" title="Secure documents">
        <p className="text-body text-ink">
          {documents.length} documents on file
          {needsAttention > 0 ? ` · ${needsAttention} need an update` : ' · all current'}
        </p>
        <RestrictedNote>
          State leadership sees that documents exist and whether they are current — never their
          contents or their type.
        </RestrictedNote>
      </RecordCard>
    );
  }

  return (
    <RecordCard
      id="documents"
      coach="documents"
      title="Secure documents"
      description="Each document shows who added it, when it expires, and who is allowed to open it."
      action={
        canAddDocuments(role) ? (
          <Button variant="secondary" onClick={onAddRequest} data-coach="add-document">
            <FilePlus2 className="h-4 w-4" aria-hidden="true" />
            Add a document
          </Button>
        ) : undefined
      }
    >
      {readable.length === 0 && restricted === 0 ? (
        <p className="text-body text-ink-2">No documents are on file yet.</p>
      ) : (
        <ul className="divide-y divide-line-hair rounded-control border border-line">
          {readable.map((doc) => {
            const status = documentStatus(doc);
            const liveCount = liveEvents.filter((e) => e.detail === doc.id).length;
            return (
              <li key={doc.id} className="flex flex-col gap-3 p-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                  <FileText className="mt-0.5 h-5 w-5 shrink-0 text-ink-3" aria-hidden="true" />
                  <div className="min-w-0">
                    <p className="text-body font-medium text-ink">
                      {DOCUMENT_TYPE_LABELS[doc.type]}
                      {doc.version > 1 && <span className="ml-2 text-caption text-ink-3">Version {doc.version}</span>}
                      {doc.addedThisSession && (
                        <span className="ml-2 rounded-pill bg-orange-subtle px-2 py-0.5 text-caption text-ink">
                          Added this session
                        </span>
                      )}
                    </p>
                    <dl className="mt-1 grid grid-cols-1 gap-x-4 gap-y-0.5 text-caption text-ink-2 sm:grid-cols-2">
                      <div>
                        <dt className="inline">Owner: </dt>
                        <dd className="inline">{personaLabel(doc.ownerPersonaId)}</dd>
                      </div>
                      <div>
                        <dt className="inline">Added: </dt>
                        <dd className="inline">{formatFullDate(doc.uploadedAt)}</dd>
                      </div>
                      <div>
                        <dt className="inline">Expires: </dt>
                        <dd className="inline">{doc.expiresAt ? formatFullDate(doc.expiresAt) : 'Does not expire'}</dd>
                      </div>
                      <div>
                        <dt className="inline">Who can open it: </dt>
                        <dd className="inline">{ACCESS_LEVEL_LABELS[doc.accessLevel]}</dd>
                      </div>
                    </dl>
                    <div className="mt-2">
                      <SeverityPill label={DOCUMENT_STATUS_LABELS[status]} tone={STATUS_TONE[status]} />
                    </div>
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <Button variant="secondary" onClick={() => open(doc)} className="!px-3 !py-1.5 text-caption">
                    <Eye className="h-4 w-4" aria-hidden="true" />
                    Open<span className="sr-only"> {DOCUMENT_TYPE_LABELS[doc.type]}</span>
                  </Button>
                  {canDownloadDocument(role, doc.accessLevel) && (
                    <Button variant="ghost" onClick={() => setDownloading(doc)} className="!px-3 !py-1.5 text-caption">
                      <Download className="h-4 w-4" aria-hidden="true" />
                      Download
                    </Button>
                  )}
                  <Button variant="ghost" onClick={() => setHistoryFor(doc)} className="!px-3 !py-1.5 text-caption">
                    <History className="h-4 w-4" aria-hidden="true" />
                    History{liveCount > 0 ? ` (${doc.history.length + liveCount})` : ''}
                  </Button>
                </div>
              </li>
            );
          })}
          {restricted > 0 && (
            <li className="flex items-start gap-3 p-3">
              <Lock className="mt-0.5 h-5 w-5 shrink-0 text-ink-3" aria-hidden="true" />
              <div>
                <p className="text-body font-medium text-ink">
                  {restricted} restricted {restricted === 1 ? 'document' : 'documents'}
                </p>
                <p className="text-caption text-ink-2">
                  Held for other members of the student’s team. Your account cannot open
                  {restricted === 1 ? ' it' : ' them'}, so the name is not shown either.
                </p>
              </div>
            </li>
          )}
        </ul>
      )}

      {!canDownloadDocument(role, 'ALL_TEAM') && readable.length > 0 && (
        <p className="mt-3 flex items-start gap-2 text-caption text-ink-2">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-ok" aria-hidden="true" />
          Documents open inside the platform, where every view is recorded. Only DARS keeps
          downloadable copies.
        </p>
      )}

      {/* Viewer */}
      <Modal
        open={viewing !== null}
        title={viewing ? DOCUMENT_TYPE_LABELS[viewing.type] : ''}
        description={viewing ? `${transitionId} · version ${viewing.version}` : undefined}
        onClose={() => setViewing(null)}
        footer={
          <Button variant="primary" onClick={() => setViewing(null)}>
            Close
          </Button>
        }
      >
        {viewing && (
          <div className="relative overflow-hidden rounded-control border border-line bg-canvas p-4">
            <p
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 flex -rotate-12 items-center justify-center text-center text-h3 font-semibold uppercase tracking-widest text-ink-3/20"
            >
              Viewed by {persona?.displayName ?? 'you'} · demonstration
            </p>
            <p className="meta-label">Demonstration document</p>
            <p className="mt-2 text-body text-ink">
              In the live platform, the {DOCUMENT_TYPE_LABELS[viewing.type].toLowerCase()} opens
              here, inside a secure viewer. This demonstration holds no real documents, so
              only its tracking details appear.
            </p>
            <dl className="mt-3 space-y-1 text-caption text-ink-2">
              <div>Owner: {personaLabel(viewing.ownerPersonaId)}</div>
              <div>Added: {formatFullDate(viewing.uploadedAt)}</div>
              <div>Expires: {viewing.expiresAt ? formatFullDate(viewing.expiresAt) : 'Does not expire'}</div>
              <div>Who can open it: {ACCESS_LEVEL_LABELS[viewing.accessLevel]}</div>
            </dl>
            <p className="mt-3 flex items-center gap-1 text-caption text-ok">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              This view was recorded in the audit trail.
            </p>
          </div>
        )}
      </Modal>

      {/* History */}
      <Modal
        open={historyFor !== null}
        title="Document history"
        description={historyFor ? `${DOCUMENT_TYPE_LABELS[historyFor.type]} · ${transitionId}` : undefined}
        onClose={() => setHistoryFor(null)}
        footer={
          <Button variant="primary" onClick={() => setHistoryFor(null)}>
            Close
          </Button>
        }
      >
        {historyFor && (
          <ol className="space-y-3">
            {liveEvents
              .filter((e) => e.detail === historyFor.id)
              .map((e) => (
                <li key={e.id} className="rounded-control bg-orange-subtle/60 p-2 text-caption text-ink">
                  <span className="font-medium">{AUDIT_ACTION_LABELS[e.action]}</span> — {personaLabel(e.actorPersonaId)}
                  <span className="block text-ink-2">{formatSessionTime(e.at)} · this session</span>
                </li>
              ))}
            {[...historyFor.history].reverse().map((h, i) => (
              <li key={`${h.at}-${i}`} className="text-caption text-ink">
                <span className="font-medium">
                  {h.action === 'UPLOADED' ? 'Added' : h.action === 'VIEWED' ? 'Opened' : h.action === 'DOWNLOADED' ? 'Downloaded' : 'Access level set'}
                </span>{' '}
                — {personaLabel(h.actorPersonaId)}
                <span className="block text-ink-2">{formatFullDate(h.at)}</span>
              </li>
            ))}
          </ol>
        )}
      </Modal>

      {/* Download confirmation — DARS only */}
      <Modal
        open={downloading !== null}
        title="Download a watermarked copy?"
        description="The copy is stamped with your name and the time, and the download is recorded in the audit trail."
        onClose={() => setDownloading(null)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setDownloading(null)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => downloading && download(downloading)}>
              <Download className="h-4 w-4" aria-hidden="true" />
              Download copy
            </Button>
          </>
        }
      >
        <p className="rounded-control bg-surface-sunken p-3 text-caption text-ink-2">
          Demonstration: the file you receive is a labelled placeholder, not a student document.
        </p>
      </Modal>
    </RecordCard>
  );
}

/**
 * Adds a document to the secure folder. In the demonstration nothing is uploaded — a
 * tracked placeholder is created so the folder, the expiry, and the audit trail can be
 * shown working. The dialog says so, and warns never to add a real student document.
 */
export function AddDocumentDialog({
  open,
  onClose,
  role,
  persona,
  studentId,
  transitionId,
  presetType,
}: {
  open: boolean;
  onClose: () => void;
  role: Role;
  persona: Persona | undefined;
  studentId: string;
  transitionId: string;
  presetType?: DocumentType;
}) {
  const options = ADDABLE[role];
  const initial = presetType && options.includes(presetType) ? presetType : options[0];
  const [type, setType] = useState<DocumentType | undefined>(initial);
  const [accessLevel, setAccessLevel] = useState<DocumentAccessLevel>(initial ? DEFAULT_ACCESS[initial] : 'ALL_TEAM');
  const [lastPreset, setLastPreset] = useState(presetType);

  // Opening the dialog from "Attach it now" pre-selects the right type.
  if (presetType !== lastPreset) {
    setLastPreset(presetType);
    const next = presetType && options.includes(presetType) ? presetType : options[0];
    setType(next);
    if (next) setAccessLevel(DEFAULT_ACCESS[next]);
  }

  const levels = useMemo(
    () => (Object.keys(ACCESS_LEVEL_LABELS) as DocumentAccessLevel[]).filter((level) => canOpenDocument(role, level)),
    [role],
  );

  function save() {
    if (!type || !persona) return;
    const uploadedAt = new Date(DEMO_NOW_MS).toISOString();
    const doc: SecureDocument = {
      id: `${studentId}-DOC-S${Date.now().toString(36)}`,
      studentId,
      type,
      ownerPersonaId: persona.id,
      uploadedAt,
      expiresAt: expiresAtFor(type, uploadedAt),
      accessLevel,
      version: 1,
      history: [{ at: uploadedAt, actorPersonaId: persona.id, action: 'UPLOADED', note: 'Added in this session.' }],
      addedThisSession: true,
    };
    addSessionDocument(doc);
    recordAudit({
      actorRole: role,
      actorPersonaId: persona.id,
      action: 'DOCUMENT_ADDED',
      studentId,
      subject: `${DOCUMENT_TYPE_LABELS[type]} · ${transitionId}`,
      detail: doc.id,
    });
    onClose();
  }

  return (
    <Modal
      open={open}
      title="Add a document to the secure folder"
      description={`For ${transitionId}. The document’s owner, date, expiry, and access level are tracked from the moment it is added.`}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={save} disabled={!type}>
            <FilePlus2 className="h-4 w-4" aria-hidden="true" />
            Add document
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label htmlFor="doc-type" className="text-label font-medium text-ink">
            Document type
          </label>
          <select
            id="doc-type"
            value={type}
            onChange={(e) => {
              const next = e.target.value as DocumentType;
              setType(next);
              setAccessLevel(DEFAULT_ACCESS[next]);
            }}
            className="mt-1 w-full rounded-control border border-line bg-surface px-3 py-2 text-body"
          >
            {options.map((t) => (
              <option key={t} value={t}>
                {DOCUMENT_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="doc-access" className="text-label font-medium text-ink">
            Who can open it
          </label>
          <select
            id="doc-access"
            value={accessLevel}
            onChange={(e) => setAccessLevel(e.target.value as DocumentAccessLevel)}
            className="mt-1 w-full rounded-control border border-line bg-surface px-3 py-2 text-body"
          >
            {levels.map((level) => (
              <option key={level} value={level}>
                {ACCESS_LEVEL_LABELS[level]}
              </option>
            ))}
          </select>
          <p className="mt-1 text-caption text-ink-2">
            Starts at the usual level for this type. You can only choose levels that include you.
          </p>
        </div>
        {type && (
          <p className="text-caption text-ink-2">
            Expires:{' '}
            {(() => {
              const at = expiresAtFor(type, new Date(DEMO_NOW_MS).toISOString());
              return at ? formatFullDate(at) : 'does not expire';
            })()}
          </p>
        )}
        <p className="rounded-control border border-warn/30 bg-warn-bg p-3 text-caption text-ink">
          <strong>Demonstration:</strong> no file is uploaded. A tracked placeholder is added so
          you can see the folder, expiry, and audit trail at work. Never add a real student’s
          document to this demonstration.
        </p>
      </div>
    </Modal>
  );
}
