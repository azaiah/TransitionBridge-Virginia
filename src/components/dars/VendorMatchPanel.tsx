'use client';

import { useMemo } from 'react';
import { MapPin, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { demoData } from '@/data';
import type { Referral } from '@/data/types';

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = Math.imul(31, hash) + str.charCodeAt(i) | 0;
  }
  return Math.abs(hash);
}

export function VendorMatchPanel({ referral }: { referral: Referral }) {
  // Find vendors that serve the student's locality
  const candidateVendors = useMemo(() => {
    const vendors = demoData.vendors.filter((v) => 
      v.servedLocalityFips.includes(referral.localityFips)
    );

    return vendors.map((vendor) => {
      // Deterministic fake distance for the demo
      const hash = simpleHash(vendor.id + referral.schoolId);
      const distance = (hash % 44) + 2; // 2 to 45 miles

      const activitiesMatchCount = referral.requestedActivities.filter(a => vendor.activitiesOffered.includes(a)).length;
      const slotsOpen = vendor.capacityTotal - vendor.capacityUsed;
      
      // Score calculation:
      // +100 for each matching activity
      // -2 for each mile of distance
      // +50 if they have slots open
      // + (completionRate * 100)
      let score = (activitiesMatchCount * 100) - (distance * 2) + (vendor.completionRate * 100);
      if (slotsOpen > 0) score += 50;

      return {
        vendor,
        distance,
        activitiesMatchCount,
        slotsOpen,
        score,
      };
    }).sort((a, b) => b.score - a.score);
  }, [referral]);

  if (candidateVendors.length === 0) {
    return (
      <div className="rounded-card border border-warn bg-warn-bg p-4 text-warn">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <div>
            <h3 className="text-label font-medium">No coverage in this locality</h3>
            <p className="mt-1 text-body">There are no approved Pre-ETS providers serving this student&apos;s locality.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {candidateVendors.map(({ vendor, distance, activitiesMatchCount, slotsOpen }, index) => {
        const isBestMatch = index === 0;
        
        return (
          <div 
            key={vendor.id} 
            className={`flex flex-col gap-4 rounded-card border p-4 sm:flex-row sm:items-center sm:justify-between ${
              isBestMatch ? 'border-orange bg-orange-subtle/30' : 'border-line bg-surface'
            }`}
          >
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-h3 text-ink">{vendor.name}</h3>
                {isBestMatch && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-orange-deep px-2 py-0.5 text-xs font-medium text-white">
                    <CheckCircle2 className="h-3 w-3" />
                    Best match
                  </span>
                )}
              </div>
              
              <div className="mt-2 text-body text-ink-2">
                <p>
                  <strong className="text-ink">{activitiesMatchCount} of {referral.requestedActivities.length}</strong> requested activities ·{' '}
                  <strong className="text-ink">{distance} miles</strong> ·{' '}
                  <strong className={slotsOpen > 0 ? 'text-ok' : 'text-warn'}>{slotsOpen} of {vendor.capacityTotal}</strong> slots open ·{' '}
                  <strong className="text-ink">{Math.round(vendor.completionRate * 100)}%</strong> completion rate
                </p>
              </div>
              
              <div className="mt-2 flex items-center gap-4 text-caption text-ink-3">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  Serves {vendor.servedLocalityFips.length} localities
                </span>
                <span>
                  Median response: {vendor.medianResponseHours}h
                </span>
              </div>
            </div>
            
            <div className="shrink-0">
              <Button variant={isBestMatch ? 'primary' : 'secondary'}>
                Assign to {vendor.name.split(' ')[0]}
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
