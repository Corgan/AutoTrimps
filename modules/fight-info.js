;(function(M) {
	M["fightinfo"] = {};
	M["fightinfo"].$worldGrid = document.getElementById('grid');
	M["fightinfo"].$mapGrid = document.getElementById('mapGrid');

	//This changes the colour of the cell. It's usually bad, because it overrides trimps and looks bad against corruption, among other reasons
	M["fightinfo"].changeCellColor = false;

	//This option reverts to AT's old way of giving an unique icon for each of the exotic/powerful imps
	M["fightinfo"].allExoticIcons = true;
	M["fightinfo"].allPowerfulIcons = true;

	M["fightinfo"].imp = {
		skel     : {icon: '"glyphicon glyphicon-italic"',      shadow: "0px 0px 10px #ffffff", color: '#ffffff'},
		exotic   : {icon: '"glyphicon glyphicon-sunglasses"',  shadow: "0px 0px 10px #fb753f", color: '#ff0000'},
		powerful : {icon: '"glyphicon glyphicon-fire"',        shadow: "0px 0px 10px #ff0c55", color: '#ff0c55'},
		fast     : {icon: '"glyphicon glyphicon-forward"',     shadow: "0px 0px 10px #ffffff", color: '#666666'},
		poison   : {icon: '"glyphicon glyphicon-flask"',       shadow: "0px 0px 10px #ffffff", color: '#00ff00'},
		wind     : {icon: '"icomoon icon-air"',                shadow: "0px 0px 10px #ffffff", color: '#99ffff'},
		ice      : {icon: '"glyphicon glyphicon-certificate"', shadow: "0px 0px 10px #ffffff", color: '#00ffff'}
	};

	//Powerful imps
	M["fightinfo"].powerful = {
		blimp          : {name: "Blimp",          icon: '"glyphicon glyphicon-plane"'        },
		cthulimp       : {name: "Cthulimp",       icon: '"icomoon icon-hipster"'             },
		improbability  : {name: "Improbability",  icon: '"glyphicon glyphicon-question-sign"'},
		omnipotrimp    : {name: "Omnipotrimp",    icon: '"glyphicon glyphicon-fire"'         },
		mutimp         : {name: "Mutimp",         icon: '"glyphicon glyphicon-menu-up"'      },
		hulking_mutimp : {name: "Hulking_Mutimp", icon: '" glyphicon glyphicon-chevron-up"'  }
	};

	//Exotic imps
	M["fightinfo"].exotics = {
		chronoimp : {name: "Chronoimp", icon: '"glyphicon glyphicon-hourglass"'   },
		feyimp    : {name: "Feyimp",    icon: '"icomoon icon-diamond"'            },
		flutimp   : {name: "Flutimp",   icon: '"glyphicon glyphicon-globe"'       },
		goblimp   : {name: "Goblimp",   icon: '"icomoon icon-evil"'               },
		jestimp   : {name: "Jestimp",   icon: '"icomoon icon-mask"'               },
		magnimp   : {name: "Magnimp",   icon: '"glyphicon glyphicon-magnet"'      },
		tauntimp  : {name: "Tauntimp",  icon: '"glyphicon glyphicon-tent"'        },
		titimp    : {name: "Titimp",    icon: '"icomoon icon-hammer"'             },
		venimp    : {name: "Venimp",    icon: '"glyphicon glyphicon-baby-formula"'},
		whipimp   : {name: "Whipimp",   icon: '"icomoon icon-area-graph"'         },
	};

	//Fast imps
	M["fightinfo"].fast = [
		"Squimp",
		"Snimp",
		"Gorillimp",
		"Shrimp",
		"Chickimp",
		"Kittimp",
    	"Frimp",
    	"Slagimp",
    	"Lavimp",
    	"Kangarimp",
    	"Entimp",
		"Fusimp",
    	"Carbimp",
		"Shadimp",
		"Voidsnimp",
		"Prisimp",
		"Sweltimp",
		"Horrimp",
	];

	//Last processed
	M["fightinfo"].lastProcessedWorld = null;
	M["fightinfo"].lastProcessedMap = null;

	function updateCell($cell, cell, pallet, customIcon) {
		//Cell Color
		//if (M.fightinfo.changeCellColor) $cell.style.color = pallet.color;
		//$cell.style.textShadow = pallet.shadow;

		let iconList = [];

		//Glyph Icon
		if(customIcon || pallet) {
			let icon = (customIcon) ? customIcon : pallet.icon;
			if(icon)
				iconList.push('<span class='+icon+'></span>');
		}
		//var replaceable = ["fruit", "Metal", "gems", "freeMetals", "groundLumber", "Wood", "Map", "Any"]
		//if (overrideCoords) replaceable.push("Coordination");

		//Icon Overriding
		if (cell.special && game.worldUnlocks[cell.special])
			iconList.push(unlock2span(game.worldUnlocks[cell.special]));

		if (cell.special && game.mapUnlocks[cell.special])
			iconList.push(unlock2span(game.mapUnlocks[cell.special]));
		
		if(cell.corrupted && cell.corrupted != "none")
			iconList.push('<span class="'+mutationEffects[cell.corrupted].icon+'"></span>');

		if(iconList.length != 0)
			$cell.innerHTML = iconList.join(' ');
	}

	function unlock2span(special) {
		var title = "";
		if (special.title) title = "title='" + special.title + "' ";
		
		var addClass = "";
		if (special.addClass) addClass = (typeof special.addClass === 'function') ? special.addClass() : special.addClass;

		var prefix = "";
		var icon = special.icon;
			if (icon && icon.charAt(0) == "*") {
				icon = icon.replace("*", "");
				prefix =  "icomoon icon-"
			}
			else prefix = "glyphicon glyphicon-";
		return '<span ' + title + 'class="' + prefix + icon  + ' ' + addClass + '"></span>';
	}

	function Update() {
		//Check if we should update world or map info
		var $cells = [];
		var cells = (game.global.mapsActive) ? game.global.mapGridArray : game.global.gridArray;
		var rowSource = (game.global.mapsActive) ? M["fightinfo"].$mapGrid.children : M["fightinfo"].$worldGrid.children;
		var $rows = Array.prototype.slice.call(rowSource).reverse();

		//Check if current the world is already info-ed
		if (!game.global.mapsActive && M["fightinfo"].lastProcessedWorld == game.global.world)
			return;

		//Set this world as info-ed
		else if (!game.global.mapsActive) M["fightinfo"].lastProcessedWorld = game.global.world;

		//Loop through DOM rows and concat each row's cell-element into $cells
		$rows.forEach(function(row) {
			$cells = $cells.concat(Array.prototype.slice.call(row.children));
		});

		//Process all cells
		for(var i=0; i < $cells.length; i++) {
			//Init
			var $cell = $cells[i];
			var cell = cells[i];

			//Skeletimp
			if (cell.name.toLowerCase().indexOf('skele') > -1) {
				updateCell($cell, cell, M.fightinfo.imp.skel);
			}

			//Exotic cell
			else if (cell.name.toLowerCase() in M["fightinfo"].exotics) {
				let icon = M.fightinfo.allExoticIcons ? M.fightinfo.exotics[cell.name.toLowerCase()].icon : undefined;
				updateCell($cell, cell, M.fightinfo.imp.exotic, icon);
			}

			//Powerful Imp
			else if (cell.name.toLowerCase() in M["fightinfo"].powerful) {
				let icon = M.fightinfo.allPowerfulIcons ? M.fightinfo.powerful[cell.name.toLowerCase()].icon : undefined;
				updateCell($cell, cell, M.fightinfo.imp.powerful, icon);
			}

			//Fast Imp
			else if(M["fightinfo"].fast.indexOf(cell.name) > -1 && (!cell.corrupted || !cell.corrupted.startsWith("corrupt"))) {
				updateCell($cell, cell, M.fightinfo.imp.fast);
			}

			//This shit doesn't work and I don't know why (What is the cell.title??? is it the name of the nature? Imps are labelled Toxic/Gusty/Frozen but that didn't work either)
			else if (cell.empowerment == "Poison") {
				updateCell($cell, cell, M.fightinfo.imp.poison);
			}

			//Wind Token
			else if (cell.empowerment == "Wind") {
				updateCell($cell, cell, M.fightinfo.imp.wind);
			}

			//Ice Token
			else if (cell.empowerment == "Ice") {
				updateCell($cell, cell, M.fightinfo.imp.ice);
			}
			
			else {
				updateCell($cell, cell);
			}

			//Cell Titles
			$cell.title = cell.name;
			
			if (cell.corrupted)
				$cell.title += " - " + mutationEffects[cell.corrupted].title;
			
			if (cell.u2Mutation !== undefined) {
				cell.u2Mutation.forEach(mut => {
					$cell.classList.add(mut);
				});
			}
		}
	}

	M["fightinfo"].Update = Update;
})(MODULES);