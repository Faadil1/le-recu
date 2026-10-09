type Props = { same: boolean; mine: string; theirs: string }

/** The second imprint appears only after the second, independent server commitment. */
export function DuplexResult({ same, mine, theirs }: Props) {
  return (
    <section className="duplex-imprint w-full" aria-label="Résultat du duel à deux">
      <p className="duplex-eyebrow">DEUX SIGNATURES · UN REÇU</p>
      <div className="duplex-plates">
        <div className="duplex-plate duplex-first">
          <span className="duplex-index">01 / MOI</span>
          <span className="duplex-cost">{mine}</span>
        </div>
        <div className="duplex-plate duplex-second">
          <span className="duplex-index">02 / L'AUTRE</span>
          <span className="duplex-cost">{theirs}</span>
        </div>
      </div>
      <p className="duplex-verdict">{same ? "MÊME REFUS" : "PAS LA MÊME LIGNE"}</p>
      <p className="duplex-note">
        {same
          ? "Vous avez refusé de payer le même prix."
          : "Vous vouliez la même chose. Pas au même prix."}
      </p>
    </section>
  )
}
