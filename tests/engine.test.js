import test from 'node:test';
import assert from 'node:assert/strict';
import { newRun, beginFloor, act, canAllOut, allOutAttack, openCache, makeEnemies, saveRun, loadRun, equipPersona, claimShuffle, nextFloor } from '../engine.js';
import { makeMaze } from '../explorer.js';

const constant = (value) => () => value;
const prepare = (floor = 1) => { const run = newRun(); run.floor = floor; beginFloor(run, constant(0)); return run; };
const winFloor = (floor = 1) => {
  const run = prepare(floor); run.battle.enemies[0].hp = 1;
  act(run, 'attack', { actorId: 'rowan', targetId: run.battle.enemies[0].id }, constant(0.99));
  assert.equal(run.battle.won, true);
  return run;
};

test('each generated first-person floor maze is connected from its entrance', () => {
  const maze = makeMaze(12); const seen = new Set(['1,1']); const queue = [[1, 1]];
  while (queue.length) {
    const [x, y] = queue.shift();
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy, key = `${nx},${ny}`;
      if (maze[ny]?.[nx] === 0 && !seen.has(key)) { seen.add(key); queue.push([nx, ny]); }
    }
  }
  assert.ok(seen.size > 45);
});

test('elemental weakness knocks down and grants one extra action', () => {
  const run = prepare(1); const target = run.battle.enemies[0];
  equipPersona(run, 'iris', 'tide'); target.weak = 'ice'; target.resists = 'fire'; target.hp = 100;
  const result = act(run, 'skill', { actorId: 'iris', targetId: target.id, skillId: 'bufu' }, constant(0.99));
  assert.equal(result.result, 'one-more');
  assert.equal(target.knocked, true);
  assert.equal(run.battle.extraAction, true);
});

test('all enemies down enables All-Out Attack and clears the floor', () => {
  const run = prepare(1); const target = run.battle.enemies[0];
  equipPersona(run, 'iris', 'tide'); target.hp = 60; target.knocked = false; target.weak = 'ice';
  act(run, 'skill', { actorId: 'iris', targetId: target.id, skillId: 'bufu' }, constant(0.99));
  assert.equal(canAllOut(run.battle), true);
  assert.equal(allOutAttack(run), true);
  assert.equal(run.battle.won, true);
  assert.ok(run.cleared.includes(1));
});

test('floor 15 and floor 30 have their designated bosses', () => {
  assert.equal(makeEnemies(15)[0].name, 'The Bellkeeper');
  assert.equal(makeEnemies(30)[0].name, 'Morrow, the Unlit');
});

test('Patra removes a party ailment', () => {
  const run = prepare(1); run.party[0].status = 'poison'; run.party[0].statusTurns = 2;
  act(run, 'skill', { actorId: 'vale', targetId: 'iris', skillId: 'patra' }, constant(0.99));
  assert.equal(run.party[0].status, null);
});

test('Persona switching is limited to Personas already owned', () => {
  const run = newRun();
  assert.equal(equipPersona(run, 'iris', 'volt'), true);
  assert.equal(run.party[0].personaId, 'volt');
  assert.equal(equipPersona(run, 'iris', 'umbra'), false);
});

test('Shuffle Time gives clout, EXP, weapons, or new Personas and blocks descent until chosen', () => {
  const run = winFloor(1); const cards = run.battle.shuffleChoices;
  assert.equal(cards.length, 3);
  assert.equal(nextFloor(run), false);
  const persona = cards.find((card) => card.type === 'persona');
  assert.ok(persona);
  assert.equal(claimShuffle(run, persona.id), true);
  assert.ok(run.personasOwned.includes(persona.personaId));
  assert.equal(run.battle.shuffleClaimed, true);
  assert.equal(nextFloor(run), true);
  assert.equal(run.floor, 2);
});

test('clout, EXP, and weapon reward cards update the run', () => {
  const cloutRun = winFloor();
  cloutRun.battle.shuffleChoices = [{ id: 'clout', type: 'clout' }];
  claimShuffle(cloutRun, cloutRun.battle.shuffleChoices.find((c) => c.type === 'clout').id);
  assert.equal(cloutRun.clout, 32);
  const expRun = winFloor();
  expRun.battle.shuffleChoices = [{ id: 'experience', type: 'experience' }];
  claimShuffle(expRun, expRun.battle.shuffleChoices.find((c) => c.type === 'experience').id);
  assert.equal(expRun.experience, 33);
  const weaponRun = winFloor(); const before = weaponRun.party[2].atk;
  weaponRun.battle.shuffleChoices = [{ id: 'weapon', type: 'weapon' }];
  claimShuffle(weaponRun, weaponRun.battle.shuffleChoices.find((c) => c.type === 'weapon').id, constant(0.99));
  assert.equal(weaponRun.party[2].atk, before + 2);
  assert.equal(weaponRun.weapons.length, 1);
});

test('cache rewards only once and a saved run can resume', () => {
  const run = newRun(); run.floor = 5;
  assert.equal(openCache(run), true); assert.equal(run.inventory.medicine, 4);
  assert.equal(openCache(run), false);
  const memory = new Map();
  const storage = { setItem: (key, value) => memory.set(key, value), getItem: (key) => memory.get(key) };
  saveRun(run, storage);
  assert.equal(loadRun(storage).floor, 5);
  assert.equal(loadRun(storage).inventory.medicine, 4);
});
