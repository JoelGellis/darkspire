# Current card and equipment inventory
Generated from actual index script order on 2026-09-09. Descriptions are current implementation claims, not independent behavior verification.

## fighter (16 cards)

| ID | Energy | Launch | Target | Current effect |
|---|---|---|---|---|
| fighter_strike | 1 | any | enemy | Deal 7 damage. |
| fighter_shield_block | 1 | any | self | Gain 8 Block. |
| fighter_heavy_blow | 2 | 1 | enemy | Deal 15 damage. Pos 1 only. |
| fighter_rally | 1 | any | all_allies | 4 Block to ALL allies. |
| fighter_cleave | 2 | 1/2 | all_enemies | Deal 6 damage to ALL enemies. |
| fighter_taunt | 1 | 1 | self | Gain 5 Block. Enemies target you. |
| fighter_fortify | 1 | any | self | Gain Block = half current Block (min 3). |
| fighter_second_wind | 1 | any | self | Heal 6 HP. Exhaust. |
| fighter_war_cry | 1 | any | none | Gain 2 Strength this combat. Exhaust. |
| fighter_shield_bash | 2 | 1 | enemy | Deal 8 damage. Apply 2 Vulnerable. |
| fighter_whirlwind | 3 | 1 | all_enemies | Deal 10 damage to ALL enemies. Pos 1 only. |
| fighter_iron_will | 1 | 1/2 | self | Gain 12 Block. Exhaust. |
| fighter_intercept | 1 | any | ally | Gain 7 Block. Guard an ally until next turn. |
| fighter_riposte | 1 | any | self | Gain 5 Block. Retaliate for 5 damage against the next 2 attacks this round. |
| fighter_hook | 1 | any | enemy_any | Deal 4 damage. Pull target forward 2 ranks. |
| fighter_sunder | 2 | any | enemy | Destroy up to 12 Block, then deal 9 damage. |

## rogue (15 cards)

| ID | Energy | Launch | Target | Current effect |
|---|---|---|---|---|
| rogue_backstab | 1 | any | enemy | Deal 8 damage. |
| rogue_evade | 1 | any | self | Gain 6 Block. |
| rogue_throwing_knife | 1 | any | enemy_any | Deal 5 damage. Hits any enemy. |
| rogue_shadow_step | 1 | 2/3 | enemy | Deal 4 damage + move forward 1. |
| rogue_flurry | 1 | 1/2 | enemy | Strike 3 times for 3 damage. |
| rogue_smoke_bomb | 1 | 2/3/4 | ally | Gain 4 Block. Swap positions with an ally. |
| rogue_poison_blade | 1 | any | enemy | Deal 4 damage + 3 Poison. |
| rogue_fan_of_knives | 2 | 3/4 | all_enemies | Deal 3 damage to all enemies. |
| rogue_weaken | 1 | any | enemy | Deal 3 damage. Apply 2 Weak. |
| rogue_lacerate | 1 | any | enemy | Deal 5 damage. Apply 3 Bleed. |
| rogue_assassinate | 2 | 1/2 | enemy | Deal 20 damage. Exhaust. |
| rogue_caltrops | 1 | 2/3/4 | all_enemies | Apply 2 Poison to ALL enemies. |
| rogue_reserve_blade | 1 | any | enemy | Retain. Deal 9 damage when the moment is right. |
| rogue_improvise | 0 | any | none | Discard your leftmost other card. Draw 2. Exhaust. |
| rogue_escape_plan | 1 | any | self | Innate. Gain 4 Block whenever you deliberately discard a card this combat. Exhaust. |

## cleric (12 cards)

| ID | Energy | Launch | Target | Current effect |
|---|---|---|---|---|
| cleric_smite | 1 | any | enemy | Deal 5 damage. |
| cleric_divine_shield | 1 | any | ally | Give ally 7 Block. |
| cleric_heal | 1 | any | ally | Heal ally 8 HP. |
| cleric_bless | 2 | 4 | all_allies | All allies: 4 Block + 2 HP. Pos 4 only. |
| cleric_holy_fire | 2 | any | enemy | Deal 9 damage. |
| cleric_sanctuary | 2 | 3/4 | all_allies | All allies: 3 Block + 3 HP. |
| cleric_purify | 0 | any | ally | Remove all Poison from an ally. |
| cleric_resurrect | 3 | 4 | ally_dead | Revive a dead hero at 1 HP. Exhaust. |
| cleric_divine_wrath | 2 | 3/4 | all_enemies | Deal 4 damage to all. Apply 1 Vulnerable. |
| cleric_cleansing_light | 1 | 3/4 | all_allies | Heal all allies 3 HP. Remove all Weak. |
| cleric_martyrdom | 1 | 3/4 | none | Lose 5 HP. Heal all other allies 10 HP. |
| cleric_holy_nova | 2 | 3/4 | all_enemies | Deal 5 damage to all enemies. Heal all allies 3 HP. |

