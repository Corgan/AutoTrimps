//Helium
MODULES.maps = {};
MODULES.maps.numHitsSurvived = 8;
MODULES.maps.LeadfarmingCutoff = 10;
MODULES.maps.NomfarmingCutoff = 10;
MODULES.maps.NomFarmStacksCutoff = [7, 30, 100];
MODULES.maps.MapTierZone = [72, 47, 16];
MODULES.maps.MapTier0Sliders = [9, 9, 9, "Mountain"];
MODULES.maps.MapTier1Sliders = [9, 9, 9, "Depths"];
MODULES.maps.MapTier2Sliders = [9, 9, 9, "Random"];
MODULES.maps.MapTier3Sliders = [9, 9, 9, "Random"];
MODULES.maps.preferGardens = !getPageSetting("PreferMetal");
MODULES.maps.SpireFarm199Maps = !0;
MODULES.maps.shouldFarmCell = 59;
MODULES.maps.SkipNumUnboughtPrestiges = 2;
MODULES.maps.UnearnedPrestigesRequired = 2;

var doVoids = !1;
var needToVoid = !1;
var needPrestige = !1;
var skippedPrestige = !1;
var scryerStuck = !1;
var shouldDoMaps = !1;
var mapTimeEstimate = 0;
var lastMapWeWereIn = null;
var preSpireFarming = !1;
var spireMapBonusFarming = !1;
var spireTime = 0;
var doMaxMapBonus = !1;
var vanillaMapatZone = !1;
var farmingWonder = !1;
var additionalCritMulti = 2 < getPlayerCritChance() ? 25 : 5;

function updateAutoMapsStatus(get) {

    var status;
    var minSp = getPageSetting('MinutestoFarmBeforeSpire');

    //Fail Safes
    if (getPageSetting('AutoMaps') == 0) status = 'Off';
    else if (game.global.challengeActive == "Mapology" && game.challenges.Mapology.credits < 1) status = 'Out of Map Credits';

    //Raiding
    else if (game.global.mapsActive && getCurrentMapObject().level > game.global.world && getCurrentMapObject().location != "Void" && getCurrentMapObject().location != "Bionic") status = 'Prestige Raiding';
    else if (game.global.mapsActive && getCurrentMapObject().level > game.global.world && getCurrentMapObject().location == "Bionic") status = 'BW Raiding';

    //Spire
    else if (preSpireFarming) {
        var secs = Math.floor(60 - (spireTime * 60) % 60).toFixed(0);
        var mins = Math.floor(minSp - spireTime).toFixed(0);
        var hours = ((minSp - spireTime) / 60).toFixed(2);
        var spiretimeStr = (minSp - spireTime >= 60) ?
            (hours + 'h') : (mins + 'm:' + (secs >= 10 ? secs : ('0' + secs)) + 's');
        status = 'Farming for Spire ' + spiretimeStr + ' left';
    } else if (spireMapBonusFarming) status = 'Getting Spire Map Bonus';
    else if (getPageSetting('SkipSpires') == 1 && ((game.global.challengeActive != 'Daily' && isActiveSpireAT()) || (game.global.challengeActive == 'Daily' && disActiveSpireAT()))) status = 'Skipping Spire';
    else if (doMaxMapBonus) status = 'Max Map Bonus After Zone';
    else if (!game.global.mapsUnlocked) status = '&nbsp;';
    else if (needPrestige && !doVoids) status = 'Prestige';
    else if (doVoids) {
        var stackedMaps = Fluffy.isRewardActive('void') ? countStackedVoidMaps() : 0;
        status = 'Void Maps: ' + game.global.totalVoidMaps + ((stackedMaps) ? " (" + stackedMaps + " stacked)" : "") + ' remaining';
    } else if (shouldFarm && !doVoids) status = 'Farming: ' + calcHDratio().toFixed(4) + 'x';
    else if (!enoughHealth && !enoughDamage) status = 'Want Health & Damage';
    else if (!enoughDamage) status = 'Want ' + calcHDratio().toFixed(4) + 'x &nbspmore damage';
    else if (!enoughHealth) status = 'Want more health';
    else if (farmingWonder) status = 'Experiencing Wonder';
    else if (enoughHealth && enoughDamage) status = 'Advancing';

    if (skippedPrestige)
        status += '<br><b style="font-size:.8em;color:pink;margin-top:0.2vw">Prestige Skipped</b>';

    //hider he/hr% status
    var getPercent = (game.stats.heliumHour.value() / (game.global.totalHeliumEarned - (game.global.heliumLeftover + game.resources.helium.owned))) * 100;
    var lifetime = (game.resources.helium.owned / (game.global.totalHeliumEarned - game.resources.helium.owned)) * 100;
    var hiderStatus = 'He/hr: ' + getPercent.toFixed(3) + '%<br>&nbsp;&nbsp;&nbsp;He: ' + lifetime.toFixed(3) + '%';

    if (get) {
        return [status, getPercent, lifetime];
    } else {
        document.getElementById('autoMapStatus').innerHTML = status;
        document.getElementById('hiderStatus').innerHTML = hiderStatus;
    }
}

MODULES["maps"].advSpecialMapMod_numZones = 3;
var advExtraMapLevels = 0;

function testMapSpecialModController() {
    var a = [];
    if (Object.keys(mapSpecialModifierConfig).forEach(function(o) {
            var p = mapSpecialModifierConfig[o];
            game.global.highestLevelCleared + 1 >= p.unlocksAt && a.push(p.abv.toLowerCase());
        }), !(1 > a.length)) {
        var c = document.getElementById("advSpecialSelect");
        if (c) {
            if (59 <= game.global.highestLevelCleared) {
                if (needPrestige && a.includes("p")) {
                    c.value = "p";
                } else if (shouldFarm || !enoughHealth || preSpireFarming) {
                    c.value = a.includes("lmc") ? "lmc" : a.includes("hc") ? "hc" : a.includes("smc") ? "smc" : "lc";
                } else c.value = "fa";
                for (var d = updateMapCost(!0), e = game.resources.fragments.owned, f = 100 * (d / e); 0 < c.selectedIndex && d > e;) {
                    c.selectedIndex -= 1;
                    "0" != c.value && console.log("Could not afford " + mapSpecialModifierConfig[c.value].name);
                }
                var d = updateMapCost(!0),
                    e = game.resources.fragments.owned;
                "0" != c.value && debug("Set the map special modifier to: " + mapSpecialModifierConfig[c.value].name + ". Cost: " + (100 * (d / e)).toFixed(2) + "% of your fragments.");
            }
            var g = getSpecialModifierSetting(),
                h = 109 <= game.global.highestLevelCleared,
                i = checkPerfectChecked(),
                j = document.getElementById("advPerfectCheckbox"),
                k = getPageSetting("AdvMapSpecialModifier") ? getExtraMapLevels() : 0,
                l = 209 <= game.global.highestLevelCleared;
            if (l) {
                var m = document.getElementById("advExtraMapLevelselect");
                if (!m)
                    return;
                var n = document.getElementById("mapLevelInput").value;
                for (m.selectedIndex = n == game.global.world ? MODULES.maps.advSpecialMapMod_numZones : 0; 0 < m.selectedIndex && updateMapCost(!0) > game.resources.fragments.owned;)
                    m.selectedIndex -= 1;
            }
        }
    }
}

