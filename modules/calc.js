var critCC = 1;
var critDD = 1;
var trimpAA = 1;

//Helium

function getTrimpAttack() {
    var dmg = 6;
    var equipmentList = ["Dagger", "Mace", "Polearm", "Battleaxe", "Greatsword", "Arbalest"];
	
    //For each weapon...
    for(var i = 0; i < equipmentList.length; i++) {
	//If unlocked, adds up it's damage
        if(game.equipment[equipmentList[i]].locked !== 0) continue;
        var attackBonus = game.equipment[equipmentList[i]].attackCalculated;
        var level       = game.equipment[equipmentList[i]].level;
        dmg += attackBonus * level;
    }
    
    //Magma
    if (mutations.Magma.active()){
        dmg *= mutations.Magma.getTrimpDecay();
    }
    
    //Power I
    if (game.portal.Power.level > 0) {
            dmg += (dmg * game.portal.Power.level * game.portal.Power.modifier);
    }
    
    //Power II
    if (game.portal.Power_II.level > 0) {
        dmg *= (1 + (game.portal.Power_II.modifier * game.portal.Power_II.level));
    }
    
    //Formation
    if (game.global.formation !== 0){
        dmg *= (game.global.formation == 2) ? 4 : 0.5;
    }
    
    return dmg * game.resources.trimps.maxSoldiers;
}

function calcOurHealth(stance, fullGeneticist) {
    var health = 50;

    if (game.resources.trimps.maxSoldiers > 0) {
        var equipmentList = ["Shield", "Boots", "Helmet", "Pants", "Shoulderguards", "Breastplate", "Gambeson"];
        for(var i = 0; i < equipmentList.length; i++){
            if(game.equipment[equipmentList[i]].locked !== 0) continue;
            var healthBonus = game.equipment[equipmentList[i]].healthCalculated;
            var level       = game.equipment[equipmentList[i]].level;
            health += healthBonus*level;
        }
    }
    health *= game.resources.trimps.maxSoldiers;
    if (game.goldenUpgrades.Battle.currentBonus > 0) {
        health *= game.goldenUpgrades.Battle.currentBonus + 1;
    }
    if (game.portal.Toughness.level > 0) {
        health *= ((game.portal.Toughness.level * game.portal.Toughness.modifier) + 1);
    }
    if (game.portal.Toughness_II.level > 0) {
        health *= ((game.portal.Toughness_II.level * game.portal.Toughness_II.modifier) + 1);
    }
    if (game.portal.Resilience.level > 0) {
        health *= (Math.pow(game.portal.Resilience.modifier + 1, game.portal.Resilience.level));
    }
    var geneticist = game.jobs.Geneticist;
    if (geneticist.owned > 0) {
        health *= (Math.pow(1.01, fullGeneticist ? geneticist.owned : game.global.lastLowGen));
    }
    if (stance && game.global.formation > 0) {
        var formStrength = 0.5;
        if (game.global.formation == 1) formStrength = 4;
        health *= formStrength;
    }
    if (game.global.challengeActive == "Life") {
        health *= game.challenges.Life.getHealthMult();
    } else if (game.global.challengeActive == "Balance") {
        health *= game.challenges.Balance.getHealthMult();
    } else if (typeof game.global.dailyChallenge.pressure !== 'undefined') {
        health *= (dailyModifiers.pressure.getMult(game.global.dailyChallenge.pressure.strength, game.global.dailyChallenge.pressure.stacks));
    }
    if (mutations.Magma.active()) {
        var mult = mutations.Magma.getTrimpDecay();
        var lvls = game.global.world - mutations.Magma.start() + 1;
        health *= mult;
    }
    var heirloomBonus = calcHeirloomBonus("Shield", "trimpHealth", 0, true);
    if (heirloomBonus > 0) {
        health *= ((heirloomBonus / 100) + 1);
    }
    if (game.global.radioStacks > 0) {
        health *= (1 - (game.global.radioStacks * 0.1));
    }
    if (game.global.totalSquaredReward > 0) {
        health *= (1 + (game.global.totalSquaredReward / 100));
    }
    if (game.jobs.Amalgamator.owned > 0) {
        health *= game.jobs.Amalgamator.getHealthMult();
    }
    if (game.talents.voidPower.purchased && game.global.voidBuff) {
        var amt = (game.talents.voidPower2.purchased) ? ((game.talents.voidPower3.purchased) ? 65 : 35) : 15;
        health *= (1 + (amt / 100));
    }
    return health;
}

function calcHealthRatio(stance, considerVoid, fullGeneticist) {
    //Init
    var enemyDamage;
    var targetZone = game.global.world;
    const formationMod = game.upgrades.Dominance.done ? 2 : 1;

    //Our Health and Block
    var health = calcOurHealth(stance, fullGeneticist) / formationMod;
    var block = calcOurBlock(stance) / formationMod;

    //Lead farms one zone ahead
    if (game.global.challengeActive == "Lead" && game.global.world%2 == 1) targetZone++;

    //Enemy Damage
    enemyDamage = calcBadGuyDmg(null, getEnemyMaxAttack(targetZone+1, 50, 'Snimp', 1.0), true, true);
    
    //Pierce & Voids
    var pierceDmg = enemyDamage * ((game.global.brokenPlanet) ? getPierceAmt() : 0);
    if (considerVoid && !game.global.spireActive) enemyDamage *= 4.5;

    //The Resulting Ratio
    var finalDmg = Math.max(enemyDamage - block, pierceDmg);
    return health / finalDmg;
}

