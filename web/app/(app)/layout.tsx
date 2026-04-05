export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#020810] relative overflow-hidden">
      {/* Galaxy background — SVG with sharp luminous gradients */}
      <svg
        className="fixed inset-0 w-full h-full z-0 pointer-events-none"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <defs>
          {/* Main diagonal beam */}
          <radialGradient id="beam" cx="75%" cy="20%" r="50%" fx="75%" fy="20%">
            <stop offset="0%" stopColor="#9CF0FF" stopOpacity="0.35" />
            <stop offset="15%" stopColor="#4AB8CC" stopOpacity="0.2" />
            <stop offset="40%" stopColor="#1A3F6E" stopOpacity="0.15" />
            <stop offset="70%" stopColor="#0A1A3D" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#020810" stopOpacity="0" />
          </radialGradient>

          {/* Hot cyan core */}
          <radialGradient id="core" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.6" />
            <stop offset="20%" stopColor="#9CF0FF" stopOpacity="0.5" />
            <stop offset="50%" stopColor="#4AB8CC" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#020810" stopOpacity="0" />
          </radialGradient>

          {/* Deep blue nebula */}
          <radialGradient id="nebula" cx="40%" cy="60%" r="45%">
            <stop offset="0%" stopColor="#172090" stopOpacity="0.3" />
            <stop offset="50%" stopColor="#0A1051" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#020810" stopOpacity="0" />
          </radialGradient>

          {/* Orange warmth */}
          <radialGradient id="warmth" cx="15%" cy="85%" r="30%">
            <stop offset="0%" stopColor="#FF6130" stopOpacity="0.15" />
            <stop offset="40%" stopColor="#FF6130" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#020810" stopOpacity="0" />
          </radialGradient>

          {/* Purple depth */}
          <radialGradient id="purple" cx="85%" cy="65%" r="25%">
            <stop offset="0%" stopColor="#6B3FA0" stopOpacity="0.15" />
            <stop offset="60%" stopColor="#3A1F5E" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#020810" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Base dark */}
        <rect width="100%" height="100%" fill="#020810" />

        {/* Deep blue nebula field */}
        <rect width="100%" height="100%" fill="url(#nebula)" />

        {/* Main diagonal light beam — the key element */}
        <ellipse cx="1050" cy="150" rx="700" ry="500" fill="url(#beam)" transform="rotate(-15, 1050, 150)" />

        {/* Hot cyan core — bright point source */}
        <ellipse cx="1080" cy="120" rx="80" ry="60" fill="url(#core)" />

        {/* Secondary beam reflection */}
        <ellipse cx="900" cy="300" rx="400" ry="250" fill="url(#beam)" opacity="0.3" transform="rotate(-25, 900, 300)" />

        {/* Orange warmth bottom-left */}
        <ellipse cx="150" cy="780" rx="350" ry="250" fill="url(#warmth)" />

        {/* Purple accent right */}
        <ellipse cx="1250" cy="600" rx="200" ry="180" fill="url(#purple)" />
      </svg>

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