function autoMap() {

    //mano();

    //Failsafes
    if (!game.global.mapsUnlocked || calcOurDmg("avg", false, true) <= 0) {
        enoughDamage = true;
        enoughHealth = true;
        shouldFarm = false;
        updateAutoMapsStatus();
        return;
    }
    if (game.global.challengeActive == "Mapology" && game.challenges.Mapology.credits < 1) {
        updateAutoMapsStatus();
        return;
    }

    //WS
    var mapenoughdamagecutoff = getPageSetting("mapcuntoff");
    if (getEmpowerment() == 'Wind' && game.global.challengeActive != "Daily" && !game.global.runningChallengeSquared && getPageSetting("AutoStance") == 3 && getPageSetting("WindStackingMin") > 0 && game.global.world >= getPageSetting("WindStackingMin") && getPageSetting("windcutoffmap") > 0)
        mapenoughdamagecutoff = getPageSetting("windcutoffmap");
    if (getEmpowerment() == 'Wind' && game.global.challengeActive == "Daily" && !game.global.runningChallengeSquared && (getPageSetting("AutoStance") == 3 || getPageSetting("use3daily") == true) && getPageSetting("dWindStackingMin") > 0 && game.global.world >= getPageSetting("dWindStackingMin") && getPageSetting("dwindcutoffmap") > 0)
        mapenoughdamagecutoff = getPageSetting("dwindcutoffmap");
    if (getPageSetting("mapc2hd") > 0 && game.global.challengeActive == "Mapology")
        mapenoughdamagecutoff = getPageSetting("mapc2hd");

    //Vars
    var customVars = MODULES["maps"];
    var prestige = autoTrimpSettings.Prestige.selected;
    if (prestige != "Off" && game.options.menu.mapLoot.enabled != 1) toggleSetting('mapLoot');
    if (game.global.repeatMap == true && !game.global.mapsActive && !game.global.preMapsActive) repeatClicked();
    if ((game.options.menu.repeatUntil.enabled == 1 || game.options.menu.repeatUntil.enabled == 2 || game.options.menu.repeatUntil.enabled == 3) && !game.global.mapsActive && !game.global.preMapsActive) toggleSetting('repeatUntil');
    if (game.options.menu.exitTo.enabled != 0) toggleSetting('exitTo');
    if (game.options.menu.repeatVoids.enabled != 0) toggleSetting('repeatVoids');
    var challSQ = game.global.runningChallengeSquared;
    var extraMapLevels = getPageSetting('AdvMapSpecialModifier') ? getExtraMapLevels() : 0;

    //Void Vars
    var voidMapLevelSetting = 0;
    var voidMapLevelSettingCell;
    var voidMapLevelPlus = 0;
    if (game.global.challengeActive != "Daily") {
        voidMapLevelSettingCell = ((getPageSetting('voidscell') > 0) ? getPageSetting('voidscell') : 70);
    }
    if (game.global.challengeActive == "Daily") {
        voidMapLevelSettingCell = ((getPageSetting('dvoidscell') > 0) ? getPageSetting('dvoidscell') : 70);
    }
    if (game.global.challengeActive != "Daily" && getPageSetting('VoidMaps') > 0) {
        voidMapLevelSetting = getPageSetting('VoidMaps');
    }
    if (game.global.challengeActive == "Daily" && getPageSetting('DailyVoidMod') >= 1) {
        voidMapLevelSetting = getPageSetting('DailyVoidMod');
    }
    if (getPageSetting('RunNewVoidsUntilNew') != 0 && game.global.challengeActive != "Daily") {
        voidMapLevelPlus = getPageSetting('RunNewVoidsUntilNew');
    }
    if (getPageSetting('dRunNewVoidsUntilNew') != 0 && game.global.challengeActive == "Daily") {
        voidMapLevelPlus = getPageSetting('dRunNewVoidsUntilNew');
    }

    needToVoid = (voidMapLevelSetting > 0 && game.global.totalVoidMaps > 0 && game.global.lastClearedCell + 1 >= voidMapLevelSettingCell &&
        (
            (game.global.world == voidMapLevelSetting) ||
            (voidMapLevelPlus < 0 && game.global.world >= voidMapLevelSetting &&
                (game.global.universe == 1 &&
                    (
                        (getPageSetting('runnewvoidspoison') == false && game.global.challengeActive != "Daily") ||
                        (getPageSetting('drunnewvoidspoison') == false && game.global.challengeActive == "Daily")
                    ) ||
                    (
                        (getPageSetting('runnewvoidspoison') == true && getEmpowerment() == 'Poison' && game.global.challengeActive != "Daily") ||
                        (getPageSetting('drunnewvoidspoison') == true && getEmpowerment() == 'Poison' && game.global.challengeActive == "Daily")
                    )
                ) ||
                (voidMapLevelPlus > 0 && game.global.world >= voidMapLevelSetting && game.global.world <= (voidMapLevelSetting + voidMapLevelPlus) &&
                    (game.global.universe == 1 &&
                        (
                            (getPageSetting('runnewvoidspoison') == false && game.global.challengeActive != "Daily") ||
                            (getPageSetting('drunnewvoidspoison') == false && game.global.challengeActive == "Daily")
                        ) ||
                        (
                            (getPageSetting('runnewvoidspoison') == true && getEmpowerment() == 'Poison' && game.global.challengeActive != "Daily") ||
                            (getPageSetting('drunnewvoidspoison') == true && getEmpowerment() == 'Poison' && game.global.challengeActive == "Daily")
                        )
                    )
                )
            )
        )
    );

    var voidArrayDoneS = [];
    if (game.global.challengeActive != "Daily" && getPageSetting('onlystackedvoids') == true) {
        for (var mapz in game.global.mapsOwnedArray) {
            var theMapz = game.global.mapsOwnedArray[mapz];
            if (theMapz.location == 'Void' && theMapz.stacked > 0) {
                voidArrayDoneS.push(theMapz);
            }
        }
    }

    if (
        (game.global.totalVoidMaps <= 0) ||
        (!needToVoid) ||
        (getPageSetting('novmsc2') == true && game.global.runningChallengeSquared) ||
        (game.global.challengeActive != "Daily" && game.global.totalVoidMaps > 0 && getPageSetting('onlystackedvoids') == true && voidArrayDoneS.length < 1)
    ) {
        doVoids = false;
    }

    //Prestige
    if ((getPageSetting('ForcePresZ') >= 0) && ((game.global.world + extraMapLevels) >= getPageSetting('ForcePresZ'))) {
        const prestigeList = ['Supershield', 'Dagadder', 'Megamace', 'Polierarm', 'Axeidic', 'Greatersword', 'Harmbalest', 'Bootboost', 'Hellishmet', 'Pantastic', 'Smoldershoulder', 'Bestplate', 'GambesOP'];
        needPrestige = (offlineProgress.countMapItems(game.global.world) !== 0);
    } else
        needPrestige = prestige != "Off" && game.mapUnlocks[prestige] && game.mapUnlocks[prestige].last <= (game.global.world + extraMapLevels) - 5 && game.global.challengeActive != "Frugal";

    skippedPrestige = false;
    if (needPrestige && (getPageSetting('PrestigeSkip1_2') == 1 || getPageSetting('PrestigeSkip1_2') == 2)) {
        var prestigeList = ['Dagadder', 'Megamace', 'Polierarm', 'Axeidic', 'Greatersword', 'Harmbalest', 'Bootboost', 'Hellishmet', 'Pantastic', 'Smoldershoulder', 'Bestplate', 'GambesOP'];
        var numUnbought = 0;
        for (var i in prestigeList) {
            var p = prestigeList[i];
            if (game.upgrades[p].allowed - game.upgrades[p].done > 0)
                numUnbought++;
        }
        if (numUnbought >= customVars.SkipNumUnboughtPrestiges) {
            needPrestige = false;
            skippedPrestige = true;
        }
    }

    if ((needPrestige || skippedPrestige) && (getPageSetting('PrestigeSkip1_2') == 1 || getPageSetting('PrestigeSkip1_2') == 3)) {
        const prestigeList = ['Dagadder', 'Megamace', 'Polierarm', 'Axeidic', 'Greatersword', 'Harmbalest'];
        const numLeft = prestigeList.filter(prestige => game.mapUnlocks[prestige].last <= (game.global.world + extraMapLevels) - 5);
        const shouldSkip = numLeft <= customVars.UnearnedPrestigesRequired;
        if (shouldSkip != skippedPrestige) {
            needPrestige = !needPrestige;
            skippedPrestige = !skippedPrestige;
        }
    }

    //Calc
    var ourBaseDamage = calcOurDmg("avg", false, true);
    var enemyDamage = calcBadGuyDmg(null, getEnemyMaxAttack(game.global.world + 1, 50, 'Snimp', 1.0), true, true);
    var enemyHealth = calcEnemyHealth();

    if (getPageSetting('DisableFarm') > 0) {
        shouldFarm = (calcHDratio() >= getPageSetting('DisableFarm'));
        if (game.options.menu.repeatUntil.enabled == 1 && shouldFarm)
            toggleSetting('repeatUntil');
    }
    if (game.global.spireActive) {
        enemyDamage = calcSpire(99, game.global.gridArray[99].name, 'attack');
    }
    highDamageShield();
    if (getPageSetting('loomswap') > 0 && game.global.challengeActive != "Daily" && game.global.ShieldEquipped.name != getPageSetting('highdmg'))
        ourBaseDamage *= trimpAA;
    if (getPageSetting('dloomswap') > 0 && game.global.challengeActive == "Daily" && game.global.ShieldEquipped.name != getPageSetting('dhighdmg'))
        ourBaseDamage *= trimpAA;
    var mapbonusmulti = 1 + (0.20 * game.global.mapBonus);
    var ourBaseDamage2 = ourBaseDamage;
    ourBaseDamage2 /= mapbonusmulti;
    var pierceMod = (game.global.brokenPlanet) ? getPierceAmt() : 0;
    const FORMATION_MOD_1 = game.upgrades.Dominance.done ? 2 : 1;
    enoughHealth = (calcOurHealth() / FORMATION_MOD_1 > customVars.numHitsSurvived * (enemyDamage - calcOurBlock() / FORMATION_MOD_1 > 0 ? enemyDamage - calcOurBlock() / FORMATION_MOD_1 : enemyDamage * pierceMod));
    enoughDamage = (ourBaseDamage * mapenoughdamagecutoff > enemyHealth);
    updateAutoMapsStatus();

    //Farming
    var selectedMap = "world";
    var shouldFarmLowerZone = false;
    shouldDoMaps = false;
    if (ourBaseDamage > 0) {
        shouldDoMaps = (!enoughDamage || shouldFarm || scryerStuck);
    }
    var shouldDoHealthMaps = false;
    if (game.global.mapBonus >= getPageSetting('MaxMapBonuslimit') && !shouldFarm)
        shouldDoMaps = false;
    else if (game.global.mapBonus >= getPageSetting('MaxMapBonuslimit') && shouldFarm)
        shouldFarmLowerZone = getPageSetting('LowerFarmingZone');
    else if (game.global.mapBonus < getPageSetting('MaxMapBonushealth') && !enoughHealth && !shouldDoMaps && !needPrestige) {
        shouldDoMaps = true;
        shouldDoHealthMaps = true;
    }
    var restartVoidMap = false;
    if (game.global.challengeActive == 'Nom' && getPageSetting('FarmWhenNomStacks7')) {
        if (game.global.gridArray[99].nomStacks > customVars.NomFarmStacksCutoff[0]) {
            if (game.global.mapBonus != getPageSetting('MaxMapBonuslimit'))
                shouldDoMaps = true;
        }
        if (game.global.gridArray[99].nomStacks == customVars.NomFarmStacksCutoff[1]) {
            shouldFarm = (calcHDratio() > customVars.NomfarmingCutoff);
            shouldDoMaps = true;
        }
        if (!game.global.mapsActive && game.global.gridArray[game.global.lastClearedCell + 1].nomStacks >= customVars.NomFarmStacksCutoff[2]) {
            shouldFarm = (calcHDratio() > customVars.NomfarmingCutoff);
            shouldDoMaps = true;
        }
        if (game.global.mapsActive && game.global.mapGridArray[game.global.lastClearedMapCell + 1].nomStacks >= customVars.NomFarmStacksCutoff[2]) {
            shouldFarm = (calcHDratio() > customVars.NomfarmingCutoff);
            shouldDoMaps = true;
            restartVoidMap = true;
        }
    }

    //Prestige
    if (shouldFarm && !needPrestige) {
        var capped = areWeAttackLevelCapped();
        var prestigeitemsleft;
        if (game.global.mapsActive) {
            prestigeitemsleft = addSpecials(true, true, getCurrentMapObject());
        } else if (lastMapWeWereIn) {
            prestigeitemsleft = addSpecials(true, true, lastMapWeWereIn);
        }
        const prestigeList = ['Dagadder', 'Megamace', 'Polierarm', 'Axeidic', 'Greatersword', 'Harmbalest'];
        var numUnbought = 0;
        for (var i = 0, len = prestigeList.length; i < len; i++) {
            var p = prestigeList[i];
            if (game.upgrades[p].allowed - game.upgrades[p].done > 0)
                numUnbought++;
        }
        if (capped && prestigeitemsleft == 0 && numUnbought == 0) {
            shouldFarm = false;
            if (game.global.mapBonus >= getPageSetting('MaxMapBonuslimit') && !shouldFarm)
                shouldDoMaps = false;
        }
    }

    //Spire
    var shouldDoSpireMaps = false;
    preSpireFarming = (isActiveSpireAT() || disActiveSpireAT()) && (spireTime = (new Date().getTime() - game.global.zoneStarted) / 1000 / 60) < getPageSetting('MinutestoFarmBeforeSpire');
    spireMapBonusFarming = getPageSetting('MaxStacksForSpire') && (isActiveSpireAT() || disActiveSpireAT()) && game.global.mapBonus < 10;
    if (preSpireFarming || spireMapBonusFarming) {
        shouldDoMaps = true;
        shouldDoSpireMaps = true;
    }

    //Map Bonus
    var maxMapBonusZ = getPageSetting('MaxMapBonusAfterZone');
    doMaxMapBonus = (maxMapBonusZ >= 0 && game.global.mapBonus < getPageSetting("MaxMapBonuslimit") && game.global.world >= maxMapBonusZ);
    if (doMaxMapBonus)
        shouldDoMaps = true;

    //Maps
    vanillaMapatZone = (game.options.menu.mapAtZone.enabled && game.global.canMapAtZone && !isActiveSpireAT() && !disActiveSpireAT());
    if (vanillaMapatZone) {
        for (var x = 0; x < game.options.menu.mapAtZone.setZone.length; x++) {
            if (game.global.world == game.options.menu.mapAtZone.setZone[x].world)
                shouldDoMaps = true;
        }
    }

    let minZone = ((game.global.challengeActive == "Experience" && getPageSetting('farmWonders')) ? (getPageSetting('maxExpZone') - ((getPageSetting('wondersAmount') - 1) * 5)) : 0)

    if(minZone > game.global.world) {
        shouldDoMaps = false;
        needPrestige = false;
    }

    var siphlvl = shouldFarmLowerZone ? game.global.world - 10 : game.global.world - game.portal.Siphonology.level;
    var maxlvl = game.talents.mapLoot.purchased ? game.global.world - 1 : game.global.world;
    maxlvl += extraMapLevels;
    if (getPageSetting('DynamicSiphonology') || shouldFarmLowerZone) {
        for (siphlvl; siphlvl < maxlvl; siphlvl++) {
            var maphp = getEnemyMaxHealth(siphlvl) * 1.1;
            var cpthlth = getCorruptScale("health") / 2;
            if (mutations.Magma.active())
                maphp *= cpthlth;
            var mapdmg = ourBaseDamage2;
            if (game.upgrades.Dominance.done)
                mapdmg *= 4;
            if (mapdmg < maphp) {
                break;
            }
        }
    }
    var obj = {};
    var siphonMap = -1;
    for (var map in game.global.mapsOwnedArray) {
        if (!game.global.mapsOwnedArray[map].noRecycle) {
            obj[map] = game.global.mapsOwnedArray[map].level;
            if (game.global.mapsOwnedArray[map].level == siphlvl)
                siphonMap = map;
        }
    }
    var keysSorted = Object.keys(obj).sort(function(a, b) {
        return obj[b] - obj[a];
    });
    var highestMap;
    var lowestMap;
    if (keysSorted[0]) {
        highestMap = keysSorted[0];
        lowestMap = keysSorted[keysSorted.length - 1];
    } else
        selectedMap = "create";

    //Uniques
    var runUniques = (getPageSetting('AutoMaps') > 0);
    var AMUwall = (getPageSetting('AutoMaps') == 2 && getPageSetting('AMUwall') == true);
    var AMUblock = (getPageSetting('AutoMaps') == 2 && getPageSetting('AMUblock') == true);
    var AMUanger = (getPageSetting('AutoMaps') == 2 && getPageSetting('AMUanger') == true);
    var AMUtrimple = (getPageSetting('AutoMaps') == 2 && getPageSetting('AMUtrimple') == true);
    var AMUprison = (getPageSetting('AutoMaps') == 2 && getPageSetting('AMUprison') == true);
    var AMUbw = (getPageSetting('AutoMaps') == 2 && getPageSetting('AMUbw') == true);
    var AMUstar = (getPageSetting('AutoMaps') == 2 && getPageSetting('AMUstar') == true);
  
    if (runUniques) {
        for (var map in game.global.mapsOwnedArray) {
            var theMap = game.global.mapsOwnedArray[map];
            if (theMap.noRecycle) {
                if (theMap.name == 'The Wall' && game.upgrades.Bounty.allowed == 0 && !game.talents.bounty.purchased) {
                    var theMapDifficulty = Math.ceil(theMap.difficulty / 2);
                    if (game.global.world < 15 + theMapDifficulty) continue;
                    selectedMap = theMap.id;
                    break;
                }
                else if (theMap.name == 'The Wall' && AMUwall) {
                    var theMapDifficulty = Math.ceil(theMap.difficulty / 2);
                    if (game.global.world < 15 + theMapDifficulty) continue;
                    selectedMap = theMap.id;
                    break;
                }
                if (theMap.name == 'Dimension of Anger' && document.getElementById("portalBtn").style.display == "none" && !game.talents.portal.purchased) {
                    var theMapDifficulty = Math.ceil(theMap.difficulty / 2);
                    if (game.global.world < 20 + theMapDifficulty) continue;
                    selectedMap = theMap.id;
                    break;
                }
                else if (theMap.name == 'Dimension of Anger' && AMUanger) {
                    var theMapDifficulty = Math.ceil(theMap.difficulty / 2);
                    if (game.global.world < 20 + theMapDifficulty) continue;
                    selectedMap = theMap.id;
                    break;
                }
                var runningC2 = game.global.runningChallengeSquared;
                if (theMap.name == 'The Block' && !game.upgrades.Shieldblock.allowed && ((game.global.challengeActive == "Scientist" || game.global.challengeActive == "Trimp") && !runningC2 || getPageSetting('BuyShieldblock'))) {
                    var theMapDifficulty = Math.ceil(theMap.difficulty / 2);
                    if (game.global.world < 11 + theMapDifficulty) continue;
                    selectedMap = theMap.id;
                    break;
                }
                else if (theMap.name == 'The Block' && AMUblock) {
                    var theMapDifficulty = Math.ceil(theMap.difficulty / 2);
                    if (game.global.world < 11 + theMapDifficulty) continue;
                    selectedMap = theMap.id;
                    break;
                }
                var treasure = getPageSetting('TrimpleZ');
                if (theMap.name == 'Trimple Of Doom' && (!runningC2 && game.mapUnlocks.AncientTreasure.canRunOnce && game.global.world >= treasure)) {
                    var theMapDifficulty = Math.ceil(theMap.difficulty / 2);
                    if ((game.global.world < 33 + theMapDifficulty) || treasure > -33 && treasure < 33) continue;
                    selectedMap = theMap.id;
                    if (treasure < 0)
                        setPageSetting('TrimpleZ', 0);
                    break;
                }
                else if (theMap.name == 'Trimple Of Doom' && AMUtrimple) {
                    var theMapDifficulty = Math.ceil(theMap.difficulty / 2);
                    if (game.global.world < 33 + theMapDifficulty) continue;
                    selectedMap = theMap.id;
                    break;
                }
                if (!runningC2) {
                    if (theMap.name == 'The Prison' && (game.global.challengeActive == "Electricity" || game.global.challengeActive == "Mapocalypse")) {
                        var theMapDifficulty = Math.ceil(theMap.difficulty / 2);
                        if (game.global.world < 80 + theMapDifficulty) continue;
                        selectedMap = theMap.id;
                        break;
                    }
                    else if (theMap.name == 'The Prison' && AMUprison) {
                        var theMapDifficulty = Math.ceil(theMap.difficulty / 2);
                        if (game.global.world < 80 + theMapDifficulty) continue;
                        selectedMap = theMap.id;
                        break;
                    }
                    if (theMap.name == 'Bionic Wonderland' && game.global.challengeActive == "Crushed") {
                        var theMapDifficulty = Math.ceil(theMap.difficulty / 2);
                        if (game.global.world < 125 + theMapDifficulty) continue;
                        selectedMap = theMap.id;
                        break;
                    }
                    else if (theMap.name == 'Bionic Wonderland' && AMUbw) {
                        var theMapDifficulty = Math.ceil(theMap.difficulty / 2);
                        if (game.global.world < 125 + theMapDifficulty) continue;
                        selectedMap = theMap.id;
                        break;
                    }
                }
                if (theMap.name == 'Imploding Star' && AMUstar) {
                    var theMapDifficulty = Math.ceil(theMap.difficulty / 2);
                    if (game.global.world < 170 + theMapDifficulty) continue;
                    selectedMap = theMap.id;
                    break;
                }
            }
        }
    }

    //Voids
    if (getPageSetting('novmsc2') == true && game.global.runningChallengeSquared) {
        needToVoid = false;
    }
   
    if (needToVoid) {
        var voidArray = [];
        var prefixlist = {
            'Deadly': 10,
            'Heinous': 11,
            'Poisonous': 20,
            'Destructive': 30
        };
        var prefixkeys = Object.keys(prefixlist);
        var suffixlist = {
            'Descent': 7.077,
            'Void': 8.822,
            'Nightmare': 9.436,
            'Pit': 10.6
        };
        var suffixkeys = Object.keys(suffixlist);

        if (game.global.challengeActive != "Daily" && getPageSetting('onlystackedvoids') == true) {
            for (var map in game.global.mapsOwnedArray) {
                var theMap = game.global.mapsOwnedArray[map];
                if (theMap.location == 'Void' && theMap.stacked > 0) {
                    for (var pre in prefixkeys) {
                        if (theMap.name.includes(prefixkeys[pre]))
                            theMap.sortByDiff = 1 * prefixlist[prefixkeys[pre]];
                    }
                    for (var suf in suffixkeys) {
                        if (theMap.name.includes(suffixkeys[suf]))
                            theMap.sortByDiff += 1 * suffixlist[suffixkeys[suf]];
                    }
                    voidArray.push(theMap);
                }
            }
        } else {
            for (var map in game.global.mapsOwnedArray) {
                var theMap = game.global.mapsOwnedArray[map];
                if (theMap.location == 'Void') {
                    for (var pre in prefixkeys) {
                        if (theMap.name.includes(prefixkeys[pre]))
                            theMap.sortByDiff = 1 * prefixlist[prefixkeys[pre]];
                    }
                    for (var suf in suffixkeys) {
                        if (theMap.name.includes(suffixkeys[suf]))
                            theMap.sortByDiff += 1 * suffixlist[suffixkeys[suf]];
                    }
                    voidArray.push(theMap);
                }
            }
        }

        var voidArraySorted = voidArray.sort(function(a, b) {
            return a.sortByDiff - b.sortByDiff;
        });
        for (var map in voidArraySorted) {
            var theMap = voidArraySorted[map];
            doVoids = true;
            if (getPageSetting('novmsc2') == true && game.global.runningChallengeSquared) {
                doVoids = false;
            }
            var eAttack = getEnemyMaxAttack(game.global.world, theMap.size, 'Voidsnimp', theMap.difficulty);
            if (game.global.world >= 181 || (game.global.challengeActive == "Corrupted" && game.global.world >= 60))
                eAttack *= (getCorruptScale("attack") / 2).toFixed(1);
            if (game.global.challengeActive == 'Balance') {
                eAttack *= 2;
            }
            if (game.global.challengeActive == 'Toxicity') {
                eAttack *= 5;
            }
            if (getPageSetting('DisableFarm') <= 0)
                shouldFarm = shouldFarm || false;
            if (!restartVoidMap)
                selectedMap = theMap.id;
            if (game.global.mapsActive && getCurrentMapObject().location == "Void" && game.global.challengeActive == "Nom" && getPageSetting('FarmWhenNomStacks7')) {
                if (game.global.mapGridArray[theMap.size - 1].nomStacks >= customVars.NomFarmStacksCutoff[2]) {
                    mapsClicked(true);
                }
            }
            break;
        }
    }

    //Skip Spires
    if (!preSpireFarming && getPageSetting('SkipSpires') == 1 && ((game.global.challengeActive != 'Daily' && isActiveSpireAT()) || (game.global.challengeActive == 'Daily' && disActiveSpireAT()))) {
        enoughDamage = true;
        enoughHealth = true;
        shouldFarm = false;
        shouldDoMaps = false;
    }

    //Automaps
    if (shouldDoMaps || doVoids || needPrestige) {
        if (selectedMap == "world") {
            if (preSpireFarming) {
                var spiremaplvl = (game.talents.mapLoot.purchased && MODULES["maps"].SpireFarm199Maps) ? game.global.world - 1 : game.global.world;
                selectedMap = "create";
                for (i = 0; i < keysSorted.length; i++) {
                    if (game.global.mapsOwnedArray[keysSorted[i]].level >= spiremaplvl &&
                        game.global.mapsOwnedArray[keysSorted[i]].location == ((customVars.preferGardens && game.global.decayDone) ? 'Plentiful' : 'Mountain')) {
                        selectedMap = game.global.mapsOwnedArray[keysSorted[i]].id;
                        break;
                    }
                }
            } else if (needPrestige || (extraMapLevels > 0)) {
                if ((game.global.world + extraMapLevels) <= game.global.mapsOwnedArray[highestMap].level)
                    selectedMap = game.global.mapsOwnedArray[highestMap].id;
                else
                    selectedMap = "create";
            } else if (siphonMap != -1)
                selectedMap = game.global.mapsOwnedArray[siphonMap].id;
            else
                selectedMap = "create";
        }
    }
    if ((game.global.challengeActive == 'Lead' && !challSQ) && !doVoids && (game.global.world % 2 == 0 || game.global.lastClearedCell < customVars.shouldFarmCell)) {
        if (game.global.preMapsActive)
            mapsClicked();
        return;
    }

    if (!game.global.preMapsActive && game.global.mapsActive) {
        var doDefaultMapBonus = game.global.mapBonus < getPageSetting('MaxMapBonuslimit') - 1;
        if (selectedMap == game.global.currentMapId && (!getCurrentMapObject().noRecycle && (doDefaultMapBonus || vanillaMapatZone || doMaxMapBonus || shouldFarm || needPrestige || shouldDoSpireMaps))) {
            var targetPrestige = autoTrimpSettings.Prestige.selected;
            if (!game.global.repeatMap) {
                repeatClicked();
            }
            if (!shouldDoMaps && (game.global.mapGridArray[game.global.mapGridArray.length - 1].special == targetPrestige && game.mapUnlocks[targetPrestige].last >= (game.global.world + extraMapLevels - 9))) {
                repeatClicked();
            }
            if (shouldDoHealthMaps && game.global.mapBonus >= getPageSetting('MaxMapBonushealth') - 1) {
                repeatClicked();
                shouldDoHealthMaps = false;
            }
            if (doMaxMapBonus && game.global.mapBonus >= getPageSetting('MaxMapBonuslimit') - 1) {
                repeatClicked();
                doMaxMapBonus = false;
            }
        } else {
            if (game.global.repeatMap) {
                repeatClicked();
            }
            if (restartVoidMap) {
                mapsClicked(true);
            }
        }
    } else if (!game.global.preMapsActive && !game.global.mapsActive) {
        if (selectedMap != "world") {
            if (!game.global.switchToMaps) {
                mapsClicked();
            }
            if ((!getPageSetting('PowerSaving') || (getPageSetting('PowerSaving') == 2) && doVoids) && game.global.switchToMaps &&
                (needPrestige || doVoids ||
                    ((game.global.challengeActive == 'Lead' && !challSQ) && game.global.world % 2 == 1) ||
                    (!enoughDamage && enoughHealth && game.global.lastClearedCell < 9) ||
                    (shouldFarm && game.global.lastClearedCell >= customVars.shouldFarmCell) ||
                    (scryerStuck)) &&
                (
                    (game.resources.trimps.realMax() <= game.resources.trimps.owned + 1) ||
                    ((game.global.challengeActive == 'Lead' && !challSQ) && game.global.lastClearedCell > 93) ||
                    (doVoids && game.global.lastClearedCell > 70)
                )
            ) {
                if (scryerStuck) {
                    debug("Got perma-stuck on cell " + (game.global.lastClearedCell + 2) + " during scryer stance. Are your scryer settings correct? Entering map to farm to fix it.");
                }
                mapsClicked();
            }
        }
    } else if (game.global.preMapsActive) {
        var minFragmentsNeeded = Math.floor((((game.global.world / 150) * (Math.pow(1.14, game.global.world - 1))) * game.global.world * 2) * Math.pow((1.03 + (game.global.world / 50000)), game.global.world)) * 2;
        if (selectedMap == "world") {
            mapsClicked();
        } else if (selectedMap == "create") {
            var $mapLevelInput = document.getElementById("mapLevelInput");
            $mapLevelInput.value = needPrestige ? game.global.world : siphlvl;
            if (preSpireFarming && MODULES["maps"].SpireFarm199Maps)
                $mapLevelInput.value = game.talents.mapLoot.purchased ? game.global.world - 1 : game.global.world;
            var decrement;
            var tier;
            if (game.global.world >= customVars.MapTierZone[0]) {
                tier = customVars.MapTier0Sliders;
                decrement = [];
            } else if (game.global.world >= customVars.MapTierZone[1]) {
                tier = customVars.MapTier1Sliders;
                decrement = ['loot'];
            } else if (game.global.world >= customVars.MapTierZone[2]) {
                tier = customVars.MapTier2Sliders;
                decrement = ['loot'];
            } else {
                tier = customVars.MapTier3Sliders;
                decrement = ['diff', 'loot'];
            }
            sizeAdvMapsRange.value = tier[0];
            adjustMap('size', tier[0]);
            difficultyAdvMapsRange.value = tier[1];
            adjustMap('difficulty', tier[1]);
            lootAdvMapsRange.value = tier[2];
            adjustMap('loot', tier[2]);
            biomeAdvMapsSelect.value = autoTrimpSettings.mapselection.selected == "Gardens" ? "Plentiful" : autoTrimpSettings.mapselection.selected;
            updateMapCost();
            if (shouldFarm || game.global.challengeActive == 'Metal') {
                biomeAdvMapsSelect.value = game.global.decayDone ? "Plentiful" : "Mountain";
                updateMapCost();
            }
            if (updateMapCost(true) > game.resources.fragments.owned) {
                if (needPrestige && !enoughDamage) decrement.push('diff');
                if (shouldFarm) decrement.push('size');
            }
            while (decrement.indexOf('loot') > -1 && lootAdvMapsRange.value > 0 && updateMapCost(true) > game.resources.fragments.owned) {
                lootAdvMapsRange.value -= 1;
            }
            while (decrement.indexOf('diff') > -1 && difficultyAdvMapsRange.value > 0 && updateMapCost(true) > game.resources.fragments.owned) {
                difficultyAdvMapsRange.value -= 1;
            }
            while (decrement.indexOf('size') > -1 && sizeAdvMapsRange.value > 0 && updateMapCost(true) > game.resources.fragments.owned) {
                sizeAdvMapsRange.value -= 1;
            }
            while (lootAdvMapsRange.value > 0 && updateMapCost(true) > game.resources.fragments.owned) {
                lootAdvMapsRange.value -= 1;
            }
            while (difficultyAdvMapsRange.value > 0 && updateMapCost(true) > game.resources.fragments.owned) {
                difficultyAdvMapsRange.value -= 1;
            }
            while (sizeAdvMapsRange.value > 0 && updateMapCost(true) > game.resources.fragments.owned) {
                sizeAdvMapsRange.value -= 1;
            }
            if (getPageSetting('AdvMapSpecialModifier'))
                testMapSpecialModController();
            var maplvlpicked = parseInt($mapLevelInput.value) + (getPageSetting('AdvMapSpecialModifier') ? getExtraMapLevels() : 0);
            if (updateMapCost(true) > game.resources.fragments.owned) {
                if (game.jobs.Explorer.owned > 0 || game.unlocks.imps.Flutimp == true) {
                    selectMap(game.global.mapsOwnedArray[highestMap].id);
                    debug("Can't afford the map we designed, #" + maplvlpicked, "maps", '*crying2');
                    debug("...selected our highest map instead # " + game.global.mapsOwnedArray[highestMap].id + " Level: " + game.global.mapsOwnedArray[highestMap].level, "maps", '*happy2');
                    runMap();
                    lastMapWeWereIn = getCurrentMapObject();
                } else {
                    selectedMap == "world";
                }
            } else {
                debug("Buying a Map, level: #" + maplvlpicked, "maps", 'th-large');
                var result = buyMap();
                if (result == -2) {
                    debug("Too many maps, recycling now: ", "maps", 'th-large');
                    recycleBelow(true);
                    debug("Retrying, Buying a Map, level: #" + maplvlpicked, "maps", 'th-large');
                    result = buyMap();
                    if (result == -2) {
                        recycleMap(lowestMap);
                        result = buyMap();
                        if (result == -2)
                            debug("AutoMaps unable to recycle to buy map!");
                        else
                            debug("Retrying map buy after recycling lowest level map");
                    }
                }
            }
        } else {
            selectMap(selectedMap);
            var themapobj = game.global.mapsOwnedArray[getMapIndex(selectedMap)];
            var levelText = " Level: " + themapobj.level;
            var voidorLevelText = themapobj.location == "Void" ? " Void: " : levelText;
            debug("Running selected " + selectedMap + voidorLevelText + " Name: " + themapobj.name, "maps", 'th-large');
            runMap();
            lastMapWeWereIn = getCurrentMapObject();
        }
    }


    // Experience Challenge
    if (game.global.challengeActive == "Experience" && getPageSetting('farmWonders')) {
        var wondersFromZ = getPageSetting('maxExpZone');
        var wondersAmount = getPageSetting('wondersAmount');
        var wondersFloorZ = wondersFromZ - ((wondersAmount - 1) * 5);
        var finishOnBw = (() => {
            var pageSetting = getPageSetting('finishExpOnBw');
            pageSetting = pageSetting < 125 ? 125 : pageSetting;
            pageSetting = pageSetting != -1 ? (Math.floor((pageSetting - 125) / 15) * 15) + 125 : -1;
            return pageSetting;
        })();
        var bionics = game.global.mapsOwnedArray
            .filter((map) => map.location == "Bionic")
            .sort((a, b) => b.level - a.level)
        if (game.global.world >= game.challenges.Experience.nextWonder
            && wondersAmount > game.challenges.Experience.wonders
            && game.global.world >= wondersFloorZ) {
            farmingWonder = true;
            if (!game.global.mapsActive && game.global.mapsOwnedArray.filter(function (map) {
                return map.level >= game.global.world && map.location != 'Bionic';
            }).length >= 1) {
                var mapID = game.global.mapsOwnedArray.find(function (map) {
                    return map.level >= game.global.world && map.location != 'Bionic';
                }).id;
                selectedMap = mapID;
                selectMap(mapID);
                runMap();
            } else if (!game.global.mapsActive) {
                selectedMap = "create"
                maplvlpicked = game.global.world
                debug("Buying a Map, level: #" + maplvlpicked, "maps", 'th-large');
                mapsClicked(true)
                var result = buyMap();
                if (result == -2) {
                    debug("Too many maps, recycling now: ", "maps", 'th-large');
                    recycleBelow(true, game.challenges.Experience.nextWonder - 1);
                    debug("Retrying, Buying a Map, level: #" + maplvlpicked, "maps", 'th-large');
                    result = buyMap();
                    if (result == -2) {
                        recycleMap(lowestMap);
                        result = buyMap();
                        if (result == -2)
                            debug("AutoMaps unable to recycle to buy map!");
                        else
                            debug("Retrying map buy after recycling lowest level map");
                    }
                }
            }
        } else if (game.global.world > 600 && !game.global.mapsActive && game.global.world != 700
            && wondersFromZ != -1 && game.global.world >= wondersFromZ && finishOnBw != -1) {
            // Finish challenge with target BW. If for some reason we've raided past it, pick the lowest BW available.
            // If we somehow did not raid for it, pick the highest available which will climb if necessary to 605.
            // If at 700, clear the zone to complete instead.
            farmingWonder = true;
            var finishBw = bionics.find(map => map.level == finishOnBw);
            if (finishBw) {
                selectMap(finishBw.id);
            } else {
                if (bionics.every((map) => map.level > finishOnBw)) {
                    selectMap(bionics[bionics.length - 1].id);
                } else {
                    selectMap(bionics[0].id);
                }
            }
            runMap();
        } else if (game.global.world <= 600 && !game.global.mapsActive && wondersAmount <= game.challenges.Experience.wonders
            && wondersFromZ != -1 && game.global.world >= wondersFromZ && getPageSetting('finishExpOnBw') <= 600
            && game.global.world >= getPageSetting('finishExpOnBw')) {
            farmingWonder = false;
            abandonChallenge();
            selectedMap = "world";
        } else {
            farmingWonder = false;
            selectedMap = "world";
        }
    }

}