function highDamageShield() {
	if (game.global.challengeActive != "Daily" && game.global.ShieldEquipped.name == getPageSetting('highdmg')) {
		critCC = getPlayerCritChance();
		critDD = getPlayerCritDamageMult();
		trimpAA = (calcHeirloomBonus("Shield", "trimpAttack", 1, true)/100);
	}
	if (game.global.challengeActive == "Daily" && game.global.ShieldEquipped.name == getPageSetting('dhighdmg')) {
		critCC = getPlayerCritChance();
		critDD = getPlayerCritDamageMult();
		trimpAA = (calcHeirloomBonus("Shield", "trimpAttack", 1, true)/100);
	}
}

function getCritMulti(high, crit) {
	var critChance = getPlayerCritChance();
	var CritD = getPlayerCritDamageMult();
	
	if (crit == "never") critChance = Math.floor(critChance);
        else if (crit == "force") critChance = Math.ceil(critChance);

	if (high && (getPageSetting('AutoStance') == 3 && getPageSetting('highdmg') != undefined && game.global.challengeActive != "Daily") || 
	      (getPageSetting('use3daily') == true && getPageSetting('dhighdmg') != undefined && game.global.challengeActive == "Daily")) {
	          highDamageShield();
	          critChance = critCC;
	          CritD = critDD;
	}

	if      (critChance < 0) CritDHModifier = (1+critChance - critChance/5);
	else if (critChance < 1) CritDHModifier = (1-critChance + critChance * CritD);
	else if (critChance < 2) CritDHModifier = ((critChance-1) * getMegaCritDamageMult(2) * CritD + (2-critChance) * CritD);
	else                     CritDHModifier = ((critChance-2) * Math.pow(getMegaCritDamageMult(2),2) * CritD + (3-critChance) * getMegaCritDamageMult(2) * CritD);

  return CritDHModifier;
}

function calcOurBlock(stance) {
    var block = 0;
    
    //Gyms
    var gym = game.buildings.Gym;
    if (gym.owned > 0) block += gym.owned * gym.increase.by;
    
    //Shield Block
    var shield = game.equipment.Shield;
    if (shield.blockNow && shield.level > 0) block += shield.level * shield.blockCalculated;
    
    //Trainers
    var trainer = game.jobs.Trainer;
    if (trainer.owned > 0) {
        var trainerStrength = trainer.owned * (trainer.modifier / 100);
        block *= 1 + calcHeirloomBonus("Shield", "trainerEfficiency", trainerStrength);
    }
    
    //Coordination
    block *= game.resources.trimps.maxSoldiers;

    //Stances
    if (stance && game.global.formation != 0) block *= game.global.formation == 3 ? 4 : 0.5;
    
    //Heirloom
    var heirloomBonus = calcHeirloomBonus("Shield", "trimpBlock", 0, true);
    if (heirloomBonus > 0) block *= ((heirloomBonus / 100) + 1);
    
    //Radio Stacks
    if (game.global.radioStacks > 0) block *= (1 - (game.global.radioStacks * 0.1));
    
    return block;
}

