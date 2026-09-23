'use client';

import { useState, useEffect } from 'react';
import { CheckCircle2, FileUp, Info } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { getStudentById } from '@/data/records';
import { ACTIVITY_LABELS } from '@/data/types';
import type { PreEtsActivity } from '@/data/types';
import { cn } from '@/lib/utils';

export function ReferralForm({ initialStudentId }: { initialStudentId?: string }) {
  const [studentId, setStudentId] = useState(initialStudentId ?? '');
  const [isSearching, setIsSearching] = useState(false);
  const [student, setStudent] = useState(initialStudentId ? getStudentById(initialStudentId) : null);
  
  const [activities, setActivities] = useState<Set<PreEtsActivity>>(new Set());
  const [consentMethod, setConsentMethod] = useState<'upload' | 'attest' | null>(null);
  const [hasTransportBarrier, setHasTransportBarrier] = useState<boolean | null>(null);
  
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  // Simulate autosave
  useEffect(() => {
    if (!student) return;
    
    const timer = setTimeout(() => {
      setIsSaving(true);
      setTimeout(() => {
        setIsSaving(false);
        setLastSaved(new Date());
      }, 500);
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [student, activities, consentMethod, hasTransportBarrier]);

  const handleSearch = () => {
    if (!studentId) return;
    setIsSearching(true);
    setTimeout(() => {
      const found = getStudentById(studentId.trim());
      setStudent(found ?? null);
      setIsSearching(false);
    }, 400);
  };

  const toggleActivity = (activity: PreEtsActivity) => {
    const next = new Set(activities);
    if (next.has(activity)) next.delete(activity);
    else next.add(activity);
    setActivities(next);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <div className="rounded-card border-2 border-ok bg-surface p-8 text-center max-w-2xl mx-auto">
        <CheckCircle2 className="mx-auto h-12 w-12 text-ok" />
        <h2 className="mt-4 text-h2 text-ink">Referral submitted for {student?.displayName}</h2>
        <p className="mt-2 text-body text-ink-2">
          Reference <strong>DEMO-REF-2026-004182</strong>.
        </p>
        <p className="mt-4 text-body text-ink-2">
          A DARS counselor typically reviews within 3 days — you&apos;ll see the status change here.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Button variant="secondary" href="/school/">Back to dashboard</Button>
          <Button variant="primary" onClick={() => window.location.reload()}>Submit another</Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-3xl space-y-8">
      {/* 1. Student Lookup */}
      <section className="rounded-card border border-line bg-surface p-6 shadow-sm">
        <h2 className="text-h2 text-ink">1. Student lookup</h2>
        <p className="mt-1 text-body text-ink-2">We&apos;ll pre-fill everything we already know.</p>
        
        {!student ? (
          <div className="mt-6 flex gap-3">
            <div className="flex-1">
              <label htmlFor="studentId" className="sr-only">Student ID</label>
              <input
                id="studentId"
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="Enter Student ID (e.g., DEMO-STU-000412)"
                className="w-full rounded-control border border-line bg-surface px-4 py-2 text-body focus:border-orange focus:outline-none focus:ring-1 focus:ring-orange"
              />
            </div>
            <Button variant="primary" type="button" onClick={handleSearch} disabled={!studentId || isSearching}>
              {isSearching ? 'Searching...' : 'Find student'}
            </Button>
          </div>
        ) : (
          <div className="mt-6 rounded-lg border border-line bg-surface-sunken p-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-h3 text-ink">{student.displayName}</h3>
                <p className="text-body text-ink-2">ID: {student.id}</p>
              </div>
              <button 
                type="button" 
                onClick={() => setStudent(null)}
                className="text-label font-medium text-orange-deep hover:underline"
              >
                Change student
              </button>
            </div>
            
            <div className="mt-4 grid grid-cols-2 gap-4 border-t border-line pt-4 sm:grid-cols-4">
              <div>
                <span className="block text-caption text-ink-3">Age</span>
                <span className="text-body font-medium text-ink">{student.age}</span>
              </div>
              <div>
                <span className="block text-caption text-ink-3">Grade</span>
                <span className="text-body font-medium text-ink">{student.gradeLevel}</span>
              </div>
              <div>
                <span className="block text-caption text-ink-3">Plan type</span>
                <span className="text-body font-medium text-ink">{student.planType === 'IEP' ? 'IEP' : '504'}</span>
              </div>
              <div>
                <span className="block text-caption text-ink-3">Disability docs</span>
                <span className="text-body font-medium text-ink">{student.disabilityDocumented ? 'On file' : 'Needed'}</span>
              </div>
            </div>
            
            <div className="mt-4 flex items-center gap-2 rounded bg-info-bg px-3 py-2 text-caption text-info">
              <Info className="h-4 w-4 shrink-0" />
              <span>From student record — edit if wrong.</span>
            </div>
          </div>
        )}
      </section>

      {/* Progressive disclosure - only show rest if student is selected */}
      {student && (
        <div className="space-y-8 animate-fade-up">
          {/* 2. Requested Activities */}
          <section className="rounded-card border border-line bg-surface p-6 shadow-sm">
            <h2 className="text-h2 text-ink">2. Requested activities</h2>
            <p className="mt-1 text-body text-ink-2">Select all that apply. These are the five statutory Pre-ETS activities.</p>
            
            <div className="mt-6 space-y-3">
              {(Object.entries(ACTIVITY_LABELS) as [PreEtsActivity, string][]).map(([key, label]) => (
                <label 
                  key={key} 
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors hover:bg-surface-sunken",
                    activities.has(key) ? "border-orange bg-orange-subtle/20" : "border-line"
                  )}
                >
                  <div className="flex h-5 items-center">
                    <input
                      type="checkbox"
                      checked={activities.has(key)}
                      onChange={() => toggleActivity(key)}
                      className="h-4 w-4 rounded border-line text-orange-deep focus:ring-orange"
                    />
                  </div>
                  <div className="flex-1">
                    <span className="text-body font-medium text-ink">{label}</span>
                  </div>
                </label>
              ))}
            </div>
          </section>

          {/* 3. Consent & Logistics */}
          <section className="rounded-card border border-line bg-surface p-6 shadow-sm">
            <h2 className="text-h2 text-ink">3. Consent & Logistics</h2>
            
            <div className="mt-6 space-y-8">
              <fieldset>
                <legend className="text-label font-medium text-ink">Consent to participate</legend>
                <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <label 
                    className={cn(
                      "flex cursor-pointer flex-col items-center gap-2 rounded-lg border p-4 text-center transition-colors hover:bg-surface-sunken",
                      consentMethod === 'upload' ? "border-orange bg-orange-subtle/20" : "border-line"
                    )}
                  >
                    <input
                      type="radio"
                      name="consent"
                      value="upload"
                      checked={consentMethod === 'upload'}
                      onChange={() => setConsentMethod('upload')}
                      className="sr-only"
                    />
                    <FileUp className="h-6 w-6 text-ink-3" />
                    <span className="text-body font-medium text-ink">Upload signed form</span>
                  </label>
                  <label 
                    className={cn(
                      "flex cursor-pointer flex-col items-center gap-2 rounded-lg border p-4 text-center transition-colors hover:bg-surface-sunken",
                      consentMethod === 'attest' ? "border-orange bg-orange-subtle/20" : "border-line"
                    )}
                  >
                    <input
                      type="radio"
                      name="consent"
                      value="attest"
                      checked={consentMethod === 'attest'}
                      onChange={() => setConsentMethod('attest')}
                      className="sr-only"
                    />
                    <CheckCircle2 className="h-6 w-6 text-ink-3" />
                    <span className="text-body font-medium text-ink">I attest consent is on file</span>
                  </label>
                </div>
              </fieldset>

              <fieldset>
                <legend className="text-label font-medium text-ink">Transportation barrier</legend>
                <p className="mt-1 text-caption text-ink-2">
                  Does this student lack reliable transportation to off-site services?
                </p>
                <div className="mt-3 flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="transport"
                      checked={hasTransportBarrier === true}
                      onChange={() => setHasTransportBarrier(true)}
                      className="h-4 w-4 border-line text-orange-deep focus:ring-orange"
                    />
                    <span className="text-body text-ink">Yes, requires mobile/in-school service</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="transport"
                      checked={hasTransportBarrier === false}
                      onChange={() => setHasTransportBarrier(false)}
                      className="h-4 w-4 border-line text-orange-deep focus:ring-orange"
                    />
                    <span className="text-body text-ink">No</span>
                  </label>
                </div>
              </fieldset>
            </div>
          </section>

          {/* Action Bar */}
          <div className="sticky bottom-4 z-10 flex items-center justify-between rounded-card border border-line bg-surface/95 p-4 shadow-pop backdrop-blur">
            <div className="text-caption text-ink-3">
              {isSaving ? 'Saving draft...' : lastSaved ? `Draft saved ${lastSaved.toLocaleTimeString()}` : ''}
            </div>
            <div className="flex items-center gap-4">
              <span className="text-caption font-medium text-ink-2">About 90 seconds</span>
              <Button 
                variant="primary" 
                type="submit"
                disabled={!student || activities.size === 0 || !consentMethod || hasTransportBarrier === null}
              >
                Submit referral
              </Button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