//Radon

MODULES.maps.RMapTierZone = [72, 47, 16];
MODULES.maps.RMapTier0Sliders = [9, 9, 9, "Mountain"];
MODULES.maps.RMapTier1Sliders = [9, 9, 9, "Depths"];
MODULES.maps.RMapTier2Sliders = [9, 9, 9, "Random"];
MODULES.maps.RMapTier3Sliders = [9, 9, 9, "Random"];
MODULES.maps.RshouldFarmCell = 59;
MODULES.maps.RSkipNumUnboughtPrestiges = 2;
MODULES.maps.RUnearnedPrestigesRequired = 2;

var RdoVoids = !1;
var RneedToVoid = !1;
var RneedPrestige = !1;
var RskippedPrestige = !1;
var RscryerStuck = !1;
var RshouldDoMaps = !1;
var RmapTimeEstimate = 0;
var RlastMapWeWereIn = null;
var RdoMaxMapBonus = !1;
var RvanillaMapatZone = !1;
var Rtimefarm = !1;
var Rdtimefarm = !1;
var RadditionalCritMulti = 2 < getPlayerCritChance() ? 25 : 5;
var Rshouldtimefarm = !1;
var Rdshouldtimefarm = !1;
var Rshouldtributefarm = !1;
var Rshoulddobogs = false;
var Rshouldcastle = false;
var Rshoulddopraid = false;
var Rdshoulddopraid = false;
var Rshoulddoquest = false;
var Rquestequalityscale = false;
var Rquestshieldzone = 0;
var RAMPpMap1 = undefined;
var RAMPpMap2 = undefined;
var RAMPpMap3 = undefined;
var RAMPpMap4 = undefined;
var RAMPpMap5 = undefined;
var RAMPfragmappy = undefined;
var RAMPrepMap1 = undefined;
var RAMPrepMap2 = undefined;
var RAMPrepMap3 = undefined;
var RAMPrepMap4 = undefined;
var RAMPrepMap5 = undefined;
var RAMPprefragmappy = undefined;
var RAMPmapbought1 = false;
var RAMPmapbought2 = false;
var RAMPmapbought3 = false;
var RAMPmapbought4 = false;
var RAMPmapbought5 = false;
var RAMPfragmappybought = false;
var RAMPdone = false;
var RAMPfragfarming = false;
var RdAMPpMap1 = undefined;
var RdAMPpMap2 = undefined;
var RdAMPpMap3 = undefined;
var RdAMPpMap4 = undefined;
var RdAMPpMap5 = undefined;
var RdAMPfragmappy = undefined;
var RdAMPrepMap1 = undefined;
var RdAMPrepMap2 = undefined;
var RdAMPrepMap3 = undefined;
var RdAMPrepMap4 = undefined;
var RdAMPrepMap5 = undefined;
var RdAMPprefragmappy = undefined;
var RdAMPmapbought1 = false;
var RdAMPmapbought2 = false;
var RdAMPmapbought3 = false;
var RdAMPmapbought4 = false;
var RdAMPmapbought5 = false;
var RdAMPfragmappybought = false;
var RdAMPdone = false;
var RdAMPfragfarming = false;
var Rshouldmayhem = 0;
var Rmayhemextraglobal = -1;
var Rshouldpanda = 0;
var Rpandaextraglobal = 1;
var Rinsanityfarm = !1;
var Rshouldinsanityfarm = !1;
var Rinsanityfragfarming = false;
var insanityfragmappy = undefined;
var insanityprefragmappy = undefined;
var insanityfragmappybought = false;
var Rstormfarm = !1;
var Rshouldstormfarm = !1;
var Requipfarm = !1;
var Rshouldequipfarm = !1;
var Requipminusglobal = -1;
var Rshipfarm = !1;
var Rshouldshipfarm = !1;
var Rshipfragfarming = false;
var shipfragmappy = undefined;
var shipprefragmappy = undefined;
var shipfragmappybought = false;
var Ralchfarm = !1;
var Rshouldalchfarm = !1;
var Rshouldhypofarm = !1;
var Ralchfragfarming = false;
var alchfragmappy = undefined;
var alchprefragmappy = undefined;
var alchfragmappybought = false;
var Rhypofarm = !1;
var Rshouldhypofarm = !1;
var Rhypofragfarming = false;
var hypofragmappy = undefined;
var hypoprefragmappy = undefined;
var hypofragmappybought = false;
var Rhyposhouldwood = true;
var contractVoid = false;

function RupdateAutoMapsStatus(get) {

    var status;

    //Fail Safes
    if (getPageSetting('RAutoMaps') == 0) status = 'Off';

    else if (Rshouldcastle && game.global.totalVoidMaps <= 0) status = 'Frozen Castle';
    else if (contractVoid) status = 'Contract';
    else if (Rshouldshipfarm) status = 'Ship Farming';
    else if (Rshouldequipfarm) status = 'Equip Farming to ' + equipfarmdynamicHD().toFixed(2) + " and " + estimateEquipsForZone()[2] + " Equality";
    else if (Rshouldstormfarm) status = 'Storm Farming to ' + stormdynamicHD().toFixed(2);
    else if (Rshouldinsanityfarm) status = 'Insanity Farming';
    else if (Rshouldalchfarm) status = 'Alchemy Farming';
    else if (Rshouldhypofarm) status = 'Hypo Farming';
    else if (Rshouldmayhem == 1) status = 'Mayhem Attack';
    else if (Rshouldmayhem == 2) status = 'Mayhem Health';
    else if (Rshouldpanda) status = 'Pandemonium';
    else if (Rshoulddopraid) status = 'Praiding';
    else if (Rdshoulddopraid) status = 'Daily Praiding';
    else if (Rshoulddoquest) status = 'Questing';
    else if (Rshouldtimefarm) status = 'Time Farming';
    else if (Rdshouldtimefarm) status = 'Daily Time Farming';
    else if (Rshouldtributefarm) status = 'Tribute Farming';
    else if (Rshoulddobogs) status = 'Black Bogs';
    else if (RdoMaxMapBonus) status = 'Max Map Bonus After Zone';
    else if (!game.global.mapsUnlocked) status = '&nbsp;';
    else if (RneedPrestige && !RdoVoids) status = 'Prestige';
    else if (RdoVoids) {
        var stackedMaps = Fluffy.isRewardActive('void') ? countStackedVoidMaps() : 0;
        status = 'Void Maps: ' + game.global.totalVoidMaps + ((stackedMaps) ? " (" + stackedMaps + " stacked)" : "") + ' remaining';
    } else if (RshouldFarm && !RdoVoids) status = 'Farming: ' + RcalcHDratio().toFixed(4) + 'x';
    else if (!RenoughHealth && !RenoughDamage) status = 'Want Health & Damage';
    else if (!RenoughDamage) status = 'Want ' + RcalcHDratio().toFixed(4) + 'x &nbspmore damage';
    else if (!RenoughHealth) status = 'Want more health';
    else if (RenoughHealth && RenoughDamage) status = 'Advancing';

    if (RskippedPrestige)
        status += '<br><b style="font-size:.8em;color:pink;margin-top:0.2vw">Prestige Skipped</b>';

    var getPercent = (game.stats.heliumHour.value() / (game.global.totalRadonEarned - (game.global.radonLeftover + game.resources.radon.owned))) * 100;
    var lifetime = (game.resources.radon.owned / (game.global.totalRadonEarned - game.resources.radon.owned)) * 100;
    var hiderStatus = 'Rn/hr: ' + getPercent.toFixed(3) + '%<br>&nbsp;&nbsp;&nbsp;Rn: ' + lifetime.toFixed(3) + '%';

    if (get) {
        return [status, getPercent, lifetime];
    } else {
        document.getElementById('autoMapStatus').innerHTML = status;
        document.getElementById('hiderStatus').innerHTML = hiderStatus;
    }
}



