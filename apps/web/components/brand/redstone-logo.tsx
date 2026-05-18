import { cn } from '@/lib/utils';

export function RedstoneLogo({
  className,
  size = 40,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('shrink-0', className)}
      aria-hidden
    >
      <path
        d="M32 4L56 20V44L32 60L8 44V20L32 4Z"
        fill="url(#redstone-gem)"
        stroke="#ffb690"
        strokeWidth="2"
      />
      <path
        d="M32 16L44 24V40L32 48L20 40V24L32 16Z"
        fill="#0b1326"
        fillOpacity="0.35"
      />
      <defs>
        <linearGradient
          id="redstone-gem"
          x1="8"
          y1="4"
          x2="56"
          y2="60"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#f97316" />
          <stop offset="1" stopColor="#ea580c" />
        </linearGradient>
      </defs>
    </svg>
  );
}
