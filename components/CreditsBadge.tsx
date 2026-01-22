"use client";

import Link from "next/link";

export function CreditsBadge() {
  return (
    <div className="flex flex-col gap-1 items-start">
      <div className="flex items-center gap-2 text-[9px] sm:text-[10px] font-mono text-zinc-600">
        <span className="uppercase tracking-wider">Powered by</span>
        <Link
          href="https://convex.dev"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 hover:text-zinc-400 transition-colors"
        >
          <ConvexLogo className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
          <span>Convex</span>
        </Link>
        <span className="text-zinc-700">+</span>
        <Link
          href="https://nextjs.org"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 hover:text-zinc-400 transition-colors"
        >
          <NextLogo className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
          <span>Next.js</span>
        </Link>
      </div>
      <p className="text-[8px] text-zinc-700 tracking-wide">
        Not affiliated with GitHub
      </p>
      <p className="text-[8px] text-zinc-700 tracking-wide">
        Made with{" "}
        <span className="text-red-500/60">♥</span>
        {" "}by{" "}
        <Link
          href="https://github.com/dariye"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-zinc-500 transition-colors"
        >
          dariye
        </Link>
        {" · "}
        <Link
          href="https://github.com/dariye/gh.world"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-zinc-500 transition-colors"
        >
          source
        </Link>
      </p>
    </div>
  );
}

function ConvexLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 128 128"
      fill="currentColor"
      className={className}
      aria-label="Convex"
    >
      <path d="M64 0C28.7 0 0 28.7 0 64s28.7 64 64 64 64-28.7 64-64S99.3 0 64 0zm0 115.2C35.8 115.2 12.8 92.2 12.8 64S35.8 12.8 64 12.8 115.2 35.8 115.2 64 92.2 115.2 64 115.2z"/>
      <path d="M64 25.6c-21.2 0-38.4 17.2-38.4 38.4S42.8 102.4 64 102.4 102.4 85.2 102.4 64 85.2 25.6 64 25.6zm0 64c-14.1 0-25.6-11.5-25.6-25.6S49.9 38.4 64 38.4 89.6 49.9 89.6 64 78.1 89.6 64 89.6z"/>
    </svg>
  );
}

function NextLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 180 180"
      fill="currentColor"
      className={className}
      aria-label="Next.js"
    >
      <mask
        id="nextMask"
        style={{ maskType: "alpha" }}
        maskUnits="userSpaceOnUse"
        x="0"
        y="0"
        width="180"
        height="180"
      >
        <circle cx="90" cy="90" r="90" fill="currentColor" />
      </mask>
      <g mask="url(#nextMask)">
        <circle cx="90" cy="90" r="90" fill="currentColor" />
        <path
          d="M149.508 157.52L69.142 54H54v71.97h12.114V69.384l73.885 95.461a90.304 90.304 0 009.509-7.325z"
          fill="url(#nextGrad1)"
        />
        <path
          d="M115 54h12v72h-12z"
          fill="url(#nextGrad2)"
        />
      </g>
      <defs>
        <linearGradient
          id="nextGrad1"
          x1="109"
          y1="116.5"
          x2="144.5"
          y2="160.5"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#060a0f" />
          <stop offset="1" stopColor="#060a0f" stopOpacity="0" />
        </linearGradient>
        <linearGradient
          id="nextGrad2"
          x1="121"
          y1="54"
          x2="120.799"
          y2="106.875"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#060a0f" />
          <stop offset="1" stopColor="#060a0f" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export default CreditsBadge;
