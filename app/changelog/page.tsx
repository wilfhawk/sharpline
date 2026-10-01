import { CHANGELOG } from "@/lib/changelog";

export const metadata = { title: "Changelog — SharpLine" };

export default function ChangelogPage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-12 sm:px-6">
      <div>
        <h1 className="text-2xl font-semibold">Changelog</h1>
        <p className="text-sm text-muted-foreground">What's shipped, most recent first.</p>
      </div>

      <div className="flex flex-col gap-8">
        {CHANGELOG.map((entry) => (
          <div key={entry.date} className="flex flex-col gap-2 border-l-2 border-border/60 pl-4">
            <p className="text-xs text-muted-foreground">
              {new Date(entry.date + "T00:00:00Z").toLocaleDateString(undefined, {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
            <h2 className="font-medium">{entry.title}</h2>
            <ul className="flex flex-col gap-1.5 text-sm text-muted-foreground">
              {entry.items.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-1.5 size-1 shrink-0 rounded-full bg-muted-foreground" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
