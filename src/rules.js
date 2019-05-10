

/* global Tools, P_HEX */

/*
 * All the rules of the game
 * It's an easy way to implement uncommon rules of the chess 
 * 
 * A rule must contain a 'events' object with the following possible options :
 *  - firstClick : "function" => the function "function" is trigger at the user's fist click
 *  - secondClick : "function => the function "function" is trigger at the user's second click
 *  - afterUpdate : "function" => the function "function" is called after the second click's update
 *  
 *  A rule can contain a 'init' function that will be called when adding the rule to the game
 *  
 *  the FIRSTCLICK function get in parameter : 
 *  ------------------------------------------
 *  - chess : the game containing all the views, and collection
 *  - event : the event of the first click, this object contain :
 *      - index : integer, index of where the user clicked
 *      - case : ChessBox, the chessBox corresponding to the div where the user clicked
 *      - tour : integer, the color of the current turn
 *  the function does not need to return anything
 *  
 *  the SECONDCLICK function get in parameter :
 *  ------------------------------------------
 *  the same as the firstClick function +
 *  - move : Move model, containing some move information
 *  this function MUST return the move object (modified if needed)
 *  
 *  the AFTERUPDATE function get in parameter:
 *  ------------------------------------------
 *  the same as the secondclick function.
 */


/**
 * All the function to check if a pawn can do the 'en passant' move
 */
var enPassant = {
    events: {
        'firstClick': 'proposeEnPassant',
        'secondClick': 'validEnPassant'
    },
    /**
     * Add some information on the chessboard if needed
     */
    proposeEnPassant: function (chess, event) {
        var pieceSelect = event.case.getCurrent();
        if (Tools.sameType(pieceSelect, P_HEX.PAWN)) {
            var indexSelect = parseInt(event.indexCase);
            var lastMove = chess.moves.moves.getLastMove();
            if (lastMove) {
                var dest = parseInt(lastMove.get('to'));
                var difference = Math.abs(lastMove.get('from') - dest);
                if (Tools.sameType(P_HEX.PAWN, lastMove.get('piece')) && difference === 16
                        && ((!Tools.isAtLeftBorder(dest) && indexSelect === (dest - 1))
                                || (!Tools.isAtRightBorder(dest) && indexSelect === (dest + 1)))
                        ) {
                    //Possibilité de faire un 'en passant'
                    var turn = event.turn;
                    var board = chess.board;
                    var incr = 8;
                    if (Tools.isBlack(turn)) {
                        incr = -incr;
                    }
                    //Ajouter un 'en passant' plus loin
                    board.chessBoard.at(dest + incr).addTrAndBg(pieceSelect);
                }
            }
        }
        return;
    },
    /**
     * Remove the pawn that was taken by 'en passant'
     */
    validEnPassant: function (chess, event, move) {
        //Manger il faut qu'il s'agisse d'un pion, et qu'il n'y ai personne dans la case en question
        if (Tools.sameType(move.get('piece'), P_HEX.PAWN) && !move.get('eat')) {
            var lastMove = chess.moves.moves.getLastMove();
            if (lastMove) {
                var origin = parseInt(move.get('from'));
                var now = parseInt(move.get('to'));
                var lastTo = parseInt(lastMove.get('to'));
                if (Tools.sameColumn(lastTo, now)
                        && !Tools.sameColumn(lastTo, origin)) {
                    //On peut manger la pièce en question ! (l'enlever du jeu)
                    move.set({
                        eat: chess.board.chessBoard.removePiece(lastMove.get('to')),
                        enPassant: true
                    });
                }
            }
        }
        return move;
    }
};

/**
 * Function to check for castling
 */
