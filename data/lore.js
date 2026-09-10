// Darkspire's through-line. Screens can ask for a short passage without
// owning the setting or inventing disconnected flavor.
window.DS = window.DS || {};
DS.Lore = {
  title: 'The Spire remembers every name it takes.',
  subtitle: 'A company of the living climbs after the thief who chained the sky.',
  premise: 'Archmage Tyrhung reached the crown of the Dark Spire and stole the Oath Necklace, the relic that binds the tower to the world below. Since then, the roads have bent upward, the dead have learned to march, and every bell in the hamlet rings one note too late.',
  oath: 'Bring back the necklace. Break Tyrhung\'s ascent. Give the names of the lost somewhere to rest.',
  chapter: function(floor) {
    var chapters = [
      'The road above the hamlet is still wet with ordinary rain. That will not last.',
      'The first gate bears Tyrhung\'s seal: a circle of silver teeth around an empty throat.',
      'The stones remember a procession climbing without footsteps. Your company is not the first to follow it.',
      'The tower has begun to notice you. Doors open before hands touch them.',
      'The air tastes of old spellwork. Somewhere above, the necklace is being taught a new name.',
      'At the crown, Tyrhung waits with the stolen oath and the whole dark tower behind him.'
    ];
    return chapters[Math.max(0, Math.min(chapters.length - 1, Number(floor) || 0))];
  },
  campfire: function(run) {
    if (run && run.runCount > 0) return 'The fire has kept your place. The Spire has not forgiven your return.';
    return 'Before the first step, speak the purpose aloud: Tyrhung has the necklace, and the tower has our dead.';
  },
  town: 'The hamlet survives in the shadow of the tower by refusing to look up for too long. Every upgrade is a small argument against the dark.',
  map: function(run) { return this.chapter(run && run.floor); },
  combat: function(enemies) {
    var names = (enemies || []).filter(function(e) { return e.hp > 0; }).map(function(e) { return e.name; });
    if (!names.length) return 'The room goes quiet. Even the Spire is listening.';
    if (names.some(function(n) { return /vampire|bat|lich|skeleton|wraith|cult/i.test(n); })) return 'The tower has sent its old servants. They recognize the necklace\'s trail.';
    if (names.some(function(n) { return /spider|slime|fung|mushroom/i.test(n); })) return 'The living stone has grown a mouth. Cut a path before it learns your names.';
    return 'The Spire tests the company with steel, hunger, and the promise of an easier way back down.';
  },
  event: 'Every mystery in the Spire is a question Tyrhung refused to answer. The tower keeps asking it of you.',
  reward: 'The Spire pays in things it could not digest: coin, steel, and fragments of the names it stole.',
  boss: function(boss) {
    if (boss && /vampire/i.test(boss.name)) return 'The blood court guards a fragment of the Oath Necklace. Its lord remembers Tyrhung as a guest, not a master.';
    if (boss && /lich/i.test(boss.name)) return 'The dead scholar holds a page from Tyrhung\'s ascent journal. It ends where the handwriting becomes a scream.';
    return 'A guardian of the upper dark steps between the company and Tyrhung\'s crown.';
  },
  ending: function(victory) {
    return victory
      ? 'At the crown, the necklace speaks every lost name at once. Tyrhung falls silent. Below, the roads straighten, and the hamlet hears its bells arrive on time.'
      : 'The Spire closes its hand around the expedition. Somewhere above, Tyrhung turns the necklace and listens for the next company.';
  }
};
