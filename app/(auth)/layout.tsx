export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-4">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--accent),_transparent_60%)] opacity-60"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -bottom-32 -z-10 h-64 bg-[radial-gradient(ellipse_at_bottom,_var(--granum-azul),_transparent_70%)] opacity-15"
      />
      {children}
    </div>
  )
}
