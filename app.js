import { SKILLS, PERSONAS, newRun, beginFloor, nextFloor, openCache, act, allOutAttack, canAllOut, saveRun, loadRun, isValidRun, equipPersona, claimShuffle } from './engine.js';
import { attachExplorer } from './explorer.js';

const $ = (selector) => document.querySelector(selector);
const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
let run = loadRun() || newRun();
let selectedAction = 'attack';
let menuOpen = false;
let explorer;
const labels = { 15: 'MINIBOSS LANDING', 30: 'FINAL BOSS LANDING' };

function persist() {
  saveRun(run);
  $('#save-state').textContent = 'SAVED IN THIS BROWSER';
  window.setTimeout(() => { if ($('#save-state')) $('#save-state').textContent = 'LOCAL SAVE READY'; }, 1200);
}
function syncView() {
  const locked = explorer?.isLocked() || false;
  const overlay = $('#view-overlay');
  overlay.classList.toggle('hidden', locked || !!run.battle || menuOpen);
  $('#explorer').classList.toggle('view-disabled', !!run.battle || menuOpen);
  if (!locked && !run.battle && !menuOpen) overlay.innerHTML = '<strong>CLICK TO ENTER</strong><span>WASD MOVE · MOUSE LOOK · E SWING</span>';
  $('#view-floor').textContent = `FLOOR ${String(run.floor).padStart(2, '0')}`;
}
function statusText(member) { return member.status ? `${member.status.toUpperCase()} · ${member.statusTurns} turn${member.statusTurns === 1 ? '' : 's'}` : (member.buff ? 'ATTACK UP' : 'READY'); }
function renderParty() {
  $('#party-list').innerHTML = run.party.map((p) => {
    const persona = PERSONAS[p.personaId];
    return `<article class="member"><div class="member-head"><span class="member-name">${escapeHtml(p.name)}</span><span class="member-role">${escapeHtml(p.role)} · LV ${p.level || 1}</span></div><div class="member-persona">${escapeHtml(persona?.name || 'Unknown Persona')} · ${escapeHtml(persona?.element || '—')}</div><div class="member-bars"><span>HP</span><div class="mini-bar"><span style="width:${Math.max(0, p.hp / p.maxHp * 100)}%"></span></div><span>${p.hp}/${p.maxHp}</span></div><div class="member-bars"><span>MP</span><div class="mini-bar mp"><span style="width:${Math.max(0, p.mp / p.maxMp * 100)}%"></span></div><span>${p.mp}/${p.maxMp}</span></div><div class="member-status">${escapeHtml(statusText(p))}</div></article>`;
  }).join('');
  $('#inventory-list').innerHTML = `<div class="inventory-item"><span>Medicine · restores 42 HP</span><span>× ${run.inventory.medicine || 0}</span></div><div class="inventory-item"><span>Antidote · clears ailments</span><span>× ${run.inventory.antidote || 0}</span></div>`;
}
function renderEnemies() {
  const battle = run.battle;
  const oldActor = $('#actor-select').value;
  const oldTarget = $('#target-select').value;
  const oldSkill = $('#skill-select').value;
  const oldItem = $('#item-select').value;
  const aliveEnemies = battle.enemies.filter((e) => e.hp > 0);
  $('#enemy-list').innerHTML = battle.enemies.map((e) => `<article class="enemy-card ${e.knocked ? 'down' : ''}"><div class="enemy-top"><span class="enemy-name">${escapeHtml(e.name)}</span><span class="enemy-kind">${e.boss ? (run.floor === 15 ? 'MINIBOSS' : 'FINAL BOSS') : escapeHtml(String(e.kind).toUpperCase())}</span></div>${e.status ? `<div class="enemy-status">${escapeHtml(e.status.toUpperCase())} · ${e.statusTurns} turns</div>` : ''}${e.knocked ? '<div class="enemy-status">KNOCKED DOWN</div>' : ''}<div class="bar"><span style="width:${Math.max(0, e.hp / e.maxHp * 100)}%"></span></div><div class="enemy-meta"><span>${Math.max(0, e.hp)} / ${e.maxHp} HP</span><span>WEAK TO ${escapeHtml(e.weak.toUpperCase())} · RESISTS ${escapeHtml(e.resists.toUpperCase())}</span></div></article>`).join('');
  $('#battle-log').innerHTML = battle.log.map((line) => `<div>${escapeHtml(line)}</div>`).join('');
  $('#battle-log').scrollTop = $('#battle-log').scrollHeight;
  $('#round-tag').textContent = `ROUND ${String(battle.round).padStart(2, '0')}`;
  $('#all-out').classList.toggle('hidden', !canAllOut(battle));
  $('#combat-controls').classList.toggle('hidden', battle.won || run.lost);
  $('#victory').classList.toggle('hidden', !battle.won);
  $('#perform-action').classList.toggle('hidden', battle.won || run.lost);
  $('#perform-action').textContent = `Confirm ${selectedAction === 'skill' ? 'skill' : selectedAction === 'item' ? 'item' : selectedAction} →`;
  $('#victory-title').textContent = run.floor === 30 ? 'The stairwell is silent.' : run.floor === 15 ? 'The Bellkeeper is quiet.' : 'The way is open.';
  $('#victory-copy').textContent = run.floor === 30 ? 'You cleared all 30 floors and defeated Morrow, the Unlit.' : 'The party recovers a little strength. Choose a Shuffle Time reward.';

  $('#actor-select').innerHTML = run.party.filter((p) => p.hp > 0).map((p) => `<option value="${escapeHtml(p.id)}">${escapeHtml(p.name)} · ${p.mp} MP</option>`).join('');
  if ([...$('#actor-select').options].some((o) => o.value === oldActor)) $('#actor-select').value = oldActor;
  const actor = run.party.find((p) => p.id === $('#actor-select').value);
  const skillIds = PERSONAS[actor?.personaId]?.skills || [];
  $('#skill-select').innerHTML = skillIds.filter((id) => SKILLS[id].cost <= (actor?.mp || 0)).map((id) => { const s = SKILLS[id]; return `<option value="${id}">${s.name} · ${s.cost} MP${s.element ? ` · ${s.element}` : ''}</option>`; }).join('');
  if ([...$('#skill-select').options].some((o) => o.value === oldSkill)) $('#skill-select').value = oldSkill;
  $('#item-select').innerHTML = `<option value="medicine">Medicine ×${run.inventory.medicine || 0}</option><option value="antidote">Antidote ×${run.inventory.antidote || 0}</option>`;
  if ([...$('#item-select').options].some((o) => o.value === oldItem)) $('#item-select').value = oldItem;
  const skill = SKILLS[$('#skill-select').value];
  const targetsParty = (selectedAction === 'skill' && ['heal', 'buff', 'cleanse'].includes(skill?.type)) || selectedAction === 'item';
  const targetOptions = targetsParty ? run.party.filter((p) => p.hp > 0).map((p) => `<option value="${escapeHtml(p.id)}">${escapeHtml(p.name)} · ${p.hp}/${p.maxHp} HP</option>`).join('') : aliveEnemies.map((e) => `<option value="${escapeHtml(e.id)}">${escapeHtml(e.name)} · ${e.hp}/${e.maxHp} HP</option>`).join('');
  $('#target-select').innerHTML = targetOptions;
  if ([...$('#target-select').options].some((o) => o.value === oldTarget)) $('#target-select').value = oldTarget;
  $('#skill-row').classList.toggle('hidden', selectedAction !== 'skill');
  $('#item-row').classList.toggle('hidden', selectedAction !== 'item');
  document.querySelectorAll('[data-action]').forEach((button) => button.classList.toggle('selected', button.dataset.action === selectedAction));

  const shuffle = $('#shuffle-panel');
  shuffle.classList.toggle('hidden', !battle.won);
  if (battle.won && !battle.shuffleClaimed) {
    $('#shuffle-cards').innerHTML = (battle.shuffleChoices || []).map((card) => `<button class="shuffle-card" data-reward="${escapeHtml(card.id)}"><span class="eyebrow">${escapeHtml(card.type.toUpperCase())}</span><strong>${escapeHtml(card.name)}</strong><small>${escapeHtml(card.detail)}</small></button>`).join('');
    $('#shuffle-result').textContent = 'One card only. Your choice is saved with the run.';
  } else {
    $('#shuffle-cards').innerHTML = '';
    $('#shuffle-result').textContent = battle.shuffleResult || 'Reward claimed.';
  }
}
function renderMenu() {
  const floorCleared = run.cleared.length;
  $('#data-summary').innerHTML = `<div class="data-chip"><span>FLOOR</span><strong>${run.floor} / 30</strong></div><div class="data-chip"><span>CLEARED</span><strong>${floorCleared}</strong></div><div class="data-chip"><span>EXP</span><strong>${run.experience || 0}</strong></div><div class="data-chip"><span>CLOUT</span><strong>${run.clout || 0}</strong></div>`;
  $('#persona-switches').innerHTML = run.party.map((p) => `<label class="persona-choice"><span>${escapeHtml(p.name)}</span><select data-persona-member="${escapeHtml(p.id)}">${(run.personasOwned || []).filter((id) => PERSONAS[id]).map((id) => `<option value="${id}" ${p.personaId === id ? 'selected' : ''}>${escapeHtml(PERSONAS[id].name)} · ${escapeHtml(PERSONAS[id].element)}</option>`).join('')}</select></label>`).join('');
  $('#weapon-list').innerHTML = `<p class="small-note"><strong>Acquired weapons</strong>: ${(run.weapons || []).length ? run.weapons.map((w) => `${escapeHtml(w.name)} (+${w.bonus} ATK)`).join(' · ') : 'None yet'}<br>Each found weapon is automatically equipped by its recipient.</p>`;
}
function render() {
  const floor = run.floor;
  $('#floor-label').textContent = `FLOOR ${String(floor).padStart(2, '0')} / 30`;
  $('#floor-number').textContent = String(floor).padStart(2, '0');
  $('#progress-fill').style.width = `${floor / 30 * 100}%`;
  $('#milestone-label').textContent = labels[floor] || (floor < 15 ? 'THE UPPER LANDING' : floor < 30 ? 'THE LOWER LANDING' : 'THE LAST LANDING');
  $('#floor-type').textContent = labels[floor] || (run.cleared.includes(floor) ? 'CLEARED' : 'UNCHARTED');
  $('#floor-copy').textContent = floor === 15 ? 'A bell rings once in the dark. Find it and press E to engage the Bellkeeper.' : floor === 30 ? 'At the foot of the stairwell, Morrow opens its eyes. Press E to begin.' : run.cleared.includes(floor) ? 'This landing is quiet. Choose Continue downward when ready.' : 'Use W A S D to explore; press E to swing and begin the shadow encounter.';
  $('#explore').classList.toggle('hidden', !!run.battle || run.cleared.includes(floor) || run.won || run.lost);
  $('#cache').classList.toggle('hidden', !!run.battle || ![5, 10, 20, 25].includes(floor) || run.caches.includes(floor) || run.won || run.lost);
  const mayDescend = (run.battle?.won && run.battle.shuffleClaimed) || (!run.battle && run.cleared.includes(floor));
  $('#next-floor').classList.toggle('hidden', !mayDescend || floor >= 30 || run.won || run.lost);
  $('#battle-panel').classList.toggle('hidden', !run.battle);
  $('#reset-run').textContent = run.lost ? 'Restart run' : 'Start a new run';
  renderParty();
  if (run.battle) renderEnemies();
  syncView();
  persist();
}
function handleAction(action) {
  if (!run.battle || run.battle.won || run.lost) return;
  selectedAction = action;
  renderEnemies();
  $('#combat-hint').textContent = 'Choose the member, skill, and target, then confirm.';
}
function performAction() {
  if (!run.battle || run.battle.won || run.lost) return;
  const result = act(run, selectedAction, { actorId: $('#actor-select').value, targetId: $('#target-select').value, skillId: $('#skill-select').value, itemId: $('#item-select').value });
  $('#combat-hint').textContent = result.ok ? (run.battle.extraAction ? 'One More: choose your next move.' : canAllOut(run.battle) ? 'Every shadow is down. Finish with an All-Out Attack.' : 'Choose an action, then select a target.') : result.message;
  render();
}
function setMenu(open) {
  menuOpen = open;
  if (open) explorer?.unlock();
  $('#menu-layer').classList.toggle('hidden', !open);
  if (open) { renderMenu(); $('#menu-close').focus(); }
  else $('#menu-button').focus();
  syncView();
}