function calcOurDmg(minMaxAvg, incStance, incFlucts, crit) {
	var number = getTrimpAttack();
	var fluctuation = .2;
	var maxFluct = -1;
	var minFluct = -1;
	
	//Amalgamator
	if (game.jobs.Amalgamator.owned > 0) {
            number *= game.jobs.Amalgamator.getDamageMult();
	}
	
	//Map Bonus
	if (game.global.mapBonus > 0) {
	    var mapBonus = game.global.mapBonus;
            if (game.talents.mapBattery.purchased && mapBonus == 10) mapBonus *= 2;
		number *= ((mapBonus * .2) + 1);
	}
	
	//Range
	if (game.portal.Range.level > 0) minFluct = fluctuation - (.02 * game.portal.Range.level);

	//Achievements
	if (game.global.achievementBonus > 0) number *= (1 + (game.global.achievementBonus / 100));

	//Anticipation
	if ((getPageSetting('45stacks') == false || getPageSetting('45stacks') == "false")  && game.global.antiStacks > 0) {
            number *= ((game.global.antiStacks * game.portal.Anticipation.level * game.portal.Anticipation.modifier) + 1);
	}
	else if (game.global.antiStacks > 0) {
            number *= ((45 * game.portal.Anticipation.level * game.portal.Anticipation.modifier) + 1);
	}

	//Formation
	if (!incStance && game.global.formation != 0) number /= (game.global.formation == 2) ? 4 : 0.5;

	//Robo Trimp
	if (game.global.roboTrimpLevel > 0) number *= ((0.2 * game.global.roboTrimpLevel) + 1);

	//Heirlooms
	number = calcHeirloomBonus("Shield", "trimpAttack", number);

	//Fluffy
	if (Fluffy.isActive()) number *= Fluffy.getDamageModifier();

	//Gamma Burst
	if (getHeirloomBonus("Shield", "gammaBurst") > 0 && (calcOurHealth() / (calcBadGuyDmg(null, getEnemyMaxAttack(game.global.world, 50, 'Snimp', 1.0))) >= 5))
	    	number *= ((getHeirloomBonus("Shield", "gammaBurst") / 100) + 1) / 5;
	
	//Discipline
	if (game.global.challengeActive == "Discipline") fluctuation = .995;
	if (game.global.challengeActive == "Life") number *= game.challenges.Life.getHealthMult();
	if (game.global.challengeActive == "Lead" && (game.global.world % 2) == 1) number *= 1.5;
	if (game.challenges.Electricity.stacks > 0) number *= 1 - (game.challenges.Electricity.stacks * 0.1);
	
	//Decay
	if (game.global.challengeActive == "Decay") {
		number *= 5;
		number *= Math.pow(0.995, game.challenges.Decay.stacks);
	}
	
	//Daily
	if (game.global.challengeActive == "Daily"){
		if (typeof game.global.dailyChallenge.minDamage !== 'undefined'){
			if (minFluct == -1) minFluct = fluctuation;
			minFluct += dailyModifiers.minDamage.getMult(game.global.dailyChallenge.minDamage.strength);
		}
		if (typeof game.global.dailyChallenge.maxDamage !== 'undefined'){
			if (maxFluct == -1) maxFluct = fluctuation;
			maxFluct += dailyModifiers.maxDamage.getMult(game.global.dailyChallenge.maxDamage.strength);
		}
		if (typeof game.global.dailyChallenge.oddTrimpNerf !== 'undefined' && ((game.global.world % 2) == 1)){
			number *= dailyModifiers.oddTrimpNerf.getMult(game.global.dailyChallenge.oddTrimpNerf.strength);
		}
		if (typeof game.global.dailyChallenge.evenTrimpBuff !== 'undefined' && ((game.global.world % 2) == 0)){
			number *= dailyModifiers.evenTrimpBuff.getMult(game.global.dailyChallenge.evenTrimpBuff.strength);
		}
		if (typeof game.global.dailyChallenge.rampage !== 'undefined'){
			number *= dailyModifiers.rampage.getMult(game.global.dailyChallenge.rampage.strength, game.global.dailyChallenge.rampage.stacks);
		}
	}
	
	//Battle Goldens
	if (game.goldenUpgrades.Battle.currentBonus > 0) number *= game.goldenUpgrades.Battle.currentBonus + 1;

	//Empowerments
	if (getPageSetting('fullice') == true && getEmpowerment() == "Ice") number *= (Fluffy.isRewardActive('naturesWrath') ? 3 : 2);
	if (getPageSetting('fullice') == false && getEmpowerment() == "Ice") number *= (game.empowerments.Ice.getDamageModifier()+1);
	if (getEmpowerment() == "Poison" && getPageSetting('addpoison') == true) {
		number *= (1 + game.empowerments.Poison.getModifier());
		number *= 4;
	}

	//Masteries - Herbalist, Legs for Days, Magmamancer, Still Rowing II, Void Mastery, Health Strength, Sugar Rush
	if (game.talents.herbalist.purchased) number *= game.talents.herbalist.getBonus();
	if (game.global.challengeActive == "Daily" && game.talents.daily.purchased) number *= 1.5;
	if (game.talents.magmamancer.purchased) number *= game.jobs.Magmamancer.getBonusPercent();
	if (game.talents.stillRowing2.purchased) number *= ((game.global.spireRows * 0.06) + 1);
	if (game.global.voidBuff && game.talents.voidMastery.purchased) number *= 5;
	if (game.talents.healthStrength.purchased && mutations.Healthy.active()) number *= ((0.15 * mutations.Healthy.cellCount()) + 1);
	if (game.global.sugarRush > 0) number *= sugarRush.getAttackStrength();

	//Void Power
	if (game.talents.voidPower.purchased && game.global.voidBuff) {
		var vpAmt = (game.talents.voidPower2.purchased) ? ((game.talents.voidPower3.purchased) ? 65 : 35) : 15;
		number *= ((vpAmt / 100) + 1);
	}

	//Scryhard
	if (incStance && game.talents.scry.purchased && game.global.formation == 4 && (mutations.Healthy.active() || mutations.Corruption.active()))
		number *= 2;

	//Spire Strengh Trap
	if (playerSpireTraps.Strength.owned) {
			var strBonus = playerSpireTraps.Strength.getWorldBonus();
			number *= (1 + (strBonus / 100));
	}

	//Fluffy + Sharp Trimps + Uber Poison + Challenge²
	if (Fluffy.isRewardActive('voidSiphon') && game.stats.totalVoidMaps.value) number *= (1 + (game.stats.totalVoidMaps.value * 0.05));
	if (game.singleRunBonuses.sharpTrimps.owned) number *= 1.5;
	if (game.global.uberNature == "Poison") number *= 3;
        if (game.global.totalSquaredReward > 0) number *= ((game.global.totalSquaredReward / 100) + 1);

	//Init Damage Variation
	var min = number;
	var max = number;
	var avg = number;

	//Crit
	min *= getCritMulti(false, (crit) ? crit : "ignore");
	avg *= getCritMulti(false, (crit) ? crit : "maybe");
	max *= getCritMulti(false, (crit) ? crit : "force");

	//Damage Range
	if (incFlucts) {
		//Defaults
		if (minFluct > 1) minFluct = 1;
		if (maxFluct == -1) maxFluct = fluctuation;
  		if (minFluct == -1) minFluct = fluctuation;

		//Apply fluctuation
		min *= (1 - minFluct);
		max *= (1 + maxFluct);
		avg *= 1 + (maxFluct - minFluct)/2;
	}

	//Well, finally, huh?
	if (minMaxAvg == "min") return min;
	if (minMaxAvg == "max") return max;
	if (minMaxAvg == "avg") return avg;
}

function calcDailyAttackMod(number) {
    if (game.global.challengeActive == "Daily"){
        if (typeof game.global.dailyChallenge.badStrength !== 'undefined'){
            number *= dailyModifiers.badStrength.getMult(game.global.dailyChallenge.badStrength.strength);
        }
        if (typeof game.global.dailyChallenge.badMapStrength !== 'undefined' && game.global.mapsActive){
            number *= dailyModifiers.badMapStrength.getMult(game.global.dailyChallenge.badMapStrength.strength);
        }
        if (typeof game.global.dailyChallenge.bloodthirst !== 'undefined'){
            number *= dailyModifiers.bloodthirst.getMult(game.global.dailyChallenge.bloodthirst.strength, game.global.dailyChallenge.bloodthirst.stacks);
        }
    }
    return number;
}

