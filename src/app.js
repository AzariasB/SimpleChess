/* global mat, pat, pawnTransform, castling, enPassant, Gen */
import $ from 'jquery';
import { Chess } from './chess';
import { enPassant, castling, pawnTransform, mat, pat } from './rules';
import { Gen } from './tools';
import './less/style.less';

$(document).ready(function() {
	var chess = new Chess({
		rules            : [ enPassant, castling, pawnTransform, mat, pat ],
		generationOption : Gen.boardOptions.normalBoard,
		generationRandom : false
	});

	chess.start();
});
