DS.Meta.newGame();
DS.Meta.heroRoster = DS.Heroes.slice(0,4).map(function(h) { return DS.Meta.rollRecruit(h.cls); });
DS.Meta.ownedGear = DS.Gear.catalog.map(function(i) { return i.id; });
DS.Meta.gold = 500;
DS.Meta._injure(0);
DS.Meta.save();
