import type { Personality } from '../../lib/personality'
import { Kicker, Reveal, SlideBody } from './primitives'

export default function PersonalitySlide({ personality }: { personality: Personality }) {
  return (
    <SlideBody className="justify-center text-center">
      <Reveal>
        <Kicker>Your film personality is…</Kicker>
      </Reveal>
      <Reveal className="mt-8">
        <h2 className="font-display text-5xl font-extrabold leading-[0.95] tracking-tight sm:text-6xl">{personality.title}</h2>
      </Reveal>
      <Reveal className="mt-6">
        <p className="text-lg opacity-90">{personality.description}</p>
      </Reveal>
      <Reveal className="mt-8">
        <ul className="flex flex-wrap justify-center gap-2">
          {personality.traits.map((t) => (
            <li key={t} className="rounded-full border-2 border-current px-4 py-1.5 text-sm font-bold">
              {t}
            </li>
          ))}
        </ul>
      </Reveal>
    </SlideBody>
  )
}
