export const ELEMENTS = ['fire', 'ice', 'lightning', 'wind', 'light', 'dark', 'physical'];

export const SKILLS = {
  agi: { name: 'Agi', type: 'spell', element: 'fire', power: 18, cost: 4 },
  bufu: { name: 'Bufu', type: 'spell', element: 'ice', power: 18, cost: 4 },
  zio: { name: 'Zio', type: 'spell', element: 'lightning', power: 18, cost: 4 },
  garu: { name: 'Garu', type: 'spell', element: 'wind', power: 18, cost: 4 },
  kouha: { name: 'Kouha', type: 'spell', element: 'light', power: 20, cost: 5 },
  eiha: { name: 'Eiha', type: 'spell', element: 'dark', power: 20, cost: 5 },
  miasma: { name: 'Miasma', type: 'spell', element: 'dark', power: 14, cost: 6, ailment: 'poison', chance: 0.55 },
  dia: { name: 'Dia', type: 'heal', power: 32, cost: 5 },
  tarukaja: { name: 'Tarukaja', type: 'buff', cost: 5 },
  rakunda: { name: 'Rakunda', type: 'debuff', cost: 5 },
  patra: { name: 'Patra', type: 'cleanse', cost: 4 }
};

export const PERSONAS = {
  ember: { name: 'Ember Crow', element: 'fire', magBonus: 2, skills: ['agi', 'dia'] },
  tide: { name: 'Pale Current', element: 'ice', magBonus: 3, skills: ['bufu', 'patra'] },
  gale: { name: 'Kite Wisp', element: 'wind', magBonus: 2, skills: ['garu', 'rakunda'] },
  volt: { name: 'Arc Lynx', element: 'lightning', magBonus: 3, skills: ['zio', 'tarukaja'] },
  dawn: { name: 'Dawn Owl', element: 'light', magBonus: 4, skills: ['kouha', 'dia', 'patra'] },
  umbra: { name: 'Veil Hound', element: 'dark', magBonus: 3, skills: ['eiha', 'miasma', 'rakunda'] }
};

const PARTY = [
  { id: 'iris', name: 'Iris', role: 'Wayfinder', maxHp: 86, hp: 86, maxMp: 40, mp: 40, atk: 12, mag: 16, def: 5, status: null, statusTurns: 0, buff: 0, guard: false, personaId: 'ember', level: 1, exp: 0, weapon: 'Wayfarer Blade' },
  { id: 'rowan', name: 'Rowan', role: 'Vanguard', maxHp: 112, hp: 112, maxMp: 28, mp: 28, atk: 18, mag: 8, def: 8, status: null, statusTurns: 0, buff: 0, guard: false, personaId: 'gale', level: 1, exp: 0, weapon: 'Wayfarer Blade' },
  { id: 'vale', name: 'Vale', role: 'Arcanist', maxHp: 92, hp: 92, maxMp: 44, mp: 44, atk: 11, mag: 14, def: 6, status: null, statusTurns: 0, buff: 0, guard: false, personaId: 'tide', level: 1, exp: 0, weapon: 'Wayfarer Blade' }
];

const FOES = [
  { kind: 'Cinder Mote', element: 'fire', weak: 'ice', resists: 'fire', spell: 'agi', hp: 34, atk: 9, mag: 9 },
  { kind: 'Frostcap', element: 'ice', weak: 'fire', resists: 'ice', spell: 'bufu', hp: 40, atk: 8, mag: 11 },
  { kind: 'Volt Jackal', element: 'lightning', weak: 'wind', resists: 'lightning', spell: 'zio', hp: 38, atk: 11, mag: 9 },
  { kind: 'Hollow Moth', element: 'wind', weak: 'lightning', resists: 'wind', spell: 'garu', hp: 32, atk: 8, mag: 10 },
  { kind: 'Grave Hound', element: 'dark', weak: 'light', resists: 'dark', spell: 'eiha', hp: 48, atk: 12, mag: 10 }
];

export function newRun() {
  return { floor: 1, party: structuredClone(PARTY), inventory: { medicine: 3, antidote: 2 }, cleared: [], caches: [], personasOwned: ['ember', 'tide', 'gale', 'volt'], weapons: [], clout: 0, experience: 0, battle: null, won: false, lost: false };
}

