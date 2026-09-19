import * as E from "../src/engine";
/** Bounded, visible-information policy. No hidden draw order or future RNG access. */
export function fight(s: E.State) {
  let steps = 0;
  while (s.battle?.status === "player" && steps++ < 250) {
    const b = s.battle;
    const wounded = E.alive(s.party).find(
      (u) => u.maxHp - u.hp >= 12 && u.hp <= 15,
    );
    if (s.potions && wounded) {
      E.useTonic(s, wounded.id);
      continue;
    }
    const options = b.hand
      .flatMap((c) =>
        E.targets(s, c).map((t) => {
          const d = E.effectiveCard(s, c),
            v = E.cardValue(s, c),
            incoming = b.intents
              .filter(
                (i) =>
                  i.target === t.id &&
                  b.enemies.some((u) => u.id === i.source && u.hp > 0),
              )
              .reduce((a, i) => a + i.damage, 0);
          const score =
            d.effect === "heal"
              ? Math.min(v, t.maxHp - t.hp) * 1.3
              : d.effect === "block" || d.effect === "step"
                ? Math.min(v, Math.max(0, incoming - t.block)) * 0.9
                : (d.target === "all" ? E.alive(b.enemies).length : 1) * v +
                  (t.hp <= v ? 12 : 0) +
                  (d.effect === "poison" ? 5 : 0);
          return {
            c,
            t,
            score:
              (score +
                (d.draw ?? 0) * 3 +
                (d.weaken ?? 0) * 0.5 +
                (d.partyBlock ?? 0)) /
              (d.cost || 0.7),
          };
        }),
      )
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score);
    if (options.length) {
      const { c, t } = options[0];
      E.play(s, c.uid, t.id, !E.effectiveCard(s, c).optionalMove);
    } else E.endTurn(s);
  }
  if (steps >= 250) throw Error("Combat exceeded decision bound");
  E.finishBattle(s);
}
