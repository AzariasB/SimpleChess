/**
 * ChessView
 * ---------
 * 
 * View corresponding to the chessboard.
 * Contain the chessBoard with all pieces inside of it.
 * Only taking care of the view : the display and the events.
 * All the calculations are performed in the ChessBoard Collection.
 */
import Backbone from 'backbone';
import $ from 'jquery';
import _ from 'underscore';
import { Tools } from './tools';
import { ChessBoard } from './ChessBoard';

export const ChessView = Backbone.View.extend({
	id               : 'board',
	//Get the selected item
	selected         : undefined,
	/**
     * Function to call to create and populate the chessboard
     * 
     * @param {String} genOption options of the chessboard Generation (available in Gen.boardOptions)
     * @param {boolean} random if the generation of the chessBoard must be random or not
     */
	start            : function(genOption, random) {
		this.board = $('#board');
		this.chessBoard = new ChessBoard();
		this.chessBoard.createBoard(genOption, random);
		this.initChessBoard();
	},
	/**
     * Addind the tiles to the view
     */
	initChessBoard   : function() {
		this.board.text('');
		var counter = 0;

		for (var i = 0; i < 8; i++) {
			//Row
			for (var j = 0; j < 8; j++) {
				//Column
				var sq;
				sq = $('<div/>', {
					id    : counter,
					class : 'box chessbox ' + ((i + j) & 1 ? 'black_box' : 'white_box')
				});
				sq.appendTo(this.board);
				counter++;
			}
		}
		this.renderPieces();
	},
	/**
     * Display pieces of the chessBoard Collection
     */
	renderPieces     : function() {
		var self = this;
		this.chessBoard.each(function(value) {
			self.renderPiece(value.id, value.getCurrent());
		});
	},
	/**
     * Render one piece in one div
     * 
     * @param {integer} div_id the id of the div where to add the piece
     * @param {integer} piece_code the integer that define the color, the id and the type of the piece 
     */
	renderPiece      : function(div_id, piece_code) {
		if (!_.isUndefined(piece_code) && piece_code !== 0) {
			this.board.find('#' + div_id).html(Tools.getHtmlName(piece_code)).addClass('pieceBox');
		} else if (!_.isUndefined(piece_code) && piece_code === 0) {
			this.board.find('#' + div_id).html('');
		}
	},
	/**
     * Display the informations when a player select a piece on the board
     * 
     * @param {Game} game the main game, "Game" to have access to the rules
     * @param {HTMLElement} touched To get the id of the selected div
     * @param {integer} turn the color of the current turn
     */
	select           : function(game, touched, turn) {
		var id_div = touched.id;
		var mCase = this.chessBoard.at(id_div);
		var event = {
			indexCase : id_div,
			case      : mCase,
			turn      : turn
		};
		if (!_.isUndefined(mCase) && mCase.getCurrent() !== 0 && Tools.sameColor(mCase.getCurrent(), turn)) {
			_.each(game.rules, function(rule) {
				var funcName = rule.events.firstClick;
				if (funcName && rule[funcName]) {
					rule[funcName](game, event);
				}
			});
			return this.firstClick(id_div, mCase, turn);
		} else if (this.state === 'first' && !_.isUndefined(this.selected)) {
			var move = this.chessBoard.moveFromTo(this.selected, id_div);
			if (move) {
				_.each(game.rules, function(rule) {
					var funcName = rule.events.secondClick;
					if (funcName && rule[funcName]) {
						move = rule[funcName](game, event, move);
					}
				});
				this.secondClickEnd(turn);
				_.each(game.rules, function(rule) {
					var funcName = rule.events.afterUpdate;
					if (funcName && rule[funcName]) {
						rule[funcName](game, event, move);
					}
				});
				return move;
			}
			return;
		}
	},
	/**
     * Get the tracks of the piece, and display them.
     * 
     * @param {integer} piece_code the code containing informations about a piece
     */
	proposeChoice    : function(piece_code) {
		var tracks = this.chessBoard.getTracksOf(piece_code);
		this.ableDivs(tracks);
		return;
	},
	/**
     * Remove all choices proposed before
     * 
     */
	resetChoice      : function() {
		_.each(this.board.children(), function(value) {
			$(value).removeClass([ 'selectedBox', 'currentBox', 'pieceBox', 'threatBox', 'begunBox' ]);
			if (!_.isEmpty($(value).text())) {
				$(value).addClass('pieceBox');
			}
		});
		return;
	},
	/**
     * Surround given div with green border
     * 
     * @param {Array<ChessBox>} boxes
     */
	ableDivs         : function(boxes) {
		var self = this;
		_.each(boxes, function(value) {
			var id = value.id;
			var className = 'selectedBox';
			if (value.getCurrent() !== 0 && !Tools.sameColor(value.getCurrent(), self.turn)) {
				className = 'threatBox';
			}

			$('#' + id).addClass(className);
		});
		return;
	},
	/**
     * Action to trigger when a player perform the first click of his turn
     * 
     * @param {integer} indexSelected the index of the selected div
     * @param {ChessBox} mCase the Model corresponding to the selected div
     * @param {integer} turn the color of the current turn
     */
	firstClick       : function(indexSelected, mCase, turn) {
		this.state = 'first';
		this.resetChoice();
		$('#' + indexSelected).addClass('currentBox');

		this.proposeChoice(mCase.getCurrent());
		this.selected = indexSelected;
		return;
	},
	/**
     * The actions to perform when the user perform his second click
     * 
     * @param {integer} turn color of the current turn
     */
	secondClickEnd   : function(turn) {
		this.renderPieces();
		this.chessBoard.updateAll(turn);
		this.hilightChessKing(turn);
		this.resetChoice();
		this.state = 'none';
		return;
	},
	/**
     * Set background to red if the king is in chess.
     * 
     * @param {integer} turn current turns color
     */
	hilightChessKing : function(turn) {
		_.each(this.board.children(), function(value) {
			$(value).removeClass('begunBox');
		});
		var color = Tools.getInvertColor(turn);
		if (this.chessBoard.myKingIsChess(color)) {
			var indexKing = this.chessBoard.findColorKing(color);
			if (indexKing >= 0) {
				$('#' + indexKing).addClass('begunBox');
			}
		}
		return;
	}
});
