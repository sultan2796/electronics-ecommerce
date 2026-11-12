interface StarRatingProps {
  value: number;
  size?: "sm" | "md" | "lg";
  onChange?: (value: number) => void;
}

const sizes = { sm: "size-3.5", md: "size-4", lg: "size-7" };

function Star({ fill, className }: { fill: number; className: string }) {
  const id = `star-${Math.round(fill * 100)}`;
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={id}>
          <stop offset={`${fill * 100}%`} stopColor="currentColor" />
          <stop offset={`${fill * 100}%`} stopColor="currentColor" stopOpacity="0.2" />
        </linearGradient>
      </defs>
      <path
        fill={`url(#${id})`}
        d="M12 2.5l2.94 5.96 6.56.95-4.75 4.63 1.12 6.53L12 17.5l-5.87 3.07 1.12-6.53L2.5 9.41l6.56-.95z"
      />
    </svg>
  );
}

export default function StarRating({ value, size = "md", onChange }: StarRatingProps) {
  const stars = [1, 2, 3, 4, 5];
  if (!onChange) {
    return (
      <span className="inline-flex text-amber-400" role="img" aria-label={`5 ulduzdan ${value.toFixed(1)}`}>
        {stars.map((star) => (
          <Star key={star} className={sizes[size]} fill={Math.max(0, Math.min(1, value - star + 1))} />
        ))}
      </span>
    );
  }
  return (
    <span className="inline-flex gap-1 text-amber-400" role="radiogroup" aria-label="Qiymətləndirmə">
      {stars.map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={value === star}
          aria-label={`${star} ulduz`}
          onClick={() => onChange(star)}
          className="rounded transition hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        >
          <Star className={sizes[size]} fill={star <= value ? 1 : 0} />
        </button>
      ))}
    </span>
  );
}
