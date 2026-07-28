export function Button({
  type = "button",
  variant = "default",
  size = "md",
  className = "",
  children,
  ...props
}) {
  const baseStyles =
    "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:pointer-events-none";
  const variantStyles =
    variant === "primary"
      ? "bg-primary text-white hover:bg-primary/90"
      : variant === "secondary"
      ? "bg-muted text-foreground hover:bg-muted/80 border border-border"
      : variant === "destructive"
      ? "bg-destructive text-white hover:bg-destructive/90"
      : variant === "ghost"
      ? "bg-transparent text-foreground hover:bg-muted border-transparent"
      : "bg-card text-foreground hover:bg-muted border border-border";
  const sizeStyles =
    size === "sm"
      ? "px-3 py-1.5 text-xs"
      : size === "lg"
      ? "px-5 py-3 text-base"
      : "px-4 py-2 text-sm";

  return (
    <button type={type} className={`${baseStyles} ${variantStyles} ${sizeStyles} ${className}`} {...props}>
      {children}
    </button>
  );
}
