import { MUTED, Eyebrow } from "../ui";

/**
 * The bridge into the showcase (11 Sep 2026). The hero defines the
 * collaboration and the winners talk about people; the showcase then jumps
 * into one specific mock experience and three long chapters. One line naming
 * what the next chapters are earns its space. The showcase files stay as
 * they are.
 */
export function Bridge() {
  return (
    <div id="bridge" className="px-6 pt-2 md:pt-4">
      <div className="max-w-2xl mx-auto text-center">
        <Eyebrow>What one collaboration produces</Eyebrow>
        <p className="text-base md:text-lg mt-3 leading-relaxed" style={{ color: MUTED }}>
          One example, start to finish: two experts, six weeks, one group.
          First the experience itself, then how it is built, then a week
          inside it.
        </p>
      </div>
    </div>
  );
}