function calcSpire(what, cell, name) {
    //Target Cell
    var exitCell = (cell) ? cell : 100;
    if (game.global.challengeActive != "Daily" && isActiveSpireAT() && getPageSetting('ExitSpireCell') > 0 && getPageSetting('ExitSpireCell') <= 100)
        exitCell = getPageSetting('ExitSpireCell');
    if (game.global.challengeActive == "Daily" && disActiveSpireAT() && getPageSetting('dExitSpireCell') > 0 && getPageSetting('dExitSpireCell') <= 100)
        exitCell = getPageSetting('dExitSpireCell');

    //Enemy on the Target Cell
    var enemy = (name) ? name : game.global.gridArray[exitCell-1].name;
    var base = (what == "attack") ? getEnemyMaxAttack(game.global.world, exitCell, 'Chimp') : calcEnemyBaseHealth(game.global.world, exitCell) * 2;
    var mod = (what == "attack") ? 1.17 : 1.14;

    //Spire Num
    var spireNum = Math.floor((game.global.world-100)/100);
    if (spireNum > 1) {
        var modRaiser = 0;
        modRaiser += ((spireNum - 1) / 100);
        if (what == "attack") modRaiser *= 8;
        if (what == "health") modRaiser *= 2;
        mod += modRaiser;
    }

    //Math
    base *= Math.pow(mod, exitCell);
    base *= game.badGuys[enemy][what];

    //Compensations
    if (game.global.challengeActive == "Domination" && exitCell != 100) base /= (what == "attack") ? 10 : 75 * 4;

    return base;
}

function calcBadGuyDmg(enemy, attack, daily, maxormin, disableFlucts) {
    //Init
    var number = (enemy) ? enemy.attack : attack;
    var fluctuation = .2;
    var maxFluct = -1;
    var minFluct = -1;
    var corrupt = mutations.Corruption.active();
    var healthy = mutations.Healthy.active();

    if (!enemy) {
        //A few challenges
        if      (game.global.challengeActive == "Meditate")   number *= 1.5;
        else if (game.global.challengeActive == "Watch")      number *= 1.25;
        else if (game.global.challengeActive == 'Life')       number *= 6;
        else if (game.global.challengeActive == "Corrupted")  number *= 3;
        else if (game.global.challengeActive == "Domination") number *= 2.5;
        else if (game.global.challengeActive == "Coordinate") number *= getBadCoordLevel();
        else if (game.global.challengeActive == "Lead")       number *= (1 + (game.challenges.Lead.stacks * 0.04));

        //Scientists and Nom
        else if (game.global.challengeActive == "Scientist" && getScientistLevel() == 5) number *= 10;
        else if (game.global.challengeActive == "Nom" && enemy && typeof enemy.nomStacks !== 'undefined') number *= Math.pow(1.25, enemy.nomStacks);

        //Obliterated and Eradicated
        else if (game.global.challengeActive == "Obliterated" || game.global.challengeActive == "Eradicated"){
            var oblitMult = (game.global.challengeActive == "Eradicated") ? game.challenges.Eradicated.scaleModifier : 1e12;
            var zoneModifier = Math.floor(game.global.world / game.challenges[game.global.challengeActive].zoneScaleFreq);
            oblitMult *= Math.pow(game.challenges[game.global.challengeActive].zoneScaling, zoneModifier);
            number *= oblitMult;
	}

        //Spire
        if (game.global.spireActive) number = calcSpire("attack");

        //Corruption - May be slightly smaller than it should be, if "world" is different than your current zone
        else if (corrupt && !healthy && !(game.global.mapsActive && getCurrentMapObject().location == "Void")) {
            //Calculates the impact of the corruption on the average health on that map (kinda like a crit)
            var corruptionAmount = ~~((game.global.world - mutations.Corruption.start())/3) + 2; //Integer division
            var corruptionWeight = (100 - corruptionAmount) + corruptionAmount * getCorruptScale("attack");
            number *= corruptionWeight/100;
        }

        //RoboTrimp
        if (!enemy && game.global.usingShriek) number *= game.mapUnlocks.roboTrimp.getShriekValue();
    }

    //Daily
    if (daily) number = calcDailyAttackMod(number);

    //Fluctuations
    if (!disableFlucts) {
        if (minFluct > 1) minFluct = 1;
        if (maxFluct == -1) maxFluct = fluctuation;
        if (minFluct == -1) minFluct = fluctuation;
        var min = Math.floor(number * (1 - minFluct));
        var max = Math.ceil(number + (number * maxFluct));
        return maxormin ? max : min;
    }

    return number;
}

function calcCorruptionScale(world, base) {
    var startPoint = (game.global.challengeActive == "Corrupted" || game.global.challengeActive == "Eradicated") ? 1 : 150;
    var scales = Math.floor((world - startPoint) / 6);
    base *= Math.pow(1.05, scales);
    return base;
}

function calcEnemyBaseHealth(zone, level, name) {
    //Init
    var health = 0;
    health += 130 * Math.sqrt(zone) * Math.pow(3.265, zone / 2);
    health -= 110;

    //First Two Zones
    if (zone == 1 || zone == 2 && level < 10) {
        health *= 0.6;
        health = (health * 0.25) + ((health * 0.72) * (level / 100));
    }

    //Before Breaking the World
    else if (zone < 60) {
        health = (health * 0.4) + ((health * 0.4) * (level / 110));
        health *= 0.75;
    }
    
    //After Breaking the World
    else {
        health = (health * 0.5) + ((health * 0.8) * (level / 100));
        health *= Math.pow(1.1, zone - 59);
    }
    
    //Specific Imp
    if (name) health *= game.badGuys[name].health;

    return health;
}

