// Icon component — port literal de granum-design/icons.jsx (Lucide-style inline SVG, thin stroke)
// Mantém a mesma API: <Icon name="search" /> ou <Icon name="bell" className="..." />

import type { CSSProperties, ReactNode } from "react"

interface IconProps {
  name: string
  className?: string
  style?: CSSProperties
}

const PATHS: Record<string, ReactNode> = {
  home: (
    <>
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1V9.5Z" />
    </>
  ),
  building: (
    <>
      <path d="M4 21V5a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v16" />
      <path d="M16 10h3a1 1 0 0 1 1 1v10" />
      <path d="M4 21h16" />
      <path d="M8 8h2M8 12h2M8 16h2" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M3 20c0-3.5 2.5-6 6-6s6 2.5 6 6" />
      <circle cx="17" cy="9" r="2.5" />
      <path d="M21 19c0-2.5-1.5-4.5-4-5" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 21c0-4 3-7 7-7s7 3 7 7" />
    </>
  ),
  truck: (
    <>
      <path d="M2 7h11v10H2z" />
      <path d="M13 10h5l3 3v4h-8" />
      <circle cx="6" cy="18" r="1.8" />
      <circle cx="17" cy="18" r="1.8" />
    </>
  ),
  briefcase: (
    <>
      <rect x="3" y="7" width="18" height="13" rx="1.5" />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M3 12h18" />
    </>
  ),
  dollar: (
    <>
      <path d="M12 3v18" />
      <path d="M16 7H9.5a2.5 2.5 0 0 0 0 5h5a2.5 2.5 0 0 1 0 5H8" />
    </>
  ),
  receipt: (
    <>
      <path d="M5 3h14v18l-2.5-1.5L14 21l-2-1.5L10 21l-2.5-1.5L5 21Z" />
      <path d="M9 8h6M9 12h6M9 16h3" />
    </>
  ),
  tree: (
    <>
      <path d="M6 3v18" />
      <path d="M6 7h6a2 2 0 0 1 2 2v1" />
      <path d="M6 13h8a2 2 0 0 1 2 2v2" />
      <circle cx="18" cy="10" r="1.5" />
      <circle cx="20" cy="17" r="1.5" />
    </>
  ),
  chart: (
    <>
      <path d="M3 3v18h18" />
      <path d="M7 15l4-4 3 3 5-6" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="1.5" />
      <path d="M3 10h18" />
      <path d="M8 3v4M16 3v4" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h0a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h0a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
    </>
  ),
  plug: (
    <>
      <path d="M9 2v4" />
      <path d="M15 2v4" />
      <path d="M7 10h10v3a5 5 0 0 1-10 0v-3Z" />
      <path d="M12 18v4" />
    </>
  ),
  bell: (
    <>
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 8 3 8H3s3-1 3-8" />
      <path d="M10 20a2 2 0 0 0 4 0" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.5-4.5" />
    </>
  ),
  plus: (
    <>
      <path d="M12 5v14M5 12h14" />
    </>
  ),
  edit: (
    <>
      <path d="M11 4H4v16h16v-7" />
      <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5Z" />
    </>
  ),
  check: (
    <>
      <path d="M5 12l5 5L20 7" />
    </>
  ),
  x: (
    <>
      <path d="M18 6 6 18M6 6l12 12" />
    </>
  ),
  arrowRight: (
    <>
      <path d="M5 12h14M13 5l7 7-7 7" />
    </>
  ),
  chevronRight: (
    <>
      <path d="M9 6l6 6-6 6" />
    </>
  ),
  chevronLeft: (
    <>
      <path d="M15 6l-6 6 6 6" />
    </>
  ),
  chevronDown: (
    <>
      <path d="M6 9l6 6 6-6" />
    </>
  ),
  list: (
    <>
      <path d="M8 6h13M8 12h13M8 18h13" />
      <circle cx="4" cy="6" r="1" />
      <circle cx="4" cy="12" r="1" />
      <circle cx="4" cy="18" r="1" />
    </>
  ),
  layout: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18" />
      <path d="M9 9v12" />
    </>
  ),
  layers: (
    <>
      <path d="M12 2l9 5-9 5-9-5 9-5Z" />
      <path d="M3 12l9 5 9-5" />
      <path d="M3 17l9 5 9-5" />
    </>
  ),
  folder: (
    <>
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />
    </>
  ),
  fileText: (
    <>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Z" />
      <path d="M14 2v6h6" />
      <path d="M8 13h8M8 17h8M8 9h2" />
    </>
  ),
  book: (
    <>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5v14Z" />
      <path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5H6.5A2.5 2.5 0 0 0 4 19.5Z" />
    </>
  ),
  mapPin: (
    <>
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </>
  ),
  phone: (
    <>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z" />
    </>
  ),
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 6 9-6" />
    </>
  ),
  download: (
    <>
      <path d="M12 3v14" />
      <path d="M6 11l6 6 6-6" />
      <path d="M4 21h16" />
    </>
  ),
  upload: (
    <>
      <path d="M12 17V3" />
      <path d="M6 9l6-6 6 6" />
      <path d="M4 21h16" />
    </>
  ),
  more: (
    <>
      <circle cx="5" cy="12" r="1.5" />
      <circle cx="12" cy="12" r="1.5" />
      <circle cx="19" cy="12" r="1.5" />
    </>
  ),
  dots: (
    <>
      <circle cx="5" cy="12" r="1.5" />
      <circle cx="12" cy="12" r="1.5" />
      <circle cx="19" cy="12" r="1.5" />
    </>
  ),
  logout: (
    <>
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
      <path d="M10 17l5-5-5-5" />
      <path d="M15 12H3" />
    </>
  ),
  filter: (
    <>
      <path d="M3 5h18" />
      <path d="M6 12h12" />
      <path d="M10 19h4" />
    </>
  ),
  up: (
    <>
      <path d="M6 15l6-6 6 6" />
    </>
  ),
  down: (
    <>
      <path d="M6 9l6 6 6-6" />
    </>
  ),
  arrowUp: (
    <>
      <path d="M12 19V5" />
      <path d="M5 12l7-7 7 7" />
    </>
  ),
  arrowDown: (
    <>
      <path d="M12 5v14" />
      <path d="M19 12l-7 7-7-7" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  alertTriangle: (
    <>
      <path d="M10.3 3.7L2.2 18a2 2 0 0 0 1.7 3h16.2a2 2 0 0 0 1.7-3L13.7 3.7a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9v4" />
      <circle cx="12" cy="17" r="0.5" fill="currentColor" />
    </>
  ),
  alert: (
    <>
      <path d="M10.3 3.7L2.2 18a2 2 0 0 0 1.7 3h16.2a2 2 0 0 0 1.7-3L13.7 3.7a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9v4" />
      <circle cx="12" cy="17" r="0.5" fill="currentColor" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4 12H2M22 12h-2M4.93 4.93L6.34 6.34M17.66 17.66l1.41 1.41M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </>
  ),
  cloud: (
    <>
      <path d="M17.5 19a4.5 4.5 0 1 0-1.5-8.78A6 6 0 0 0 4 12a5 5 0 0 0 1 9.9" />
      <path d="M5 21h12.5" />
    </>
  ),
  cloudRain: (
    <>
      <path d="M16 13a4 4 0 1 0-1.4-7.78A6 6 0 0 0 3 11a5 5 0 0 0 1 9.9" />
      <path d="M8 19v2M12 17v3M16 19v2" />
    </>
  ),
  activity: (
    <>
      <path d="M22 12h-4l-3 9-6-18-3 9H2" />
    </>
  ),
  trend: (
    <>
      <path d="M3 17l6-6 4 4 8-8" />
      <path d="M14 7h7v7" />
    </>
  ),
  trendingUp: (
    <>
      <path d="M3 17l6-6 4 4 8-8" />
      <path d="M14 7h7v7" />
    </>
  ),
  trendDown: (
    <>
      <path d="M3 7l6 6 4-4 8 8" />
      <path d="M14 17h7v-7" />
    </>
  ),
  trendingDown: (
    <>
      <path d="M3 7l6 6 4-4 8 8" />
      <path d="M14 17h7v-7" />
    </>
  ),
  wallet: (
    <>
      <path d="M3 7v12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7H5a2 2 0 0 1 0-4h16V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2Z" />
      <circle cx="17" cy="14" r="1" fill="currentColor" />
    </>
  ),
  zap: (
    <>
      <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8Z" />
    </>
  ),
  eye: (
    <>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  external: (
    <>
      <path d="M15 3h6v6" />
      <path d="M10 14l11-11" />
      <path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5" />
    </>
  ),
  image: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="M21 15l-5-5L5 21" />
    </>
  ),
  mic: (
    <>
      <rect x="9" y="3" width="6" height="12" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0" />
      <path d="M12 18v3" />
    </>
  ),
  clipboard: (
    <>
      <rect x="6" y="4" width="12" height="17" rx="2" />
      <rect x="9" y="2" width="6" height="4" rx="1" />
      <path d="M9 12h6M9 16h4" />
    </>
  ),
  construction: (
    <>
      <rect x="3" y="12" width="18" height="8" rx="1" />
      <path d="M3 16h18" />
      <path d="M7 20v2M17 20v2" />
      <path d="M6 12V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v6" />
    </>
  ),
  hammer: (
    <>
      <path d="M14 4l5 5-3 3-5-5 3-3Z" />
      <path d="M11 7L3 15l3 3 8-8" />
    </>
  ),
  sparkle: (
    <>
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6.3 6.3l2.8 2.8M14.9 14.9l2.8 2.8M6.3 17.7l2.8-2.8M14.9 9.1l2.8-2.8" />
    </>
  ),
  moreH: (
    <>
      <circle cx="5" cy="12" r="1.5" />
      <circle cx="12" cy="12" r="1.5" />
      <circle cx="19" cy="12" r="1.5" />
    </>
  ),
  refresh: (
    <>
      <path d="M21 12a9 9 0 1 1-2.64-6.36L21 8" />
      <path d="M21 3v5h-5" />
    </>
  ),
  messageSquare: (
    <>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z" />
    </>
  ),
  key: (
    <>
      <circle cx="8" cy="15" r="4" />
      <path d="M10.8 12.2 21 2" />
      <path d="M18 5l3 3M15 8l2 2" />
    </>
  ),
  shield: (
    <>
      <path d="M12 2 4 6v6c0 5 3.5 9.5 8 10 4.5-.5 8-5 8-10V6l-8-4Z" />
      <path d="M9 12l2 2 4-4" />
    </>
  ),
  smartphone: (
    <>
      <rect x="6" y="2" width="12" height="20" rx="2" />
      <path d="M11 18h2" />
    </>
  ),
  monitor: (
    <>
      <rect x="2" y="4" width="20" height="14" rx="2" />
      <path d="M8 22h8M12 18v4" />
    </>
  ),
  trash: (
    <>
      <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
      <path d="M6 6l1 14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-14" />
      <path d="M10 11v6M14 11v6" />
    </>
  ),
  camera: (
    <>
      <path d="M3 8a2 2 0 0 1 2-2h2l1.5-2h7L17 6h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8Z" />
      <circle cx="12" cy="13" r="4" />
    </>
  ),
  paperclip: (
    <>
      <path d="M21 11.5l-8.5 8.5a5 5 0 0 1-7-7l8.5-8.5a3.5 3.5 0 0 1 5 5L11 17a2 2 0 0 1-3-3l7-7" />
    </>
  ),
  play: (
    <>
      <path d="M6 4l14 8-14 8V4Z" fill="currentColor" />
    </>
  ),
  menu: (
    <>
      <path d="M3 6h18M3 12h18M3 18h18" />
    </>
  ),
}

export function Icon({ name, className, style }: IconProps) {
  const p = PATHS[name] ?? PATHS.layout
  return (
    <svg
      className={className}
      style={style}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {p}
    </svg>
  )
}
