// Explicit player attribution. Never infers identity from browser or device data.
(function () {
  var DS = window.DS;
  var current = null;
  var changing = false;
  function validate(actor) {
    if (!actor || ['human','ai','scripted'].indexOf(actor.type) < 0) throw new Error('Choose a player type.');
    var required = actor.type === 'human' ? ['name'] : actor.type === 'ai' ? ['provider','model','modelVersion','effort'] : ['policy','policyVersion'];
    required.forEach(function (key) { if (typeof actor[key] !== 'string' || !actor[key].trim()) throw new Error('Player identity requires ' + key + '. Enter unknown when unavailable.'); });
    var safe = {type: actor.type};
    required.forEach(function (key) { safe[key] = actor[key].trim().slice(0,160); });
    if (actor.type === 'scripted') safe.effort = 'not applicable';
    return safe;
  }
  DS.PlayerIdentity = {
    get current() { return current; },
    set: function (actor) {
      current = validate(actor);
      changing = false;
      try { sessionStorage.setItem('darkspire_player_identity', JSON.stringify(current)); } catch (e) { /* identity remains valid for this tab */ }
      var modal = document.getElementById('player-identity'); if (modal) modal.remove();
      var root = document.getElementById('game-root'); if (root) root.inert = false;
      if (DS.Telemetry) DS.Telemetry.record('actor.identified', {actor: current});
      return current;
    },
    demand: function () {
      if (current) return true;
      mount(); return false;
    },
    change: function () { changing = true; mount(); }
  };
  try {
    var saved = sessionStorage.getItem('darkspire_player_identity');
    if (saved) current = validate(JSON.parse(saved));
  } catch (e) { /* a new session must identify itself */ }
  function mount() {
    if ((current && !changing) || !document.body || document.getElementById('player-identity')) return;
    var game = document.getElementById('game-root'); if (game) game.inert = true;
    var shade = document.createElement('div'); shade.id = 'player-identity';
    shade.setAttribute('role','dialog'); shade.setAttribute('aria-modal','true'); shade.setAttribute('aria-label','Sign the expedition ledger');
    shade.style.cssText = 'position:fixed;inset:0;z-index:30000;display:grid;place-items:center;overflow:auto;padding:24px;background:linear-gradient(#101114aa,#101114ed),url(assets/exported/renders/campfire-environment.png) center/cover;color:#eee0c5;font-family:Georgia,serif';
    var panel = document.createElement('form'); panel.style.cssText='width:min(100%,520px);padding:32px;background:#171713ee;border:1px solid #96754a;box-shadow:0 10px 80px #000';
    var title = document.createElement('h1'); title.textContent='Sign the expedition ledger'; panel.appendChild(title);
    var intro = document.createElement('p'); intro.textContent='Every expedition keeps a local record of its player, decisions and results. Name the person or tester taking this run.'; panel.appendChild(intro);
    function field(label, tag) {
      var wrap = document.createElement('label'); wrap.textContent=label;wrap.style.cssText='display:block;margin:16px 0';
      var input=document.createElement(tag||'input'); input.style.cssText='display:block;width:100%;box-sizing:border-box;padding:10px;margin-top:6px;background:#29251f;color:#f0e3ca;border:1px solid #826b47;font:16px Georgia';
      input._identityLabel=wrap;wrap.appendChild(input);panel.appendChild(wrap);return input;
    }
    var type=field('Player','select');
    [['human','Human'],['ai','AI model'],['scripted','Scripted tester']].forEach(function (v) {var o=document.createElement('option');o.value=v[0];o.textContent=v[1];type.appendChild(o);});
    var name=field('Chosen name'); name.autocomplete='off'; name.required=true;
    var fields={provider:field('AI provider'),model:field('Exact model ID'),modelVersion:field('Model version'),effort:field('Thinking effort'),policy:field('Scripted policy name'),policyVersion:field('Policy version')};
    var note=document.createElement('p');note.textContent='AI testers: enter unknown for any unavailable detail. Scripted testers use no model and no thinking effort.';panel.appendChild(note);
    function display() {
      name._identityLabel.style.display=type.value==='human'?'block':'none';name.required=type.value==='human';
      Object.keys(fields).forEach(function(key){var shown=type.value==='ai'?['provider','model','modelVersion','effort'].indexOf(key)>=0:type.value==='scripted'&&['policy','policyVersion'].indexOf(key)>=0;fields[key]._identityLabel.style.display=shown?'block':'none';fields[key].required=shown;fields[key].placeholder='Enter explicitly; unknown if unavailable';});
    }
    type.onchange=display;display();
    var error=document.createElement('p');error.setAttribute('role','alert');panel.appendChild(error);
    var submit=document.createElement('button');submit.type='submit';submit.textContent='Enter the campfire';submit.style.cssText='padding:12px 24px;background:#6c4929;color:#fff0d5;border:1px solid #b38c53;font:18px Georgia';panel.appendChild(submit);
    panel.onsubmit=function(event){event.preventDefault();try{var actor={type:type.value,name:name.value};Object.keys(fields).forEach(function(key){actor[key]=fields[key].value;});DS.PlayerIdentity.set(actor);}catch(e){error.textContent=e.message;}};
    shade.appendChild(panel);document.body.appendChild(shade);if(name.focus)name.focus();
  }
  var newRun=DS.State.newRun,load=DS.State.load;
  DS.State.newRun=function(){if(!DS.PlayerIdentity.demand())throw new Error('Identify the player before creating an expedition.');return newRun.apply(this,arguments);};
  DS.State.load=function(){if(!DS.PlayerIdentity.demand())return false;return load.apply(this,arguments);};
  mount();
})();