var castling = {
    events: {
        'firstClick': 'proposeCastling',
        'secondClick': 'confirmCastling'
    },
    positionsCastling: {
        white: {
            left: [1, 2],
            right: [6, 5, 4]
        },
        black: {
            left: [57, 58],
            right: [62, 61, 60]
        }
    },
    /*
     * Add some informations on the board if possible
     * 
     * The castling is possible if :
     *  - The king did not moved before
     *  - The rook did not moved before
     *  - None of the box that the king is crossing must be begun
     */
    proposeCastling: function (chess, event) {
        var selected = event.case.getCurrent();
        var color = event.turn;
        if (Tools.sameType(selected, P_HEX.KING) && !chess.moves.moves.myKingMoved(color)
                && !event.case.currentIsBegun()
                ) {
            var chosenColor = Tools.ifWhiteElseIfBlack(color, this.positionsCastling.white, this.positionsCastling.black);

            !chess.moves.moves.myRightRookMoved(color)
                    && this.castlingPossible(chess, chosenColor.right, color) &&
                    this.updateForCastling(chess, chosenColor.right, event.case.getCurrent());

            !chess.moves.moves.myLeftRookMoved(color) &&
                    this.castlingPossible(chess, chosenColor.left, color) &&
                    this.updateForCastling(chess, chosenColor.left, event.case.getCurrent());
        }

    },
    /*
     * The king is automatically moved,
     * but we must also move the rook
     */
    confirmCastling: function (chess, event, move) {
        var moved = move.get('piece'),
                from = parseInt(move.get('from')),
                to = parseInt(move.get('to')),
                difference = to - from;
        //Le roi a fait un roque
        if (Tools.sameType(moved, P_HEX.KING) && Math.abs(difference) >= 2) {
            var rookOrigin,
                    rookDestination,
                    moveName;
            if (difference > 0) {
                //grand roque
                rookOrigin = to + 2;
                rookDestination = to - 1;
                moveName = {
                    'bigCastling': true
                };
            } else {
                //petit roque
                rookOrigin = to - 1;
                rookDestination = to + 1;
                moveName = {
                    'littleCastling': true
                };
            }
            var rook = chess.board.chessBoard.removePiece(rookOrigin);
            chess.board.chessBoard.at(rookDestination).setCurrent(rook);
            move.set(moveName);
        }
        return move;
    },
    castlingPossible: function (chess, positions, color) {
        for (var pos in positions) {
            var index = positions[pos];
            var box = chess.board.chessBoard.at(index);
            if (positions.length === 3 && pos === 0 && !box.isEmpty()) {
                return false;
            } else if (!box.isEmpty() || box.isBegunBy(Tools.getInvertColor(color))) {
                return false;
            }
        }
        return true;
    },
    updateForCastling: function (chess, positions, piece) {
        var kingIndex = positions.length === 2 ? positions[0] : positions[1];
        chess.board.chessBoard.at(kingIndex).addTrack(piece);
    }
};

/**
 * When a pawn arrives at his last line, it can transform into another piece
 */
var pawnTransform = {
    init: function () {
        var self = this;
        $('.modal-close').on('click', function () {
            $('#newpiece').modal('hide');
            self.changePawn(this);
        });
    },
    events: {
        'secondClick': 'transformPawn'
    },
    transformPawn: function (chess, event, move) {
        this.chess = chess;
        this.event = event;
        var piece = event.case.getCurrent();
        if (Tools.sameType(piece, P_HEX.PAWN) && Tools.isOnHisLastLine(piece, event.indexCase)) {
            //Le pion est arrivé sur sa dernière case, on doit le transformer
            $('#newpiece').modal({
                keyboard: false
            });
        }
        return move;
    },
    changePawn: function (target) {
        var nwType = $(target).data('hex');
        var pawn = this.event.case.getCurrent();
        var nwPiece = Tools.changeType(pawn, nwType);
        this.chess.board.chessBoard.at(this.event.indexCase).setCurrent(nwPiece);
        this.chess.board.chessBoard.updateAll(this.event.turn);
        this.chess.board.renderPieces();
        this.chess.board.hilightChessKing(this.event.turn);
    }
};

/**
 * Test is the game is finished
 */
var mat = {
    events: {
        'afterUpdate': 'checkForMat'
    },
    checkForMat: function (chess, event, move) {
        /**
         * Mat signifie : à la find de mon tour, l'autre roi :
         *  - Est en échec
         *  - Toutes les cases autour sont menacées, ou contiennent un allié
         *  - Les 'begun' listes ne peuvent pas être protégées
         * 
         */
        var color = Tools.getInvertColor(event.turn);
        if (chess.board.chessBoard.myKingIsChess(color)
                && chess.board.chessBoard.kingCannotMove(color)
                && !chess.board.chessBoard.canProtectKing(color)) {
            this.cinematiqueCheckMate(Tools.getInvertColor(color));
        }
        return move;
    },
    cinematiqueCheckMate: function (colorWin) {
        $("#patOrMat").html("Les vainqueurs sont les : <strong>" + Tools.getColorName(colorWin) + "s</strong> !");
        $("#winner").modal();
    }
};
/*
 * Test if there is 'stalemate' (pat in french)
 */
var pat = {
    events: {
        'afterUpdate': 'checkForPat'
    },
    checkForPat: function (chess, event, move) {
        /**
         * Pat signifie, à la fin de mon tour, l'autre roi :
         * - N'est pas en échec
         * - Est le seul à pouvoir bouger
         * - A toutes les cases autour de lui menacées
         * - Il n'y a plus que deux pièces sur le jeu
         */

        var color = Tools.getInvertColor(event.turn);
        if (!chess.board.chessBoard.myKingIsChess(color)
                && chess.board.chessBoard.kingCannotMove(color)
                && chess.board.chessBoard.colorCantMove(color)
                || chess.board.chessBoard.onlyTwoLeft()) {
            this.cinematiqueCheckPat();
        }
        return move;

    },
    cinematiqueCheckPat: function () {
        $("#patOrMat").html("Pat ! Egalité ! Aucun vainqueurs !");
        $("#winner").modal();
    }
};