function shuffleChoices(run, floor, random) {
  const available = Object.keys(PERSONAS).filter((id) => !run.personasOwned.includes(id));
  const common = [
    { id: 'clout', type: 'clout', name: 'Pocket Change', detail: `+${25 + floor * 7} clout` },
    { id: 'experience', type: 'experience', name: 'Echo Memory', detail: `+${28 + floor * 5} EXP` },
    { id: 'weapon', type: 'weapon', name: 'Found Weapon', detail: 'A new blade and attack power' }
  ];
  const pick = (items, count) => {
    const list = [...items];
    for (let i = list.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [list[i], list[j]] = [list[j], list[i]]; }
    return list.slice(0, count);
  };
  const choices = available.length ? [{ id: 'persona', type: 'persona', personaId: available[Math.floor(random() * available.length)], name: 'New Persona', detail: 'Add a Persona to your collection' }, ...pick(common, 2)] : pick(common, 3);
  return pick(choices, choices.length);
}

export function equipPersona(run, memberId, personaId) {
  const member = run.party.find((p) => p.id === memberId);
  if (!member || !run.personasOwned.includes(personaId) || !PERSONAS[personaId]) return false;
  member.personaId = personaId;
  return true;
}

export function claimShuffle(run, rewardId, random = Math.random) {
  const battle = run.battle;
  const reward = battle?.shuffleChoices?.find((card) => card.id === rewardId);
  if (!battle?.won || battle.shuffleClaimed || !reward) return false;
  const floor = run.floor;
  if (reward.type === 'clout') {
    const amount = 25 + floor * 7; run.clout += amount; battle.shuffleResult = `+${amount} clout — bragging rights only.`;
  } else if (reward.type === 'experience') {
    const amount = 28 + floor * 5; run.experience += amount;
    run.party.forEach((p) => { p.exp += amount; while (p.exp >= p.level * 45) { p.exp -= p.level * 45; p.level++; p.maxHp += 4; p.hp = Math.min(p.maxHp, p.hp + 4); p.atk++; p.mag++; } });
    battle.shuffleResult = `The party gains ${amount} EXP.`;
  } else if (reward.type === 'weapon') {
    const member = run.party[Math.floor(random() * run.party.length)];
    const names = ['Glassfang', 'Bell Iron', 'Starless Edge', 'Vesper Blade'];
    const name = names[Math.floor(random() * names.length)];
    const bonus = 2 + Math.floor(floor / 10); member.atk += bonus; member.weapon = name;
    run.weapons.push({ name, bonus, memberId: member.id });
    battle.shuffleResult = `${member.name} equips ${name} (+${bonus} ATK).`;
  } else {
    if (!run.personasOwned.includes(reward.personaId) && PERSONAS[reward.personaId]) {
      run.personasOwned.push(reward.personaId); battle.shuffleResult = `${PERSONAS[reward.personaId].name} joins your Persona collection.`;
    } else { run.experience += 20; battle.shuffleResult = 'The card fades into 20 EXP.'; }
  }
  battle.shuffleClaimed = true;
  battle.log.push(`Shuffle Time: ${battle.shuffleResult}`);
  return true;
}

export function makeEnemies(floor, random = Math.random) {
  if (floor === 15) return [{ id: 'bellkeeper', name: 'The Bellkeeper', kind: 'Miniboss', hp: 250, maxHp: 250, atk: 17, mag: 15, def: 8, weak: 'lightning', resists: 'wind', spell: 'bufu', knocked: false, downTurns: 0, status: null, statusTurns: 0, defDown: 0, boss: true }];
  if (floor === 30) return [{ id: 'morrow', name: 'Morrow, the Unlit', kind: 'Final Boss', hp: 430, maxHp: 430, atk: 22, mag: 20, def: 12, weak: 'light', resists: 'dark', spell: 'eiha', secondSpell: 'agi', knocked: false, downTurns: 0, status: null, statusTurns: 0, defDown: 0, boss: true }];
  const count = floor < 4 ? 1 : (random() < 0.48 ? 2 : 1);
  return Array.from({ length: count }, (_, i) => {
    const foe = FOES[Math.floor(random() * FOES.length)];
    const scale = 1 + floor * 0.035;
    return { id: `foe-${floor}-${i}-${Math.floor(random() * 100000)}`, name: foe.kind, kind: foe.kind, hp: Math.round(foe.hp * scale), maxHp: Math.round(foe.hp * scale), atk: Math.round(foe.atk + floor * 0.28), mag: Math.round(foe.mag + floor * 0.22), def: 3 + Math.floor(floor / 9), weak: foe.weak, resists: foe.resists, spell: foe.spell, knocked: false, downTurns: 0, status: null, statusTurns: 0, defDown: 0, boss: false };
  });
}

