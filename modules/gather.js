//updated
MODULES["gather"] = {};
//These can be changed (in the console) if you know what you're doing:
MODULES["gather"].minScienceAmount = 100;
MODULES["gather"].minScienceSeconds = 60;

//Global flags
var trapBuffering = false, maxTrapBuffering = false;
var maxZoneDuration = 0;

//Traps per second
fuction calcTPS() {
	Math.min(10, game.global.playerModifier / 5);
}

function calcMaxTraps() {
	//TODO consider minZone > 1
	//Tries to keep in mind the longest duration any zone has lasted in this portal
	var time = getZoneSeconds();
	if (game.global.world == 1) maxZoneDuration = time;
	if (time > maxZoneDuration) maxZoneDuration = time;
	
	//Return enough traps to last 1/4 of the longest duration zone we've seen so far
	return Math.ceil(calcTPS() * time/4);
}

//OLD: "Auto Gather/Build"
function manualLabor2() {
	//If not using auto-gather, return
	if (getPageSetting('ManualGather2') == 0) return;
	
	//Init
	var trapsPS
	var minTraps = Math.ceil(calcTPS());
	var trapsBufferSize = Math.ceil(5 * calcTPS());
	var maxTraps = calcMaxTraps();
	var lowOnTraps = game.buildings.Trap.owned < minTraps;
	var trapsReady = game.buildings.Trap.owned >= minTraps + trapsBufferSize;
	var fullOfTraps = game.buildings.Trap.owned >= maxTraps + maxTrapBuffering ? trapsBufferSize : 0;
	var breedingTrimps = game.resources.trimps.owned - game.resources.trimps.employed;
	var notFullPop = game.resources.trimps.owned < game.resources.trimps.realMax();
	var trapTrimpsOK = getPageSetting('TrapTrimps');
	var targetBreed = getPageSetting('GeneticistTimer');
	var trapperTrapUntilFull = game.global.challengeActive == "Trapper" && notFullPop;
	var hasTurkimp = game.talents.turkimp2.purchased || game.global.turkimpTimer > 0;
	var needScience = game.resources.science.owned < scienceNeeded;
	var researchAvailable = document.getElementById('scienceCollectBtn').style.display != 'none' && document.getElementById('science').style.visibility != 'hidden';
	if (trapsReady) trapBuffering = false;
	if (fullOfTraps) trapBuffering = false;
	
	//Highest Priority Trapping (Early Game, when trapping is mandatory)
	if (game.global.world <= 3 && game.global.totalHeliumEarned <= 500000) {
		//If not building and not trapping 
		if (game.global.buildingsQueue.length == 0 && (game.global.playerGathering != 'trimps' || game.buildings.Trap.owned == 0)) {
			//Gather food or wood
			if (game.resources.food.owned < 10) {setGather('food'); return;}
			else if (game.triggers.wood.done && game.resources.wood.owned < 10) {setGather('wood'); return;}
		}
	}
	
	//High Priority Trapping (doing Trapper or without breeding trimps)
	if (trapTrimpsOK && (breedingTrimps < 5 || trapperTrapUntilFull)) {
		//Bait trimps if we have traps
		if (!lowOnTrap && !trapBuffering) {setGather('trimps'); return;}
		
		//Or build them, if they are on the queue
		else if (isBuildingInQueue('Trap') || safeBuyBuilding('Trap')) {
			trapBuffering = true;
			setGather('buildings');
			return;
		}
	}
	
	//Highest Priority Science gathering if we have less science than minScience
	if (getPageSetting('ManualGather2') != 2 && game.resources.science.owned < MODULES["gather"].minScienceAmount && document.getElementById('scienceCollectBtn').style.display != 'none' && document.getElementById('science').style.visibility != 'hidden') {
		setGather('science');
		return;
	}
	
	//Build if we don't have foremany, there are 2+ buildings in the queue, or if we can speed up something other than a trap
	if (!bwRewardUnlocked("Foremany") && game.global.buildingsQueue.length && (game.global.buildingsQueue.length > 1 || game.global.autoCraftModifier == 0 || (getPlayerModifier() > 100 && game.global.buildingsQueue[0] != 'Trap.1'))) {
		setGather('buildings');
		return;
	}
	
	//Also Build if we have storage buildings on top of the queue
	if (!bwRewardUnlocked("Foremany") && game.global.buildingsQueue.length && game.global.buildingsQueue[0] == 'Barn.1' || game.global.buildingsQueue[0] == 'Shed.1' || game.global.buildingsQueue[0] == 'Forge.1') {
		setGather('buildings');
		return;
	}
	
	//High Priority Research - When manual research still has more impact than scientists
	if (getPageSetting('ManualGather2') != 2 && researchAvailable && needScience && getPlayerModifier() > getPerSecBeforeManual('Scientist')) {
		setGather('science');
		return;
	}
	
	//Metal if Turkimp is active
	if (hasTurkimp) {setGather('metal'); return;}
	
	//Mid Priority Research
	if (getPageSetting('ManualGather2') != 2 && researchAvailable && needScience) {setGather('science'); return;}
	
	//Low Priority Trapping
	if (trapTrimpsOK && notFullPop && !lowOnTraps && !trapBuffering) {setGather('trimps'); return;}
	
	//Low Priority Trap Building
	if (trapTrimpsOK && canAffordBuilding('Trap') && !fullOfTraps) {
		trapBuffering = true;
		maxTrapBuffering = true;
		safeBuyBuilding('Trap');
		setGather('buildings');
		return;
	}
	
	//Untouched mess
	var manualResourceList = {
		'food': 'Farmer',
		'wood': 'Lumberjack',
		'metal': 'Miner',
	};
	var lowestResource = 'food';
	var lowestResourceRate = -1;
	var haveWorkers = true;
	for (var resource in manualResourceList) {
		var job = manualResourceList[resource];
		var currentRate = game.jobs[job].owned * game.jobs[job].modifier;
		// debug('Current rate for ' + resource + ' is ' + currentRate + ' is hidden? ' + (document.getElementById(resource).style.visibility == 'hidden'));
		if (document.getElementById(resource).style.visibility != 'hidden') {
			//find the lowest resource rate
			if (currentRate === 0) {
				currentRate = game.resources[resource].owned;
				// debug('Current rate for ' + resource + ' is ' + currentRate + ' lowest ' + lowestResource + lowestResourceRate);
				if ((haveWorkers) || (currentRate < lowestResourceRate)) {
					// debug('New Lowest1 ' + resource + ' is ' + currentRate + ' lowest ' + lowestResource + lowestResourceRate+ ' haveworkers ' +haveWorkers);
					haveWorkers = false;
					lowestResource = resource;
					lowestResourceRate = currentRate;
				}
			}
			if ((currentRate < lowestResourceRate || lowestResourceRate == -1) && haveWorkers) {
				// debug('New Lowest2 ' + resource + ' is ' + currentRate + ' lowest ' + lowestResource + lowestResourceRate);
				lowestResource = resource;
				lowestResourceRate = currentRate;
			}
		}
	}
	
	//High Priority Gathering - No workers for this resource
	if (game.global.playerGathering != lowestResource && !haveWorkers && !breedFire) {setGather(lowestResource); return;}
	
	//Low Priority Research
	if (getPageSetting('ManualGather2') != 2 && researchAvailable && haveWorkers) {
		if (game.resources.science.owned < getPsString('science', true) * MODULES["gather"].minScienceSeconds) {
			setGather('science');
			return;
		}
	}
	
	//Just gather whatever has lowest rate
	setGather(lowestResource);
}

