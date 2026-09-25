/** Employer partners and job postings. Small; loaded by the job board and the record. */
import employersJson from './generated/employers.json';
import type { Employer, EmployerBundle, JobPosting } from './types';

const bundle = employersJson as unknown as EmployerBundle;

export const employers: Employer[] = bundle.employers ?? [];
export const postings: JobPosting[] = bundle.postings ?? [];

const employerById = new Map(employers.map((e) => [e.id, e]));

export function getEmployerById(id: string): Employer | undefined {
  return employerById.get(id);
}

/** Postings with their employer attached, newest first. */
export function postingsWithEmployer(): (JobPosting & { employer: Employer })[] {
  return postings
    .map((p) => ({ ...p, employer: employerById.get(p.employerId)! }))
    .filter((p) => p.employer)
    .sort((a, b) => b.postedAt.localeCompare(a.postedAt));
}
