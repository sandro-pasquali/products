var Screenliner = require('screenliner');
var keypress 	= require('keypress');
var clio		= require('clio')();
var util		= require('util');
var screenliner = new Screenliner();
var fs 			= require('fs');
var Joi			= require('joi');

var selected 	= clio.prepare("@green[√]@@");
var highlighted	= clio.prepare("@blue[@green√@blue]@@");
var empty		= "[ ]";

var colors = ['black','red','green','yellow','blue','magenta','cyan','white'];

var options = {
	fgcolor 	: undefined,
	bgcolor 	: undefined,
	selectFirst	: true
};

var api = Object.create({
	current : {},	
	lastIdx : 0,
	pad : function(str) {
		return str + new Array(screenliner.width - str.length + 1).join(' ');
	},
	colorize : function(str, fgcolor, bgcolor) {
	
		bg	= ~colors.indexOf(bgcolor) || '';
	
		var fg = ~colors.indexOf(fgcolor) ? '@' + fgcolor : '';
		
		if(bg) {
			bg =  '@_' + bgcolor;
			str = this.pad(str);
		}

		return clio.prepare(fg + bg + str + '@@');
	},
	options : function(opts) {
		opts = opts || {};
		
		var result = Joi.validate(opts || {}, Joi.object().keys({
			fgcolor 	: Joi.string().valid(colors),
			bgcolor 	: Joi.string().valid(colors),
			selectFirst : Joi.boolean()
		}));
		
		if(result.error) {
			clio.write('@white@_red' + result.error);
			process.exit(1);
		}
		
		for(var o in opts) {
			options[o] = opts[o]
		}
	},
	add : function(str, fgcolor, bgcolor) {
		var to = typeof str;
		if(str && to !== "string") {
			throw new TypeError("#region must be a String. Received: " + to);
		}

		str = empty + " " + str;
		
		var region = screenliner.createRegion(this.colorize(str, fgcolor, bgcolor));

		this.lastIdx = this.current.id;

		this.current = screenliner.regions[screenliner.regions.length -1];
		
		return region;
	},
	
	updateCheck : function() {
		
		//	up || down has re
		if(this.current.selected) {
			this.current.replace(
				selected, 
				highlighted
			)			
		} else {
			this.current.replace(
				empty, 
				highlighted
			)		
		}
		
		if(screenliner.regions[this.lastIdx].selected) {
			screenliner.regions[this.lastIdx].replace(
				highlighted, 
				selected
			)
		} else {
			screenliner.regions[this.lastIdx].replace(
				highlighted, 
				empty
			)
		}
	},
	
	select : function() {
		this.current.selected = !this.current.selected;		
	},
	
	selected : function() {
		return screenliner.regions.filter(function(r) {
			return r.selected
		})
	},
	
	//	Handler for keyboard up arrow
	//
	up : function() {
	
		this.lastIdx = this.current.id;	
	
		if((this.current.id -1) < 0) {
			this.current = screenliner.regions[screenliner.regions.length -1];
		} else {
			this.current = screenliner.regions[this.current.id -1]
		}
		
		this.updateCheck()
	},
	
	//	Handler for keyboard down arrow
	//
	down : function() {	
	
		this.lastIdx = this.current.id;
	
		if((this.current.id +1) === screenliner.regions.length) {
			this.current = screenliner.regions[0];
		} else {
			this.current = screenliner.regions[this.current.id +1]
		}

		this.updateCheck()
	},
	
	offer : function(commitF) {
	
		var committed;
		
		var handleKeypress = function(ch, key) {
		
			if(!key) {
				return;
			}	
		
			if(key.ctrl && key.name == 'c') {
				return process.exit(0);
			}
			
			switch(key.name) {
				case "up":
					api.up()
				break;
				
				case "down":
					api.down()
				break;
				
				case "space":
					api.select()
				break;
				
				case "return":
					process.stdin.removeListener('keypress', handleKeypress);
					commitF && commitF(api.selected().map(function(s) {
						return s.id;
					}))
				break;
				
				default:
					//console.log(key)
				break;
			}
		
		};
	
		keypress(process.stdin);
		
		process.stdin.on('keypress', handleKeypress);
		
		process.stdin.setRawMode(true);
		process.stdin.resume();	
		
		//	This initializes the view -- it will create a checkmark
		//	in the first product slot.
		//
		options.selectFirst && api.down()
	}
})

module.exports = api;