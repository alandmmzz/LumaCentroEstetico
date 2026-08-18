export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-secondary/40 py-14">
      <div className="mx-auto max-w-6xl px-6 text-center">
        <div className="flex flex-col items-center leading-none">
          <span className="font-serif text-2xl font-semibold tracking-[0.25em] text-primary">
            LUMA
          </span>
          <span className="mt-1 text-[0.6rem] tracking-[0.4em] text-muted-foreground">
            CENTRO ESTÉTICO
          </span>
        </div>
        <p className="mx-auto mt-6 max-w-md text-sm italic leading-relaxed text-muted-foreground">
          Iluminamos tu belleza, potenciamos tu esencia.
        </p>
        <p className="mt-6 text-xs tracking-wide text-muted-foreground">
          San Martín 2825 · Reducto · Montevideo, Uruguay
        </p>
        <p className="mt-2 text-xs tracking-wide text-muted-foreground">
          @luma_centroestetico
        </p>
      </div>
    </footer>
  )
}