## wizard (15 cards)

| ID | Energy | Launch | Target | Current effect |
|---|---|---|---|---|
| wizard_magic_missile | 1 | any | enemy_any | Deal 6 damage. Hits any enemy. |
| wizard_arcane_ward | 1 | any | self | Gain 5 Block. |
| wizard_fireball | 2 | 4 | all_enemies | Deal 4 damage to ALL enemies. Pos 4 only. |
| wizard_arcane_intellect | 1 | 4 | none | Draw 3 cards. Pos 4 only. |
| wizard_chain_lightning | 2 | 4 | enemy | Strike random enemies 4 times for 3 damage. |
| wizard_frost_nova | 1 | 3/4 | all_enemies | 2 damage to all enemies. 25% stun. |
| wizard_mana_shield | 0 | any | self | Convert energy to Block (4 per 1 energy). |
| wizard_teleport | 0 | 1/2/3/4 | none | Swap two heroes' positions. Exhaust. |
| wizard_blizzard | 3 | 4 | all_enemies | Deal 3 damage to all enemies. Apply 2 Weak. |
| wizard_empower | 1 | any | ally | Give an ally 3 Strength. Exhaust. |
| wizard_meteor | 3 | 4 | all_enemies | Deal 15 damage to ALL enemies. Exhaust. |
| wizard_mirror_image | 1 | 3/4 | all_allies | Give all allies 3 Block. Draw 1 card. |
| wizard_overcharge | 0 | any | none | The leftmost other card costs 0 this turn. Exhaust. |
| wizard_arcane_barrage | X | any | enemy_any | Spend all energy. Deal 6 damage per energy spent. |
| wizard_conjure | 1 | any | none | Create two free Arcane Shards. Unused shards fade at turn end. Exhaust. |

## barbarian (12 cards)

| ID | Energy | Launch | Target | Current effect |
|---|---|---|---|---|
| barbarian_savage_strike | 1 | any | enemy | Deal 8 damage. |
| barbarian_tough_skin | 1 | any | self | Gain 6 Block. |
| barbarian_reckless_charge | 1 | 1 | enemy | Deal 12 damage. Take 3 damage. Pos 1 only. |
| barbarian_blood_rage | 1 | any | none | Gain 2 Strength. Lose 4 HP. Exhaust. |
| barbarian_rampage | 1 | 1/2 | enemy | Deal 6 damage. Double if below 50% HP. |
| barbarian_bloodlust | 2 | 1 | enemy | Deal 10 damage. If kill, heal 5. Pos 1 only. |
| barbarian_whirlwind_axe | 2 | 1 | all_enemies | Deal 7 damage to ALL enemies. Pos 1 only. |
| barbarian_berserker_roar | 1 | 1/2 | none | All enemies gain 2 Vulnerable. Gain 1 Strength. |
| barbarian_pain_threshold | 1 | 1/2/3 | self | Gain Block = missing HP (max 15). |
| barbarian_undying_rage | 2 | 1/2 | none | Set HP to 1. Gain 6 Strength. Exhaust. |
| barbarian_headbutt | 1 | 1 | enemy | Deal 7 damage. 30% stun. Pos 1 only. |
| barbarian_frenzy | 1 | 1/2 | enemy | Strike 4 times for 2 damage. +1 each if below 50% HP. |

## ranger (12 cards)

| ID | Energy | Launch | Target | Current effect |
|---|---|---|---|---|
| ranger_quick_shot | 1 | any | enemy_any | Deal 6 damage. Hits any enemy. |
| ranger_dodge_roll | 1 | any | self | Gain 5 Block. |
| ranger_aimed_shot | 1 | any | enemy | Deal 9 damage. |
| ranger_snare_trap | 1 | any | enemy | Apply 2 Weak + 2 Vulnerable. |
| ranger_mark_prey | 0 | any | enemy | Mark target. Next hit deals +3 bonus damage. |
| ranger_volley | 2 | 3/4 | all_enemies | Deal 4 damage to ALL enemies. |
| ranger_poison_arrow | 1 | any | enemy_any | Deal 3 damage + 3 Poison. |
| ranger_called_shot | 2 | 2/3 | enemy | Deal 14 damage. If Marked, deal +6 and clear Mark. |
| ranger_multi_shot | 1 | 2/3/4 | enemy | Hit 3 random enemies for 3 damage each. |
| ranger_camouflage | 1 | any | self | Gain 8 Block. Draw 1 card. |
| ranger_bear_trap | 1 | any | enemy | Deal 5 damage + 3 Bleed. |
| ranger_rain_of_arrows | 3 | 3/4 | all_enemies | Deal 8 damage to ALL enemies. Exhaust. |