function autogather3() {
	//Build if there are multiple things on queue, mine otherwise
	if (getPageSetting('gathermetal') == true || game.global.buildingsQueue.length <= 1) setGather('metal');
	else setGather('buildings')
}

//RGather

MODULES["gather"].RminScienceAmount = 200;

function RmanualLabor2() {	
    //Vars
    var lowOnTraps = game.buildings.Trap.owned < 5;
    var trapTrimpsOK = getPageSetting('RTrapTrimps');
    var hasTurkimp = game.talents.turkimp2.purchased || game.global.turkimpTimer > 0;
    var needToTrap = (game.resources.trimps.max - game.resources.trimps.owned >= game.resources.trimps.max * 0.05) || (game.resources.trimps.getCurrentSend() > game.resources.trimps.owned - game.resources.trimps.employed);
    var fresh = false;
    //ULTRA FRESH
    if (!game.upgrades.Battle.done) {
	fresh = true;
	if (game.resources.food.owned < 10) {
	    setGather('food');
	}
	if (game.resources.wood.owned < 10 && game.resources.food.owned >= 10) {
	    setGather('wood');
	}
	if (game.resources.food.owned >= 10 && game.resources.wood.owned >= 10) {
	    safeBuyBuilding('Trap');
	}
	if (game.buildings.Trap.owned > 0 && game.resources.trimps.owned < 1) {
	    setGather('trimps');
	}
	if (game.resources.trimps.owned >= 1) {
	    setGather('science');
	}
	return;
    }
    if (game.upgrades.Battle.done && game.upgrades.Scientists.allowed && !game.upgrades.Scientists.done && game.resources.science.owned < 100) {
	fresh = true;
	setGather('science');
	return;
    }
    if (game.upgrades.Battle.done && game.upgrades.Miners.allowed && !game.upgrades.Miners.done && game.resources.science.owned < 60) {
	fresh = true;
	setGather('science');
	return;
    }
	
    //FRESH GAME NO RADON CODE.
    if (!fresh && game.global.world <=3 && game.global.totalRadonEarned<=5000) {
        if (game.global.buildingsQueue.length == 0 && (game.global.playerGathering != 'trimps' || game.buildings.Trap.owned == 0)){
            if (!game.triggers.wood.done || game.resources.food.owned < 10 || Math.floor(game.resources.food.owned) < Math.floor(game.resources.wood.owned))
                setGather('food');
            else
                setGather('wood');
        }
	return;
    }
    if (game.global.challengeActive == "Quest" && (questcheck() == 10 || questcheck() == 20)) {
	setGather('food');
    }
    else if (game.global.challengeActive == "Quest" && (questcheck() == 11 || questcheck() == 21)) {
	setGather('wood');
    }
    else if (game.global.challengeActive == "Quest" && (questcheck() == 12 || questcheck() == 22)) {
	setGather('metal');
    }
    else if (game.global.challengeActive == "Quest" && (questcheck() == 14 || questcheck() == 24)) {
	setGather('science');
    }
    else if ((Rshouldtimefarm || Rshouldtimefarmbogs) && (autoTrimpSettings.Rtimespecialselection.selected == "ssc" || autoTrimpSettings.Rtimespecialselection.selected == "lsc")) {
	     setGather('food');
    }
    else if ((Rshouldtimefarm || Rshouldtimefarmbogs) && (autoTrimpSettings.Rtimespecialselection.selected == "swc" || autoTrimpSettings.Rtimespecialselection.selected == "lwc")) {
	     setGather('wood');
    }
    else if ((Rshouldtimefarm || Rshouldtimefarmbogs) && (autoTrimpSettings.Rtimespecialselection.selected == "smc" || autoTrimpSettings.Rtimespecialselection.selected == "lmc")) {
	     setGather('metal');
    }
    else if (getPageSetting('RManualGather2') != 2 && game.resources.science.owned < MODULES["gather"].RminScienceAmount && document.getElementById('scienceCollectBtn').style.display != 'none' && document.getElementById('science').style.visibility != 'hidden') {
             setGather('science');
    }
    else if (game.resources.science.owned < (RscienceNeeded*0.8) && document.getElementById('scienceCollectBtn').style.display != 'none' && document.getElementById('science').style.visibility != 'hidden') {
	     setGather('science');
    }
    else if (trapTrimpsOK && needToTrap && game.buildings.Trap.owned == 0 && canAffordBuilding('Trap')) {
         if (!safeBuyBuilding('Trap'))
             setGather('buildings');
    }
    else if (trapTrimpsOK && needToTrap && game.buildings.Trap.owned > 0) {
             setGather('trimps');
    }
    else if (!bwRewardUnlocked("Foremany") && (game.global.buildingsQueue.length ? (game.global.buildingsQueue.length > 1 || game.global.autoCraftModifier == 0 || (getPlayerModifier() > 100 && game.global.buildingsQueue[0] != 'Trap.1')) : false)) {
             setGather('buildings');
    }
    else if (!game.global.trapBuildToggled && (game.global.buildingsQueue[0] == 'Barn.1' || game.global.buildingsQueue[0] == 'Shed.1' || game.global.buildingsQueue[0] == 'Forge.1')){
             setGather('buildings');
    }
    else if (game.resources.science.owned >= RscienceNeeded && document.getElementById('scienceCollectBtn').style.display != 'none' && document.getElementById('science').style.visibility != 'hidden') {
        if (game.global.challengeActive != "Transmute" && (getPlayerModifier() < getPerSecBeforeManual('Scientist') && hasTurkimp)||getPageSetting('RManualGather2') == 2){
            setGather('metal');
        }
        else if (getPageSetting('RManualGather2') != 2){
                 setGather('science');
        }
    }
    else if (trapTrimpsOK){
        if (game.buildings.Trap.owned < 5 && canAffordBuilding('Trap')) {
            safeBuyBuilding('Trap');
            setGather('buildings');
        }
    else if (game.buildings.Trap.owned > 0)
             setGather('trimps');
    }
    else {
        var manualResourceList = {
            'food': 'Farmer',
            'wood': 'Lumberjack',
            'metal': 'Miner',
        };
        var lowestResource = 'food';
        var lowestResourceRate = -1;
        var haveWorkers = true;
        for (var resource in manualResourceList) {
             var job = manualResourceList[resource];
             var currentRate = game.jobs[job].owned * game.jobs[job].modifier;
             if (document.getElementById(resource).style.visibility != 'hidden') {
                 if (currentRate === 0) {
                     currentRate = game.resources[resource].owned;
                     if ((haveWorkers) || (currentRate < lowestResourceRate)) {
                         haveWorkers = false;
                         lowestResource = resource;
                         lowestResourceRate = currentRate;
                     }
                }
                if ((currentRate < lowestResourceRate || lowestResourceRate == -1) && haveWorkers) {
                    lowestResource = resource;
                    lowestResourceRate = currentRate;
                }
            }
         }
        if (game.global.challengeActive == "Transmute" && game.global.playerGathering != lowestResource && !haveWorkers && !breedFire) {
            if (hasTurkimp)
                setGather('metal');
            else
                setGather(lowestResource);
        } else if (getPageSetting('RManualGather2') != 2 && document.getElementById('scienceCollectBtn').style.display != 'none' && document.getElementById('science').style.visibility != 'hidden') {
            if (game.resources.science.owned < getPsString('science', true) * MODULES["gather"].minScienceSeconds && game.global.turkimpTimer < 1 && haveWorkers)
                setGather('science');
            else if (game.global.challengeActive == "Transmute" && hasTurkimp)
                     setGather('metal');
            else
                setGather(lowestResource);
        }
        else if(trapTrimpsOK && game.global.trapBuildToggled == true && lowOnTraps)
            setGather('buildings');
        else
            setGather(lowestResource);
    }
}
