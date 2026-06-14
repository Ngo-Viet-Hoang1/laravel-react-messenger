import { Toaster as Sonner, type ToasterProps } from 'sonner';

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg',
          description: 'group-[.toast]:text-muted-foreground',
          actionButton:
            'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
          cancelButton:
            'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',
          error:
            'group-[.toast]:border-destructive/40 group-[.toast]:bg-destructive/10 group-[.toast]:text-destructive',
          success:
            'group-[.toast]:border-emerald-500/40 group-[.toast]:bg-emerald-500/10 group-[.toast]:text-emerald-600 dark:group-[.toast]:text-emerald-400',
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
