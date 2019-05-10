

/* global mat, pat, pawnTransform, castling, enPassant, Gen */

$(window).load(function () {
    var chess = new Chess({
        rules: [enPassant, castling, pawnTransform, mat, pat],
        generationOption: Gen.boardOptions.normalBoard,
        generationRandom: false
    });
    
    chess.start();
}); 