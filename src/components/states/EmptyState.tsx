interface EmptyStateProps {
  title: string;
  hint: string;
}

export default function EmptyState({ title, hint }: EmptyStateProps) {
  return (
    <section
      role="status"
      className="rounded-lg border border-white/10 bg-white/5 p-4 text-white backdrop-blur-md"
    >
      <h2 className="font-medium">{title}</h2>
      <p className="mt-1 text-sm text-white/65">{hint}</p>
    </section>
  );
}
