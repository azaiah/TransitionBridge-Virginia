'use client';

import { useState } from 'react';
import { useRoleOptional } from '@/context/RoleContext';
import { getPersonaById, demoData } from '@/data';
import { Button } from '@/components/ui/Button';
import { ACTIVITY_LABELS } from '@/data/types';
import type { PreEtsActivity } from '@/data/types';
import { MapPin, Users, CheckCircle2, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export function VendorCapacity() {
  const roleCtx = useRoleOptional();
  const personaId = roleCtx?.personaId;
  const persona = personaId ? getPersonaById(personaId) : null;
  
  const vendorId = persona?.scopeId ?? demoData.vendors[0].id;
  const vendor = demoData.vendors.find(v => v.id === vendorId);

  const [capacity, setCapacity] = useState<number>(vendor?.capacityTotal ?? 0);
  const [activities, setActivities] = useState<Set<PreEtsActivity>>(new Set(vendor?.activitiesOffered ?? []));
  const [isSaved, setIsSaved] = useState(false);

  if (!vendor) return null;

  const toggleActivity = (activity: PreEtsActivity) => {
    const next = new Set(activities);
    if (next.has(activity)) next.delete(activity);
    else next.add(activity);
    setActivities(next);
    setIsSaved(false);
  };

  const handleSave = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const localities = vendor.servedLocalityFips.map(fips => {
    const loc = demoData.localities.find(l => l.fips === fips);
    return loc?.name ?? fips;
  });

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="text-h1 text-ink">Capacity & coverage</h1>
        <p className="mt-2 text-body text-ink-2">
          Update your capacity and service offerings. This directly feeds the statewide coverage map.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <section className="rounded-card border border-line bg-surface p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-sunken text-ink-2">
                <Users className="h-4 w-4" />
              </div>
              <h2 className="text-h2 text-ink">Slot capacity</h2>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="flex-1">
                <label className="block text-label font-medium text-ink mb-2">Total concurrent students</label>
                <input
                  type="number"
                  min={vendor.capacityUsed}
                  value={capacity}
                  onChange={(e) => {
                    setCapacity(parseInt(e.target.value) || vendor.capacityUsed);
                    setIsSaved(false);
                  }}
                  className="w-full max-w-[200px] rounded-control border border-line bg-surface px-3 py-2 text-body focus:border-orange focus:outline-none focus:ring-1 focus:ring-orange"
                />
                <p className="mt-2 text-caption text-ink-3">
                  Currently serving {vendor.capacityUsed} students.
                </p>
              </div>
              
              <div className="flex-1 rounded-lg border border-line bg-surface-sunken p-4">
                <div className="text-caption text-ink-2">Available slots</div>
                <div className={cn(
                  "text-h2 mt-1",
                  capacity - vendor.capacityUsed > 0 ? "text-ok" : "text-warn"
                )}>
                  {Math.max(0, capacity - vendor.capacityUsed)}
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-card border border-line bg-surface p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-sunken text-ink-2">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <h2 className="text-h2 text-ink">Activities offered</h2>
            </div>
            
            <div className="space-y-3">
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

          <div className="flex items-center justify-between">
            <div className="text-caption text-ok flex items-center gap-1 transition-opacity duration-300" style={{ opacity: isSaved ? 1 : 0 }}>
              <CheckCircle2 className="h-4 w-4" />
              Changes saved and published to state map
            </div>
            <Button variant="primary" onClick={handleSave}>
              Save changes
            </Button>
          </div>
        </div>

        <div>
          <section className="rounded-card border border-line bg-surface p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-sunken text-ink-2">
                <MapPin className="h-4 w-4" />
              </div>
              <h2 className="text-h2 text-ink">Service area</h2>
            </div>
            
            <div className="rounded bg-info-bg p-3 text-caption text-info flex items-start gap-2 mb-4">
              <Info className="h-4 w-4 shrink-0 mt-0.5" />
              <p>Service areas are managed by DARS. Contact your contract administrator to request changes.</p>
            </div>

            <h3 className="text-label font-medium text-ink mb-2">Approved localities ({localities.length})</h3>
            <ul className="space-y-2">
              {localities.sort().map(loc => (
                <li key={loc} className="text-body text-ink-2 flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-viz-2" />
                  {loc}
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
