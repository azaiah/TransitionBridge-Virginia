/**
 * The counselor's student page is now the shared secure transition record, so every
 * portal reads the same record under the same access rules. Kept as a re-export so any
 * older import keeps working.
 */
export { TransitionRecord as StudentDetail } from '@/components/record/TransitionRecord';
