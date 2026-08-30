type LogoProps = {
  size?: number;
  className?: string;
  withWordmark?: boolean;
};

/** Marca da Onmode: símbolo de três barras + wordmark, geometria fixa do design system. */
export function Logo({ size = 22, className, withWordmark = true }: LogoProps) {
  const w1 = size * (12 / 72);
  const w2 = size * (19 / 72);
  const w3 = size * (28 / 72);
  const h1 = size * (34 / 72);
  const h2 = size * (52 / 72);
  const h3 = size;
  const gap = size * (10 / 72);

  return (
    <span className={`inline-flex items-center gap-2.5 ${className ?? ""}`}>
      <span className="inline-flex items-end flex-shrink-0" style={{ gap }}>
        <span style={{ width: w1, height: h1, background: "currentColor" }} />
        <span style={{ width: w2, height: h2, background: "currentColor" }} />
        <span style={{ width: w3, height: h3, background: "var(--accent)" }} />
      </span>
      {withWordmark && (
        <span className="font-display font-bold uppercase tracking-[-0.02em] leading-none">
          Onmode
        </span>
      )}
    </span>
  );
}
