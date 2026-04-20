export type AvatarGlyphProps = {
  seed: {
    background: string;
    ring: string;
    mark: string;
    code: string;
  };
  initials?: string;
  size?: number;
};

export function AvatarGlyph({ seed, initials, size = 44 }: AvatarGlyphProps) {
  const patternId = `avatar-pattern-${seed.code}`;
  const gradientId = `avatar-gradient-${seed.code}`;

  return (
    <div
      className="relative inline-flex items-center justify-center overflow-hidden rounded-full"
      style={{
        width: size,
        height: size,
        background: seed.background,
        boxShadow: `inset 0 0 0 1px color-mix(in oklab, ${seed.ring} 60%, transparent)`,
      }}
    >
      <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true">
        <defs>
          <pattern
            id={patternId}
            width="14"
            height="14"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(30)"
          >
            <path d="M0 7 L14 7" stroke={seed.mark} strokeOpacity="0.2" strokeWidth="0.6" />
          </pattern>
          <radialGradient id={gradientId} cx="50%" cy="35%" r="65%">
            <stop offset="0%" stopColor={seed.mark} stopOpacity="0.25" />
            <stop offset="100%" stopColor={seed.mark} stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="64" height="64" fill={`url(#${patternId})`} />
        <rect width="64" height="64" fill={`url(#${gradientId})`} />
        <polygon
          points="32,12 50,22 50,42 32,52 14,42 14,22"
          fill="none"
          stroke={seed.ring}
          strokeOpacity="0.55"
          strokeWidth="0.8"
        />
      </svg>
      {initials ? (
        <span
          className="absolute text-sm font-semibold"
          style={{ letterSpacing: "0.02em" }}
        >
          {initials}
        </span>
      ) : null}
    </div>
  );
}
