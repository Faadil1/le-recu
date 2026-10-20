import { t, type Locale } from "@/lib/locale"

type Props = { same: boolean; first: string; second: string; locale: Locale }

/**
 * The SECOND physical impression appears at the top of the *same* sheet,
 * directly above its real marked cost rows. Order is canonical on both
 * participants' browsers: creator first, responder second.
 * No animation can authorize or manufacture a second decision.
 */
export function DuplexResult({ same, first, second, locale }: Props) {
  const words=t(locale)
  return (
    <section className="duplex-imprint w-full" data-duplex-outcome={same?"same":"different"}
      aria-label={words.duelTitle}>
      <div className="duplex-headline">
        <p className="duplex-eyebrow">{words.duelTitle}</p>
        <p className="duplex-verdict">{same ? words.same : words.different}</p>
      </div>
      <div className="duplex-plates">
        <div className="duplex-plate duplex-first">
          <span className="duplex-index">{words.first}</span>
          <span className="duplex-cost duplex-refused">{first}</span>
        </div>
        <div className="duplex-plate duplex-second">
          <span className="duplex-index">{words.second}</span>
          <span className="duplex-cost duplex-refused">{second}</span>
        </div>
      </div>
      <p className="duplex-note">{same ? words.sameNote : words.diffNote}</p>
    </section>
  )
}
