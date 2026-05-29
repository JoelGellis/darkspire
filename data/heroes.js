window.DS = window.DS || {};

DS.Heroes = [
  {
    name: 'Fighter',
    cls: 'fighter',
    maxHp: 52,
    startPos: 1,
    colors: { primary: '#c8a035', secondary: '#6b4e1f', accent: '#e8d070' },
    sprite: {
      body: 'heavy',      // broad torso, plate armor look
      head: 'helm',        // flat-top helm
      details: ['shield-left', 'sword-right'],
      bodyColor: '#8b6914',
      armorColor: '#c8a035',
      accentColor: '#e8d070'
    }
  },
  {
    name: 'Rogue',
    cls: 'rogue',
    maxHp: 38,
    startPos: 2,
    colors: { primary: '#c43c3c', secondary: '#1a1a1a', accent: '#e06060' },
    sprite: {
      body: 'light',       // narrow, agile build
      head: 'hood',        // pointed hood
      details: ['dagger-left', 'dagger-right'],
      bodyColor: '#1a1a1a',
      armorColor: '#c43c3c',
      accentColor: '#e06060'
    }
  },
  {
    name: 'Cleric',
    cls: 'cleric',
    maxHp: 34,
    startPos: 3,
    colors: { primary: '#5588cc', secondary: '#e0e8f0', accent: '#80bbff' },
    sprite: {
      body: 'robes',       // flowing robes
      head: 'halo',        // circle halo above
      details: ['staff-right', 'holy-symbol'],
      bodyColor: '#3a5a8a',
      armorColor: '#5588cc',
      accentColor: '#80bbff'
    }
  },
  {
    name: 'Wizard',
    cls: 'wizard',
    maxHp: 26,
    startPos: 4,
    colors: { primary: '#9966cc', secondary: '#2a1a40', accent: '#c090ff' },
    sprite: {
      body: 'robes',       // flowing robes
      head: 'pointed-hat', // classic wizard hat
      details: ['staff-orb'],
      bodyColor: '#2a1a40',
      armorColor: '#9966cc',
      accentColor: '#c090ff'
    }
  }
];
