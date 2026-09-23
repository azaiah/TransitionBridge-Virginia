'use client';

import { useState, useMemo } from 'react';
import { demoData, CURRENT_PERIOD, PERIODS, REFERENCE_DATE } from '@/data';
import { formatFullDate } from '@/lib/dates';
import { Button } from '@/components/ui/Button';
import { ChartFrame } from '@/components/ui/ChartFrame';
import { explainChart } from '@/lib/definitions';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { Printer, Download } from 'lucide-react';

export function ReportBuilder() {
  const [scope, setScope] = useState<'state' | 'district' | 'division'>('state');
  const [period, setPeriod] = useState<string>(CURRENT_PERIOD);
  const [measure, setMeasure] = useState<'referrals' | 'fillRate' | 'outcomes'>('referrals');

  const data = useMemo(() => {
    if (scope === 'state') {
      const state = demoData.stateMetrics.find(m => m.period === period);
      if (!state) return [];
      
      return [{
        name: 'Statewide',
        value: measure === 'referrals' ? state.totals.referralsSubmitted 
             : measure === 'fillRate' ? (state.totals.referralsAssigned / state.totals.referralsSubmitted) * 100
             : (state.totals.employmentOutcomeRate ?? 0) * 100
      }];
    }
    
    if (scope === 'district') {
      return demoData.districtMetrics
        .filter(m => m.period === period)
        .map(m => {
          const district = demoData.districts.find(d => d.id === m.darsDistrictId);
          return {
            name: district?.name ?? m.darsDistrictId,
            value: measure === 'referrals' ? m.referralsSubmitted 
                 : measure === 'fillRate' ? (m.referralsAssigned / m.referralsSubmitted) * 100
                 : (m.employmentOutcomeRate ?? 0) * 100
          };
        });
    }
    
    // division
    return demoData.divisionMetrics
      .filter(m => m.period === period)
      .map(m => {
        const division = demoData.divisions.find(d => d.id === m.divisionId);
        return {
          name: division?.name ?? m.divisionId,
          value: measure === 'referrals' ? m.referralsSubmitted 
               : measure === 'fillRate' ? (m.referralsAssigned / m.referralsSubmitted) * 100
               : (m.employmentOutcomeRate ?? 0) * 100
        };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 20); // Top 20 for readability
  }, [scope, period, measure]);

  const formatValue = (val: number) => {
    if (measure === 'referrals') return val.toLocaleString();
    return `${Math.round(val)}%`;
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportCsv = () => {
    const headers = ['Region', 'Value'];
    const rows = data.map(r => [r.name, r.value.toString()]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report-${scope}-${period}-${measure}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      <div className="rounded-card border border-line bg-surface p-6 shadow-sm print:hidden">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-label font-medium text-ink mb-2">Scope</label>
            <select
              value={scope}
              onChange={(e) => setScope(e.target.value as any)}
              className="w-full rounded-control border border-line bg-surface px-3 py-2 text-body focus:border-orange focus:outline-none focus:ring-1 focus:ring-orange"
            >
              <option value="state">Statewide</option>
              <option value="district">By District</option>
              <option value="division">By Division (Top 20)</option>
            </select>
          </div>
          <div>
            <label className="block text-label font-medium text-ink mb-2">Period</label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="w-full rounded-control border border-line bg-surface px-3 py-2 text-body focus:border-orange focus:outline-none focus:ring-1 focus:ring-orange"
            >
              {PERIODS.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-label font-medium text-ink mb-2">Measure</label>
            <select
              value={measure}
              onChange={(e) => setMeasure(e.target.value as any)}
              className="w-full rounded-control border border-line bg-surface px-3 py-2 text-body focus:border-orange focus:outline-none focus:ring-1 focus:ring-orange"
            >
              <option value="referrals">Referral volume</option>
              <option value="fillRate">Fill rate</option>
              <option value="outcomes">Employment outcomes</option>
            </select>
          </div>
        </div>
        
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={handleExportCsv}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button variant="primary" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print / PDF
          </Button>
        </div>
      </div>

      <div className="print:block">
        <div className="hidden print:block mb-8 border-b border-line pb-4">
          <h1 className="text-h1 text-ink">TransitionBridge Report</h1>
          <p className="text-body text-ink-2 mt-2">
            Scope: {scope} · Period: {period} · Measure: {measure}
          </p>
          {/* The dataset's own as-of date, not the wall clock — a printed page should say
              what the figures describe, and it must read the same on every machine. */}
          <p className="text-caption text-ink-3 mt-1">
            Figures as of {formatFullDate(REFERENCE_DATE)} · Demonstration data
          </p>
        </div>

        <ChartFrame
          title={`${measure === 'referrals' ? 'Referral volume' : measure === 'fillRate' ? 'Fill rate' : 'Employment outcomes'} by ${scope}`}
          explain={explainChart(
            measure === 'referrals'
              ? 'referralsReceived'
              : measure === 'fillRate'
                ? 'fillRate'
                : 'employmentOutcomeRate',
          )}
          tableHeaders={['Region', 'Value']}
          tableRows={data.map(r => [r.name, formatValue(r.value)])}
          csvFilename={`report-${scope}-${period}-${measure}.csv`}
        >
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} layout="vertical">
              <XAxis type="number" hide />
              <YAxis
                dataKey="name"
                type="category"
                tick={{ fontSize: 11, fill: 'var(--tb-ink-2)' }}
                axisLine={false}
                tickLine={false}
                width={150}
              />
              <Tooltip
                cursor={{ fill: 'var(--tb-surface-sunken)' }}
                contentStyle={{
                  backgroundColor: 'var(--tb-surface)',
                  border: '1px solid var(--tb-border)',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                }}
                formatter={(value: number) => [formatValue(value), '']}
              />
              <Bar dataKey="value" fill="var(--tb-viz-2)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartFrame>
      </div>
    </div>
  );
}