const live = (target) => target && target.hp > 0;
const allDown = (battle) => battle.enemies.filter(live).length > 0 && battle.enemies.filter(live).every((e) => e.knocked);
const randInt = (random, low, high) => Math.floor(random() * (high - low + 1)) + low;

export function finishBattle(run) {
  if (!run.battle || run.battle.enemies.some(live)) return false;
  const floor = run.floor;
  run.battle.shuffleChoices = shuffleChoices(run, floor, Math.random);
  run.battle.shuffleClaimed = false;
  run.cleared = [...new Set([...run.cleared, floor])];
  run.party.forEach((p) => { if (p.hp > 0) { p.hp = Math.min(p.maxHp, p.hp + 8); p.mp = Math.min(p.maxMp, p.mp + 3); } });
  run.battle.log.push(floor === 30 ? 'Morrow falls. The stairwell goes quiet.' : 'The shadow dissolves. The party catches its breath.');
  run.battle.won = true;
  if (floor === 30) run.won = true;
  return true;
}

function damage(target, amount) { target.hp = Math.max(0, target.hp - Math.max(1, Math.round(amount))); }
function addLog(battle, text) { battle.log.push(text); battle.log = battle.log.slice(-10); }
function setStatus(target, status, turns) {
  if (target.status || !live(target)) return false;
  target.status = status; target.statusTurns = turns; return true;
}

function tickStatus(target, isEnemy, battle) {
  if (!target.status) return false;
  if (target.status === 'poison' || target.status === 'burn') {
    damage(target, target.status === 'poison' ? 5 : 4);
    addLog(battle, `${target.name} takes ${target.status === 'poison' ? 'poison' : 'burn'} damage.`);
  }
  const skips = target.status === 'sleep' || (target.status === 'fear' && Math.random() < 0.35);
  target.statusTurns -= 1;
  if (target.statusTurns <= 0) target.status = null;
  return skips || !live(target);
}

function enemyPhase(run, random) {
  const battle = run.battle;
  addLog(battle, 'The shadows take their turn.');
  for (const foe of battle.enemies.filter(live)) {
    if (foe.knocked) { foe.knocked = false; addLog(battle, `${foe.name} struggles back to its feet.`); continue; }
    if (foe.status && tickStatus(foe, true, battle)) continue;
    const targets = run.party.filter(live);
    if (!targets.length) break;
    const target = targets[Math.floor(random() * targets.length)];
    if (random() < 0.55) {
      const skill = SKILLS[foe.spell];
      const amount = (foe.mag + skill.power * 0.48) * (foe.defDown ? 1.1 : 1) - target.def;
      damage(target, amount);
      addLog(battle, `${foe.name} casts ${skill.name} on ${target.name} (${Math.max(1, Math.round(amount))} dmg).`);
      if (skill.element === 'fire' && random() < 0.14) setStatus(target, 'burn', 2) && addLog(battle, `${target.name} is burned!`);
      if (skill.element === 'lightning' && random() < 0.18) setStatus(target, 'shock', 1) && addLog(battle, `${target.name} is shocked!`);
      if (foe.kind === 'Hollow Moth' && random() < 0.12) setStatus(target, 'sleep', 1) && addLog(battle, `${target.name} falls asleep!`);
      if (foe.kind === 'Grave Hound' && random() < 0.18) setStatus(target, 'fear', 2) && addLog(battle, `${target.name} is afraid!`);
    } else {
      const amount = (foe.atk - target.def * 0.55) * (target.guard ? 0.35 : 1);
      damage(target, amount);
      addLog(battle, `${foe.name} strikes ${target.name} (${Math.max(1, Math.round(amount))} dmg).`);
      if (foe.kind === 'Grave Hound' && random() < 0.12) setStatus(target, 'poison', 2) && addLog(battle, `${target.name} is poisoned!`);
    }
    target.guard = false;
  }
  run.party.forEach((p) => { if (live(p) && p.buff > 0) p.buff--; });
  battle.enemies.forEach((e) => { if (live(e) && e.defDown > 0) e.defDown--; });
  if (run.party.every((p) => p.hp <= 0)) { run.lost = true; addLog(battle, 'The party is down. Restart the run to try again.'); }
  battle.extraAction = false;
  battle.extraUsed = false;
  battle.round++;
}

