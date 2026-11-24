export function StockRing({
  segments,
}: {
  segments: { key: string; label: string; count: number; color: string }[]
}) {
  const total = segments.reduce((sum, segment) => sum + segment.count, 0)
  const radius = 46
  const circumference = 2 * Math.PI * radius
  const gap = segments.filter((segment) => segment.count > 0).length > 1 ? 3 : 0
  let offset = 0

  const arcs = segments.map((segment) => {
    const raw = total === 0 ? 0 : (segment.count / total) * circumference
    const length = Math.max(raw - gap, 0)
    const arc = { ...segment, length, offset }
    offset += raw
    return arc
  })

  return (
    <div className="dash-ring-wrap">
      <svg
        className="dash-ring"
        viewBox="0 0 120 120"
        role="img"
        aria-label={segments
          .map((segment) => `${segment.label} ${segment.count}`)
          .join(", ")}
      >
        <circle className="dash-ring-track" cx="60" cy="60" r={radius} />
        {arcs.map((arc) =>
          arc.length > 0 ? (
            <circle
              key={arc.key}
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke={arc.color}
              strokeWidth="9"
              strokeLinecap="butt"
              strokeDasharray={`${arc.length} ${circumference - arc.length}`}
              strokeDashoffset={-arc.offset}
              transform="rotate(-90 60 60)"
            />
          ) : null
        )}
      </svg>
      <div className="dash-ring-center" aria-hidden>
        <strong>{total}</strong>
        <span>products</span>
      </div>
    </div>
  )
}
