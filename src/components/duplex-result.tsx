import { t, type Locale } from "@/lib/locale"

type Props = { same: boolean; mine: string; theirs: string; locale: Locale }

/** After a real second commitment, the single receipt gains its second impression. */
export function DuplexResult({ same, mine, theirs, locale }: Props) {
  const words=t(locale)
  return (
    <section className="duplex-imprint w-full" aria-label={words.duelTitle}>
      <p className="duplex-eyebrow">{words.duelTitle}</p>
      <div className="duplex-plates">
        <div className="duplex-plate duplex-first">
          <span className="duplex-index">{words.me}</span>
          <span className="duplex-cost duplex-refused">{mine}</span>
        </div>
        <div className="duplex-plate duplex-second">
          <span className="duplex-index">{words.them}</span>
          <span className="duplex-cost duplex-refused">{theirs}</span>
        </div>
      </div>
      <p className="duplex-verdict">{same ? words.same : words.different}</p>
      <p className="duplex-note">{same ? words.sameNote : words.diffNote}</p>
    </section>
  )
}
