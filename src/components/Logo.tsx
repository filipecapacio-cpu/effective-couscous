type LogoProps = {
  size?: number;
  className?: string;
  withWordmark?: boolean;
};

/** Marca da Pulso: glifo de pulso + wordmark, no traço geométrico da identidade atual. */
export function Logo({ size = 22, className, withWordmark = true }: LogoProps) {
  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ""}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        stroke="currentColor"
        strokeWidth={13}
        strokeLinecap="square"
        className="flex-shrink-0"
      >
        <path d="M6 66 H32" />
        <path d="M32 66 L50 22" stroke="var(--accent)" />
        <path d="M50 22 L67 52 H94" strokeLinejoin="miter" />
      </svg>
      {withWordmark && (
        <span className="font-bold uppercase tracking-[-0.02em] leading-none">Pulso</span>
      )}
    </span>
  );
}