function calcEnemyHealthCore(world, map, cell, name) {
    //Pre-Init
    if (!world) world = game.global.world;
    if (!cell) cell = (map) ? getCurrentMapCell() : getCurrentWorldCell();

    //Init
    var health = calcEnemyBaseHealth(world, cell, name);

    //Maps
    if (map && game.global.universe == 1) health *= 0.5;

    //Spire - Overrides the base health number
    if (!map && game.global.spireActive) health = calcSpire("health");

    //Challenges
    if (game.global.challengeActive == 'Balance')    health *= 2;
    if (game.global.challengeActive == 'Meditate')   health *= 2;
    if (game.global.challengeActive == "Toxicity")   health *= 2;
    if (game.global.challengeActive == 'Life')       health *= 11;
    if (game.global.challengeActive == "Coordinate") health *= getBadCoordLevel();

    //Obliterated + Eradicated
    if (game.global.challengeActive == "Obliterated" || game.global.challengeActive == "Eradicated") {
        var oblitMult = (game.global.challengeActive == "Eradicated") ? game.challenges.Eradicated.scaleModifier : 1e12;
        var zoneModifier = Math.floor(game.global.world / game.challenges[game.global.challengeActive].zoneScaleFreq);
        oblitMult *= Math.pow(game.challenges[game.global.challengeActive].zoneScaling, zoneModifier);
        health *= oblitMult;
    }

    return health;
}

function calcEnemyHealth(world, map, cell = 99, name = "Turtlimp") {
    //Pre-Init
    if (!world) world = game.global.world;
    if (game.global.challengeActive == 'Lead' && world%2 == 1) world++;

    //Init
    var health = calcEnemyHealthCore(world, map, cell, name);
    var corrupt = !map && world >= mutations.Corruption.start();
    var healthy = !map && mutations.Healthy.active();

    //Challenges - worst case for lead, conservative on domination unless it's on a map
    if (game.global.challengeActive == "Domination")   health *= 7.5 * (map ? 1 : 4);
    if (game.global.challengeActive == "Lead") health *= game.challenges.Lead.stacks * (!map ? 102 : game.challenges.Lead.stacks);

    //Corruption - May be slightly smaller than it should be, if "world" is different than your current zone
    if (corrupt && !healthy && !game.global.spireActive) {
        //Calculates the impact of the corruption on the average health on that map (kinda like a crit)
        var corruptionAmount = ~~((world - mutations.Corruption.start())/3) + 2; //Integer division
        var corruptionWeight = (100 - corruptionAmount) + corruptionAmount * calcCorruptionScale(world, 10);
        health *= corruptionWeight/100;
    }

    //Healthy -- DEBUG
    if (healthy && !game.global.spireActive) {
        var scales = Math.floor((world - 150) / 6);
        health *= 14*Math.pow(1.05, scales);
        health *= 1.15;
    }

    return health;
}

function calcSpecificEnemyHealth(world, map, cell) {
    //Pre-Init
    if (!world) world = game.global.world;
    if (!cell) cell = (map) ? getCurrentMapCell() : getCurrentWorldCell();

    //Init
    var enemy = game.global.gridArray[cell-1];
    var corrupt = enemy.hasOwnProperty("corrupted");
    var healthy = enemy.hasOwnProperty("healthy");
    var name = (corrupt || healthy) ? "Chimp" : enemy.name;
    var health = calcEnemyHealthCore(world, map, cell, name);

    //Challenges - considers the actual scenario for this enemy
    if (game.global.challengeActive == "Lead") health *= 1 + (0.04 * game.challenges.Lead.stacks);
    if (game.global.challengeActive == 'Domination') {
        if (!map && !game.global.spireActive && cell != 100) health /= 10;
        if (map && cell != game.global.mapGridArray.length) health /= 10;
    }

    //Corruption - May be slightly smaller than it should be, if "world" is different than your current zone
    if (corrupt && !healthy) {
        health *= calcCorruptionScale(world, 10);
        if (enemy.corrupted == "corruptTough") health *= 5;
    }

    //Healthy -- DEBUG
    if (healthy) {
        var scales = Math.floor((world - 150) / 6);
        health *= 14*Math.pow(1.05, scales);
        health *= 1.15;
    }

    return health;
}

function calcHDratio(mapZone) {
    var ratio = 0;
    var ourBaseDamage = calcOurDmg("avg", false, true);

    //Shield
    highDamageShield();
    if (getPageSetting('AutoStance') == 3 && getPageSetting('highdmg') != undefined && game.global.challengeActive != "Daily" && game.global.ShieldEquipped.name != getPageSetting('highdmg')) {
	ourBaseDamage /= getCritMulti(false);
        ourBaseDamage *= trimpAA;
	ourBaseDamage *= getCritMulti(true);
    }
    if (getPageSetting('use3daily') == true && getPageSetting('dhighdmg') != undefined && game.global.challengeActive == "Daily" && game.global.ShieldEquipped.name != getPageSetting('dhighdmg')) {
	ourBaseDamage /= getCritMulti(false);
        ourBaseDamage *= trimpAA;
	ourBaseDamage *= getCritMulti(true);
    }

    //Math, considering maps or not
    if (!mapZone || mapZone < 1) ratio = calcEnemyHealth() / ourBaseDamage;
    if (mapZone || mapZone >= 1) ratio = calcEnemyHealth(mapZone, true) / ourBaseDamage;

    //Voids -- DEBUG
    //if (considerVoid && !game.global.spireActive) ratio *= 4.5;

    return ratio;
}