explorer = attachExplorer($('#explorer'), {
  onAttack: () => {
    if (menuOpen || run.battle || run.won || run.lost) return;
    if (run.cleared.includes(run.floor)) { $('#floor-copy').textContent = 'This floor is cleared. Continue downward from the stairwell controls.'; return; }
    explorer.unlock();
    beginFloor(run);
    render();
  },
  onLockChange: () => syncView()
});
explorer.setFloor(run.floor);
$('#explore').addEventListener('click', () => { if (!run.battle && !run.won) explorer.requestLock(); });
$('#cache').addEventListener('click', () => { if (openCache(run)) { $('#floor-copy').textContent = 'The cache held Medicine, an Antidote, and a little restorative energy.'; render(); } });
$('#next-floor').addEventListener('click', () => { if (nextFloor(run)) { explorer.setFloor(run.floor); selectedAction = 'attack'; render(); } });
document.querySelectorAll('[data-action]').forEach((button) => button.addEventListener('click', () => handleAction(button.dataset.action)));
$('#actor-select').addEventListener('change', () => { if (run.battle) renderEnemies(); });
$('#skill-select').addEventListener('change', () => { if (run.battle) renderEnemies(); });
$('#perform-action').addEventListener('click', performAction);
$('#all-out').addEventListener('click', () => { if (allOutAttack(run)) render(); });
$('#reset-run').addEventListener('click', () => { if (window.confirm('Start over? This replaces your saved run in this browser.')) { run = newRun(); selectedAction = 'attack'; explorer.setFloor(1); render(); } });
$('#menu-button').addEventListener('click', () => setMenu(true));
$('#menu-close').addEventListener('click', () => setMenu(false));
$('#menu-resume').addEventListener('click', () => setMenu(false));
document.addEventListener('keydown', (event) => {
  if (event.key === 'Backspace' && !event.target.closest('input, textarea, select')) { event.preventDefault(); setMenu(!menuOpen); }
  if (event.key === 'Escape' && menuOpen) setMenu(false);
});
$('#google-login').addEventListener('click', () => { $('#menu-message').textContent = 'Google sign-in and cloud sync are placeholders in this local-first version.'; });
$('#export-save').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(run, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob); const link = document.createElement('a');
  link.href = url; link.download = `hollow-stair-floor-${run.floor}-save.json`; link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  $('#menu-message').textContent = 'Save exported as a JSON file.';
});
$('#import-save-button').addEventListener('click', () => $('#import-save-file').click());
$('#import-save-file').addEventListener('change', async (event) => {
  const file = event.target.files?.[0]; if (!file) return;
  try {
    const imported = JSON.parse(await file.text());
    if (!isValidRun(imported)) throw new Error('The file is not a valid Hollow Stair save.');
    if (!window.confirm('Replace the current browser save with this imported save? Export the current save first if you want a backup.')) return;
    imported.personasOwned = (Array.isArray(imported.personasOwned) ? imported.personasOwned : ['ember', 'tide', 'gale', 'volt']).filter((id) => PERSONAS[id]);
    imported.weapons ||= []; imported.clout ||= 0; imported.experience ||= 0;
    imported.party.forEach((p, i) => { if (!PERSONAS[p.personaId] || !imported.personasOwned.includes(p.personaId)) p.personaId = ['ember', 'gale', 'tide'][i]; p.level ||= 1; p.exp ||= 0; p.weapon ||= 'Wayfarer Blade'; });
    run = imported; explorer.setFloor(run.floor); render(); renderMenu();
    $('#menu-message').textContent = 'Save imported and stored in this browser.';
  } catch (error) { $('#menu-message').textContent = error.message || 'Could not read that save file.'; }
  finally { event.target.value = ''; }
});
$('#persona-switches').addEventListener('change', (event) => {
  const select = event.target.closest('[data-persona-member]');
  if (select && equipPersona(run, select.dataset.personaMember, select.value)) { render(); renderMenu(); $('#menu-message').textContent = 'Persona switched.'; }
});
$('#shuffle-cards').addEventListener('click', (event) => {
  const card = event.target.closest('[data-reward]');
  if (card && claimShuffle(run, card.dataset.reward)) render();
});

render();
