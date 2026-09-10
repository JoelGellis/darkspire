const assert = require('node:assert/strict');
const {loadGame} = require('./game-harness');

const {DS, memory} = loadGame();
DS.UI.render = () => {};
DS.PlayerIdentity.set({type:'scripted',policy:'persistence-migration',policyVersion:'1'});
DS.Meta.newGame();
DS.State.newRun();
DS.State.screen = 'map';
DS.State.save();

const saved = JSON.parse(memory.get('darkspire_save'));
saved.version = 2;
saved.run.deck.push({id:'removed-card',baseId:'removed_card',heroCls:'fighter',heroIdx:0});
memory.set('darkspire_save', JSON.stringify(saved));
assert.equal(DS.State.load(), true, 'old save with removed cards still loads');
assert.match(DS.State.migrationNotice, /retired card/);
assert.equal(DS.State.run.deck.some(c => c.baseId === 'removed_card'), false);
assert.equal(JSON.parse(memory.get('darkspire_save')).version, DS.State.SAVE_SCHEMA);
assert.ok(memory.has('darkspire_recovery_checkpoint'), 'migration keeps a pre-migration checkpoint');

const checkpoint = memory.get('darkspire_recovery_checkpoint');
memory.set('darkspire_save', '{bad json');
assert.equal(DS.State.load(), true, 'corrupt current save recovers from the last good checkpoint');
assert.equal(DS.State.recoveredFromBackup, true);
assert.match(DS.State.migrationNotice, /recovered the last good checkpoint/);
assert.equal(memory.get('darkspire_recovery_checkpoint'), checkpoint, 'corrupt save does not overwrite the good checkpoint');
console.log('persistence-migration: tolerant card filtering, schema migration, checkpoint preservation passed');