function calcCurrentStance() {
    if (game.global.uberNature == "Wind" && getEmpowerment() == "Wind" && !game.global.mapsActive &&
        (((game.global.challengeActive != "Daily" && calcHDratio() < getPageSetting('WindStackingMinHD'))
            || (game.global.challengeActive == "Daily" && calcHDratio() < getPageSetting('dWindStackingMinHD')))
                && ((game.global.challengeActive != "Daily" && game.global.world >= getPageSetting('WindStackingMin'))
                    || (game.global.challengeActive == "Daily" && game.global.world >= getPageSetting('dWindStackingMin'))))
                        || (game.global.uberNature == "Wind" && getEmpowerment() == "Wind" && !game.global.mapsActive && checkIfLiquidZone() && getPageSetting('liqstack') == true))
                            return 15;
    else {
        //Base Calc
        var ehealth = 1;
        if (game.global.fighting) ehealth = (getCurrentEnemy().maxHealth - getCurrentEnemy().health);
        var attacklow = calcOurDmg("max", false, true);
        var attackhigh = calcOurDmg("max", false, true);

        //Heirloom Calc
        highDamageShield();
        if (getPageSetting('AutoStance') == 3 && getPageSetting('highdmg') != undefined && game.global.challengeActive != "Daily" && game.global.ShieldEquipped.name != getPageSetting('highdmg')) {
            attackhigh *= trimpAA;
            attackhigh *= getCritMulti(true);
        }
        if (getPageSetting('use3daily') == true && getPageSetting('dhighdmg') != undefined && game.global.challengeActive == "Daily" && game.global.ShieldEquipped.name != getPageSetting('dhighdmg')) {
            attackhigh *= trimpAA;
            attackhigh *= getCritMulti(true);
        }

        //Heirloom Switch
        if (ehealth > 0) {
            var hitslow = (ehealth / attacklow);
            var hitshigh = (ehealth / attackhigh);
            var stacks = 190;
            var usehigh = false;
            var stacksleft = 1;

            if (game.global.challengeActive != "Daily" && getPageSetting('WindStackingMax') > 0) stacks = getPageSetting('WindStackingMax');
            if (game.global.challengeActive == "Daily" && getPageSetting('dWindStackingMax') > 0) stacks = getPageSetting('dWindStackingMax');
            if (game.global.uberNature == "Wind") stacks += 100;
            if (getEmpowerment() == "Wind") stacksleft = (stacks - game.empowerments.Wind.currentDebuffPower);

            //Use High
            if ((getEmpowerment() != "Wind") || (game.empowerments.Wind.currentDebuffPower >= stacks) || (hitshigh >= stacksleft)
                || (game.global.mapsActive) || (game.global.challengeActive != "Daily" && game.global.world < getPageSetting('WindStackingMin'))
                    || (game.global.challengeActive == "Daily" && game.global.world < getPageSetting('dWindStackingMin')))
                        usehigh = true;

            if ((getPageSetting('wsmax') > 0 && game.global.world >= getPageSetting('wsmax') && !game.global.mapsActive && getEmpowerment() == "Wind" && game.global.challengeActive != "Daily" && getPageSetting('wsmaxhd') > 0 && calcHDratio() < getPageSetting('wsmaxhd'))
                || (getPageSetting('dwsmax') > 0 && game.global.world >= getPageSetting('dwsmax') && !game.global.mapsActive && getEmpowerment() == "Wind" && game.global.challengeActive == "Daily" && getPageSetting('dwsmaxhd') > 0 && calcHDratio() < getPageSetting('dwsmaxhd')))
                    usehigh = false;

            //Low
            if (!usehigh) {
                if ((game.empowerments.Wind.currentDebuffPower >= stacks) || ((hitslow * 4) > stacksleft)) return 2;
                else if ((hitslow) > stacksleft) return 0;
                else return 1;
            }

            //High
            else if (usehigh) {
                if ((getEmpowerment() != "Wind") || (game.empowerments.Wind.currentDebuffPower >= stacks)
                    || ((hitshigh * 4) > stacksleft) || (game.global.mapsActive)
                        || (game.global.challengeActive != "Daily" && game.global.world < getPageSetting('WindStackingMin'))
                            || (game.global.challengeActive == "Daily" && game.global.world < getPageSetting('dWindStackingMin')))
                                return 12;

                else if (hitshigh > stacksleft) return 10;
                else return 11;
            }
        }
    }
}

//Radon

function RgetCritMulti() {

	var critChance = getPlayerCritChance();
	var CritD = getPlayerCritDamageMult();

	if (critChance < 0)
		CritDHModifier = (1+critChance - critChance/5);
	if (critChance >= 0 && critChance < 1)
		CritDHModifier = (1-critChance + critChance * CritD);
	if (critChance >= 1 && critChance < 2)
		CritDHModifier = ((critChance-1) * getMegaCritDamageMult(2) * CritD + (2-critChance) * CritD);
	if (critChance >= 2)
		CritDHModifier = ((critChance-2) * Math.pow(getMegaCritDamageMult(2),2) * CritD + (3-critChance) * getMegaCritDamageMult(2) * CritD);

  return CritDHModifier;
}

