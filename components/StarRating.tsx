"use client";

export default function StarRating({
  value,
  onChange,
  readOnly = false,
}: {
  value: number;
  onChange?: (v: number) => void;
  readOnly?: boolean;
}) {
  return (
    <div className="flex gap-1 text-secondary-fixed-dim">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          role={readOnly ? undefined : "button"}
          className={`material-symbols-outlined rating-star ${
            readOnly ? "" : "cursor-pointer"
          } ${star <= value ? "active" : ""}`}
          style={{ fontVariationSettings: star <= value ? "'FILL' 1" : "'FILL' 0" }}
          onClick={readOnly ? undefined : () => onChange?.(star === value ? 0 : star)}
        >
          star
        </span>
      ))}
    </div>
  );
}
