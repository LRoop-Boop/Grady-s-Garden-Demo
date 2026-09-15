// A decorative strip of overlapping vegetable emoji, read as a "pile" —
// purely visual, so it's hidden from assistive tech.

const veggiePile = ["🥕", "🌽", "🍅", "🥦", "🍆", "🫑", "🥔", "🥬", "🧅", "🍠", "🥒", "🫛"];
// translateY per position in the pile, cycled by index % 3.
const veggieOffsets = ["10%", "-10%", "0%"];

export default function VeggieFooter() {
  return (
    <footer className="flex h-10 w-full shrink-0 items-end justify-center overflow-hidden border-t-4 border-amber-900/30 bg-gradient-to-b from-amber-100 to-amber-300 sm:h-12">
      <div className="flex items-end" aria-hidden="true">
        {veggiePile.map((veggie, i) => (
          <span
            key={`${veggie}-${i}`}
            className="text-4xl leading-none sm:text-5xl"
            style={{
              marginLeft: i === 0 ? 0 : "-0.75rem",
              transform: `translateY(${veggieOffsets[i % veggieOffsets.length]}) rotate(${((i % 5) - 2) * 8}deg)`,
              zIndex: i,
            }}
          >
            {veggie}
          </span>
        ))}
      </div>
    </footer>
  );
}
