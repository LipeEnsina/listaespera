const PROFILES = [
  { label: "Lipe Alive", href: "https://www.instagram.com/lipe.alive/" },
  { label: "Lipe Ensina", href: "https://www.instagram.com/llipe.ensina/" },
];

function InstagramGlyph() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="h-[18px] w-[18px] shrink-0">
      <rect
        x="2.75"
        y="2.75"
        width="18.5"
        height="18.5"
        rx="5.25"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <circle
        cx="12"
        cy="12"
        r="4.15"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <circle cx="17.3" cy="6.7" r="1.25" fill="currentColor" />
    </svg>
  );
}

/** Atalhos para os dois perfis do Instagram. */
export default function InstagramLinks({
  className = "",
}: {
  className?: string;
}) {
  return (
    <div className={`flex flex-wrap items-center gap-2.5 ${className}`}>
      {PROFILES.map((profile) => (
        <a
          key={profile.href}
          href={profile.href}
          target="_blank"
          rel="noopener noreferrer"
          className="group inline-flex items-center gap-2 rounded-full border border-white/[0.12] bg-white/[0.04] px-3.5 py-2 text-sm font-medium text-white/75 transition hover:border-magenta/60 hover:bg-magenta/10 hover:text-white"
        >
          <span className="text-white/50 transition group-hover:text-magenta">
            <InstagramGlyph />
          </span>
          {profile.label}
        </a>
      ))}
    </div>
  );
}
