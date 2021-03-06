import Backbone from 'backbone';
import _ from 'underscore';
import $ from 'jquery';
import { COLOR, Tools } from './tools';
import { ChessView } from './ChessView';
import { MoveView, EatenView, Eaten } from './Plugin';

var Game = Backbone.View.extend({
	el           : '#chess2',
	turn         : COLOR.WHITE,
	numTurn      : 0,
	rules        : [],
	board        : new ChessView(),
	moves        : new MoveView(),
	eaten        : new EatenView(),
	events       : {
		click : 'handleClick'
		//"dblclick": "rollBack"
	},
	start        : function() {
		var option = this.genOption || Gen.boardOptions.normalBoard;
		var random = this.randomGen || false;
		this.board.start(option, random);
	},
	setRandomGen : function(random) {
		this.randomGen = random;
	},
	setOptionGen : function(option) {
		this.genOption = option;
	},
	addRule      : function(rule) {
		rule.init && rule.init();
		this.rules.push(rule);
	},
	handleClick  : function(event) {
		var target = event.target;
		if ($(target).parents('#board')) {
			this.boardClick(target);
		}
	},
	boardClick   : function(target) {
		var move = this.board.select(this, target, this.turn);
		if (move) {
			move.set({ turn: this.numTurn });
			this.addMove(move);
			//Si un pion s'est fait mangé
			if (move.get('eat')) {
				var eaten = new Eaten({
					turn         : this.numTurn,
					lastPosition : move.get('to'),
					piece        : move.get('eat')
				});
				this.eaten.addEaten(eaten);
			}
			this.numTurn++;
			this.switchTurn();
		}
	},
	addMove      : function(move) {
		this.moves.addMove(move);
	},
	addEaten     : function(eatenObj) {
		this.eaten.addEaten(eatenObj);
	},
	switchTurn   : function() {
		this.turn = Tools.getInvertColor(this.turn);
	}
});

export function Chess() {
	this.game = new Game();
	var self = this;

	function construct(args) {
		_.each(args, function(val, index) {
			switch (index) {
				case 'rules':
					_.each(val, self.addRule.bind(self));
					break;
				case 'generationRandom':
					self.setRandom(val);
					break;
				case 'generationOption':
					self.setGenOption(val);
					break;
			}
		});
	}

	this.addRule = function(rule) {
		this.game.addRule(rule);
		return this;
	};

	this.setRandom = function(random) {
		this.game.setRandomGen(random);
	};

	this.setGenOption = function(option) {
		this.game.setOptionGen(option);
	};

	this.start = function() {
		this.game.start();
	};

	construct(arguments[0]);
}