export function beginFloor(run, random = Math.random) {
  if (run.battle || run.won || run.lost || run.cleared.includes(run.floor)) return false;
  run.party.forEach((p) => { p.guard = false; });
  run.battle = { enemies: makeEnemies(run.floor, random), log: [`Floor ${run.floor}: a shadow blocks the way.`], round: 1, extraAction: false, extraUsed: false, won: false };
  return true;
}

export function nextFloor(run) {
  if (!run.battle?.won || !run.battle.shuffleClaimed || run.floor >= 30) return false;
  run.floor++;
  run.battle = null;
  return true;
}

export function openCache(run) {
  if (run.battle || run.caches.includes(run.floor) || ![5, 10, 20, 25].includes(run.floor)) return false;
  run.caches.push(run.floor);
  run.inventory.medicine = (run.inventory.medicine || 0) + 1;
  run.inventory.antidote = (run.inventory.antidote || 0) + 1;
  run.party.forEach((p) => { p.mp = Math.min(p.maxMp, p.mp + 5); });
  return true;
}

export function act(run, action, { actorId, targetId, skillId, itemId } = {}, random = Math.random) {
  const battle = run.battle;
  if (!battle || battle.won || run.lost || run.won) return { ok: false, message: 'No active battle.' };
  const actor = run.party.find((p) => p.id === actorId && live(p));
  if (!actor) return { ok: false, message: 'Choose a living party member.' };
  if (actor.status === 'sleep') {
    const skips = tickStatus(actor, false, battle);
    if (skips) { addLog(battle, `${actor.name} cannot act.`); enemyPhase(run, random); return { ok: false, message: 'Asleep.' }; }
  }
  if (actor.status === 'fear' && random() < 0.3) { addLog(battle, `${actor.name} hesitates in fear.`); enemyPhase(run, random); return { ok: false, message: 'Fear prevented the action.' }; }
  let knockedNow = false;
  if (action === 'attack') {
    const target = battle.enemies.find((e) => e.id === targetId && live(e));
    if (!target) return { ok: false, message: 'Choose a living enemy.' };
    const crit = random() < 0.16 || actor.status === 'shock';
    const amount = (actor.atk * (1 + (actor.buff ? 0.25 : 0)) + randInt(random, 2, 7)) * (crit ? 1.65 : 1) - Math.max(0, target.def - target.defDown * 2);
    damage(target, amount);
    addLog(battle, `${actor.name} attacks ${target.name} for ${Math.max(1, Math.round(amount))}${crit ? ' — CRITICAL!' : ''}`);
    if (crit && !target.knocked) { target.knocked = true; knockedNow = true; addLog(battle, `${target.name} is knocked down!`); }
    actor.status = actor.status === 'shock' ? null : actor.status; actor.guard = false;
  } else if (action === 'skill') {
    const skill = SKILLS[skillId];
    if (!skill || !PERSONAS[actor.personaId]?.skills.includes(skillId)) return { ok: false, message: 'That skill is not available to the equipped Persona.' };
    if (actor.mp < skill.cost) return { ok: false, message: 'Not enough MP for that skill.' };
    actor.mp -= skill.cost;
    if (skill.type === 'spell') {
      const target = battle.enemies.find((e) => e.id === targetId && live(e));
      if (!target) return { ok: false, message: 'Choose a living enemy.' };
      const multiplier = target.weak === skill.element ? 1.7 : target.resists === skill.element ? 0.5 : 1;
      const persona = PERSONAS[actor.personaId];
      const personaBoost = persona?.element === skill.element ? 1.15 : 1;
      const amount = ((actor.mag + (persona?.magBonus || 0)) * 0.55 + skill.power) * multiplier * personaBoost - Math.max(0, target.def - target.defDown * 2) * 0.35;
      damage(target, amount);
      const weakness = target.weak === skill.element;
      addLog(battle, `${actor.name} casts ${skill.name} on ${target.name}: ${Math.max(1, Math.round(amount))} dmg${weakness ? ' — WEAK!' : target.resists === skill.element ? ' — RESIST' : ''}`);
      if (weakness && !target.knocked) { target.knocked = true; knockedNow = true; addLog(battle, `${target.name} is knocked down!`); }
      if (skill.ailment && random() < skill.chance) setStatus(target, skill.ailment, 3) && addLog(battle, `${target.name} is poisoned!`);
      if (skill.element === 'fire' && random() < 0.1) setStatus(target, 'burn', 2) && addLog(battle, `${target.name} is burned!`);
      if (skill.element === 'lightning' && random() < 0.12) setStatus(target, 'shock', 1) && addLog(battle, `${target.name} is shocked!`);
    } else if (skill.type === 'heal') {
      const target = run.party.find((p) => p.id === targetId && live(p));
      if (!target) return { ok: false, message: 'Choose a living ally.' };
      const before = target.hp; target.hp = Math.min(target.maxHp, target.hp + skill.power + actor.mag);
      addLog(battle, `${actor.name} uses Dia on ${target.name} (+${target.hp - before} HP).`);
    } else if (skill.type === 'buff') {
      const target = run.party.find((p) => p.id === targetId && live(p));
      if (!target) return { ok: false, message: 'Choose a living ally.' };
      target.buff = 3; addLog(battle, `${actor.name} casts Tarukaja on ${target.name}. Attack up!`);
    } else if (skill.type === 'debuff') {
      const target = battle.enemies.find((e) => e.id === targetId && live(e));
      if (!target) return { ok: false, message: 'Choose a living enemy.' };
      target.defDown = 3; addLog(battle, `${actor.name} casts Rakunda on ${target.name}. Defense down!`);
    } else if (skill.type === 'cleanse') {
      const target = run.party.find((p) => p.id === targetId && live(p));
      if (!target) return { ok: false, message: 'Choose a living ally.' };
      target.status = null; target.statusTurns = 0; addLog(battle, `${actor.name} uses Patra on ${target.name}. Ailments cured.`);
    }
    actor.guard = false;
  } else if (action === 'guard') {
    actor.guard = true; addLog(battle, `${actor.name} guards. Incoming damage reduced.`);
  } else if (action === 'item') {
    const target = run.party.find((p) => p.id === targetId && live(p));
    if (!target) return { ok: false, message: 'Choose a living ally.' };
    if (itemId === 'medicine' && (run.inventory.medicine || 0) > 0) {
      run.inventory.medicine--; const before = target.hp; target.hp = Math.min(target.maxHp, target.hp + 42); addLog(battle, `${actor.name} uses Medicine on ${target.name} (+${target.hp - before} HP).`);
    } else if (itemId === 'antidote' && (run.inventory.antidote || 0) > 0) {
      run.inventory.antidote--; target.status = null; target.statusTurns = 0; addLog(battle, `${actor.name} gives ${target.name} an Antidote. Ailments cured.`);
    } else return { ok: false, message: 'That item is unavailable.' };
  } else return { ok: false, message: 'Unknown action.' };

  if (battle.enemies.every((e) => !live(e))) { finishBattle(run); return { ok: true, result: 'win' }; }
  if (knockedNow && !battle.extraUsed) { battle.extraAction = true; battle.extraUsed = true; addLog(battle, 'ONE MORE — act again before the shadows.'); return { ok: true, result: 'one-more' }; }
  if (allDown(battle)) { battle.extraAction = false; addLog(battle, 'All shadows are down — the All-Out Attack is ready!'); return { ok: true, result: 'all-down' }; }
  if (battle.extraAction) { battle.extraAction = false; enemyPhase(run, random); return { ok: true, result: 'enemy-turn' }; }
  enemyPhase(run, random);
  return { ok: true, result: 'enemy-turn' };
}