## necromancer (13 cards)

| ID | Energy | Launch | Target | Current effect |
|---|---|---|---|---|
| necromancer_life_drain | 1 | any | enemy | Deal 4 damage. Heal self 3. |
| necromancer_shadow_bolt | 1 | any | enemy_any | Deal 6 damage. Hits any enemy. |
| necromancer_bone_shield | 1 | any | self | Gain 5 Block. |
| necromancer_hex | 1 | any | enemy | Apply 2 Weak. |
| necromancer_plague_spread | 1 | 3/4 | enemy | If Poisoned, double it. Otherwise apply 3 Poison. |
| necromancer_soul_siphon | 2 | 3/4 | enemy | Deal 6 damage. Heal lowest-HP ally 6. |
| necromancer_corpse_explosion | 1 | 4 | all_enemies | Deal 2 x dead enemy count to all alive enemies. Pos 4 only. |
| necromancer_dark_pact | 0 | 3/4 | none | Lose 5 HP. Draw 3 cards. Exhaust. |
| necromancer_mass_curse | 2 | 4 | all_enemies | All enemies: 2 Weak + 1 Vulnerable. Pos 4 only. |
| necromancer_death_coil | 2 | 3/4 | enemy | Deal 12 damage. Heal self 4. |
| necromancer_blight | 1 | 3/4 | all_enemies | Apply 2 Poison to ALL enemies. |
| necromancer_raise_shade | 2 | 4 | enemy | Deal 10 damage + 3 Poison. Exhaust. Pos 4 only. |
| necromancer_ash_covenant | 1 | any | self | Innate. Gain 3 Block whenever any card exhausts this combat. Exhaust. |

## paladin (12 cards)

| ID | Energy | Launch | Target | Current effect |
|---|---|---|---|---|
| paladin_holy_strike | 1 | any | enemy | Deal 5 damage. Gain 3 Block. |
| paladin_shield_of_faith | 1 | any | ally | Give ally 7 Block. |
| paladin_lay_on_hands | 1 | any | ally | Heal ally 6 HP. |
| paladin_righteous_blow | 1 | any | enemy | Deal 8 damage. |
| paladin_divine_smite | 2 | 1 | enemy | Deal 12 damage. Apply 2 Vulnerable. Pos 1 only. |
| paladin_consecrate | 2 | 1/2 | all_enemies | Deal 4 to all enemies. All allies gain 3 Block. |
| paladin_guardian_stance | 2 | 1 | self | Gain 14 Block. Taunt all enemies. Pos 1 only. |
| paladin_holy_avenger | 2 | 1/2 | enemy | Deal damage equal to your Block. Exhaust. |
| paladin_aura_of_protection | 1 | 1/2 | all_allies | All allies gain 4 Block. |
| paladin_retribution | 1 | 1/2 | enemy | Deal 6 damage. Pos 1: also gain 4 Block. |
| paladin_sacred_oath | 1 | 1/2 | none | Gain 2 Strength + 5 Block. Exhaust. |
| paladin_crusader_strike | 2 | 1 | enemy | Deal 10 damage. Heal self 5. Pos 1 only. |

## Equipment

| ID | Slot | Granted action |
|---|---|---|
| gear_iron_dagger | weapon | None |
| gear_oak_buckler | armor | None |
| gear_leather_jerkin | armor | None |
| gear_quarterstaff | weapon | Staff Strike (1): Deal 6 damage. |
| gear_whetstone | trinket | None |
| gear_shadow_cloak | armor | Ambush (0): Deal 5 damage. |
| gear_vigor_ring | trinket | None |
| gear_cloak_protection | armor | None |
| gear_holy_symbol | trinket | Blessed Light (1): Heal ALL allies 4 HP. |
| gear_bag_holding | artifact | None |
| gear_dragonscale | armor | None |
| gear_ember_staff | weapon | Ember Burst (2): Deal 8 damage to ALL enemies. |
| gear_amulet_health | trinket | None |
| gear_boots_speed | trinket | None |
| gear_war_banner | artifact | None |
| gear_flame_tongue | weapon | Flame Tongue (2): Deal 16 damage. |
| gear_robe_archmagi | armor | None |