function RcalcOurDmg(minMaxAvg, incStance, incFlucts) {
	var number = 6;
	var fluctuation = .2;
	var maxFluct = -1;
	var minFluct = -1;
        var equipmentList = ["Dagger", "Mace", "Polearm", "Battleaxe", "Greatsword", "Arbalest"];
        for(var i = 0; i < equipmentList.length; i++){
            if(game.equipment[equipmentList[i]].locked !== 0) continue;
            var attackBonus = game.equipment[equipmentList[i]].attackCalculated;
            var level       = game.equipment[equipmentList[i]].level;
            number += attackBonus*level;
        }
	number *= game.resources.trimps.maxSoldiers;
  	if (game.buildings.Smithy.owned > 0) {
		number *= Math.pow(1.25, game.buildings.Smithy.owned);
	}
	if (game.global.achievementBonus > 0){
		number *= (1 + (game.global.achievementBonus / 100));
	}
	if (game.portal.Power.radLevel > 0) {
		number += (number * game.portal.Power.radLevel * game.portal.Power.modifier);
	}
	if (game.global.mapBonus > 0){
	    var mapBonus = game.global.mapBonus;
            if (game.talents.mapBattery.purchased && mapBonus == 10) mapBonus *= 2;
		number *= ((mapBonus * .2) + 1);
	}
        if (game.portal.Equality.radLevel > 0 && getPageSetting('Rcalcmaxequality') != 1) {
            number *= game.portal.Equality.getMult();
        }
        else if (game.portal.Equality.radLevel > 0 && getPageSetting('Rcalcmaxequality') == 1 && game.portal.Equality.getActiveLevels() < game.portal.Equality.radLevel) {
            number *= Math.pow(game.portal.Equality.modifier, game.portal.Equality.radLevel);
        }
	if (game.portal.Tenacity.radLevel > 0) {
		number *= game.portal.Tenacity.getMult();
	}
	if (game.portal.Range.radLevel > 0){
		minFluct = fluctuation - (.02 * game.portal.Range.radLevel);
	}
	if (game.global.roboTrimpLevel > 0){
		number *= ((0.2 * game.global.roboTrimpLevel) + 1);
	}
	
	number = calcHeirloomBonus("Shield", "trimpAttack", number);
	
	if (game.goldenUpgrades.Battle.currentBonus > 0) {
		number *= game.goldenUpgrades.Battle.currentBonus + 1;
	}
	if (game.global.totalSquaredReward > 0) {
		number *= ((game.global.totalSquaredReward / 100) + 1);
	}
	if (Fluffy.isActive()){
		number *= Fluffy.getDamageModifier();
	}
	if (playerSpireTraps.Strength.owned) {
		var strBonus = playerSpireTraps.Strength.getWorldBonus();
		number *= (1 + (strBonus / 100));
	}
	if (game.singleRunBonuses.sharpTrimps.owned){
		number *= 1.5;
	}
	if (game.global.sugarRush > 0) {
		number *= sugarRush.getAttackStrength();
	}
	if (game.talents.herbalist.purchased) {
	        number *= game.talents.herbalist.getBonus();
	}
	if (game.global.challengeActive == "Melt") {
		number *= 5;
		number *= Math.pow(0.99, game.challenges.Melt.stacks);
	}
	if (game.global.challengeActive == "Unbalance") {
		number *= game.challenges.Unbalance.getAttackMult();
	}
	if (game.global.challengeActive == "Quagmire") {
		number *= game.challenges.Quagmire.getExhaustMult()
	}
        if (game.global.challengeActive == "Quest") {
		number *= game.challenges.Quest.getAttackMult();
	}
	if (game.global.challengeActive == "Revenge" && game.challenges.Revenge.stacks > 0) {
		number *= game.challenges.Revenge.getMult();
	}
	if (game.global.challengeActive == "Archaeology") {
		number *= game.challenges.Archaeology.getStatMult("attack");
	}
	if (game.global.mayhemCompletions > 0) {
		number *= game.challenges.Mayhem.getTrimpMult();
	}
	if (getHeirloomBonus("Shield", "gammaBurst") > 0 && (RcalcOurHealth() / (RcalcBadGuyDmg(null, RgetEnemyMaxAttack(game.global.world, 50, 'Snimp', 1.0))) >= 5)) {
	    	number *= ((getHeirloomBonus("Shield", "gammaBurst") / 100) + 1) / 5;
	}
	if (game.global.challengeActive == "Daily" && game.talents.daily.purchased){
		number *= 1.5;
	}
	if (game.global.challengeActive == "Daily"){
		if (typeof game.global.dailyChallenge.minDamage !== 'undefined') {
			if (minFluct == -1) minFluct = fluctuation;
			minFluct += dailyModifiers.minDamage.getMult(game.global.dailyChallenge.minDamage.strength);
		}
		if (typeof game.global.dailyChallenge.maxDamage !== 'undefined') {
			if (maxFluct == -1) maxFluct = fluctuation;
			maxFluct += dailyModifiers.maxDamage.getMult(game.global.dailyChallenge.maxDamage.strength);
		}
		if (typeof game.global.dailyChallenge.oddTrimpNerf !== 'undefined' && ((game.global.world % 2) == 1)) {
				number *= dailyModifiers.oddTrimpNerf.getMult(game.global.dailyChallenge.oddTrimpNerf.strength);
		}
		if (typeof game.global.dailyChallenge.evenTrimpBuff !== 'undefined' && ((game.global.world % 2) == 0)) {
				number *= dailyModifiers.evenTrimpBuff.getMult(game.global.dailyChallenge.evenTrimpBuff.strength);
		}
		if (typeof game.global.dailyChallenge.rampage !== 'undefined') {
			number *= dailyModifiers.rampage.getMult(game.global.dailyChallenge.rampage.strength, game.global.dailyChallenge.rampage.stacks);
		}
	}

  var min = number;
  var max = number;
  var avg = number;

  min *= (RgetCritMulti()*0.8);
  avg *= RgetCritMulti();
  max *= (RgetCritMulti()*1.2);
  
  if (incFlucts) {
    if (minFluct > 1) minFluct = 1;
    if (maxFluct == -1) maxFluct = fluctuation;
    if (minFluct == -1) minFluct = fluctuation;

    min *= (1 - minFluct);
    max *= (1 + maxFluct);
    avg *= 1 + (maxFluct - minFluct)/2;
  }

  if (minMaxAvg == "min") return min;
  else if (minMaxAvg == "max") return max;
  else if (minMaxAvg == "avg") return avg;
  
}

