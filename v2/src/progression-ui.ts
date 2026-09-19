import { CLASSES, PATH_BONUSES, type ClassId } from "./content";
import type { State } from "./engine";
import {
  availablePoints,
  earnedPoints,
  skillsForPath,
  trainingReason,
  type TrainedUnit,
} from "./progression";
import "./progression.css";
import { allHeroes } from "./roster";
const esc = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
export function progressionMarkup(
  s: State,
  heroId = allHeroes(s)[0]?.id ?? "",
): string {
  const heroes = allHeroes(s);
  const u = (heroes.find((u) => u.id === heroId) ?? heroes[0]) as
    TrainedUnit | undefined;
  if (!u)
    return '<h1>The Guild awaits new arrivals.</h1><p>Visit the Stagecoach to recruit a new party.</p><button data-action="roster">STAGECOACH</button>';
  const c = CLASSES[u.kind as ClassId];
  return `<div class="progression"><span class="eyebrow">THE ADVENTURERS' GUILD</span><h1>${esc(u.name)}'s training</h1>
    <nav class="progression-tabs" aria-label="Hero skill trees">${heroes.map((hero) => `<button data-action="skills" data-id="${esc(hero.id)}" aria-pressed="${hero.id === u.id}">${esc(hero.name)}</button>`).join("")}</nav>
    <p>Level ${u.level} ${c.title} &middot; <strong>${availablePoints(u)} skill points available</strong> / ${earnedPoints(u)} earned. Earn one point per level, from level 2 through 6.</p>
    <p>Training stays with this hero. Choose one specialty; its alternative closes permanently. Skills are lost if the hero dies. Train between expeditions.</p>
    <div class="progression-paths">${c.paths
      .map((name, path) => {
        const chosen = u.path === path,
          other = u.path !== null && !chosen;
        const canChoose =
          s.screen === "camp" && u.hp > 0 && u.level >= 2 && u.path === null;
        return `<section class="progression-path ${chosen ? "chosen" : other ? "unchosen" : ""}"><span class="eyebrow">${chosen ? "YOUR SUBCLASS" : "SUBCLASS"}</span><h2>${name}</h2><p class="path-inherent">Innate: ${PATH_BONUSES[path]}.</p>
        ${u.path === null ? `<button data-action="path" data-id="${esc(u.id)}" data-path="${path}" ${canChoose ? "" : "disabled"}>${canChoose ? `CHOOSE ${name.toUpperCase()}` : "UNLOCKS AT LEVEL 2 IN CAMP"}</button>` : ""}
        ${skillsForPath(u.kind, path)
          .map((skill, i) => {
            const learned = (u.skills ?? []).includes(skill.id),
              reason = trainingReason(s, u, skill);
            return `<article class="progression-skill ${learned ? "learned" : ""}"><small>${i === 0 ? "FOUNDATION" : i === 3 ? "MASTERY" : "SPECIALTY · CHOOSE ONE"} &middot; LEVEL ${skill.level}</small><h3>${skill.name}</h3><p>${skill.description}</p>
          <button data-action="train-skill" data-id="${esc(u.id)}" data-skill="${skill.id}" ${reason ? "disabled" : ""}>${learned ? "LEARNED" : `LEARN · ${skill.cost} ${skill.cost === 1 ? "POINT" : "POINTS"}`}</button>${reason && !learned ? `<small class="skill-requirement">${esc(reason)}</small>` : ""}</article>`;
          })
          .join("")}</section>`;
      })
      .join("")}</div></div>`;
}
