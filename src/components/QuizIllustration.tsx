import type { ReactNode } from "react";

export type QuizPicture = "strawberry" | "vegetables" | "tomato" | "cucumber" | "apple" | "harvest" | "carrot" | "leaves" | "seedling" | "drooping";

const descriptions: Record<QuizPicture, string> = {
  strawberry: "An outline of a strawberry, with its color left for you to imagine.",
  vegetables: "Outlines of broccoli, peas, a carrot, a beet, a tomato and a pumpkin, without their colors.",
  tomato: "A whole tomato with a leafy top.",
  cucumber: "A whole cucumber.",
  apple: "Two freshly picked apples.",
  harvest: "An apple, a tomato, a carrot and a potato from a garden harvest.",
  carrot: "A carrot with a leafy top.",
  leaves: "A head of lettuce and a bunch of spinach.",
  seedling: "A small plant in a flowerpot.",
  drooping: "A seedling with drooping leaves and dry, cracked soil.",
};

function Produce({ kind, color = true }: { kind: string; color?: boolean }) {
  const fill = (value: string) => color ? value : "#fffdf5";
  switch (kind) {
    case "strawberry": return <><path fill={fill("#ef6570")} d="M20 32 Q5 50 30 82 Q50 108 70 82 Q95 50 80 32 Q65 18 50 30 Q35 18 20 32Z" /><path fill={fill("#65a85c")} d="m50 32-24-15 17 1 7-15 7 15 17-1Z" />{[ [30,45], [52,48], [70,45], [40,65], [62,65], [50,82] ].map(([x,y]) => <path key={`${x}-${y}`} stroke={color ? "#fff1b8" : "#52766a"} d={`M${x} ${y}v3`} />)}</>;
    case "carrot": return <><path fill={fill("#f5a044")} d="M26 34 Q50 20 74 34 L49 96Z" /><path fill={fill("#72b66c")} d="M48 30Q15 9 30 5L49 21Q48-6 60 3L57 24Q83 2 83 15L60 32" /><path d="m34 48 16 3m-9 16 16 2" /></>;
    case "cucumber": return <><path fill="#80b96c" d="M25 86Q4 75 25 43L57 9Q76-5 87 14Q99 30 74 52L43 83Q33 92 25 86Z" /><path stroke="#508b51" d="m30 67 8-9m8-7 8-9m8-7 8-9" /></>;
    case "broccoli": return <><path fill={fill("#95bf72")} d="m42 48-8 43h33L57 47" /><path fill={fill("#65a85c")} d="M17 58C-2 38 16 22 29 26C25 0 69-3 72 22C101 18 103 58 80 61Q51 77 17 58Z" /></>;
    case "peas": return <><path fill={fill("#76b66a")} d="M8 78Q25 4 91 13Q84 85 8 78Z" />{[30,50,70].map((x,i) => <circle key={x} fill={fill("#b2d58b")} cx={x} cy={61-i*15} r="11" />)}</>;
    case "beet": return <><path fill={fill("#b66c92")} d="M20 38Q50 13 80 38Q90 70 50 87L46 98 42 86Q10 73 20 38Z" /><path d="M50 28 36 4m14 24L62 3" /></>;
    case "potato": return <><path fill="#d5b17c" d="M12 48Q7 23 33 22Q46 4 71 20Q98 34 86 66Q82 93 48 89Q11 88 12 48Z" /><path d="m30 43 2 2m29-13 2 2m-13 34 2 2m20-14 2 2" /></>;
    case "lettuce": return <><path fill="#a3cc79" d="M18 79Q0 61 17 44Q4 22 31 20Q46-3 66 17Q95 10 88 38Q108 59 85 78Q54 101 18 79Z" /><path d="M50 87Q23 53 31 35m19 52q28-31 23-51M50 87V28" /></>;
    case "spinach": return <><path d="m49 95 2-66m-2 66L22 53m27 42 31-41" /><path fill="#68a66b" d="M51 63Q19 31 51 3Q84 28 51 63ZM30 78Q-1 77 9 39Q43 42 30 78ZM66 77Q59 42 93 32Q103 68 66 77Z" /></>;
    default: return <><path fill={fill(kind === "pumpkin" ? "#efac52" : "#ed7770")} d="M50 28Q15 9 10 46Q2 82 34 92Q50 86 65 92Q97 82 90 46Q85 9 50 28Z" /><path d="M50 28Q46 11 55 5" /><path fill={fill("#7caf68")} d="M53 18Q69-2 82 12Q70 27 53 18Z" />{kind === "pumpkin" && <path d="M38 30Q23 60 39 88m24-58q14 30-2 58" />}</>;
  }
}

