export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <article className="container-site max-w-3xl py-14 md:py-20">
      <h1 className="text-[2.4rem] font-medium text-evergreen-900 sm:text-5xl">{title}</h1>
      <p className="mt-4 text-sm text-ink-muted">Last updated {updated}</p>
      <div className="mt-10 space-y-5 text-ink-muted [&_h2]:mt-10 [&_h2]:text-2xl [&_h2]:text-evergreen-900 [&_li]:ml-5 [&_li]:list-disc [&_ul]:space-y-2">
        {children}
      </div>
    </article>
  );
}
