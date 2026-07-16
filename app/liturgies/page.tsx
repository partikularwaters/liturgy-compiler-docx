import Link from "next/link";
import { getLiturgies } from "@/lib/liturgy/getLiturgies";
import { formatLiturgyName } from "@/lib/liturgy/formatLiturgyName";

export default async function LiturgiesPage(): Promise<React.ReactElement> {
  const liturgies = await getLiturgies();

  return (
    <div className="max-w-[960px] mx-auto p-8 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-[28px] font-bold leading-9 text-text-primary">Liturgies</h1>
        <Link
          href="/liturgy/new"
          className="bg-accent text-accent-foreground rounded-md px-4 py-2 text-sm font-medium"
        >
          New Liturgy
        </Link>
      </div>

      {liturgies.length === 0 ? (
        <div>
          <p className="text-sm text-text-muted">No liturgies yet.</p>
          <Link
            href="/liturgy/new"
            className="mt-4 inline-block bg-accent text-accent-foreground rounded-md px-4 py-2 text-sm font-medium"
          >
            Start your first liturgy
          </Link>
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-lg overflow-hidden">
          {liturgies.map((liturgy, index) => (
            <Link
              key={liturgy.id}
              href={`/liturgy/${liturgy.id}`}
              className={`block px-6 py-3 text-sm text-text-primary hover:bg-surface-secondary ${
                index < liturgies.length - 1 ? "border-b border-border" : ""
              }`}
            >
              {formatLiturgyName(liturgy)}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
