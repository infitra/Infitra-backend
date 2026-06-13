"use client";

const AMBER = "#f59e0b";

/** A 1–5 star picker. Read-only mode renders the value without interaction. */
export function StarRating({
  value,
  onChange,
  accent = AMBER,
  readOnly = false,
  size = 28,
}: {
  value: number;
  onChange?: (v: number) => void;
  accent?: string;
  readOnly?: boolean;
  size?: number;
}) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={readOnly}
          onClick={() => onChange?.(n)}
          aria-label={`${n} of 5 stars`}
          className={readOnly ? "cursor-default" : "transition-transform hover:scale-110 cursor-pointer"}
        >
          <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill={n <= value ? accent : "none"}
            stroke={n <= value ? accent : "#cbd5e1"}
            strokeWidth="1.5"
            strokeLinejoin="round"
          >
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
          </svg>
        </button>
      ))}
    </div>
  );
}
