import { cva, type VariantProps } from 'class-variance-authority';

export const dialogVariants = cva(
  'fixed left-[50%] top-[50%] z-50 flex w-full max-h-[calc(100vh-2rem)] -translate-x-1/2 -translate-y-1/2 flex-col gap-5 overflow-hidden rounded-[var(--radius-xl)] border border-border/70 bg-background p-7 text-foreground shadow-2xl max-w-[calc(100%-2rem)] sm:max-w-[425px]',
);
export type ZardDialogVariants = VariantProps<typeof dialogVariants>;