export function allOutAttack(run) {
  const battle = run.battle;
  if (!battle || battle.won || !allDown(battle)) return false;
  const damageTotal = run.party.reduce((sum, p) => sum + (live(p) ? p.atk + p.mag * 0.35 : 0), 0) * 2;
  battle.enemies.filter(live).forEach((foe) => damage(foe, damageTotal));
  addLog(battle, `ALL-OUT ATTACK! The party deals ${Math.round(damageTotal)} damage!`);
  finishBattle(run);
  return true;
}

export function canAllOut(battle) { return !!battle && !battle.won && allDown(battle); }
export function isValidRun(run) {
  const expected = ['iris', 'rowan', 'vale'];
  return !!run && Number.isInteger(run.floor) && run.floor >= 1 && run.floor <= 30
    && Array.isArray(run.party) && run.party.length === 3 && run.party.every((p, i) => p?.id === expected[i] && Number.isFinite(p.hp) && p.hp >= 0 && Number.isFinite(p.maxHp) && p.maxHp > 0 && Number.isFinite(p.mp) && p.mp >= 0 && Number.isFinite(p.maxMp) && p.maxMp > 0)
    && run.inventory && Number.isFinite(run.inventory.medicine) && Number.isFinite(run.inventory.antidote)
    && Array.isArray(run.cleared) && Array.isArray(run.caches)
    && (run.battle === null || (!!run.battle && Array.isArray(run.battle.enemies) && Array.isArray(run.battle.log) && run.battle.enemies.every((e) => typeof e.id === 'string' && typeof e.name === 'string' && typeof e.weak === 'string' && typeof e.resists === 'string' && Number.isFinite(e.hp) && Number.isFinite(e.maxHp) && e.maxHp > 0)));
}

