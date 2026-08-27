type IconProps = {
  size?: number;
  className?: string;
  strokeWidth?: number;
};

const base = { fill: "none", strokeLinecap: "round", strokeLinejoin: "round" } as const;

export function DumbbellIcon({ size = 24, className, strokeWidth = 1.6 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} stroke="currentColor" strokeWidth={strokeWidth} {...base}>
      <path d="M2 12h3M19 12h3M6 9v6M18 9v6M6 12h12" />
    </svg>
  );
}

export function LeafIcon({ size = 24, className, strokeWidth = 1.6 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} stroke="currentColor" strokeWidth={strokeWidth} {...base}>
      <path d="M12 3c4 2 6 6 4 11-1.6 3.8-5.6 6-9.5 5C4 18 3 14.5 5 11c1.7-2.9 4.3-1.4 7-8Z" />
      <path d="M8 21c1-3 2-5 4-9" />
    </svg>
  );
}

export function PulseIcon({ size = 24, className, strokeWidth = 1.6 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} stroke="currentColor" strokeWidth={strokeWidth} {...base}>
      <path d="M2 12h4l2.5-7 3 14L15 9l2 3h5" />
    </svg>
  );
}

export function PeopleIcon({ size = 24, className, strokeWidth = 1.6 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} stroke="currentColor" strokeWidth={strokeWidth} {...base}>
      <circle cx="9" cy="9" r="3.2" />
      <circle cx="17" cy="8" r="2.4" />
      <path d="M3.5 19c.6-3.4 3-5.2 5.5-5.2s4.9 1.8 5.5 5.2M15.5 19c.4-2.2 1.7-3.7 3.2-4.2" />
    </svg>
  );
}

export function BackArrowIcon({ size = 24, className, strokeWidth = 1.6 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} stroke="currentColor" strokeWidth={strokeWidth} {...base}>
      <path d="M15 5 8 12l7 7" />
    </svg>
  );
}

export function CheckIcon({ size = 24, className, strokeWidth = 2.5 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} stroke="currentColor" strokeWidth={strokeWidth} {...base}>
      <path d="M5 13l4 4 10-10" />
    </svg>
  );
}

export function ClockIcon({ size = 24, className, strokeWidth = 1.8 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} stroke="currentColor" strokeWidth={strokeWidth} {...base}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </svg>
  );
}

export function ShareIcon({ size = 24, className, strokeWidth = 1.8 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} stroke="currentColor" strokeWidth={strokeWidth} {...base}>
      <path d="M12 3v13" />
      <path d="M7 8l5-5 5 5" />
      <path d="M5 15v3a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3v-3" />
    </svg>
  );
}

export function FlameIcon({ size = 24, className, strokeWidth = 1.8 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} stroke="currentColor" strokeWidth={strokeWidth} {...base}>
      <path d="M12 2c1.5 3-1 4.5-1 7 0 2 1.5 3 3 3 2 0 3-1.5 3-3.5 3 2 4 5 4 7.5a7 7 0 0 1-14 0c0-4 2-6 2-9 0-2-1-3.5-1-5Z" />
    </svg>
  );
}

export function BellIcon({ size = 24, className, strokeWidth = 1.6 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} stroke="currentColor" strokeWidth={strokeWidth} {...base}>
      <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.7 21a2 2 0 0 1-3.4 0" />
    </svg>
  );
}

export function HomeIcon({ size = 24, className, strokeWidth = 1.8 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} stroke="currentColor" strokeWidth={strokeWidth} {...base}>
      <path d="M3 11 12 3l9 8" />
      <path d="M5 10v10h14V10" />
    </svg>
  );
}

export function ClipboardIcon({ size = 24, className, strokeWidth = 1.8 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} stroke="currentColor" strokeWidth={strokeWidth} {...base}>
      <rect x="3" y="4" width="18" height="17" rx="3" />
      <path d="M8 2v4M16 2v4M8 13.5l2.5 2.5L16 10.5" />
    </svg>
  );
}

export function UserIcon({ size = 24, className, strokeWidth = 1.8 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} stroke="currentColor" strokeWidth={strokeWidth} {...base}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c1.2-4 4.3-6 8-6s6.8 2 8 6" />
    </svg>
  );
}

export function PlayIcon({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M8 5v14l11-7Z" />
    </svg>
  );
}

export function QuoteIcon({ size = 34, className }: IconProps) {
  return (
    <svg width={size} height={(size * 26) / 34} viewBox="0 0 34 26" className={className} fill="currentColor" opacity={0.55}>
      <path d="M0 26V15.6C0 6.6 5.2.9 13 0v5.4C8.8 6.5 6.6 9.4 6.4 13.4H13V26H0ZM21 26V15.6C21 6.6 26.2.9 34 0v5.4c-4.2 1.1-6.4 4-6.6 8H34V26H21Z" />
    </svg>
  );
}

export function TargetIcon({ size = 24, className, strokeWidth = 1.6 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} stroke="currentColor" strokeWidth={strokeWidth} {...base}>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="1" />
    </svg>
  );
}

export function TrendIcon({ size = 24, className, strokeWidth = 1.6 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} stroke="currentColor" strokeWidth={strokeWidth} {...base}>
      <path d="M3 16l6-7 4 4 8-9" />
      <path d="M15 4h6v6" />
    </svg>
  );
}
