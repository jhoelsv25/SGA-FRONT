import { cva, type VariantProps } from 'class-variance-authority';

export const dialogVariants = cva(
  'fixed left-[50%] top-[50%] z-50 grid w-full translate-x-[-50%] translate-y-[-50%] gap-5 rounded-[var(--radius-xl)] border border-border/70 bg-background p-7 text-foreground shadow-2xl max-w-[calc(100%-2rem)] sm:max-w-[425px]',
);
export type ZardDialogVariants = VariantProps<typeof dialogVariants>;