function RcalcOurHealth() {
	
    //Health
	
    var health = 50;
    if (game.resources.trimps.maxSoldiers > 0) {
        var equipmentList = ["Shield", "Boots", "Helmet", "Pants", "Shoulderguards", "Breastplate", "Gambeson"];
        for(var i = 0; i < equipmentList.length; i++){
            if(game.equipment[equipmentList[i]].locked !== 0) continue;
            var healthBonus = game.equipment[equipmentList[i]].healthCalculated;
            var level       = game.equipment[equipmentList[i]].level;
            health += healthBonus*level;
        }
    }
    health *= game.resources.trimps.maxSoldiers;
    if (game.buildings.Smithy.owned > 0) {
		health *= Math.pow(1.25, game.buildings.Smithy.owned);
    }
    if (game.portal.Toughness.radLevel > 0) {
        health *= ((game.portal.Toughness.radLevel * game.portal.Toughness.modifier) + 1);
    }
    if (game.portal.Resilience.radLevel > 0) {
        health *= (Math.pow(game.portal.Resilience.modifier + 1, game.portal.Resilience.radLevel));
    }
    if (Fluffy.isRewardActive("healthy")) {
		health *= 1.5;
    }
    health = calcHeirloomBonus("Shield", "trimpHealth", health);
    if (game.goldenUpgrades.Battle.currentBonus > 0) {
        health *= game.goldenUpgrades.Battle.currentBonus + 1;
    }
    if (game.global.totalSquaredReward > 0) {
        health *= (1 + (game.global.totalSquaredReward / 100));
    }
    if (game.global.challengeActive == "Revenge" && game.challenges.Revenge.stacks > 0) {
	health *= game.challenges.Revenge.getMult();
    }
    if (game.global.challengeActive == "Wither" && game.challenges.Wither.trimpStacks > 0) {
	health *= game.challenges.Wither.getTrimpHealthMult();
    }
    if (game.global.mayhemCompletions > 0) {
	health *= game.challenges.Mayhem.getTrimpMult();
    }
    if (typeof game.global.dailyChallenge.pressure !== 'undefined') {
        health *= (dailyModifiers.pressure.getMult(game.global.dailyChallenge.pressure.strength, game.global.dailyChallenge.pressure.stacks));
    }
	
    //Pris
	
    health *= (getEnergyShieldMult() + 1);
	
    return health;
}

function RcalcDailyAttackMod(number) {
    if (game.global.challengeActive == "Daily"){
        if (typeof game.global.dailyChallenge.badStrength !== 'undefined'){
            number *= dailyModifiers.badStrength.getMult(game.global.dailyChallenge.badStrength.strength);
        }
        if (typeof game.global.dailyChallenge.badMapStrength !== 'undefined' && game.global.mapsActive){
            number *= dailyModifiers.badMapStrength.getMult(game.global.dailyChallenge.badMapStrength.strength);
        }
        if (typeof game.global.dailyChallenge.bloodthirst !== 'undefined'){
            number *= dailyModifiers.bloodthirst.getMult(game.global.dailyChallenge.bloodthirst.strength, game.global.dailyChallenge.bloodthirst.stacks);
        }
    }
    return number;
}

function RcalcBadGuyDmg(enemy,attack) {
    var number;
    if (enemy)
        number = enemy.attack;
    else
        number = attack;
    if (game.portal.Equality.radLevel > 0 && getPageSetting('Rcalcmaxequality') == 0) {
        number *= game.portal.Equality.getMult();
    }
    else if (game.portal.Equality.radLevel > 0 && getPageSetting('Rcalcmaxequality') >= 1 && game.portal.Equality.getActiveLevels() < game.portal.Equality.radLevel) {
        number *= Math.pow(game.portal.Equality.modifier, game.portal.Equality.radLevel);
    }
    if (game.global.challengeActive == "Daily") {
        number = RcalcDailyAttackMod(number);
    }
    if (game.global.challengeActive == "Unbalance") {
	number *= 1.5;
    }
    if (game.global.challengeActive == "Wither" && game.challenges.Wither.enemyStacks > 0) {
	number *= game.challenges.Wither.getEnemyAttackMult();
    }
    if (game.global.challengeActive == "Archaeology") {
	number *= game.challenges.Archaeology.getStatMult("enemyAttack");
    }
    if (game.global.challengeActive == "Mayhem") {
	number *= game.challenges.Mayhem.getEnemyMult();
	number *= game.challenges.Mayhem.getBossMult();
    }
    if (!enemy && game.global.usingShriek) {
        number *= game.mapUnlocks.roboTrimp.getShriekValue();
    }
    return number;
}

function RcalcEnemyBaseHealth(world, level, name) {
			var amt = 0;
			var healthBase = (game.global.universe == 2) ? 10e7 : 130;
			amt += healthBase * Math.sqrt(world) * Math.pow(3.265, world / 2);
			amt -= 110;
			if (world == 1 || world == 2 && level < 10){
				amt *= 0.6;
			amt = (amt * 0.25) + ((amt * 0.72) * (level / 100));
			}
			else if (world < 60)
				amt = (amt * 0.4) + ((amt * 0.4) * (level / 110));
			else{
				amt = (amt * 0.5) + ((amt * 0.8) * (level / 100));
				amt *= Math.pow(1.1, world - 59);
			}
			if (world < 60) amt *= 0.75;
			if (world > 5 && game.global.mapsActive) amt *= 1.1;
		        amt *= game.badGuys[name].health;
			if (game.global.universe == 2) {
				var part1 = (world > 60) ? 60 : world;
				var part2 = (world - 60);
				if (part2 < 0) part2 = 0;
				amt *= Math.pow(1.4, part1);
				amt *= Math.pow(1.32, part2);
			}
			return Math.floor(amt);
}

function RcalcEnemyHealth(world) {
    if (world == false) world = game.global.world;
    var health = RcalcEnemyBaseHealth(world, 50, "Snimp");
    if (game.global.challengeActive == "Unbalance") {
	health *= 2;
    }
    if (game.global.challengeActive == "Quest"){
	health *= game.challenges.Quest.getHealthMult();
    }
    if (game.global.challengeActive == "Revenge" && game.global.world % 2 == 0) {
	health *= 10;
    }
    if (game.global.challengeActive == "Archaeology") {
	
    }
    if (game.global.challengeActive == "Mayhem") {
	health *= game.challenges.Mayhem.getEnemyMult();
	health *= game.challenges.Mayhem.getBossMult();
    }
    return health;
}

function RcalcHDratio() {
    var ratio = 0;
    var ourBaseDamage = RcalcOurDmg("avg", false, true);

    ratio = RcalcEnemyHealth(game.global.world) / ourBaseDamage;
    return ratio;
}