export function saveRun(run, storage = globalThis.localStorage) { storage?.setItem('stairwell-run-v1', JSON.stringify(run)); }
export function loadRun(storage = globalThis.localStorage) {
  try {
    const parsed = JSON.parse(storage?.getItem('stairwell-run-v1') || 'null');
    if (isValidRun(parsed)) {
      parsed.personasOwned = Array.isArray(parsed.personasOwned) ? parsed.personasOwned.filter((id) => PERSONAS[id]) : ['ember', 'tide', 'gale', 'volt'];
      parsed.weapons = Array.isArray(parsed.weapons) ? parsed.weapons.filter((w) => w && typeof w.name === 'string' && Number.isFinite(w.bonus)) : [];
      parsed.clout = Number.isFinite(parsed.clout) ? parsed.clout : 0; parsed.experience = Number.isFinite(parsed.experience) ? parsed.experience : 0;
      parsed.party.forEach((p, i) => {
        const fallback = ['ember', 'gale', 'tide'][i];
        if (!PERSONAS[p.personaId] || !parsed.personasOwned.includes(p.personaId)) p.personaId = fallback;
        if (!parsed.personasOwned.includes(p.personaId)) parsed.personasOwned.push(p.personaId);
        p.level = Number.isInteger(p.level) && p.level > 0 ? p.level : 1; p.exp = Number.isFinite(p.exp) && p.exp >= 0 ? p.exp : 0;
        p.weapon = typeof p.weapon === 'string' ? p.weapon : 'Wayfarer Blade'; p.hp = Math.min(p.maxHp, p.hp); p.mp = Math.min(p.maxMp, p.mp);
      });
      if (parsed.battle) {
        parsed.battle.log = parsed.battle.log.filter((line) => typeof line === 'string');
        parsed.battle.round = Number.isInteger(parsed.battle.round) && parsed.battle.round > 0 ? parsed.battle.round : 1;
        if (!Array.isArray(parsed.battle.shuffleChoices)) { parsed.battle.shuffleChoices = []; parsed.battle.shuffleClaimed = !!parsed.battle.won; }
      }
      return parsed;
    }
  } catch { /* Ignore an invalid browser save and start fresh. */ }
  return null;
}
