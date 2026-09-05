type IconProps = {
  size?: number;
  className?: string;
  strokeWidth?: number;
};

const base = { fill: "none", strokeLinecap: "square", strokeLinejoin: "miter" } as const;

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

export function LogOutIcon({ size = 24, className, strokeWidth = 1.6 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} stroke="currentColor" strokeWidth={strokeWidth} {...base}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  );
}

export function TrashIcon({ size = 24, className, strokeWidth = 1.6 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} stroke="currentColor" strokeWidth={strokeWidth} {...base}>
      <path d="M4 7h16" />
      <path d="M9 7V4.5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1V7" />
      <path d="M6 7l1 12.5a1.5 1.5 0 0 0 1.5 1.5h7a1.5 1.5 0 0 0 1.5-1.5L18 7" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  );
}

export function PlusIcon({ size = 24, className, strokeWidth = 1.8 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} stroke="currentColor" strokeWidth={strokeWidth} {...base}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function PencilIcon({ size = 24, className, strokeWidth = 1.6 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} stroke="currentColor" strokeWidth={strokeWidth} {...base}>
      <path d="M4 20l.9-4 10.5-10.5a2 2 0 0 1 2.8 0l.3.3a2 2 0 0 1 0 2.8L8 19.1 4 20Z" />
      <path d="M13.5 6.5l3 3" />
    </svg>
  );
}

export function XIcon({ size = 24, className, strokeWidth = 1.8 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} stroke="currentColor" strokeWidth={strokeWidth} {...base}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

export function SparkleIcon({ size = 24, className, strokeWidth = 1.6 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} stroke="currentColor" strokeWidth={strokeWidth} {...base}>
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  );
}

export function CreditCardIcon({ size = 24, className, strokeWidth = 1.6 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} stroke="currentColor" strokeWidth={strokeWidth} {...base}>
      <rect x="2.5" y="5.5" width="19" height="13" rx="1.5" />
      <path d="M2.5 9.5h19M6 14.5h4" />
    </svg>
  );
}

export function SendIcon({ size = 24, className, strokeWidth = 1.8 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} stroke="currentColor" strokeWidth={strokeWidth} {...base}>
      <path d="M22 2 11 13" />
      <path d="M22 2 15 22l-4-9-9-4Z" />
    </svg>
  );
}

export function CalendarIcon({ size = 24, className, strokeWidth = 1.6 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} stroke="currentColor" strokeWidth={strokeWidth} {...base}>
      <rect x="3" y="5" width="18" height="16" rx="3" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  );
}

export function ChevronLeftIcon({ size = 24, className, strokeWidth = 1.8 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} stroke="currentColor" strokeWidth={strokeWidth} {...base}>
      <path d="M15 5 8 12l7 7" />
    </svg>
  );
}

export function ChevronRightIcon({ size = 24, className, strokeWidth = 1.8 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} stroke="currentColor" strokeWidth={strokeWidth} {...base}>
      <path d="M9 5l7 7-7 7" />
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

export function DownloadIcon({ size = 24, className, strokeWidth = 1.8 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} stroke="currentColor" strokeWidth={strokeWidth} {...base}>
      <path d="M12 3v12M7 10l5 5 5-5" />
      <path d="M4 19h16" />
    </svg>
  );
}

export function RepeatIcon({ size = 24, className, strokeWidth = 1.8 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} stroke="currentColor" strokeWidth={strokeWidth} {...base}>
      <path d="M17 2l4 4-4 4" />
      <path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <path d="M7 22l-4-4 4-4" />
      <path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </svg>
  );
}

export function MailIcon({ size = 24, className, strokeWidth = 1.8 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} stroke="currentColor" strokeWidth={strokeWidth} {...base}>
      <rect x="2.5" y="5" width="19" height="14" rx="1.5" />
      <path d="M3.5 6.5L12 13l8.5-6.5" />
    </svg>
  );
}

export function InstagramIcon({ size = 24, className, strokeWidth = 1.8 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} stroke="currentColor" strokeWidth={strokeWidth} {...base}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.3" cy="6.7" r="0.65" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function SwordsIcon({ size = 24, className, strokeWidth = 1.6 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} stroke="currentColor" strokeWidth={strokeWidth} {...base}>
      <path d="M4 20L14 10l-3-3M14 10l3-3" />
      <path d="M20 20L10 10l3-3M10 10l-3-3" />
    </svg>
  );
}

export function FootprintsIcon({ size = 24, className, strokeWidth = 1.6 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} stroke="currentColor" strokeWidth={strokeWidth} {...base}>
      <ellipse cx="8" cy="16" rx="3" ry="4.5" />
      <ellipse cx="16" cy="8" rx="3" ry="4.5" />
    </svg>
  );
}

export function MoveIcon({ size = 24, className, strokeWidth = 1.6 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} stroke="currentColor" strokeWidth={strokeWidth} {...base}>
      <path d="M12 3v18M3 12h18" />
      <path d="M12 3l-3 3M12 3l3 3M12 21l-3-3M12 21l3-3M3 12l3-3M3 12l3 3M21 12l-3-3M21 12l-3 3" />
    </svg>
  );
}

export function HeartPulseIcon({ size = 24, className, strokeWidth = 1.6 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} stroke="currentColor" strokeWidth={strokeWidth} {...base}>
      <path d="M12 20c-5-3.5-9-7-9-11.2C3 5.8 5 4 7.3 4c1.7 0 3.1 1 4.7 3 1.6-2 3-3 4.7-3C19 4 21 5.8 21 8.8 21 13 17 16.5 12 20Z" />
      <path d="M5 11h3l1.5-3L12 14l1.5-4 1 1H19" />
    </svg>
  );
}

export function WindIcon({ size = 24, className, strokeWidth = 1.6 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} stroke="currentColor" strokeWidth={strokeWidth} {...base}>
      <path d="M3 8h11a3 3 0 1 0-3-3" />
      <path d="M3 12h14a3 3 0 1 1-3 3" />
      <path d="M3 16h8" />
    </svg>
  );
}

export function WavesIcon({ size = 24, className, strokeWidth = 1.6 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} stroke="currentColor" strokeWidth={strokeWidth} {...base}>
      <path d="M2 8c1.5-2 3.5-2 5 0s3.5 2 5 0 3.5-2 5 0 3.5 2 5 0" />
      <path d="M2 14c1.5-2 3.5-2 5 0s3.5 2 5 0 3.5-2 5 0 3.5 2 5 0" />
      <path d="M2 20c1.5-2 3.5-2 5 0s3.5 2 5 0 3.5-2 5 0 3.5 2 5 0" />
    </svg>
  );
}

export function BikeIcon({ size = 24, className, strokeWidth = 1.6 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} stroke="currentColor" strokeWidth={strokeWidth} {...base}>
      <circle cx="5.5" cy="17.5" r="3.5" />
      <circle cx="18.5" cy="17.5" r="3.5" />
      <path d="M5.5 17.5L10 8h4l4.5 9.5M10 8l3 5h5.5" />
    </svg>
  );
}

export function YogaIcon({ size = 24, className, strokeWidth = 1.6 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} stroke="currentColor" strokeWidth={strokeWidth} {...base}>
      <circle cx="12" cy="4.5" r="2" />
      <path d="M12 8v6M12 8l-5 3M12 8l5 3M12 14l-4 6M12 14l4 6" />
    </svg>
  );
}