function RautoMap() {

    //Quest
    var Rquestfarming = false;
    Rshoulddoquest = false;
    Rquestfarming = (game.global.world > 5 && game.global.challengeActive == "Quest" && questcheck() > 0);

    if (Rquestfarming) {
        if (questcheck() == 3) Rshoulddoquest = 3;
        else if (questcheck() == 4 && RcalcHDratio() > 0.95 && (((new Date().getTime() - game.global.zoneStarted) / 1000 / 60) < 121)) Rshoulddoquest = 4;
        else if (questcheck() == 6) Rshoulddoquest = 6;
        else if (questcheck() == 7 && !canAffordBuilding('Smithy')) Rshoulddoquest = 7;
        else if (questcheck() == 10 || questcheck() == 20) Rshoulddoquest = 10;
        else if (questcheck() == 11 || questcheck() == 21) Rshoulddoquest = 11;
        else if (questcheck() == 12 || questcheck() == 22) Rshoulddoquest = 12;
        else if (questcheck() == 13 || questcheck() == 23) Rshoulddoquest = 13;
        else if (questcheck() == 14 || questcheck() == 24) Rshoulddoquest = 14;
    }

    //Failsafes
    if (!game.global.mapsUnlocked || RcalcOurDmg("avg", false, true) <= 0 || Rshoulddoquest == 6) {
        RenoughDamage = true;
        RenoughHealth = true;
        RshouldFarm = false;
        RupdateAutoMapsStatus();
        return;
    }

    //Vars
    var mapenoughdamagecutoff = getPageSetting("Rmapcuntoff");
    var customVars = MODULES["maps"];
    if (game.global.repeatMap == true && !game.global.mapsActive && !game.global.preMapsActive) repeatClicked();
    if ((game.options.menu.repeatUntil.enabled == 1 || game.options.menu.repeatUntil.enabled == 2 || game.options.menu.repeatUntil.enabled == 3) && !game.global.mapsActive && !game.global.preMapsActive) toggleSetting('repeatUntil');
    if (game.options.menu.exitTo.enabled != 0) toggleSetting('exitTo');
    if (game.options.menu.repeatVoids.enabled != 0) toggleSetting('repeatVoids');
    var extraMapLevels = 0;
    var hitsSurvived = 10;
    if (getPageSetting("Rhitssurvived") > 0) hitsSurvived = getPageSetting("Rhitssurvived");

    //Void Vars
    var voidMapLevelSetting = 0;
    var voidMapLevelSettingCell = ((getPageSetting('Rvoidscell') > 0) ? getPageSetting('Rvoidscell') : 70);
    var voidMapLevelPlus = 0;
    if (game.global.challengeActive != "Daily" && getPageSetting('RVoidMaps') > 0) {
        voidMapLevelSetting = getPageSetting('RVoidMaps');
    }
    if (game.global.challengeActive == "Daily" && getPageSetting('RDailyVoidMod') >= 1) {
        voidMapLevelSetting = getPageSetting('RDailyVoidMod');
    }
    if (getPageSetting('RRunNewVoidsUntilNew') != 0 && game.global.challengeActive != "Daily") {
        voidMapLevelPlus = getPageSetting('RRunNewVoidsUntilNew');
    }
    if (getPageSetting('RdRunNewVoidsUntilNew') != 0 && game.global.challengeActive == "Daily") {
        voidMapLevelPlus = getPageSetting('RdRunNewVoidsUntilNew');
    }

    RneedToVoid = (voidMapLevelSetting > 0 && game.global.totalVoidMaps > 0 && game.global.lastClearedCell + 1 >= voidMapLevelSettingCell &&
        (
            (game.global.world == voidMapLevelSetting) ||
            (voidMapLevelPlus < 0 && game.global.world >= voidMapLevelSetting) ||
            (voidMapLevelPlus > 0 && game.global.world >= voidMapLevelSetting && game.global.world <= (voidMapLevelSetting + voidMapLevelPlus))
        )
    );

    var voidArrayDoneS = [];
    if (game.global.challengeActive != "Daily" && getPageSetting('Ronlystackedvoids') == true) {
        for (var mapz in game.global.mapsOwnedArray) {
            var theMapz = game.global.mapsOwnedArray[mapz];
            if (theMapz.location == 'Void' && theMapz.stacked > 0) {
                voidArrayDoneS.push(theMapz);
            }
        }
    }

    if (
        (game.global.totalVoidMaps <= 0) ||
        (!RneedToVoid) ||
        (getPageSetting('Rnovmsc2') == true && game.global.runningChallengeSquared) ||
        (game.global.challengeActive != "Daily" && game.global.totalVoidMaps > 0 && getPageSetting('Ronlystackedvoids') == true && voidArrayDoneS.length < 1)
    ) {
        RdoVoids = false;
    }

    //Contract
    if (autoBattle.activeContract != '') {
        if (getPageSetting('RABsolve') == true && contractVoid) {
            RneedToVoid = true;
            RdoVoids = true;
        }
    }

    //Calc
    var ourBaseDamage = RcalcOurDmg("avg", false, true);
    var enemyDamage = RcalcBadGuyDmg(null, RgetEnemyMaxAttack(game.global.world, 50, 'Snimp', 1.0));
    var enemyHealth = RcalcEnemyHealth(game.global.world);

    if (getPageSetting('RDisableFarm') > 0) {
        RshouldFarm = (RcalcHDratio() >= getPageSetting('RDisableFarm'));
        if (game.options.menu.repeatUntil.enabled == 1 && RshouldFarm)
            toggleSetting('repeatUntil');
    }
    RenoughHealth = (RcalcOurHealth() > (hitsSurvived * enemyDamage));
    RenoughDamage = (RcalcHDratio() <= mapenoughdamagecutoff);
    RupdateAutoMapsStatus();

    //Quest Shield
    if (game.global.world < 6 && (Rquestshieldzone != 0 || Rquestequalityscale != false)) {
        Rquestshieldzone = 0;
        Rquestequalityscale = false;
    }
    if (Rquestfarming && questcheck() == 5 && ((game.global.soldierEnergyShieldMax / enemyDamage) < RcalcHDratio()) && game.portal.Equality.scalingActive && !game.global.mapsActive) {
        toggleEqualityScale();
        Rquestshieldzone = game.global.world;
        Rquestequalityscale = true;
    }
    if (game.global.world > 5 && game.global.challengeActive == "Quest" && Rquestshieldzone > 0 && !game.portal.Equality.scalingActive && game.global.world > Rquestshieldzone && Rquestequalityscale) {
        toggleEqualityScale();
        Rquestequalityscale = false;
    }

    //Farming
    var selectedMap = "world";
    RshouldDoMaps = false;
    Rshouldtimefarm = false;
    Rdshouldtimefarm = false;
    Rshouldtributefarm = false;
    Rshouldinsanityfarm = false;
    Rshouldalchfarm = false;
    Rshouldhypofarm = false;
    Rhyposhouldwood = true;
    Rshouldstormfarm = false;
    Rshouldequipfarm = false;
    Rshouldshipfarm = false;
    contractVoid = false;
    Rshouldmayhem = 0;
    Rshouldpanda = false;
    if (ourBaseDamage > 0) {
        RshouldDoMaps = (!RenoughDamage || RshouldFarm || RscryerStuck);
    }
    var shouldDoHealthMaps = false;
    if (game.global.mapBonus >= getPageSetting('RMaxMapBonuslimit') && !RshouldFarm)
        RshouldDoMaps = false;
    else if (game.global.mapBonus < getPageSetting('RMaxMapBonushealth') && !RenoughHealth && !RshouldDoMaps) {
        RshouldDoMaps = true;
        shouldDoHealthMaps = true;
    }
    var restartVoidMap = false;

    //Map Bonus
    var maxMapBonusZ = getPageSetting('RMaxMapBonusAfterZone');
    RdoMaxMapBonus = (maxMapBonusZ >= 0 && game.global.mapBonus < getPageSetting("RMaxMapBonuslimit") && game.global.world >= maxMapBonusZ);
    if (RdoMaxMapBonus) {
        RshouldDoMaps = true;
    }

    //Maps
    RvanillaMapatZone = (game.options.menu.mapAtZone.enabled && game.global.canMapAtZone);
    if (RvanillaMapatZone) {
        for (var x = 0; x < game.options.menu.mapAtZone.setZoneU2.length; x++) {
            if (game.global.world == game.options.menu.mapAtZone.setZoneU2[x].world)
                RshouldDoMaps = true;
        }
    }

    //Time Farm
    if (getPageSetting('Rtimefarm') || (game.global.challengeActive == 'Daily' && getPageSetting('Rdtimefarm') == 2)) {
        var timefarmzone = getPageSetting('Rtimefarmzone');
        if (timefarmzone.includes(game.global.world)) {
            var timefarmzone;
            var timefarmtime;
            var timefarmindex = timefarmzone.indexOf(game.global.world);
            var timefarmcell = getPageSetting('Rtimefarmcell')[timefarmindex];
            var time = ((new Date().getTime() - game.global.zoneStarted) / 1000 / 60);

            timefarmzone = getPageSetting('Rtimefarmzone');
            timefarmtime = getPageSetting('Rtimefarmtime');

            var timefarmindex = timefarmzone.indexOf(game.global.world);
            var timezones = timefarmtime[timefarmindex];

            if (game.global.lastClearedCell + 2 >= timefarmcell && timezones > time && timezones > 0) {
                Rshouldtimefarm = true;
            }
        }
    }

    //dTime Farm
    if (game.global.challengeActive == 'Daily' && getPageSetting('Rdtimefarm') == 1) {
        var dtimefarmzone = getPageSetting('Rdtimefarmzone');
        if (dtimefarmzone.includes(game.global.world)) {
            var dtimefarmzone;
            var dtimefarmtime;
            var dtimefarmindex = dtimefarmzone.indexOf(game.global.world);
            var dtimefarmcell = getPageSetting('Rdtimefarmcell')[dtimefarmindex];
            var dtime = ((new Date().getTime() - game.global.zoneStarted) / 1000 / 60);

            dtimefarmzone = getPageSetting('Rdtimefarmzone');
            dtimefarmtime = getPageSetting('Rdtimefarmtime');

            var dtimefarmindex = dtimefarmzone.indexOf(game.global.world);
            var dtimezones = dtimefarmtime[dtimefarmindex];

            if (game.global.lastClearedCell + 2 >= dtimefarmcell && dtimezones > dtime && dtimezones > 0) {
                Rdshouldtimefarm = true;
            }
        }
    }

    //Tribute Farm
    if (getPageSetting('Rtributefarm')) {
        var tributefarmzone = getPageSetting('Rtributefarmzone');
        if (tributefarmzone.includes(game.global.world)) {
            var tributefarmzone;
            var tributefarmtribute;
            var tributefarmindex = tributefarmzone.indexOf(game.global.world);
            var tributefarmcell = getPageSetting('Rtributefarmcell')[tributefarmindex];
            var tributes = game.buildings.Tribute.owned;

            tributefarmzone = getPageSetting('Rtributefarmzone');
            tributefarmtribute = getPageSetting('Rtributefarmamount');

            var tributefarmindex = tributefarmzone.indexOf(game.global.world);
            var tributezones = tributefarmtribute[tributefarmindex];

            if (game.global.lastClearedCell + 2 >= tributefarmcell && tributezones > tributes && tributezones > 0) {
                Rshouldtributefarm = true;
            }
        }
    }

    //Bogs
    if (game.global.challengeActive == "Quagmire") {
        var Rdobogs = false;
        Rshoulddobogs = false;
        Rdobogs = (game.global.world > 5 && (game.global.challengeActive == "Quagmire" && getPageSetting('Rblackbog') == true && getPageSetting('Rblackbogzone')[0] > 0 && getPageSetting('Rblackbogamount')[0] > 0));
        if (Rdobogs) {
            var bogzone = getPageSetting('Rblackbogzone');
            var bogamount = getPageSetting('Rblackbogamount');
            var bogindex = bogzone.indexOf(game.global.world);
            var stacks = 100;
            var stacksum = 0;

            for (var i = 0; i < (bogindex + 1); i++) {
                stacksum += parseInt(bogamount[i]);
            }

            var totalstacks = stacks - stacksum;

            if (bogzone.includes(game.global.world) && game.challenges.Quagmire.motivatedStacks > totalstacks) {
                Rshoulddobogs = true;
            }
        }
    }

    //Praid
    var Rdopraid = false;
    Rshoulddopraid = false;
    Rdopraid = (game.global.world > 5 && ((getPageSetting('RAMPraid') == true || (game.global.challengeActive == "Daily" && getPageSetting('RdAMPraid') == 2)) && getPageSetting('RAMPraidzone')[0] > 0 && getPageSetting('RAMPraidraid')[0] > 0));
    if (Rdopraid) {
        var praidzone = getPageSetting('RAMPraidzone');
        var raidzone = getPageSetting('RAMPraidraid');

        var praidindex = praidzone.indexOf(game.global.world);
        var raidzones = raidzone[praidindex];

        var cell;
        cell = ((getPageSetting('RAMPraidcell') != 0) ? getPageSetting('RAMPraidcell')[praidindex] : 1);

        if (praidzone.includes(game.global.world) && ((cell <= 1) || (cell > 1 && (game.global.lastClearedCell + 1) >= cell)) && Rgetequips(raidzones, false) > 0) {
            Rshoulddopraid = true;
        }
    }
    if (!Rshoulddopraid && (RAMPrepMap1 != undefined || RAMPrepMap2 != undefined || RAMPrepMap3 != undefined || RAMPrepMap4 != undefined || RAMPrepMap5 != undefined)) {

        RAMPpMap1 = undefined;
        RAMPpMap2 = undefined;
        RAMPpMap3 = undefined;
        RAMPpMap4 = undefined;
        RAMPpMap5 = undefined;
        RAMPfragmappy = undefined;
        RAMPprefragmappy = undefined;
        RAMPmapbought1 = false;
        RAMPmapbought2 = false;
        RAMPmapbought3 = false;
        RAMPmapbought4 = false;
        RAMPmapbought5 = false;
        RAMPfragmappybought = false;

        if (RAMPrepMap1 != undefined) {
            if (getPageSetting('RAMPraidrecycle') == true) {
                recycleMap(getMapIndex(RAMPrepMap1));
            }
            RAMPrepMap1 = undefined;
        }
        if (RAMPrepMap2 != undefined) {
            if (getPageSetting('RAMPraidrecycle') == true) {
                recycleMap(getMapIndex(RAMPrepMap2));
            }
            RAMPrepMap2 = undefined;
        }
        if (RAMPrepMap3 != undefined) {
            if (getPageSetting('RAMPraidrecycle') == true) {
                recycleMap(getMapIndex(RAMPrepMap3));
            }
            RAMPrepMap3 = undefined;
        }
        if (RAMPrepMap4 != undefined) {
            if (getPageSetting('RAMPraidrecycle') == true) {
                recycleMap(getMapIndex(RAMPrepMap4));
            }
            RAMPrepMap4 = undefined;
        }
        if (RAMPrepMap5 != undefined) {
            if (getPageSetting('RAMPraidrecycle') == true) {
                recycleMap(getMapIndex(RAMPrepMap5));
            }
            RAMPrepMap5 = undefined;
        }
    }

    //dPraid
    var Rddopraid = false;
    Rdshoulddopraid = false;
    Rddopraid = (game.global.challengeActive == "Daily" && game.global.world > 5 && (getPageSetting('RdAMPraid') == 1 && getPageSetting('RdAMPraidzone')[0] > 0 && getPageSetting('RdAMPraidraid')[0] > 0));
    if (Rddopraid) {
        var dpraidzone = getPageSetting('RdAMPraidzone');
        var draidzone = getPageSetting('RdAMPraidraid');

        var dpraidindex = dpraidzone.indexOf(game.global.world);
        var draidzones = draidzone[dpraidindex];

        var cell;
        cell = ((getPageSetting('RdAMPraidcell') != 0) ? getPageSetting('RdAMPraidcell')[dpraidindex] : 1);

        if (dpraidzone.includes(game.global.world) && ((cell <= 1) || (cell > 1 && (game.global.lastClearedCell + 1) >= cell)) && Rgetequips(draidzones, false) > 0) {
            Rdshoulddopraid = true;
        }
    }
    if (!Rdshoulddopraid && (RdAMPrepMap1 != undefined || RdAMPrepMap2 != undefined || RdAMPrepMap3 != undefined || RdAMPrepMap4 != undefined || RdAMPrepMap5 != undefined)) {

        RdAMPpMap1 = undefined;
        RdAMPpMap2 = undefined;
        RdAMPpMap3 = undefined;
        RdAMPpMap4 = undefined;
        RdAMPpMap5 = undefined;
        RdAMPfragmappy = undefined;
        RdAMPprefragmappy = undefined;
        RdAMPmapbought1 = false;
        RdAMPmapbought2 = false;
        RdAMPmapbought3 = false;
        RdAMPmapbought4 = false;
        RdAMPmapbought5 = false;
        RdAMPfragmappybought = false;

        if (RdAMPrepMap1 != undefined) {
            if (getPageSetting('RdAMPraidrecycle') == true) {
                recycleMap(getMapIndex(RdAMPrepMap1));
            }
            RdAMPrepMap1 = undefined;
        }
        if (RdAMPrepMap2 != undefined) {
            if (getPageSetting('RdAMPraidrecycle') == true) {
                recycleMap(getMapIndex(RdAMPrepMap2));
            }
            RdAMPrepMap2 = undefined;
        }
        if (RdAMPrepMap3 != undefined) {
            if (getPageSetting('RdAMPraidrecycle') == true) {
                recycleMap(getMapIndex(RdAMPrepMap3));
            }
            RdAMPrepMap3 = undefined;
        }
        if (RdAMPrepMap4 != undefined) {
            if (getPageSetting('RdAMPraidrecycle') == true) {
                recycleMap(getMapIndex(RdAMPrepMap4));
            }
            RdAMPrepMap4 = undefined;
        }
        if (RdAMPrepMap5 != undefined) {
            if (getPageSetting('RdAMPraidrecycle') == true) {
                recycleMap(getMapIndex(RdAMPrepMap5));
            }
            RdAMPrepMap5 = undefined;
        }
    }

    //Mayhem
    if (game.global.challengeActive == "Mayhem") {
        var Rdomayhem = false;
        Rshouldmayhem = 0;
        Rdomayhem = (game.global.world > 5 && game.global.challengeActive == "Mayhem" && getPageSetting('Rmayhemon') == true && (getPageSetting('Rmayhemhealth') == true || getPageSetting('Rmayhemattack') == true));
        if (Rdomayhem) {
            var hits = (getPageSetting('Rmayhemacut') > 0) ? getPageSetting('Rmayhemabcut') : 100;
            var hitssurv = (getPageSetting('Rmayhemhcut') > 0) ? getPageSetting('Rmayhemhcut') : 1;
            if (game.challenges.Mayhem.stacks > 0 && getPageSetting('Rmayhemattack') == true && (RcalcHDratio() > hits)) {
                Rshouldmayhem = 1;
            }
            if (game.challenges.Mayhem.stacks > 0 && getPageSetting('Rmayhemhealth') == true && (RcalcOurHealth() < (hitssurv * enemyDamage))) {
                Rshouldmayhem = 2;
            }
        }

        var mayhemextra = 0;
        if (Rshouldmayhem > 0 && getPageSetting('Rmayhemmap') == 2) {
            mayhemextra = 0;
            var hitsmap = (getPageSetting('Rmayhemamcut') > 0) ? getPageSetting('Rmayhemamcut') : 100;
            var hitssurv = (getPageSetting('Rmayhemhcut') > 0) ? getPageSetting('Rmayhemhcut') : 1;
            var mlevels = 6;
            var go = false;
            if (
                (((RcalcEnemyHealth(game.global.world + mlevels) / game.challenges.Mayhem.getBossMult())) <= (RcalcOurDmg("avg", false, true) * (hitsmap * (mlevels + 1)))) &&
                ((((RcalcBadGuyDmg(null, RgetEnemyMaxAttack((game.global.world + mlevels), 20, 'Snimp', 1.0))) / game.challenges.Mayhem.getBossMult() * 1.3) * (hitssurv)) <= (RcalcOurHealth() * 2))
            ) {
                mayhemextra = mlevels;
                go = true;
            }
            if (!go) {
                mlevels = 5;
                if (
                    (((RcalcEnemyHealth(game.global.world + mlevels) / game.challenges.Mayhem.getBossMult())) <= (RcalcOurDmg("avg", false, true) * (hitsmap * (mlevels + 1)))) &&
                    ((((RcalcBadGuyDmg(null, RgetEnemyMaxAttack((game.global.world + mlevels), 20, 'Snimp', 1.0))) / game.challenges.Mayhem.getBossMult() * 1.3) * (hitssurv)) <= (RcalcOurHealth() * 2))
                ) {
                    mayhemextra = mlevels;
                    go = true;
                }
            }
            if (!go) {
                mlevels = 4;
                if (
                    (((RcalcEnemyHealth(game.global.world + mlevels) / game.challenges.Mayhem.getBossMult())) <= (RcalcOurDmg("avg", false, true) * (hitsmap * (mlevels + 1)))) &&
                    ((((RcalcBadGuyDmg(null, RgetEnemyMaxAttack((game.global.world + mlevels), 20, 'Snimp', 1.0))) / game.challenges.Mayhem.getBossMult() * 1.3) * (hitssurv)) <= (RcalcOurHealth() * 2))
                ) {
                    mayhemextra = mlevels;
                    go = true;
                }
            }
            if (!go) {
                mlevels = 3;
                if (
                    (((RcalcEnemyHealth(game.global.world + mlevels) / game.challenges.Mayhem.getBossMult())) <= (RcalcOurDmg("avg", false, true) * (hitsmap * (mlevels + 1)))) &&
                    ((((RcalcBadGuyDmg(null, RgetEnemyMaxAttack((game.global.world + mlevels), 20, 'Snimp', 1.0))) / game.challenges.Mayhem.getBossMult() * 1.3) * (hitssurv)) <= (RcalcOurHealth() * 2))
                ) {
                    mayhemextra = mlevels;
                    go = true;
                }
            }
            if (!go) {
                mlevels = 2;
                if (
                    (((RcalcEnemyHealth(game.global.world + mlevels) / game.challenges.Mayhem.getBossMult())) <= (RcalcOurDmg("avg", false, true) * (hitsmap * (mlevels + 1)))) &&
                    ((((RcalcBadGuyDmg(null, RgetEnemyMaxAttack((game.global.world + mlevels), 20, 'Snimp', 1.0))) / game.challenges.Mayhem.getBossMult() * 1.3) * (hitssurv)) <= (RcalcOurHealth() * 2))
                ) {
                    mayhemextra = mlevels;
                    go = true;
                }
            }
            if (!go) {
                mlevels = 1;
                if (
                    (((RcalcEnemyHealth(game.global.world + mlevels) / game.challenges.Mayhem.getBossMult())) <= (RcalcOurDmg("avg", false, true) * (hitsmap * (mlevels + 1)))) &&
                    ((((RcalcBadGuyDmg(null, RgetEnemyMaxAttack((game.global.world + mlevels), 20, 'Snimp', 1.0))) / game.challenges.Mayhem.getBossMult() * 1.3) * (hitssurv)) <= (RcalcOurHealth() * 2))
                ) {
                    mayhemextra = mlevels;
                    go = true;
                }
            }
            if (!go) {
                mayhemextra = 0;
                go = true;
            }
        }
    }

    //Panda
    if (game.global.challengeActive == "Pandemonium") {
        var Rdopanda = false;
        Rshouldpanda = 0;
        Rdopanda = (game.global.world >= getPageSetting('Rpandazone') && game.global.challengeActive == "Pandemonium" && getPageSetting('Rpandaon') == true);
        if (Rdopanda) {
            if (game.challenges.Pandemonium.pandemonium > 0 && getPageSetting('Rpandamaps') == true) {
                Rshouldpanda = true;
            }
        }

        var pandaextra = 1;
        if (Rshouldpanda == true && getPageSetting('Rpandamaps') == true) {
            pandaextra = 1;
            var hitsmap = (getPageSetting('Rpandahits') > 0) ? getPageSetting('Rpandahits') : 10;
            var hitssurv = 1;
            var mlevels = 6;
            var go = false;
            if (
                (((RcalcEnemyHealth(game.global.world + mlevels) / game.challenges.Pandemonium.getBossMult()) * game.challenges.Pandemonium.getEnemyMult() * game.challenges.Pandemonium.getPandMult()) <= (RcalcOurDmg("avg", false, true) * (hitsmap * (mlevels + 1)))) &&
                ((((((RcalcBadGuyDmg(null, RgetEnemyMaxAttack((game.global.world + mlevels), 20, 'Snimp', 1.0))) / game.challenges.Pandemonium.getBossMult()) * game.challenges.Pandemonium.getEnemyMult() * game.challenges.Pandemonium.getPandMult()) * 1.3) * (hitssurv)) <= (RcalcOurHealth() * 2))
            ) {
                pandaextra = mlevels;
                go = true;
            }
            if (!go) {
                mlevels = 5;
                if (
                    (((RcalcEnemyHealth(game.global.world + mlevels) / game.challenges.Pandemonium.getBossMult()) * game.challenges.Pandemonium.getEnemyMult() * game.challenges.Pandemonium.getPandMult()) <= (RcalcOurDmg("avg", false, true) * (hitsmap * (mlevels + 1)))) &&
                    ((((((RcalcBadGuyDmg(null, RgetEnemyMaxAttack((game.global.world + mlevels), 20, 'Snimp', 1.0))) / game.challenges.Pandemonium.getBossMult()) * game.challenges.Pandemonium.getEnemyMult() * game.challenges.Pandemonium.getPandMult()) * 1.3) * (hitssurv)) <= (RcalcOurHealth() * 2))
                ) {
                    pandaextra = mlevels;
                    go = true;
                }
            }
            if (!go) {
                mlevels = 4;
                if (
                    (((RcalcEnemyHealth(game.global.world + mlevels) / game.challenges.Pandemonium.getBossMult()) * game.challenges.Pandemonium.getEnemyMult() * game.challenges.Pandemonium.getPandMult()) <= (RcalcOurDmg("avg", false, true) * (hitsmap * (mlevels + 1)))) &&
                    ((((((RcalcBadGuyDmg(null, RgetEnemyMaxAttack((game.global.world + mlevels), 20, 'Snimp', 1.0))) / game.challenges.Pandemonium.getBossMult()) * game.challenges.Pandemonium.getEnemyMult() * game.challenges.Pandemonium.getPandMult()) * 1.3) * (hitssurv)) <= (RcalcOurHealth() * 2))
                ) {
                    pandaextra = mlevels;
                    go = true;
                }
            }
            if (!go) {
                mlevels = 3;
                if (
                    (((RcalcEnemyHealth(game.global.world + mlevels) / game.challenges.Pandemonium.getBossMult()) * game.challenges.Pandemonium.getEnemyMult() * game.challenges.Pandemonium.getPandMult()) <= (RcalcOurDmg("avg", false, true) * (hitsmap * (mlevels + 1)))) &&
                    ((((((RcalcBadGuyDmg(null, RgetEnemyMaxAttack((game.global.world + mlevels), 20, 'Snimp', 1.0))) / game.challenges.Pandemonium.getBossMult()) * game.challenges.Pandemonium.getEnemyMult() * game.challenges.Pandemonium.getPandMult()) * 1.3) * (hitssurv)) <= (RcalcOurHealth() * 2))
                ) {
                    pandaextra = mlevels;
                    go = true;
                }
            }
            if (!go) {
                mlevels = 2;
                if (
                    (((RcalcEnemyHealth(game.global.world + mlevels) / game.challenges.Pandemonium.getBossMult()) * game.challenges.Pandemonium.getEnemyMult() * game.challenges.Pandemonium.getPandMult()) <= (RcalcOurDmg("avg", false, true) * (hitsmap * (mlevels + 1)))) &&
                    ((((((RcalcBadGuyDmg(null, RgetEnemyMaxAttack((game.global.world + mlevels), 20, 'Snimp', 1.0))) / game.challenges.Pandemonium.getBossMult()) * game.challenges.Pandemonium.getEnemyMult() * game.challenges.Pandemonium.getPandMult()) * 1.3) * (hitssurv)) <= (RcalcOurHealth() * 2))
                ) {
                    pandaextra = mlevels;
                    go = true;
                }
            }
            if (!go) {
                mlevels = 1;
                pandaextra = mlevels;
                go = true;
            }
        }
    }

    //Insanity Farm
    if (game.global.challengeActive == "Insanity") {
        var insanityfarmcell;
        var insanityfarmzone = getPageSetting('Rinsanityfarmzone');
        var insanitystacksfarmindex = insanityfarmzone.indexOf(game.global.world);
        insanityfarmcell = ((getPageSetting('Rinsanityfarmcell') != 0) ? getPageSetting('Rinsanityfarmcell')[insanitystacksfarmindex] : 1);
        Rinsanityfarm = (getPageSetting('Rinsanityon') == true && ((insanityfarmcell <= 1) || (insanityfarmcell > 1 && (game.global.lastClearedCell + 1) >= insanityfarmcell)) && game.global.world > 5 && (game.global.challengeActive == "Insanity" && getPageSetting('Rinsanityfarmzone')[0] > 0 && getPageSetting('Rinsanityfarmstack')[0] > 0));
        if (Rinsanityfarm) {
            var insanityfarmstacks;
            var insanitystacks = game.challenges.Insanity.insanity;
            var maxinsanity = game.challenges.Insanity.maxInsanity;

            insanityfarmzone = getPageSetting('Rinsanityfarmzone');
            insanityfarmstacks = getPageSetting('Rinsanityfarmstack');

            var insanitystacksfarmindex = insanityfarmzone.indexOf(game.global.world);
            var insanitystackszones = insanityfarmstacks[insanitystacksfarmindex];
            if (insanitystackszones > maxinsanity) {
                insanitystackszones = maxinsanity;
            }

            if (insanityfarmzone.includes(game.global.world) && insanitystackszones != insanitystacks) {
                Rshouldinsanityfarm = true;
            }
        }

        if (!Rshouldinsanityfarm) {
            insanityfragmappy = undefined;
            insanityprefragmappy = undefined;
            insanityfragmappybought = false;
        }
    }

    //Storm
    if (game.global.challengeActive == "Storm") {
        Rstormfarm = (getPageSetting('Rstormon') == true && game.global.world > 5 && (game.global.challengeActive == "Storm" && getPageSetting('Rstormzone') > 0 && getPageSetting('RstormHD') > 0 && getPageSetting('Rstormmult') > 0));
        if (Rstormfarm) {
            var stormzone = getPageSetting('Rstormzone');
            var stormHD = getPageSetting('RstormHD');
            var stormmult = getPageSetting('Rstormmult');
            var stormHDzone = (game.global.world - stormzone);
            var stormHDmult = (stormHDzone == 0) ? stormHD : Math.pow(stormmult, stormHDzone) * stormHD;

            if (game.global.world >= stormzone && RcalcHDratio() > stormHDmult) {
                Rshouldstormfarm = true;
            }
        }
    }

    //Ship Farm
    if (game.jobs.Worshipper.locked == 0) {
        var shipfarmcell;
        shipfarmcell = ((getPageSetting('Rshipfarmcell') > 0) ? getPageSetting('Rshipfarmcell') : 1);
        Rshipfarm = (game.jobs.Worshipper.locked == 0 && getPageSetting('Rshipfarmon') == true && ((shipfarmcell <= 1) || (shipfarmcell > 1 && (game.global.lastClearedCell + 1) >= shipfarmcell)) && game.global.world > 5 && (getPageSetting('Rshipfarmzone')[0] > 0 && getPageSetting('Rshipfarmamount')[0] > 0));
        if (Rshipfarm) {
            var shipfarmzone;
            var shipfarmamount;
            var ships = game.jobs.Worshipper.owned

            shipfarmzone = getPageSetting('Rshipfarmzone');
            shipfarmamount = getPageSetting('Rshipfarmamount');

            var shipamountfarmindex = shipfarmzone.indexOf(game.global.world);
            var shipamountzones = shipfarmamount[shipamountfarmindex];

            if (getPageSetting('Rshipfarmamount') == 50) shipamountzones = 50;

            if (shipfarmzone.includes(game.global.world) && shipamountzones > ships) {
                Rshouldshipfarm = true;
            }
        }

        if (!Rshouldshipfarm) {
            shipfragmappy = undefined;
            shipprefragmappy = undefined;
            shipfragmappybought = false;
        }
    }
    //Alch Farm
    if (game.global.challengeActive == "Alchemy") {
        var alchfarmcell;
        var alchfarmzone = getPageSetting('Ralchfarmzone');
        var alchstacksfarmindex = alchfarmzone.indexOf(game.global.world);
        alchfarmcell = ((getPageSetting('Ralchfarmcell') != 0) ? getPageSetting('Ralchfarmcell')[alchstacksfarmindex] : 1);
        Ralchfarm = (getPageSetting('Ralchon') == true && ((alchfarmcell <= 1) || (alchfarmcell > 1 && (game.global.lastClearedCell + 1) >= alchfarmcell)) && game.global.world > 5 && (game.global.challengeActive == "Alchemy" && getPageSetting('Ralchfarmzone')[0] > 0 && getPageSetting('Ralchfarmstack').length > 0));
        if (Ralchfarm) {
            var alchfarmzone = getPageSetting('Ralchfarmzone');
            var alchfarmstacks = getPageSetting('Ralchfarmstack');

            var alchstacksfarmindex = alchfarmzone.indexOf(game.global.world);
            var alchstackszones = alchfarmstacks[alchstacksfarmindex];
            if (alchstackszones != undefined) {
                var potion;
                var potionletter = alchstackszones[0];
                if (potionletter == 'h') {
                    potion = alchObj.getPotionCount('Herby Brew');
                    potionletter = "Herby Brew";
                } else if (potionletter == 'f') {
                    potion = alchObj.getPotionCount('Potion of Finding');
                    potionletter = "Potion of Finding";
                } else if (potionletter == 'g') {
                    potion = alchObj.getPotionCount('Gaseous Brew');
                    potionletter = "Gaseous Brew";
                } else if (potionletter == 'v') {
                    potion = alchObj.getPotionCount('Potion of the Void');
                    potionletter = "Potion of the Void";
                } else if (potionletter == 's') {
                    potion = alchObj.getPotionCount('Potion of Strength');
                    potionletter = "Potion of Strength";
                }

                if (alchstackszones.substring(1) > potion) {
                    alchObj.craftPotion(potionletter);
                }

                if (alchfarmzone.includes(game.global.world) && alchstackszones.substring(1) > potion) {
                    Rshouldalchfarm = true;
                }
            }
        }

        if (!Rshouldalchfarm) {
            alchfragmappy = undefined;
            alchprefragmappy = undefined;
            alchfragmappybought = false;
        }
    }

    //Hypo Farm
    Rshouldcastle = false;
    if (game.global.challengeActive == "Hypothermia") {
        if (game.global.world >= getPageSetting('Rhypocastle')) {
            Rshouldcastle = true;
        }
        var hypofarmcell;
        var hypofarmzone = getPageSetting('Rhypofarmzone');
        var hypoamountfarmindex = hypofarmzone.indexOf(game.global.world);
        hypofarmcell = ((getPageSetting('Rhypofarmcell') != 0) ? getPageSetting('Rhypofarmcell')[hypoamountfarmindex] : 1);
        Rhypofarm = (getPageSetting('Rhypoon') == true && ((hypofarmcell <= 1) || (hypofarmcell > 1 && (game.global.lastClearedCell + 1) >= hypofarmcell)) && game.global.world > 5 && (game.global.challengeActive == "Hypothermia" && getPageSetting('Rhypofarmzone')[0] > 0 && getPageSetting('Rhypofarmstack').length > 0));
        if (Rhypofarm) {
            var hypofarmzone;
            var hypofarmamount;
            var bonfire = game.challenges.Hypothermia.totalBonfires;
            var wood = game.resources.wood.max;
            var woodmax = wood * (1 + game.portal.Packrat.radLevel * game.portal.Packrat.modifier);
            woodmax = calcHeirloomBonus("Shield", "storageSize", woodmax, false);

            hypofarmzone = getPageSetting('Rhypofarmzone');
            hypofarmamount = getPageSetting('Rhypofarmstack');

            var hypoamountfarmindex = hypofarmzone.indexOf(game.global.world);
            var hypoamountzones = hypofarmamount[hypoamountfarmindex];

            var currentprice = (1e10 * Math.pow(100, game.challenges.Hypothermia.totalBonfires));
            var targetprice = (currentprice * Math.pow(100, ((hypoamountzones - bonfire) - 1))) * 1.05;
            targetprice += (targetprice / 1000)
            var gofarmbonfire = false;
            if (game.resources.wood.owned < targetprice) {
                gofarmbonfire = true;
            }

            if (hypofarmzone.includes(game.global.world) && gofarmbonfire) {
                Rshouldhypofarm = true;
                Rhyposhouldwood = false;
            }
            if (hypofarmzone.includes(game.global.world)) {
                Rhyposhouldwood = false;
            }
        }

        if (!Rshouldhypofarm) {
            hypofragmappy = undefined;
            hypoprefragmappy = undefined;
            hypofragmappybought = false;
        }
    }

    //Equip Farming
    Requipfarm = (getPageSetting('Requipfarmon') == true && game.global.world > 5 && (getPageSetting('Requipfarmzone') > 0 && getPageSetting('RequipfarmHD') > 0 && getPageSetting('Requipfarmmult') > 0));
    if (Requipfarm) {
        var equipfarmzone = getPageSetting('Requipfarmzone');
        var metal = game.resources.metal.owned
        var metalneeded = estimateEquipsForZone()[0];

        if (game.global.world >= equipfarmzone && metal < metalneeded) {
            Rshouldequipfarm = true;
        }
    }

    var equipminus = 0;
    if (Rshouldequipfarm) {
        equipminus = 0;
        var hits = (getPageSetting('Requipfarmhits') > 0) ? getPageSetting('Requipfarmhits') : 10;
        var hitssurv = (getPageSetting('Rhitssurvived') > 0) ? getPageSetting('Rhitssurvived') : 1;
        var mlevels = 0;
        var go = false;
        if (
            ((RcalcEnemyHealth(game.global.world + mlevels)) <= (RcalcOurDmg("avg", false, true) * hits)) &&
            ((((RcalcBadGuyDmg(null, RgetEnemyMaxAttack((game.global.world + mlevels), 20, 'Snimp', 1.0))) * 0.8) * (hitssurv)) <= (RcalcOurHealth() * 2))
        ) {
            equipminus = mlevels;
            go = true;
        }
        if (!go) {
            mlevels = -1;
            if (
                ((RcalcEnemyHealth(game.global.world + mlevels)) <= (RcalcOurDmg("avg", false, true) * hits)) &&
                ((((RcalcBadGuyDmg(null, RgetEnemyMaxAttack((game.global.world + mlevels), 20, 'Snimp', 1.0))) * 0.8) * (hitssurv)) <= (RcalcOurHealth() * 2))
            ) {
                equipminus = mlevels;
                go = true;
            }
        }
        if (!go) {
            mlevels = -2;
            if (
                ((RcalcEnemyHealth(game.global.world + mlevels)) <= (RcalcOurDmg("avg", false, true) * hits)) &&
                ((((RcalcBadGuyDmg(null, RgetEnemyMaxAttack((game.global.world + mlevels), 20, 'Snimp', 1.0))) * 0.8) * (hitssurv)) <= (RcalcOurHealth() * 2))
            ) {
                equipminus = mlevels;
                go = true;
            }
        }
        if (!go) {
            mlevels = -3;
            if (
                ((RcalcEnemyHealth(game.global.world + mlevels)) <= (RcalcOurDmg("avg", false, true) * hits)) &&
                ((((RcalcBadGuyDmg(null, RgetEnemyMaxAttack((game.global.world + mlevels), 20, 'Snimp', 1.0))) * 0.8) * (hitssurv)) <= (RcalcOurHealth() * 2))
            ) {
                equipminus = mlevels;
                go = true;
            }
        }
        if (!go) {
            mlevels = -4;
            if (
                ((RcalcEnemyHealth(game.global.world + mlevels)) <= (RcalcOurDmg("avg", false, true) * hits)) &&
                ((((RcalcBadGuyDmg(null, RgetEnemyMaxAttack((game.global.world + mlevels), 20, 'Snimp', 1.0))) * 0.8) * (hitssurv)) <= (RcalcOurHealth() * 2))
            ) {
                equipminus = mlevels;
                go = true;
            }
        }
        if (!go) {
            mlevels = -5;
            if (
                ((RcalcEnemyHealth(game.global.world + mlevels)) <= (RcalcOurDmg("avg", false, true) * hits)) &&
                ((((RcalcBadGuyDmg(null, RgetEnemyMaxAttack((game.global.world + mlevels), 20, 'Snimp', 1.0))) * 0.8) * (hitssurv)) <= (RcalcOurHealth() * 2))
            ) {
                equipminus = mlevels;
                go = true;
            }
        }
        if (!go) {
            equipminus = -6;
            go = true;
        }
    }

    //Map Selection
    var obj = {};
    for (var map in game.global.mapsOwnedArray) {
        if (!game.global.mapsOwnedArray[map].noRecycle) {
            obj[map] = game.global.mapsOwnedArray[map].level;
        }
    }
    var keysSorted = Object.keys(obj).sort(function(a, b) {
        return obj[b] - obj[a];
    });
    var highestMap;
    var lowestMap;
    if (keysSorted[0]) {
        highestMap = keysSorted[0];
        lowestMap = keysSorted[keysSorted.length - 1];
    } else
        selectedMap = "create";

    //Uniques
    var runUniques = (getPageSetting('RAutoMaps') == 1);
    if (runUniques || Rshoulddobogs || Rshouldcastle) {
        for (var map in game.global.mapsOwnedArray) {
            var theMap = game.global.mapsOwnedArray[map];
            if (Rshoulddobogs && theMap.name == 'The Black Bog') {
                selectedMap = theMap.id;
                break;
            } else if (runUniques && theMap.noRecycle) {
                if (theMap.name == 'Big Wall' && !game.upgrades.Bounty.allowed && !game.upgrades.Bounty.done) {
                    if (game.global.world < 8 && RcalcHDratio() > 4) continue;
                    selectedMap = theMap.id;
                    break;
                }
                if (theMap.name == 'Dimension of Rage' && document.getElementById("portalBtn").style.display == "none" && game.upgrades.Rage.done == 1) {
                    if (game.global.challenge != "Unlucky" && (game.global.world < 16 || RcalcHDratio() < 2)) continue;
                    selectedMap = theMap.id;
                    break;
                }
                if (getPageSetting('Rprispalace') == true && theMap.name == 'Prismatic Palace' && game.mapUnlocks.Prismalicious.canRunOnce) {
                    if (game.global.world < 21 || RcalcHDratio() > 25) continue;
                    selectedMap = theMap.id;
                    break;
                }
                var meltingpoint = [10000, 10000];
                if (getPageSetting('Rmeltpoint')[0] > 0 && getPageSetting('Rmeltpoint')[1] >= 0) meltingpoint = getPageSetting('Rmeltpoint');
                if (theMap.name == 'Melting Point' && ((game.global.challengeActive == "Trappapalooza" && game.global.world >= meltingpoint[0] && ((game.global.lastClearedCell + 1) >= meltingpoint[1])) || (game.global.challengeActive == "Melt" && game.global.world >= meltingpoint[0] && ((game.global.lastClearedCell + 1) >= meltingpoint[1])) || (getPageSetting('Rmeltsmithy') > 0 && getPageSetting('Rmeltsmithy') <= game.buildings.Smithy.owned && game.mapUnlocks.SmithFree.canRunOnce))) {
                    if (game.global.world < 50 || (game.global.world == 50 && game.global.lastClearedCell < 55)) continue;
                    selectedMap = theMap.id;
                    break;
                }
                if (game.global.challengeActive == "Hypothermia" && getPageSetting('Rhypocastle') > 0 && theMap.name == 'Frozen Castle' && game.global.world >= getPageSetting('Rhypocastle')) {
                    if (getPageSetting('Rhypovoids') == true && game.global.totalVoidMaps <= 0) {
                        selectedMap = theMap.id;
                        break;
                    }
                    if (getPageSetting('Rhypovoids') == false) {
                        selectedMap = theMap.id;
                        break;
                    }
                }
                if (game.global.challengeActive != "Hypothermia" && getPageSetting('Rfrozencastle') != -1 && theMap.name == 'Frozen Castle' && game.global.world >= getPageSetting('Rfrozencastle')[0] && ((game.global.lastClearedCell + 1) >= getPageSetting('Rfrozencastle')[1])) {
                    selectedMap = theMap.id;
                    break;
                }
            }
        }
    }

    //Voids
    if (RneedToVoid) {
        var voidArray = [];
        var prefixlist = {
            'Deadly': 10,
            'Heinous': 11,
            'Poisonous': 20,
            'Destructive': 30
        };
        var prefixkeys = Object.keys(prefixlist);
        var suffixlist = {
            'Descent': 7.077,
            'Void': 8.822,
            'Nightmare': 9.436,
            'Pit': 10.6
        };
        var suffixkeys = Object.keys(suffixlist);

        /*if (game.global.challengeActive != "Daily" && getPageSetting('Ronlystackedvoids') == true) {
            for (var map in game.global.mapsOwnedArray) {
                var theMap = game.global.mapsOwnedArray[map];
                if (theMap.location == 'Void' && theMap.stacked > 0) {
                    for (var pre in prefixkeys) {
                        if (theMap.name.includes(prefixkeys[pre]))
                            theMap.sortByDiff = 1 * prefixlist[prefixkeys[pre]];
                    }
                    for (var suf in suffixkeys) {
                        if (theMap.name.includes(suffixkeys[suf]))
                            theMap.sortByDiff += 1 * suffixlist[suffixkeys[suf]];
                    }
                    voidArray.push(theMap);
                }
            }
        } else {*/
        for (var map in game.global.mapsOwnedArray) {
            var theMap = game.global.mapsOwnedArray[map];
            if (theMap.location == 'Void') {
                for (var pre in prefixkeys) {
                    if (theMap.name.includes(prefixkeys[pre]))
                        theMap.sortByDiff = 1 * prefixlist[prefixkeys[pre]];
                }
                for (var suf in suffixkeys) {
                    if (theMap.name.includes(suffixkeys[suf]))
                        theMap.sortByDiff += 1 * suffixlist[suffixkeys[suf]];
                }
                voidArray.push(theMap);
            }
        }
        //}

        var voidArraySorted = voidArray.sort(function(a, b) {
            return a.sortByDiff - b.sortByDiff;
        });
        for (var map in voidArraySorted) {
            var theMap = voidArraySorted[map];
            RdoVoids = true;
            if (getPageSetting('RDisableFarm') <= 0)
                RshouldFarm = RshouldFarm || false;
            if (!restartVoidMap)
                selectedMap = theMap.id;
            break;
        }
    }

    //Automaps

    //Raiding
    if (Rshoulddopraid) {
        if (selectedMap == "world") {
            selectedMap = "createp";
        }
    }

    //dRaiding
    if (Rdshoulddopraid) {
        if (selectedMap == "world") {
            selectedMap = "dcreatep";
        }
    }

    //Everything else
    if (!Rshoulddopraid && !Rdshoulddopraid && (RshouldDoMaps || RdoVoids || Rshouldtimefarm || Rdshouldtimefarm || Rshouldtributefarm || Rshoulddoquest > 0 || Rshouldmayhem > 0 || Rshouldpanda || Rshouldinsanityfarm || Rshouldstormfarm || Rshouldequipfarm || Rshouldshipfarm || Rshouldalchfarm || Rshouldhypofarm)) {
        if (selectedMap == "world") {
            if (Rshouldmayhem > 0 && !Rshouldpanda && !Rshouldtimefarm && !Rdshouldtimefarm && !Rshouldtributefarm && !Rshouldinsanityfarm && !Rshouldequipfarm && !Rshouldshipfarm && !Rshouldalchfarm && !Rshouldhypofarm) {
                if (getPageSetting('Rmayhemmap') == 2) {
                    for (var map in game.global.mapsOwnedArray) {
                        if (!game.global.mapsOwnedArray[map].noRecycle && mayhemextra >= 0 && ((game.global.world + mayhemextra) == game.global.mapsOwnedArray[map].level)) {
                            selectedMap = game.global.mapsOwnedArray[map].id;
                            break;
                        } else {
                            selectedMap = "create";
                        }
                    }
                } else {
                    for (var map in game.global.mapsOwnedArray) {
                        if (!game.global.mapsOwnedArray[map].noRecycle && game.global.world == game.global.mapsOwnedArray[map].level) {
                            selectedMap = game.global.mapsOwnedArray[map].id;
                            break;
                        } else {
                            selectedMap = "create";
                        }
                    }
                }
            } else if (Rshouldpanda && !Rshouldtimefarm && !Rdshouldtimefarm && !Rshouldtributefarm && !Rshouldinsanityfarm && !Rshouldequipfarm && !Rshouldshipfarm && !Rshouldalchfarm && !Rshouldhypofarm) {
                if (getPageSetting('Rpandamaps') == true) {
                    for (var map in game.global.mapsOwnedArray) {
                        if (!game.global.mapsOwnedArray[map].noRecycle && pandaextra >= 0 && ((game.global.world + pandaextra) == game.global.mapsOwnedArray[map].level)) {
                            selectedMap = game.global.mapsOwnedArray[map].id;
                            break;
                        } else {
                            selectedMap = "create";
                        }
                    }
                }
            } else if (Rshouldinsanityfarm && !Rshouldtimefarm && !Rdshouldtimefarm && !Rshouldtributefarm && !Rshouldequipfarm && !Rshouldshipfarm && !Rshouldalchfarm && !Rshouldhypofarm) {
                if (getPageSetting('Rinsanityfarmlevel') == 0) {
                    for (var map in game.global.mapsOwnedArray) {
                        if (!game.global.mapsOwnedArray[map].noRecycle && game.global.world == game.global.mapsOwnedArray[map].level) {
                            selectedMap = game.global.mapsOwnedArray[map].id;
                            break;
                        } else {
                            selectedMap = "create";
                        }
                    }
                } else if (getPageSetting('Rinsanityfarmlevel') != 0) {
                    var insanityfarmlevel = getPageSetting('Rinsanityfarmlevel');
                    var insanityfarmlevelindex = insanityfarmzone.indexOf(game.global.world);
                    var insanitylevelzones = insanityfarmlevel[insanityfarmlevelindex];
                    if (insanitylevelzones > 0) {
                        for (var map in game.global.mapsOwnedArray) {
                            if (!game.global.mapsOwnedArray[map].noRecycle && ((game.global.world + insanitylevelzones) == game.global.mapsOwnedArray[map].level)) {
                                selectedMap = game.global.mapsOwnedArray[map].id;
                                break;
                            } else {
                                selectedMap = "create";
                            }
                        }
                    } else if (insanitylevelzones == 0) {
                        for (var map in game.global.mapsOwnedArray) {
                            if (!game.global.mapsOwnedArray[map].noRecycle && game.global.world == game.global.mapsOwnedArray[map].level) {
                                selectedMap = game.global.mapsOwnedArray[map].id;
                                break;
                            } else {
                                selectedMap = "create";
                            }
                        }
                    } else if (insanitylevelzones < 0) {
                        for (var map in game.global.mapsOwnedArray) {
                            if (!game.global.mapsOwnedArray[map].noRecycle && ((game.global.world + insanitylevelzones) == game.global.mapsOwnedArray[map].level)) {
                                selectedMap = game.global.mapsOwnedArray[map].id;
                                break;
                            } else {
                                selectedMap = "create";
                            }
                        }
                    }
                }
            } else if (Rshouldalchfarm && !Rshouldhypofarm && !Rshouldtimefarm && !Rdshouldtimefarm && !Rshouldtributefarm && !Rshouldequipfarm && !Rshouldshipfarm) {
                if (getPageSetting('Ralchfarmlevel') == 0) {
                    for (var map in game.global.mapsOwnedArray) {
                        if (!game.global.mapsOwnedArray[map].noRecycle && game.global.world == game.global.mapsOwnedArray[map].level) {
                            selectedMap = game.global.mapsOwnedArray[map].id;
                            break;
                        } else {
                            selectedMap = "create";
                        }
                    }
                } else if (getPageSetting('Ralchfarmlevel') != 0) {
                    var alchfarmlevel = getPageSetting('Ralchfarmlevel');
                    var alchfarmlevelindex = alchfarmzone.indexOf(game.global.world);
                    var alchlevelzones = alchfarmlevel[alchfarmlevelindex];
                    if (alchlevelzones > 0) {
                        for (var map in game.global.mapsOwnedArray) {
                            if (!game.global.mapsOwnedArray[map].noRecycle && ((game.global.world + alchlevelzones) == game.global.mapsOwnedArray[map].level)) {
                                selectedMap = game.global.mapsOwnedArray[map].id;
                                break;
                            } else {
                                selectedMap = "create";
                            }
                        }
                    } else if (alchlevelzones == 0) {
                        for (var map in game.global.mapsOwnedArray) {
                            if (!game.global.mapsOwnedArray[map].noRecycle && game.global.world == game.global.mapsOwnedArray[map].level) {
                                selectedMap = game.global.mapsOwnedArray[map].id;
                                break;
                            } else {
                                selectedMap = "create";
                            }
                        }
                    } else if (alchlevelzones < 0) {
                        for (var map in game.global.mapsOwnedArray) {
                            if (!game.global.mapsOwnedArray[map].noRecycle && ((game.global.world + alchlevelzones) == game.global.mapsOwnedArray[map].level)) {
                                selectedMap = game.global.mapsOwnedArray[map].id;
                                break;
                            } else {
                                selectedMap = "create";
                            }
                        }
                    }
                }
            } else if (Rshouldhypofarm && !Rshouldtimefarm && !Rdshouldtimefarm && !Rshouldtributefarm && !Rshouldequipfarm && !Rshouldshipfarm) {
                if (getPageSetting('Rhypofarmlevel') == 0) {
                    for (var map in game.global.mapsOwnedArray) {
                        if (!game.global.mapsOwnedArray[map].noRecycle && game.global.world == game.global.mapsOwnedArray[map].level) {
                            selectedMap = game.global.mapsOwnedArray[map].id;
                            break;
                        } else {
                            selectedMap = "create";
                        }
                    }
                } else if (getPageSetting('Rhypofarmlevel') != 0) {
                    var hypofarmlevel = getPageSetting('Rhypofarmlevel');
                    var hypofarmlevelindex = hypofarmzone.indexOf(game.global.world);
                    var hypolevelzones = hypofarmlevel[hypofarmlevelindex];
                    if (hypolevelzones > 0) {
                        for (var map in game.global.mapsOwnedArray) {
                            if (!game.global.mapsOwnedArray[map].noRecycle && ((game.global.world + hypolevelzones) == game.global.mapsOwnedArray[map].level)) {
                                selectedMap = game.global.mapsOwnedArray[map].id;
                                break;
                            } else {
                                selectedMap = "create";
                            }
                        }
                    } else if (hypolevelzones == 0) {
                        for (var map in game.global.mapsOwnedArray) {
                            if (!game.global.mapsOwnedArray[map].noRecycle && game.global.world == game.global.mapsOwnedArray[map].level) {
                                selectedMap = game.global.mapsOwnedArray[map].id;
                                break;
                            } else {
                                selectedMap = "create";
                            }
                        }
                    } else if (hypolevelzones < 0) {
                        for (var map in game.global.mapsOwnedArray) {
                            if (!game.global.mapsOwnedArray[map].noRecycle && ((game.global.world + hypolevelzones) == game.global.mapsOwnedArray[map].level)) {
                                selectedMap = game.global.mapsOwnedArray[map].id;
                                break;
                            } else {
                                selectedMap = "create";
                            }
                        }
                    }
                }
            } else if (Rshouldshipfarm && !Rshouldtimefarm && !Rdshouldtimefarm && !Rshouldtributefarm && !Rshouldequipfarm) {
                if (getPageSetting('Rshipfarmlevel') == 0) {
                    for (var map in game.global.mapsOwnedArray) {
                        if (!game.global.mapsOwnedArray[map].noRecycle && game.global.world == game.global.mapsOwnedArray[map].level) {
                            selectedMap = game.global.mapsOwnedArray[map].id;
                            break;
                        } else {
                            selectedMap = "create";
                        }
                    }
                } else if (getPageSetting('Rshipfarmlevel') != 0) {
                    var shipfarmlevel = getPageSetting('Rshipfarmlevel');
                    var shipfarmlevelindex = shipfarmzone.indexOf(game.global.world);
                    var shiplevelzones = shipfarmlevel[shipfarmlevelindex];
                    if (shiplevelzones > 0) {
                        for (var map in game.global.mapsOwnedArray) {
                            if (!game.global.mapsOwnedArray[map].noRecycle && ((game.global.world + shiplevelzones) == game.global.mapsOwnedArray[map].level) && game.global.mapsOwnedArray[map].bonus == "lsc") {
                                selectedMap = game.global.mapsOwnedArray[map].id;
                                break;
                            } else {
                                selectedMap = "create";
                            }
                        }
                    } else if (shiplevelzones == 0) {
                        for (var map in game.global.mapsOwnedArray) {
                            if (!game.global.mapsOwnedArray[map].noRecycle && game.global.world == game.global.mapsOwnedArray[map].level && game.global.mapsOwnedArray[map].bonus == "lsc") {
                                selectedMap = game.global.mapsOwnedArray[map].id;
                                break;
                            } else {
                                selectedMap = "create";
                            }
                        }
                    } else if (shiplevelzones < 0) {
                        for (var map in game.global.mapsOwnedArray) {
                            if (!game.global.mapsOwnedArray[map].noRecycle && ((game.global.world + shiplevelzones) == game.global.mapsOwnedArray[map].level) && game.global.mapsOwnedArray[map].bonus == "lsc") {
                                selectedMap = game.global.mapsOwnedArray[map].id;
                                break;
                            } else {
                                selectedMap = "create";
                            }
                        }
                    }
                }
            } else if (Rshouldtimefarm && !Rdshouldtimefarm && !Rshouldtributefarm && !Rshouldequipfarm) {
                if (getPageSetting('Rtimefarmlevel') == 0) {
                    for (var map in game.global.mapsOwnedArray) {
                        if (!game.global.mapsOwnedArray[map].noRecycle && game.global.world == game.global.mapsOwnedArray[map].level) {
                            selectedMap = game.global.mapsOwnedArray[map].id;
                            break;
                        } else {
                            selectedMap = "create";
                        }
                    }
                } else if (getPageSetting('Rtimefarmlevel') != 0) {
                    var timefarmlevel = getPageSetting('Rtimefarmlevel');
                    var timefarmlevelindex = timefarmzone.indexOf(game.global.world);
                    var levelzones = timefarmlevel[timefarmlevelindex];
                    if (levelzones > 0) {
                        for (var map in game.global.mapsOwnedArray) {
                            if (!game.global.mapsOwnedArray[map].noRecycle && ((game.global.world + levelzones) == game.global.mapsOwnedArray[map].level)) {
                                selectedMap = game.global.mapsOwnedArray[map].id;
                                break;
                            } else {
                                selectedMap = "create";
                            }
                        }
                    } else if (levelzones == 0) {
                        for (var map in game.global.mapsOwnedArray) {
                            if (!game.global.mapsOwnedArray[map].noRecycle && game.global.world == game.global.mapsOwnedArray[map].level) {
                                selectedMap = game.global.mapsOwnedArray[map].id;
                                break;
                            } else {
                                selectedMap = "create";
                            }
                        }
                    } else if (levelzones < 0) {
                        for (var map in game.global.mapsOwnedArray) {
                            if (!game.global.mapsOwnedArray[map].noRecycle && ((game.global.world - 1) == game.global.mapsOwnedArray[map].level)) {
                                selectedMap = game.global.mapsOwnedArray[map].id;
                                break;
                            } else {
                                selectedMap = "create";
                            }
                        }
                    }
                }
            } else if (Rdshouldtimefarm && !Rshouldtributefarm && !Rshouldequipfarm) {
                if (getPageSetting('Rdtimefarmlevel') == 0) {
                    for (var map in game.global.mapsOwnedArray) {
                        if (!game.global.mapsOwnedArray[map].noRecycle && game.global.world == game.global.mapsOwnedArray[map].level) {
                            selectedMap = game.global.mapsOwnedArray[map].id;
                            break;
                        } else {
                            selectedMap = "create";
                        }
                    }
                } else if (getPageSetting('Rdtimefarmlevel') != 0) {
                    var dtimefarmlevel = getPageSetting('Rdtimefarmlevel');
                    var dtimefarmlevelindex = dtimefarmzone.indexOf(game.global.world);
                    var dlevelzones = dtimefarmlevel[dtimefarmlevelindex];
                    if (dlevelzones > 0) {
                        for (var map in game.global.mapsOwnedArray) {
                            if (!game.global.mapsOwnedArray[map].noRecycle && ((game.global.world + dlevelzones) == game.global.mapsOwnedArray[map].level)) {
                                selectedMap = game.global.mapsOwnedArray[map].id;
                                break;
                            } else {
                                selectedMap = "create";
                            }
                        }
                    } else if (dlevelzones == 0) {
                        for (var map in game.global.mapsOwnedArray) {
                            if (!game.global.mapsOwnedArray[map].noRecycle && game.global.world == game.global.mapsOwnedArray[map].level) {
                                selectedMap = game.global.mapsOwnedArray[map].id;
                                break;
                            } else {
                                selectedMap = "create";
                            }
                        }
                    } else if (dlevelzones < 0) {
                        for (var map in game.global.mapsOwnedArray) {
                            if (!game.global.mapsOwnedArray[map].noRecycle && ((game.global.world - 1) == game.global.mapsOwnedArray[map].level)) {
                                selectedMap = game.global.mapsOwnedArray[map].id;
                                break;
                            } else {
                                selectedMap = "create";
                            }
                        }
                    }
                }
            } else if (Rshouldtributefarm && !Rshouldequipfarm) {
                if (getPageSetting('Rtributefarmlevel') == 0) {
                    for (var map in game.global.mapsOwnedArray) {
                        if (!game.global.mapsOwnedArray[map].noRecycle && game.global.world == game.global.mapsOwnedArray[map].level) {
                            selectedMap = game.global.mapsOwnedArray[map].id;
                            break;
                        } else {
                            selectedMap = "create";
                        }
                    }
                } else if (getPageSetting('Rtributefarmlevel') != 0) {
                    var tributefarmzone = getPageSetting('Rtributefarmzone');
                    var tributefarmlevel = getPageSetting('Rtributefarmlevel');
                    var tributefarmlevelindex = tributefarmzone.indexOf(game.global.world);
                    var levelzones = tributefarmlevel[tributefarmlevelindex];
                    if (levelzones > 0) {
                        for (var map in game.global.mapsOwnedArray) {
                            if (!game.global.mapsOwnedArray[map].noRecycle && ((game.global.world + levelzones) == game.global.mapsOwnedArray[map].level)) {
                                selectedMap = game.global.mapsOwnedArray[map].id;
                                break;
                            } else {
                                selectedMap = "create";
                            }
                        }
                    } else if (levelzones == 0) {
                        for (var map in game.global.mapsOwnedArray) {
                            if (!game.global.mapsOwnedArray[map].noRecycle && game.global.world == game.global.mapsOwnedArray[map].level) {
                                selectedMap = game.global.mapsOwnedArray[map].id;
                                break;
                            } else {
                                selectedMap = "create";
                            }
                        }
                    } else if (levelzones < 0) {
                        for (var map in game.global.mapsOwnedArray) {
                            if (!game.global.mapsOwnedArray[map].noRecycle && ((game.global.world - 1) == game.global.mapsOwnedArray[map].level)) {
                                selectedMap = game.global.mapsOwnedArray[map].id;
                                break;
                            } else {
                                selectedMap = "create";
                            }
                        }
                    }
                }
            } else if (Rshouldequipfarm) {
                for (var map in game.global.mapsOwnedArray) {
                    if (!game.global.mapsOwnedArray[map].noRecycle && equipminus <= 0 && ((game.global.world + equipminus) == game.global.mapsOwnedArray[map].level)) {
                        selectedMap = game.global.mapsOwnedArray[map].id;
                        break;
                    } else {
                        selectedMap = "create";
                    }
                }
            } else {
                for (var map in game.global.mapsOwnedArray) {
                    if (!game.global.mapsOwnedArray[map].noRecycle && game.global.world == game.global.mapsOwnedArray[map].level) {
                        selectedMap = game.global.mapsOwnedArray[map].id;
                        break;
                    } else {
                        selectedMap = "create";
                    }
                }
            }
        }
    }

    //Getting to Map Creation and Repeat.
    if (!game.global.preMapsActive && game.global.mapsActive) {
        var doDefaultMapBonus = game.global.mapBonus < getPageSetting('RMaxMapBonuslimit') - 1;
        if ((Rshoulddopraid || (Rshoulddopraid && RAMPfragfarming)) ||
            (Rdshoulddopraid || (Rdshoulddopraid && RdAMPfragfarming)) ||
            (Rshouldinsanityfarm || (Rshouldinsanityfarm && Rinsanityfragfarming)) ||
            (Rshouldalchfarm || (Rshouldalchfarm && Ralchfragfarming)) ||
            (Rshouldhypofarm || (Rshouldhypofarm && Rhypofragfarming)) ||
            (selectedMap == game.global.currentMapId && (!getCurrentMapObject().noRecycle && (doDefaultMapBonus || RvanillaMapatZone || RdoMaxMapBonus || RshouldFarm || Rshouldtimefarm || Rdshouldtimefarm || Rshouldtributefarm || Rshoulddobogs || Rshoulddoquest > 0 || Rshouldmayhem > 0 || Rshouldpanda || Rshouldstormfarm || Rshouldequipfarm ||
                (Rshouldshipfarm || (Rshouldshipfarm && Rshipfragfarming)))))) {
            if (!game.global.repeatMap) {
                repeatClicked();
            }
            if (Rshoulddopraid && !RAMPfragfarming) {
                if (game.options.menu.repeatUntil.enabled != 2) {
                    game.options.menu.repeatUntil.enabled = 2;
                }
            } else if ((Rshoulddopraid && RAMPfragfarming) || (Rshouldinsanityfarm && Rinsanityfragfarming) || (Rshouldalchfarm && Ralchfragfarming) || (Rshouldhypofarm && Rhypofragfarming) || (Rshouldshipfarm && Rshipfragfarming)) {
                if (game.options.menu.repeatUntil.enabled != 0) {
                    game.options.menu.repeatUntil.enabled = 0;
                }
            }
            if (Rdshoulddopraid && !RdAMPfragfarming) {
                if (game.options.menu.repeatUntil.enabled != 2) {
                    game.options.menu.repeatUntil.enabled = 2;
                }
            } else if ((Rdshoulddopraid && RdAMPfragfarming) || (Rshouldinsanityfarm && Rinsanityfragfarming) || (Rshouldalchfarm && Ralchfragfarming) || (Rshouldhypofarm && Rhypofragfarming) || (Rshouldshipfarm && Rshipfragfarming)) {
                if (game.options.menu.repeatUntil.enabled != 0) {
                    game.options.menu.repeatUntil.enabled = 0;
                }
            }
            if (!Rshoulddopraid && !RAMPfragfarming && !Rdshoulddopraid && !RdAMPfragfarming && !Rshouldinsanityfarm && !Rinsanityfragfarming && !Rshouldalchfarm && !Rshouldhypofarm && !Rhypofragfarming && !Ralchfragfarming && !Rshoulddobogs && !RshouldDoMaps && !Rshouldtimefarm && !Rdshouldtimefarm && !Rshouldtributefarm && Rshoulddoquest <= 0 && Rshouldmayhem <= 0 && !Rshouldpanda && !Rshouldstormfarm && !Rshouldequipfarm && !Rshouldshipfarm && !Rshipfragfarming) {
                repeatClicked();
            }
            if (shouldDoHealthMaps && game.global.mapBonus >= getPageSetting('RMaxMapBonushealth')) {
                repeatClicked();
                shouldDoHealthMaps = false;
            }
            if (RdoMaxMapBonus && game.global.mapBonus < getPageSetting('RMaxMapBonuslimit')) {
                repeatClicked();
                RdoMaxMapBonus = false;
            }
            if (game.global.repeatMap && Rshoulddoquest == 3 && game.global.mapBonus >= 4) {
                repeatClicked();
            }
            if (game.global.repeatMap && Rshoulddopraid && RAMPfragfarming && RAMPfrag() == true) {
                repeatClicked();
            }
            if (game.global.repeatMap && Rdshoulddopraid && RdAMPfragfarming && RdAMPfrag() == true) {
                repeatClicked();
            }
            if (game.global.repeatMap && Rshouldinsanityfarm && Rinsanityfragfarming && insanityfrag() == true) {
                repeatClicked();
            }
            if (game.global.repeatMap && Rshouldalchfarm && Ralchfragfarming && alchfrag() == true) {
                repeatClicked();
            }
            if (game.global.repeatMap && Rshouldhypofarm && Rhypofragfarming && hypofrag() == true) {
                repeatClicked();
            }
            if (game.global.repeatMap && Rshouldshipfarm && Rshipfragfarming && shipfrag() == true) {
                repeatClicked();
            }

        } else {
            if (game.global.repeatMap) {
                repeatClicked();
            }
            if (restartVoidMap) {
                mapsClicked(true);
            }
        }
    } else if (!game.global.preMapsActive && !game.global.mapsActive) {
        if (selectedMap != "world") {
            if (!game.global.switchToMaps) {
                mapsClicked();
            }
            if (RdoVoids && game.global.switchToMaps &&
                (RdoVoids ||
                    (!RenoughDamage && RenoughHealth && game.global.lastClearedCell < 9) ||
                    (RshouldFarm && game.global.lastClearedCell >= customVars.RshouldFarmCell) ||
                    (RscryerStuck)) &&
                (
                    (game.resources.trimps.realMax() <= game.resources.trimps.owned + 1) ||
                    (RdoVoids && game.global.lastClearedCell > 70)
                )
            ) {
                if (RscryerStuck) {
                    debug("Got perma-stuck on cell " + (game.global.lastClearedCell + 2) + " during scryer stance. Are your scryer settings correct? Entering map to farm to fix it.");
                }
                mapsClicked();
            }
        }

        //Creating Map
    } else if (game.global.preMapsActive) {
        if (selectedMap == "world") {
            mapsClicked();
        } else if (selectedMap == "createp") {
            RAMPdone = false;
            var RAMPfragcheck = true;
            if (getPageSetting('RAMPraidfrag') > 0) {
                if (RAMPfrag() == true) {
                    RAMPfragcheck = true;
                    RAMPfragfarming = false;
                } else if (RAMPfrag() == false && !RAMPmapbought1 && !RAMPmapbought2 && !RAMPmapbought3 && !RAMPmapbought4 && !RAMPmapbought5 && Rshoulddopraid) {
                    RAMPfragfarming = true;
                    RAMPfragcheck = false;
                    if (!RAMPfragcheck && RAMPfragmappy == undefined && !RAMPfragmappybought && game.global.preMapsActive && Rshoulddopraid) {
                        debug("Check complete for frag map");
                        RAMPfragmap();
                        if ((updateMapCost(true) <= game.resources.fragments.owned)) {
                            buyMap();
                            RAMPfragmappybought = true;
                            if (RAMPfragmappybought) {
                                RAMPfragmappy = game.global.mapsOwnedArray[game.global.mapsOwnedArray.length - 1].id;
                                debug("frag map bought");
                            }
                        }
                    }
                    if (!RAMPfragcheck && game.global.preMapsActive && !game.global.mapsActive && RAMPfragmappybought && RAMPfragmappy != undefined && Rshoulddopraid) {
                        debug("running frag map");
                        selectedMap = RAMPfragmappy;
                        selectMap(RAMPfragmappy);
                        runMap();
                        RlastMapWeWereIn = getCurrentMapObject();
                        RAMPprefragmappy = RAMPfragmappy;
                        RAMPfragmappy = undefined;
                    }
                    if (!RAMPfragcheck && game.global.mapsActive && RAMPfragmappybought && RAMPprefragmappy != undefined && Rshoulddopraid) {
                        if (RAMPfrag() == false) {
                            if (!game.global.repeatMap) {
                                repeatClicked();
                            }
                        } else if (RAMPfrag() == true) {
                            if (game.global.repeatMap) {
                                repeatClicked();
                                mapsClicked();
                            }
                            if (game.global.preMapsActive && RAMPfragmappybought && RAMPprefragmappy != undefined && Rshoulddopraid) {
                                RAMPfragmappybought = false;
                            }
                            if (RAMPprefragmappy != undefined) {
                                recycleMap(getMapIndex(RAMPprefragmappy));
                                RAMPprefragmappy = undefined;
                            }
                            RAMPfragcheck = true;
                            RAMPfragfarming = false;
                        }
                    }
                } else {
                    RAMPfragcheck = true;
                    RAMPfragfarming = false;
                }
            }
            if (RAMPfragcheck && RAMPpMap5 == undefined && !RAMPmapbought5 && game.global.preMapsActive && Rshoulddopraid && RAMPshouldrunmap(0)) {
                debug("Check complete for 5th map");
                RAMPplusPres(0);
                if ((updateMapCost(true) <= game.resources.fragments.owned)) {
                    buyMap();
                    RAMPmapbought5 = true;
                    if (RAMPmapbought5) {
                        RAMPpMap5 = game.global.mapsOwnedArray[game.global.mapsOwnedArray.length - 1].id;
                        debug("5th map bought");
                    }
                }
            }
            if (RAMPfragcheck && RAMPpMap4 == undefined && !RAMPmapbought4 && game.global.preMapsActive && Rshoulddopraid && RAMPshouldrunmap(1)) {
                debug("Check complete for 4th map");
                RAMPplusPres(1);
                if ((updateMapCost(true) <= game.resources.fragments.owned)) {
                    buyMap();
                    RAMPmapbought4 = true;
                    if (RAMPmapbought4) {
                        RAMPpMap4 = game.global.mapsOwnedArray[game.global.mapsOwnedArray.length - 1].id;
                        debug("4th map bought");
                    }
                }
            }
            if (RAMPfragcheck && RAMPpMap3 == undefined && !RAMPmapbought3 && game.global.preMapsActive && Rshoulddopraid && RAMPshouldrunmap(2)) {
                debug("Check complete for 3rd map");
                RAMPplusPres(2);
                if ((updateMapCost(true) <= game.resources.fragments.owned)) {
                    buyMap();
                    RAMPmapbought3 = true;
                    if (RAMPmapbought3) {
                        RAMPpMap3 = game.global.mapsOwnedArray[game.global.mapsOwnedArray.length - 1].id;
                        debug("3rd map bought");
                    }
                }
            }
            if (RAMPfragcheck && RAMPpMap2 == undefined && !RAMPmapbought2 && game.global.preMapsActive && Rshoulddopraid && RAMPshouldrunmap(3)) {
                debug("Check complete for 2nd map");
                RAMPplusPres(3);
                if ((updateMapCost(true) <= game.resources.fragments.owned)) {
                    buyMap();
                    RAMPmapbought2 = true;
                    if (RAMPmapbought2) {
                        RAMPpMap2 = game.global.mapsOwnedArray[game.global.mapsOwnedArray.length - 1].id;
                        debug("2nd map bought");
                    }
                }
            }
            if (RAMPfragcheck && RAMPpMap1 == undefined && !RAMPmapbought1 && game.global.preMapsActive && Rshoulddopraid && RAMPshouldrunmap(4)) {
                debug("Check complete for 1st map");
                RAMPplusPres(4);
                if ((updateMapCost(true) <= game.resources.fragments.owned)) {
                    buyMap();
                    RAMPmapbought1 = true;
                    if (RAMPmapbought1) {
                        RAMPpMap1 = game.global.mapsOwnedArray[game.global.mapsOwnedArray.length - 1].id;
                        debug("1st map bought");
                    }
                }
            }
            if (RAMPfragcheck && !RAMPmapbought1 && !RAMPmapbought2 && !RAMPmapbought3 && !RAMPmapbought4 && !RAMPmapbought5) {
                RAMPpMap1 = undefined;
                RAMPpMap2 = undefined;
                RAMPpMap3 = undefined;
                RAMPpMap4 = undefined;
                RAMPpMap5 = undefined;
                debug("Failed to Prestige Raid. Looks like you can't afford to or have no equips to get!");
                Rshoulddopraid = false;
                autoTrimpSettings["RAutoMaps"].value = 0;
            }
            if (RAMPfragcheck && game.global.preMapsActive && !game.global.mapsActive && RAMPmapbought1 && RAMPpMap1 != undefined && Rshoulddopraid) {
                debug("running map 1");
                selectedMap = RAMPpMap1;
                selectMap(RAMPpMap1);
                runMap();
                RlastMapWeWereIn = getCurrentMapObject();
                RAMPrepMap1 = RAMPpMap1;
                RAMPpMap1 = undefined;
            }
            if (RAMPfragcheck && game.global.preMapsActive && !game.global.mapsActive && RAMPmapbought2 && RAMPpMap2 != undefined && Rshoulddopraid) {
                debug("running map 2");
                selectedMap = RAMPpMap2;
                selectMap(RAMPpMap2);
                runMap();
                RlastMapWeWereIn = getCurrentMapObject();
                RAMPrepMap2 = RAMPpMap2;
                RAMPpMap2 = undefined;
            }
            if (RAMPfragcheck && game.global.preMapsActive && !game.global.mapsActive && RAMPmapbought3 && RAMPpMap3 != undefined && Rshoulddopraid) {
                debug("running map 3");
                selectedMap = RAMPpMap3;
                selectMap(RAMPpMap3);
                runMap();
                RlastMapWeWereIn = getCurrentMapObject();
                RAMPrepMap3 = RAMPpMap3;
                RAMPpMap3 = undefined;
            }
            if (RAMPfragcheck && game.global.preMapsActive && !game.global.mapsActive && RAMPmapbought4 && RAMPpMap4 != undefined && Rshoulddopraid) {
                debug("running map 4");
                selectedMap = RAMPpMap4;
                selectMap(RAMPpMap4);
                runMap();
                RlastMapWeWereIn = getCurrentMapObject();
                RAMPrepMap4 = RAMPpMap4;
                RAMPpMap4 = undefined;
            }
            if (RAMPfragcheck && game.global.preMapsActive && !game.global.mapsActive && RAMPmapbought5 && RAMPpMap5 != undefined && Rshoulddopraid) {
                debug("running map 5");
                selectedMap = RAMPpMap5;
                selectMap(RAMPpMap5);
                runMap();
                RlastMapWeWereIn = getCurrentMapObject();
                RAMPrepMap5 = RAMPpMap5;
                RAMPpMap5 = undefined;
            }
        } else if (selectedMap == "dcreatep") {
            RdAMPdone = false;
            debug("dcreatep selected");
            var RdAMPfragcheck = true;
            if (getPageSetting('RdAMPraidfrag') > 0) {
                if (RdAMPfrag() == true) {
                    RdAMPfragcheck = true;
                    RdAMPfragfarming = false;
                } else if (RdAMPfrag() == false && !RdAMPmapbought1 && !RdAMPmapbought2 && !RdAMPmapbought3 && !RdAMPmapbought4 && !RdAMPmapbought5 && Rdshoulddopraid) {
                    RdAMPfragfarming = true;
                    RdAMPfragcheck = false;
                    if (!RdAMPfragcheck && RdAMPfragmappy == undefined && !RdAMPfragmappybought && game.global.preMapsActive && Rdshoulddopraid) {
                        debug("Check complete for frag map");
                        RdAMPfragmap();
                        if ((updateMapCost(true) <= game.resources.fragments.owned)) {
                            buyMap();
                            RdAMPfragmappybought = true;
                            if (RdAMPfragmappybought) {
                                RdAMPfragmappy = game.global.mapsOwnedArray[game.global.mapsOwnedArray.length - 1].id;
                                debug("frag map bought");
                            }
                        }
                    }
                    if (!RdAMPfragcheck && game.global.preMapsActive && !game.global.mapsActive && RdAMPfragmappybought && RdAMPfragmappy != undefined && Rdshoulddopraid) {
                        debug("running frag map");
                        selectedMap = RdAMPfragmappy;
                        selectMap(RdAMPfragmappy);
                        runMap();
                        RlastMapWeWereIn = getCurrentMapObject();
                        RdAMPprefragmappy = RdAMPfragmappy;
                        RdAMPfragmappy = undefined;
                    }
                    if (!RdAMPfragcheck && game.global.mapsActive && RdAMPfragmappybought && RdAMPprefragmappy != undefined && Rdshoulddopraid) {
                        if (RdAMPfrag() == false) {
                            if (!game.global.repeatMap) {
                                repeatClicked();
                            }
                        } else if (RdAMPfrag() == true) {
                            if (game.global.repeatMap) {
                                repeatClicked();
                                mapsClicked();
                            }
                            if (game.global.preMapsActive && RdAMPfragmappybought && RdAMPprefragmappy != undefined && Rdshoulddopraid) {
                                RdAMPfragmappybought = false;
                            }
                            if (RdAMPprefragmappy != undefined) {
                                recycleMap(getMapIndex(RdAMPprefragmappy));
                                RdAMPprefragmappy = undefined;
                            }
                            RdAMPfragcheck = true;
                            RdAMPfragfarming = false;
                        }
                    }
                } else {
                    RdAMPfragcheck = true;
                    RdAMPfragfarming = false;
                }
            }
            if (RdAMPfragcheck && RdAMPpMap5 == undefined && !RdAMPmapbought5 && game.global.preMapsActive && Rdshoulddopraid && RdAMPshouldrunmap(0)) {
                debug("Check complete for 5th map");
                RdAMPplusPres(0);
                if ((updateMapCost(true) <= game.resources.fragments.owned)) {
                    buyMap();
                    RdAMPmapbought5 = true;
                    if (RdAMPmapbought5) {
                        RdAMPpMap5 = game.global.mapsOwnedArray[game.global.mapsOwnedArray.length - 1].id;
                        debug("5th map bought");
                    }
                }
            }
            if (RdAMPfragcheck && RdAMPpMap4 == undefined && !RdAMPmapbought4 && game.global.preMapsActive && Rdshoulddopraid && RdAMPshouldrunmap(1)) {
                debug("Check complete for 4th map");
                RdAMPplusPres(1);
                if ((updateMapCost(true) <= game.resources.fragments.owned)) {
                    buyMap();
                    RdAMPmapbought4 = true;
                    if (RdAMPmapbought4) {
                        RdAMPpMap4 = game.global.mapsOwnedArray[game.global.mapsOwnedArray.length - 1].id;
                        debug("4th map bought");
                    }
                }
            }
            if (RdAMPfragcheck && RdAMPpMap3 == undefined && !RdAMPmapbought3 && game.global.preMapsActive && Rdshoulddopraid && RdAMPshouldrunmap(2)) {
                debug("Check complete for 3rd map");
                RdAMPplusPres(2);
                if ((updateMapCost(true) <= game.resources.fragments.owned)) {
                    buyMap();
                    RdAMPmapbought3 = true;
                    if (RdAMPmapbought3) {
                        RdAMPpMap3 = game.global.mapsOwnedArray[game.global.mapsOwnedArray.length - 1].id;
                        debug("3rd map bought");
                    }
                }
            }
            if (RdAMPfragcheck && RdAMPpMap2 == undefined && !RdAMPmapbought2 && game.global.preMapsActive && Rdshoulddopraid && RdAMPshouldrunmap(3)) {
                debug("Check complete for 2nd map");
                RdAMPplusPres(3);
                if ((updateMapCost(true) <= game.resources.fragments.owned)) {
                    buyMap();
                    RdAMPmapbought2 = true;
                    if (RdAMPmapbought2) {
                        RdAMPpMap2 = game.global.mapsOwnedArray[game.global.mapsOwnedArray.length - 1].id;
                        debug("2nd map bought");
                    }
                }
            }
            if (RdAMPfragcheck && RdAMPpMap1 == undefined && !RdAMPmapbought1 && game.global.preMapsActive && Rdshoulddopraid && RdAMPshouldrunmap(4)) {
                debug("Check complete for 1st map");
                RdAMPplusPres(4);
                if ((updateMapCost(true) <= game.resources.fragments.owned)) {
                    buyMap();
                    RdAMPmapbought1 = true;
                    if (RdAMPmapbought1) {
                        RdAMPpMap1 = game.global.mapsOwnedArray[game.global.mapsOwnedArray.length - 1].id;
                        debug("1st map bought");
                    }
                }
            }
            if (RdAMPfragcheck && !RdAMPmapbought1 && !RdAMPmapbought2 && !RdAMPmapbought3 && !RdAMPmapbought4 && !RdAMPmapbought5) {
                RdAMPpMap1 = undefined;
                RdAMPpMap2 = undefined;
                RdAMPpMap3 = undefined;
                RdAMPpMap4 = undefined;
                RdAMPpMap5 = undefined;
                debug("Failed to Prestige Raid. Looks like you can't afford to or have no equips to get!");
                Rdshoulddopraid = false;
                autoTrimpSettings["RAutoMaps"].value = 0;
            }
            if (RdAMPfragcheck && game.global.preMapsActive && !game.global.mapsActive && RdAMPmapbought1 && RdAMPpMap1 != undefined && Rdshoulddopraid) {
                debug("running map 1");
                selectedMap = RdAMPpMap1;
                selectMap(RdAMPpMap1);
                runMap();
                RlastMapWeWereIn = getCurrentMapObject();
                RdAMPrepMap1 = RdAMPpMap1;
                RdAMPpMap1 = undefined;
            }
            if (RdAMPfragcheck && game.global.preMapsActive && !game.global.mapsActive && RdAMPmapbought2 && RdAMPpMap2 != undefined && Rdshoulddopraid) {
                debug("running map 2");
                selectedMap = RdAMPpMap2;
                selectMap(RdAMPpMap2);
                runMap();
                RlastMapWeWereIn = getCurrentMapObject();
                RdAMPrepMap2 = RdAMPpMap2;
                RdAMPpMap2 = undefined;
            }
            if (RdAMPfragcheck && game.global.preMapsActive && !game.global.mapsActive && RdAMPmapbought3 && RdAMPpMap3 != undefined && Rdshoulddopraid) {
                debug("running map 3");
                selectedMap = RdAMPpMap3;
                selectMap(RdAMPpMap3);
                runMap();
                RlastMapWeWereIn = getCurrentMapObject();
                RdAMPrepMap3 = RdAMPpMap3;
                RdAMPpMap3 = undefined;
            }
            if (RdAMPfragcheck && game.global.preMapsActive && !game.global.mapsActive && RdAMPmapbought4 && RdAMPpMap4 != undefined && Rdshoulddopraid) {
                debug("running map 4");
                selectedMap = RdAMPpMap4;
                selectMap(RdAMPpMap4);
                runMap();
                RlastMapWeWereIn = getCurrentMapObject();
                RdAMPrepMap4 = RdAMPpMap4;
                RdAMPpMap4 = undefined;
            }
            if (RdAMPfragcheck && game.global.preMapsActive && !game.global.mapsActive && RdAMPmapbought5 && RdAMPpMap5 != undefined && Rdshoulddopraid) {
                debug("running map 5");
                selectedMap = RdAMPpMap5;
                selectMap(RdAMPpMap5);
                runMap();
                RlastMapWeWereIn = getCurrentMapObject();
                RdAMPrepMap5 = RdAMPpMap5;
                RdAMPpMap5 = undefined;
            }
        } else if (selectedMap == "create") {
            document.getElementById("mapLevelInput").value = game.global.world;
            var decrement;
            var tier;
            if (game.global.world >= customVars.RMapTierZone[0]) {
                tier = customVars.RMapTier0Sliders;
                decrement = [];
            } else if (game.global.world >= customVars.RMapTierZone[1]) {
                tier = customVars.RMapTier1Sliders;
                decrement = ['loot'];
            } else if (game.global.world >= customVars.RMapTierZone[2]) {
                tier = customVars.RMapTier2Sliders;
                decrement = ['loot'];
            } else {
                tier = customVars.RMapTier3Sliders;
                decrement = ['diff', 'loot'];
            }
            sizeAdvMapsRange.value = tier[0];
            adjustMap('size', tier[0]);
            difficultyAdvMapsRange.value = tier[1];
            adjustMap('difficulty', tier[1]);
            lootAdvMapsRange.value = tier[2];
            adjustMap('loot', tier[2]);
            biomeAdvMapsSelect.value = autoTrimpSettings.Rmapselection.selected == "Gardens" ? "Plentiful" : autoTrimpSettings.Rmapselection.selected;
            updateMapCost();
            if (RshouldFarm || game.global.challengeActive == 'Transmute') {
                biomeAdvMapsSelect.value = game.global.decayDone ? "Plentiful" : "Forest";
                updateMapCost();
            }
            if (Rshouldinsanityfarm && !Rshouldtimefarm && !Rdshouldtimefarm && !Rshouldtributefarm && !Rshoulddoquest && !Rshouldequipfarm && !Rshouldshipfarm && !Rshouldalchfarm && !Rshouldhypofarm) {
                var insanityfragcheck = true;
                if (getPageSetting('Rinsanityfarmfrag') == true) {
                    if (insanityfrag() == true) {
                        insanityfragcheck = true;
                        Rinsanityfragfarming = false;
                    } else if (insanityfrag() == false && Rshouldinsanityfarm) {
                        Rinsanityfragfarming = true;
                        insanityfragcheck = false;
                        if (!insanityfragcheck && insanityfragmappy == undefined && !insanityfragmappybought && game.global.preMapsActive && Rshouldinsanityfarm) {
                            debug("Check complete for insanity frag map");
                            insanityfragmap();
                            if ((updateMapCost(true) <= game.resources.fragments.owned)) {
                                buyMap();
                                insanityfragmappybought = true;
                                if (insanityfragmappybought) {
                                    insanityfragmappy = game.global.mapsOwnedArray[game.global.mapsOwnedArray.length - 1].id;
                                    debug("insanity frag map bought");
                                }
                            }
                        }
                        if (!insanityfragcheck && game.global.preMapsActive && !game.global.mapsActive && insanityfragmappybought && insanityfragmappy != undefined && Rshouldinsanityfarm) {
                            debug("running insanity frag map");
                            selectedMap = insanityfragmappy;
                            selectMap(insanityfragmappy);
                            runMap();
                            RlastMapWeWereIn = getCurrentMapObject();
                            insanityprefragmappy = insanityfragmappy;
                            insanityfragmappy = undefined;
                        }
                        if (!insanityfragcheck && game.global.mapsActive && insanityfragmappybought && insanityprefragmappy != undefined && Rshouldinsanityfarm) {
                            if (insanityfrag() == false) {
                                if (!game.global.repeatMap) {
                                    repeatClicked();
                                }
                            } else if (insanityfrag() == true) {
                                if (game.global.repeatMap) {
                                    repeatClicked();
                                    mapsClicked();
                                }
                                if (game.global.preMapsActive && insanityfragmappybought && insanityprefragmappy != undefined && Rshouldinsanityfarm) {
                                    insanityfragmappybought = false;
                                }
                                if (insanityprefragmappy != undefined) {
                                    recycleMap(getMapIndex(insanityprefragmappy));
                                    insanityprefragmappy = undefined;
                                }
                                insanityfragcheck = true;
                                Rinsanityfragfarming = false;
                            }
                        }
                    } else {
                        insanityfragcheck = true;
                        Rinsanityfragfarming = false;
                    }
                }
                if (insanityfragcheck && getPageSetting('Rinsanityfarmlevel') != 0) {

                    var insanityfarmlevel = getPageSetting('Rinsanityfarmlevel');

                    var insanityfarmlevelindex = insanityfarmzone.indexOf(game.global.world);
                    var insanitylevelzones = insanityfarmlevel[insanityfarmlevelindex];

                    if (insanityfarmzone.includes(game.global.world)) {
                        if (insanitylevelzones > 0) {
                            document.getElementById("mapLevelInput").value = game.global.world;
                            document.getElementById("advExtraLevelSelect").value = insanitylevelzones;
                        } else if (insanitylevelzones < 0) {
                            document.getElementById("mapLevelInput").value = (game.global.world + insanitylevelzones);
                            document.getElementById("advExtraLevelSelect").value = 0;
                        }
                    }
                }
                updateMapCost();
            }
            if (Rshouldalchfarm && !Rshouldhypofarm && !Rshouldtimefarm && !Rdshouldtimefarm && !Rshouldtributefarm && !Rshoulddoquest && !Rshouldequipfarm && !Rshouldshipfarm) {
                var alchfragcheck = true;
                if (getPageSetting('Ralchfarmfrag') == true) {
                    if (alchfrag() == true) {
                        alchfragcheck = true;
                        Ralchfragfarming = false;
                    } else if (alchfrag() == false && Rshouldalchfarm) {
                        Ralchfragfarming = true;
                        alchfragcheck = false;
                        if (!alchfragcheck && alchfragmappy == undefined && !alchfragmappybought && game.global.preMapsActive && Rshouldalchfarm) {
                            debug("Check complete for alch frag map");
                            alchfragmap();
                            if ((updateMapCost(true) <= game.resources.fragments.owned)) {
                                buyMap();
                                alchfragmappybought = true;
                                if (alchfragmappybought) {
                                    alchfragmappy = game.global.mapsOwnedArray[game.global.mapsOwnedArray.length - 1].id;
                                    debug("alch frag map bought");
                                }
                            }
                        }
                        if (!alchfragcheck && game.global.preMapsActive && !game.global.mapsActive && alchfragmappybought && alchfragmappy != undefined && Rshouldalchfarm) {
                            debug("running alch frag map");
                            selectedMap = alchfragmappy;
                            selectMap(alchfragmappy);
                            runMap();
                            RlastMapWeWereIn = getCurrentMapObject();
                            alchprefragmappy = alchfragmappy;
                            alchfragmappy = undefined;
                        }
                        if (!alchfragcheck && game.global.mapsActive && alchfragmappybought && alchprefragmappy != undefined && Rshouldalchfarm) {
                            if (alchfrag() == false) {
                                if (!game.global.repeatMap) {
                                    repeatClicked();
                                }
                            } else if (alchfrag() == true) {
                                if (game.global.repeatMap) {
                                    repeatClicked();
                                    mapsClicked();
                                }
                                if (game.global.preMapsActive && alchfragmappybought && alchprefragmappy != undefined && Rshouldalchfarm) {
                                    alchfragmappybought = false;
                                }
                                if (alchprefragmappy != undefined) {
                                    recycleMap(getMapIndex(alchprefragmappy));
                                    alchprefragmappy = undefined;
                                }
                                alchfragcheck = true;
                                Ralchfragfarming = false;
                            }
                        }
                    } else {
                        alchfragcheck = true;
                        Ralchfragfarming = false;
                    }
                }
                if (alchfragcheck && getPageSetting('Ralchfarmlevel') != 0) {
                    if (alchfarmzone.includes(game.global.world)) {
                        if (Rshouldalchfarm) {

                            var alchfarmzone = getPageSetting('Ralchfarmzone');
                            var alchfarmlevel = getPageSetting('Ralchfarmlevel');
                            var alchfarmselection = getPageSetting('Ralchfarmselection')

                            var alchfarmlevelindex = alchfarmzone.indexOf(game.global.world);
                            var alchlevelzones = alchfarmlevel[alchfarmlevelindex];
                            var alchfarmselectionindex = alchfarmzone.indexOf(game.global.world);
                            var selection = alchfarmselection[alchfarmselectionindex];
                            if (selection == 'Mountain') selection = "Mountain";
                            else if (selection == 'Forest') selection = "Forest";
                            else if (selection == 'Sea') selection = "Sea";
                            else if (selection == 'Depths') selection = "Depths";
                            else if (selection == 'Plentiful') selection = "Plentiful";
                            else if (selection == 'Farmlands') selection = "Farmlands";

                            alchfragmin(alchlevelzones, selection);
                        }
                    }
                }
                updateMapCost();
            }
            if (Rshouldhypofarm && !Rshouldtimefarm && !Rdshouldtimefarm && !Rshouldtributefarm && !Rshoulddoquest && !Rshouldequipfarm) {
                var hypofragcheck = true;
                if (getPageSetting('Rhypofarmfrag') == true) {
                    if (hypofrag() == true) {
                        hypofragcheck = true;
                        Rhypofragfarming = false;
                    } else if (hypofrag() == false && Rshouldhypofarm) {
                        Rhypofragfarming = true;
                        hypofragcheck = false;
                        if (!hypofragcheck && hypofragmappy == undefined && !hypofragmappybought && game.global.preMapsActive && Rshouldhypofarm) {
                            debug("Check complete for hypo frag map");
                            hypofragmap();
                            if ((updateMapCost(true) <= game.resources.fragments.owned)) {
                                buyMap();
                                hypofragmappybought = true;
                                if (hypofragmappybought) {
                                    hypofragmappy = game.global.mapsOwnedArray[game.global.mapsOwnedArray.length - 1].id;
                                    debug("hypo frag map bought");
                                }
                            }
                        }
                        if (!hypofragcheck && game.global.preMapsActive && !game.global.mapsActive && hypofragmappybought && hypofragmappy != undefined && Rshouldhypofarm) {
                            debug("running hypo frag map");
                            selectedMap = hypofragmappy;
                            selectMap(hypofragmappy);
                            runMap();
                            RlastMapWeWereIn = getCurrentMapObject();
                            hypoprefragmappy = hypofragmappy;
                            hypofragmappy = undefined;
                        }
                        if (!hypofragcheck && game.global.mapsActive && hypofragmappybought && hypoprefragmappy != undefined && Rshouldhypofarm) {
                            if (hypofrag() == false) {
                                if (!game.global.repeatMap) {
                                    repeatClicked();
                                }
                            } else if (hypofrag() == true) {
                                if (game.global.repeatMap) {
                                    repeatClicked();
                                    mapsClicked();
                                }
                                if (game.global.preMapsActive && hypofragmappybought && hypoprefragmappy != undefined && Rshouldhypofarm) {
                                    hypofragmappybought = false;
                                }
                                if (hypoprefragmappy != undefined) {
                                    recycleMap(getMapIndex(hypoprefragmappy));
                                    hypoprefragmappy = undefined;
                                }
                                hypofragcheck = true;
                                Rhypofragfarming = false;
                            }
                        }
                    } else {
                        hypofragcheck = true;
                        Rhypofragfarming = false;
                    }
                }
                if (hypofragcheck && getPageSetting('Rhypofarmlevel') != 0) {

                    var hypofarmlevel = getPageSetting('Rhypofarmlevel');

                    var hypofarmlevelindex = hypofarmzone.indexOf(game.global.world);
                    var hypolevelzones = hypofarmlevel[hypofarmlevelindex];

                    if (hypofarmzone.includes(game.global.world)) {
                        if (hypolevelzones > 0) {
                            document.getElementById("mapLevelInput").value = game.global.world;
                            document.getElementById("advExtraLevelSelect").value = hypolevelzones;
                        } else if (hypolevelzones == 0) {
                            document.getElementById("mapLevelInput").value = game.global.world;
                            document.getElementById("advExtraLevelSelect").value = 0;
                        } else if (hypolevelzones < 0) {
                            document.getElementById("mapLevelInput").value = (game.global.world + hypolevelzones);
                            document.getElementById("advExtraLevelSelect").value = 0;
                        }
                    }
                }
                updateMapCost();
            }
            if (Rshouldshipfarm && !Rshouldtimefarm && !Rdshouldtimefarm && !Rshouldtributefarm && !Rshoulddoquest && !Rshouldequipfarm) {
                var shipfragcheck = true;
                if (getPageSetting('Rshipfarmfrag') == true) {
                    if (shipfrag() == true) {
                        shipfragcheck = true;
                        Rshipfragfarming = false;
                    } else if (shipfrag() == false && Rshouldshipfarm) {
                        Rshipfragfarming = true;
                        shipfragcheck = false;
                        if (!shipfragcheck && shipfragmappy == undefined && !shipfragmappybought && game.global.preMapsActive && Rshouldshipfarm) {
                            debug("Check complete for ship frag map");
                            shipfragmap();
                            if ((updateMapCost(true) <= game.resources.fragments.owned)) {
                                buyMap();
                                shipfragmappybought = true;
                                if (shipfragmappybought) {
                                    shipfragmappy = game.global.mapsOwnedArray[game.global.mapsOwnedArray.length - 1].id;
                                    debug("ship frag map bought");
                                }
                            }
                        }
                        if (!shipfragcheck && game.global.preMapsActive && !game.global.mapsActive && shipfragmappybought && shipfragmappy != undefined && Rshouldshipfarm) {
                            debug("running ship frag map");
                            selectedMap = shipfragmappy;
                            selectMap(shipfragmappy);
                            runMap();
                            RlastMapWeWereIn = getCurrentMapObject();
                            shipprefragmappy = shipfragmappy;
                            shipfragmappy = undefined;
                        }
                        if (!shipfragcheck && game.global.mapsActive && shipfragmappybought && shipprefragmappy != undefined && Rshouldshipfarm) {
                            if (shipfrag() == false) {
                                if (!game.global.repeatMap) {
                                    repeatClicked();
                                }
                            } else if (shipfrag() == true) {
                                if (game.global.repeatMap) {
                                    repeatClicked();
                                    mapsClicked();
                                }
                                if (game.global.preMapsActive && shipfragmappybought && shipprefragmappy != undefined && Rshouldshipfarm) {
                                    shipfragmappybought = false;
                                }
                                if (shipprefragmappy != undefined) {
                                    recycleMap(getMapIndex(shipprefragmappy));
                                    shipprefragmappy = undefined;
                                }
                                shipfragcheck = true;
                                Rshipfragfarming = false;
                            }
                        }
                    } else {
                        shipfragcheck = true;
                        Rshipfragfarming = false;
                    }
                }
                if (shipfragcheck && getPageSetting('Rshipfarmlevel') != 0) {

                    var shipfarmlevel = getPageSetting('Rshipfarmlevel');

                    var shipfarmlevelindex = shipfarmzone.indexOf(game.global.world);
                    var shiplevelzones = shipfarmlevel[shipfarmlevelindex];

                    if (shipfarmzone.includes(game.global.world)) {
                        if (shiplevelzones > 0) {
                            document.getElementById("mapLevelInput").value = game.global.world;
                            document.getElementById("advExtraLevelSelect").value = shiplevelzones;
                        } else if (shiplevelzones == 0) {
                            document.getElementById("mapLevelInput").value = game.global.world;
                            document.getElementById("advExtraLevelSelect").value = 0;
                        } else if (shiplevelzones < 0) {
                            document.getElementById("mapLevelInput").value = (game.global.world + shiplevelzones);
                            document.getElementById("advExtraLevelSelect").value = 0;
                        }
                    }
                }
                updateMapCost();
            }
            if (Rshouldtimefarm && !Rdshouldtimefarm && !Rshouldtributefarm && !Rshoulddoquest) {
                if (getPageSetting('Rtimefarmlevel') != 0) {

                    var timefarmlevel = getPageSetting('Rtimefarmlevel');

                    var timefarmlevelindex = timefarmzone.indexOf(game.global.world);
                    var levelzones = timefarmlevel[timefarmlevelindex];

                    if (timefarmzone.includes(game.global.world)) {
                        if (levelzones > 0) {
                            document.getElementById("mapLevelInput").value = game.global.world;
                            document.getElementById("advExtraLevelSelect").value = levelzones;
                        } else if (levelzones < 0) {
                            document.getElementById("mapLevelInput").value = (game.global.world - 1);
                        }
                    }
                }
                biomeAdvMapsSelect.value = autoTrimpSettings.Rtimefarmmap.value[timefarmlevelindex];
                document.getElementById("advSpecialSelect").value = autoTrimpSettings.Rtimefarmspecial.value[timefarmlevelindex];
                updateMapCost();
            }
            if (Rdshouldtimefarm && !Rshouldtributefarm && !Rshoulddoquest) {
                if (getPageSetting('Rdtimefarmlevel') != 0) {

                    var dtimefarmlevel = getPageSetting('Rdtimefarmlevel');

                    var dtimefarmlevelindex = dtimefarmzone.indexOf(game.global.world);
                    var dlevelzones = dtimefarmlevel[dtimefarmlevelindex];

                    if (dtimefarmzone.includes(game.global.world)) {
                        if (dlevelzones > 0) {
                            document.getElementById("mapLevelInput").value = game.global.world;
                            document.getElementById("advExtraLevelSelect").value = dlevelzones;
                        } else if (dlevelzones < 0) {
                            document.getElementById("mapLevelInput").value = (game.global.world - 1);
                        }
                    }
                }
                biomeAdvMapsSelect.value = autoTrimpSettings.Rdtimefarmmap.value[dtimefarmlevelindex];
                document.getElementById("advSpecialSelect").value = autoTrimpSettings.Rdtimefarmspecial.value[dtimefarmlevelindex];
                updateMapCost();
            }
            if (Rshouldtributefarm && !Rshoulddoquest) {
                if (getPageSetting('Rtributefarmlevel') != 0) {

                    var tributefarmlevel = getPageSetting('Rtributefarmlevel');
                    var tributefarmzone = getPageSetting('Rtributefarmzone');
                    var tributefarmlevelindex = tributefarmzone.indexOf(game.global.world);
                    var levelzones = tributefarmlevel[tributefarmlevelindex];

                    if (tributefarmzone.includes(game.global.world)) {
                        if (levelzones > 0) {
                            document.getElementById("mapLevelInput").value = game.global.world;
                            document.getElementById("advExtraLevelSelect").value = levelzones;
                        } else if (levelzones < 0) {
                            document.getElementById("mapLevelInput").value = (game.global.world - 1);
                        }
                    }
                }
                biomeAdvMapsSelect.value = autoTrimpSettings.Rtributemapselection.value[tributefarmlevelindex];
                document.getElementById("advSpecialSelect").value = autoTrimpSettings.Rtributespecialselection.value[tributefarmlevelindex];
                updateMapCost();
            }
            if (Rshoulddoquest) {
                biomeAdvMapsSelect.value = "Plentiful";
                if (Rshoulddoquest == 4) {
                    document.getElementById("advSpecialSelect").value = "hc";
                    updateMapCost();
                    if (updateMapCost(true) > game.resources.fragments.owned) {
                        document.getElementById("advSpecialSelect").value = "fa";
                        updateMapCost();
                        if (updateMapCost(true) > game.resources.fragments.owned) {
                            document.getElementById("advSpecialSelect").value = 0;
                            updateMapCost();
                        }
                    }
                }
                if (Rshoulddoquest == 7) {
                    document.getElementById("advSpecialSelect").value = "hc";
                    updateMapCost();
                    if (updateMapCost(true) > game.resources.fragments.owned) {
                        document.getElementById("advSpecialSelect").value = "lc";
                        updateMapCost();
                        if (updateMapCost(true) > game.resources.fragments.owned) {
                            document.getElementById("advSpecialSelect").value = "fa";
                            updateMapCost();
                            if (updateMapCost(true) > game.resources.fragments.owned) {
                                document.getElementById("advSpecialSelect").value = 0;
                                updateMapCost();
                            }
                        }
                    }
                }
                if (Rshoulddoquest == 10) {
                    document.getElementById("advSpecialSelect").value = "lsc";
                    updateMapCost();
                    if (updateMapCost(true) > game.resources.fragments.owned) {
                        document.getElementById("advSpecialSelect").value = "ssc";
                        updateMapCost();
                        if (updateMapCost(true) > game.resources.fragments.owned) {
                            document.getElementById("advSpecialSelect").value = "fa";
                            updateMapCost();
                            if (updateMapCost(true) > game.resources.fragments.owned) {
                                document.getElementById("advSpecialSelect").value = 0;
                                updateMapCost();
                            }
                        }
                    }
                }
                if (Rshoulddoquest == 11) {
                    document.getElementById("advSpecialSelect").value = "lwc";
                    updateMapCost();
                    if (updateMapCost(true) > game.resources.fragments.owned) {
                        document.getElementById("advSpecialSelect").value = "swc";
                        updateMapCost();
                        if (updateMapCost(true) > game.resources.fragments.owned) {
                            document.getElementById("advSpecialSelect").value = "fa";
                            updateMapCost();
                            if (updateMapCost(true) > game.resources.fragments.owned) {
                                document.getElementById("advSpecialSelect").value = 0;
                                updateMapCost();
                            }
                        }
                    }
                }
                if (Rshoulddoquest == 12) {
                    document.getElementById("advSpecialSelect").value = "lmc";
                    updateMapCost();
                    if (updateMapCost(true) > game.resources.fragments.owned) {
                        document.getElementById("advSpecialSelect").value = "smc";
                        updateMapCost();
                        if (updateMapCost(true) > game.resources.fragments.owned) {
                            document.getElementById("advSpecialSelect").value = "fa";
                            updateMapCost();
                            if (updateMapCost(true) > game.resources.fragments.owned) {
                                document.getElementById("advSpecialSelect").value = 0;
                                updateMapCost();
                            }
                        }
                    }
                }
                if (Rshoulddoquest == 13) {
                    document.getElementById("advSpecialSelect").value = "fa";
                    updateMapCost();
                    if (updateMapCost(true) > game.resources.fragments.owned) {
                        document.getElementById("advSpecialSelect").value = 0;
                        updateMapCost();
                    }
                }
                if (Rshoulddoquest == 14) {
                    document.getElementById("advSpecialSelect").value = "fa";
                    updateMapCost();
                    if (updateMapCost(true) > game.resources.fragments.owned) {
                        document.getElementById("advSpecialSelect").value = 0;
                        updateMapCost();
                    }
                }
                if (updateMapCost(true) > game.resources.fragments.owned) {
                    biomeAdvMapsSelect.value = "Random";
                    updateMapCost();
                }
            }
            if (Rshouldmayhem > 0 && getPageSetting('Rmayhemmap') == 2 && !Rshouldtimefarm && !Rdshouldtimefarm) {
                mapLevelInput.value = game.global.world;
                biomeAdvMapsSelect.value = "Random";
                document.getElementById("advSpecialSelect").value = "fa";
                document.getElementById("advExtraLevelSelect").value = mayhemextra;
                updateMapCost();
                if (updateMapCost(true) > game.resources.fragments.owned) {
                    console.log("cant afford this shit dumbass btw mayhemextra is " + mayhemextra);
                }
            }
            if (Rshouldpanda && getPageSetting('Rpandamaps') == true && !Rshouldtimefarm && !Rdshouldtimefarm) {
                mapLevelInput.value = game.global.world;
                biomeAdvMapsSelect.value = "Random";
                document.getElementById("advSpecialSelect").value = "fa";
                document.getElementById("advExtraLevelSelect").value = pandaextra;
                updateMapCost();
                if (updateMapCost(true) > game.resources.fragments.owned) {
                    console.log("Cant afford this shit dumbass btw pandaextra is " + pandaextra);
                }
            }
            if (Rshouldequipfarm) {
                mapLevelInput.value = game.global.world + equipminus;
                biomeAdvMapsSelect.value = "Plentiful";
                document.getElementById("advSpecialSelect").value = "lmc";
                document.getElementById("advExtraLevelSelect").value = 0;
                updateMapCost();
            }
            if (updateMapCost(true) > game.resources.fragments.owned) {
                if (!RenoughDamage) decrement.push('diff');
                if (RshouldFarm) decrement.push('size');
            }
            while (decrement.indexOf('loot') > -1 && lootAdvMapsRange.value > 0 && updateMapCost(true) > game.resources.fragments.owned) {
                lootAdvMapsRange.value -= 1;
            }
            while (decrement.indexOf('diff') > -1 && difficultyAdvMapsRange.value > 0 && updateMapCost(true) > game.resources.fragments.owned) {
                difficultyAdvMapsRange.value -= 1;
            }
            while (decrement.indexOf('size') > -1 && sizeAdvMapsRange.value > 0 && updateMapCost(true) > game.resources.fragments.owned) {
                sizeAdvMapsRange.value -= 1;
            }
            while (lootAdvMapsRange.value > 0 && updateMapCost(true) > game.resources.fragments.owned) {
                lootAdvMapsRange.value -= 1;
            }
            while (difficultyAdvMapsRange.value > 0 && updateMapCost(true) > game.resources.fragments.owned) {
                difficultyAdvMapsRange.value -= 1;
            }
            while (sizeAdvMapsRange.value > 0 && updateMapCost(true) > game.resources.fragments.owned) {
                sizeAdvMapsRange.value -= 1;
            }
            var maplvlpicked = parseInt(document.getElementById("mapLevelInput").value);
            if (updateMapCost(true) > game.resources.fragments.owned) {
                selectMap(game.global.mapsOwnedArray[highestMap].id);
                debug("Can't afford the map we designed, #" + maplvlpicked, "maps", '*crying2');
                debug("...selected our highest map instead # " + game.global.mapsOwnedArray[highestMap].id + " Level: " + game.global.mapsOwnedArray[highestMap].level, "maps", '*happy2');
                runMap();
                RlastMapWeWereIn = getCurrentMapObject();
            } else {
                debug("Buying a Map, level: #" + maplvlpicked, "maps", 'th-large');
                var result = buyMap();
                if (result == -2) {
                    debug("Too many maps, recycling now: ", "maps", 'th-large');
                    recycleBelow(true);
                    debug("Retrying, Buying a Map, level: #" + maplvlpicked, "maps", 'th-large');
                    result = buyMap();
                    if (result == -2) {
                        recycleMap(lowestMap);
                        result = buyMap();
                        if (result == -2)
                            debug("AutoMaps unable to recycle to buy map!");
                        else
                            debug("Retrying map buy after recycling lowest level map");
                    }
                }
            }
        } else {
            selectMap(selectedMap);
            var themapobj = game.global.mapsOwnedArray[getMapIndex(selectedMap)];
            var levelText;
            if (themapobj.level > 0) {
                levelText = " Level: " + themapobj.level;
            } else {
                levelText = " Level: " + game.global.world;
            }
            var voidorLevelText = themapobj.location == "Void" ? " Void: " : levelText;
            debug("Running selected " + selectedMap + voidorLevelText + " Name: " + themapobj.name, "maps", 'th-large');
            runMap();
            RlastMapWeWereIn = getCurrentMapObject();
        }
    }
}
