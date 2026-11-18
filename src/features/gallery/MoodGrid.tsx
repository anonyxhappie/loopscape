import { Link } from "react-router-dom";
import { MOODS } from "@/lib/catalogue/moods";

export function MoodGrid() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
      {MOODS.map((mood) => (
        <Link
          key={mood.slug}
          to={`/explore?mood=${mood.slug}`}
          onClick={() => window.scrollTo({ top: 0, left: 0, behavior: "instant" })}
          className="group flex flex-col justify-between gap-6 rounded-xl border border-line bg-gradient-to-br from-surface to-background p-4 transition-all hover:-translate-y-1 hover:border-lime/30"
        >
          <span className="text-2xl">{mood.emoji}</span>
          <span className="text-sm font-medium" style={{ color: mood.color }}>
            {mood.name}
          </span>
        </Link>
      ))}
    </div>
  );
}
