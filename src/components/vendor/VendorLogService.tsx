'use client';

import { useState } from 'react';
import { useRoleOptional } from '@/context/RoleContext';
import { getPersonaById, demoData } from '@/data';
import { referrals, students } from '@/data/records';
import { Button } from '@/components/ui/Button';
import { ACTIVITY_LABELS } from '@/data/types';
import type { PreEtsActivity } from '@/data/types';
import { CheckCircle2, Users, Calendar, Clock, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

export function VendorLogService() {
  const roleCtx = useRoleOptional();
  const personaId = roleCtx?.personaId;
  const persona = personaId ? getPersonaById(personaId) : null;
  
  const vendorId = persona?.scopeId ?? demoData.vendors[0].id;
  const vendor = demoData.vendors.find(v => v.id === vendorId);

  const activeStudents = referrals
    .filter(r => r.assignedVendorId === vendorId && (r.status === 'ASSIGNED' || r.status === 'IN_SERVICE'))
    .map(r => ({
      student: students.find(s => s.id === r.studentId)!,
      activities: r.requestedActivities,
    }));

  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
  const [activity, setActivity] = useState<PreEtsActivity | ''>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [duration, setDuration] = useState<string>('60');
  const [setting, setSetting] = useState<'SCHOOL' | 'COMMUNITY' | 'WORKPLACE' | 'VIRTUAL'>('SCHOOL');
  const [notes, setNotes] = useState('');
  
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!vendor) return null;

  const toggleStudent = (id: string) => {
    const next = new Set(selectedStudentIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedStudentIds(next);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <div className="mx-auto max-w-2xl rounded-card border-2 border-ok bg-surface p-8 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-ok" />
        <h2 className="mt-4 text-h2 text-ink">Services logged successfully</h2>
        <p className="mt-2 text-body text-ink-2">
          Logged {selectedStudentIds.size} service record{selectedStudentIds.size !== 1 ? 's' : ''} for {activity ? ACTIVITY_LABELS[activity as PreEtsActivity] : ''}.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Button variant="secondary" href="/vendor/">Back to dashboard</Button>
          <Button variant="primary" onClick={() => {
            setIsSubmitted(false);
            setSelectedStudentIds(new Set());
            setNotes('');
          }}>Log another session</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="text-h1 text-ink">Log services</h1>
        <p className="mt-2 text-body text-ink-2">
          Designed for speed. Select multiple students to bulk-log a group session.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <section className="rounded-card border border-line bg-surface p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-h2 text-ink flex items-center gap-2">
              <Users className="h-5 w-5 text-ink-3" />
              1. Select students
            </h2>
            <span className="text-caption font-medium text-ink-2">
              {selectedStudentIds.size} selected
            </span>
          </div>
          
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 max-h-64 overflow-y-auto p-1">
            {activeStudents.map(({ student }) => (
              <label 
                key={student.id}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-surface-sunken",
                  selectedStudentIds.has(student.id) ? "border-orange bg-orange-subtle/20" : "border-line"
                )}
              >
                <input
                  type="checkbox"
                  checked={selectedStudentIds.has(student.id)}
                  onChange={() => toggleStudent(student.id)}
                  className="h-4 w-4 rounded border-line text-orange-deep focus:ring-orange"
                />
                <span className="text-body font-medium text-ink truncate">{student.displayName}</span>
              </label>
            ))}
          </div>
        </section>

        <section className="rounded-card border border-line bg-surface p-6 shadow-sm">
          <h2 className="text-h2 text-ink mb-6">2. Session details</h2>
          
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-label font-medium text-ink mb-2">Pre-ETS Activity</label>
              <select
                required
                value={activity}
                onChange={(e) => setActivity(e.target.value as PreEtsActivity)}
                className="w-full rounded-control border border-line bg-surface px-3 py-2 text-body focus:border-orange focus:outline-none focus:ring-1 focus:ring-orange"
              >
                <option value="" disabled>Select activity...</option>
                {vendor.activitiesOffered.map(act => (
                  <option key={act} value={act}>{ACTIVITY_LABELS[act]}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-label font-medium text-ink mb-2 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-ink-3" />
                Date of service
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-control border border-line bg-surface px-3 py-2 text-body focus:border-orange focus:outline-none focus:ring-1 focus:ring-orange"
              />
            </div>

            <div>
              <label className="block text-label font-medium text-ink mb-2 flex items-center gap-2">
                <Clock className="h-4 w-4 text-ink-3" />
                Duration (minutes)
              </label>
              <input
                type="number"
                required
                min="15"
                step="15"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full rounded-control border border-line bg-surface px-3 py-2 text-body focus:border-orange focus:outline-none focus:ring-1 focus:ring-orange"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-label font-medium text-ink mb-2 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-ink-3" />
                Setting
              </label>
              {/* flex-wrap: the four choices drop to a second line on phones instead of
                  running off the screen. min-h-11 keeps each one an easy tap target. */}
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                {(['SCHOOL', 'COMMUNITY', 'WORKPLACE', 'VIRTUAL'] as const).map(s => (
                  <label key={s} className="flex min-h-11 items-center gap-2 sm:min-h-0">
                    <input
                      type="radio"
                      name="setting"
                      checked={setting === s}
                      onChange={() => setSetting(s)}
                      className="h-4 w-4 border-line text-orange-deep focus:ring-orange"
                    />
                    <span className="text-body text-ink capitalize">{s.toLowerCase()}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-label font-medium text-ink mb-2">Notes (Optional)</label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Brief description of the session..."
                className="w-full rounded-control border border-line bg-surface px-3 py-2 text-body focus:border-orange focus:outline-none focus:ring-1 focus:ring-orange"
              />
            </div>
          </div>
        </section>

        <div className="flex justify-end">
          <Button 
            variant="primary" 
            type="submit"
            disabled={selectedStudentIds.size === 0 || !activity || !date || !duration}
          >
            Log {selectedStudentIds.size} service record{selectedStudentIds.size !== 1 ? 's' : ''}
          </Button>
        </div>
      </form>
    </div>
  );
}
