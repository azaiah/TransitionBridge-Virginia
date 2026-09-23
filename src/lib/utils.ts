import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merge Tailwind classes without conflicts. Used on every styled component. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