function Plant({ drooping, review }: { drooping: boolean; review: boolean }) {
  return <>
    {review && <><circle cx="238" cy="35" r="20" fill="#f8ce68" /><path stroke="#e9b34a" d="M238 5V0m0 70v-8m-32-27h-8m72 0h8" /><path fill="#8ccde0" d="M80 32Q61 59 80 60Q99 59 80 32Z" /></>}
    <path fill="#dfa681" d="m116 104 11 57h66l11-57Z" /><rect x="108" y="94" width="104" height="18" rx="6" fill="#edbc98" />
    <ellipse cx="160" cy="94" rx="43" ry="7" fill="#ae805f" />
    <path d="M160 93V40" />
    <path fill="#84b978" d={drooping ? "M160 56Q120 31 121 73Q138 61 160 56ZM160 64Q198 43 198 81Q181 67 160 64Z" : "M160 66Q119 67 121 34Q154 32 160 66ZM160 52Q163 22 198 25Q198 55 160 52Z"} />
    {drooping && <path stroke="#76573f" d="m135 92 7 4 9-4m22 0 7 4 8-3" />}
  </>;
}

export default function QuizIllustration({ picture, review = false }: { picture: QuizPicture; review?: boolean }) {
  const colorsHidden = !review && (picture === "strawberry" || picture === "vegetables");
  let drawing: ReactNode;
  let description = descriptions[picture];
  if (picture === "seedling" || picture === "drooping") {
    drawing = <Plant drooping={picture === "drooping"} review={review} />;
    if (review) description += " Sunlight and a water droplet illustrate plant care.";
  } else if (picture === "apple" && review) {
    description = "Apples growing on the branches of an apple tree.";
    drawing = <><path fill="#ba8b62" d="m146 161 6-90h20l8 90Z" /><path fill="#8cbd78" d="M88 91Q58 53 100 37Q102 3 146 16Q188-9 207 27Q249 28 231 71Q244 103 199 112H122Q87 117 88 91Z" />{[ [110,46], [172,34], [193,75] ].map(([x,y]) => <g key={x} transform={`translate(${x} ${y}) scale(.3)`}><Produce kind="apple" /></g>)}</>;
  } else {
    const items = picture === "vegetables" ? ["broccoli", "peas", "carrot", "beet", "tomato", "pumpkin"] : picture === "harvest" ? ["apple", "tomato", "carrot", "potato"] : picture === "leaves" ? ["lettuce", "spinach"] : picture === "apple" ? ["apple", "apple"] : [picture];
    const scale = items.length > 4 ? .45 : items.length > 2 ? .65 : 1;
    const step = items.length > 4 ? 50 : items.length > 2 ? 73 : 112;
    const start = (320 - ((items.length - 1) * step + 100 * scale)) / 2;
    drawing = items.map((kind, i) => <g key={`${kind}-${i}`} transform={`translate(${start + i * step} ${90 - 50 * scale}) scale(${scale})`}><Produce kind={kind} color={!colorsHidden} /></g>);
    if (review && picture === "strawberry") description = "A ripe red strawberry with a green leafy top.";
    if (review && picture === "vegetables") description = "Green broccoli and peas, an orange carrot, a purple beet, a red tomato and an orange pumpkin.";
  }
  return <div className={`overflow-hidden rounded-2xl border border-teal-100 bg-[#fffdf5] ${review ? "my-3 max-w-xs" : "mb-6"}`}>
    <svg role="img" aria-label={description} viewBox="0 0 320 180" className={`mx-auto w-full ${review ? "h-28" : "h-40 sm:h-48"}`} fill="none" stroke="#42675a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="160" cy="155" rx="115" ry="10" fill="#e6eddc" stroke="none" />
      {drawing}
    </svg>
    {colorsHidden && <p className="px-3 pb-3 text-center text-xs text-slate-600">Imagine the colors!</p>}
  </div>;
}
