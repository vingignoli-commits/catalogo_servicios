type StarRatingProps = {
  rating: number;
  size?: "sm" | "md" | "lg";
};

export function StarRating({
  rating,
  size = "md",
}: StarRatingProps) {
  const stars = [1, 2, 3, 4, 5];

  const sizeClasses = {
    sm: "text-sm",
    md: "text-lg",
    lg: "text-2xl",
  };

  return (
    <div className={`flex gap-1 ${sizeClasses[size]}`}>
      {stars.map((star) => (
        <span
          key={star}
          className={
            star <= rating
              ? "text-amber-500"
              : "text-slate-300"
          }
        >
          ★
        </span>
      ))}
    </div>
  );
}