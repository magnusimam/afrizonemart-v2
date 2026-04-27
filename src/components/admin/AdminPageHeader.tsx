interface Props {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function AdminPageHeader({ title, subtitle, action }: Props) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-3 border-b border-border pb-5">
      <div>
        <h1 className="font-raleway text-2xl font-bold text-navy">{title}</h1>
        {subtitle && (
          <p className="mt-1 font-sans text-sm text-muted">{subtitle}</p>
        )}
      </div>
      {action}
    </header>
  );
}
