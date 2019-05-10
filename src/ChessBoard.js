

/* global Backbone, Tools, COLOR, _, ChessBox, P_HEX, Gen */

/**
 * ChessBoard
 * ----------
 * 
 * The big head of the game, where the main calculations are performed
 * Here are stored all the boxes of the game
 * 
 */

var ChessBoard = Backbone.Collection.extend({
    model: ChessBox,
    //If the kings are begun, must save the track to be able to block the begun
    whiteKingBegunTrack: [],
    blackKingBegunTrack: [],
    //If a piece is in-between an enemy and his king, his moves are reduced
    whitePin: [],
    blackPin: [],
    //To get the kings positions more quickly
    kingsPosition: {
        white: 0,
        black: 0
    },
    /**
     * 
     * @param {String} genOption Option of generation
     * @param {Boolean} random must generate random board or not
     */
    createBoard: function (genOption, random) {
        this.addPieces(genOption, random);
        this.updateAll();
        return;
    },
    /*
     * 
     * @param {String} option the board generation option
     * @param {Boolean} random if the generation must be random or not
     */
    addPieces: function (option, random) {
        var board = Gen.genBoard(option, random),
                self = this;

        _.each(board, function (piece, index) {
            self.addPiece(index, piece);
        });
        return;
    },
    /**
     * 
     * Add a piece to a box.
     * 
     * @param {integer} div_id the id of the box where to add the piece
     * @param {integer} piece_code the piece to add to the div
     * @returns {integer} return the id of the next box
     */
    addPiece: function (div_id, piece_code) {
        var mchessBox = new ChessBox({id: div_id});
        if (!_.isUndefined(piece_code)) {
            mchessBox.setCurrent(piece_code);
        }
        this.add(mchessBox);

        return div_id + 1;
    },
    /**
     * 
     * @param {integer} index the index of the piece to remove
     * @returns {integer} the code of the piece that was removed
     */
    removePiece: function (index) {
        return this.at(index).removePiece();
    },
    /**
     * 
     * Looking for a track for a piece, so that we know were it can go
     * 
     * @param {integer} piece_code the code of the piece we're looking tracks for
     * @returns {Array<ChessBox>} the array containing the tracks of the piece
     */
    getTracksOf: function (piece_code) {
        var tracks = this.filter(function (value) {
            var to_return = false;
            _.each(value.getTracks(), function (track) {
                if (Tools.sameId(track, piece_code) && Tools.sameColor(track, piece_code)) {
                    to_return = true;
                }
            });
            return to_return;
        });
        return tracks;
    },
    /**
     * 
     * Move a piece from "from" to "to" and return a Move model containing informations about
     * the move that was made
     * 
     * @param {integer} from the index of the origin
     * @param {integer} to the index of the destination
     * @param {Boolean} reverse if we want to do a rollback move
     */
    moveFromTo: function (from, to, reverse) {
        reverse = reverse || false;
        var origin = this.at(from);
        var destination = this.at(to);
        if (!_.isUndefined(destination) && (!reverse && destination.hasATrack(origin.getCurrent()) || reverse)) {
            var piece = origin.removePiece();
            var eaten = destination.setCurrent(piece);
            return new Move({
                from: from,
                to: to,
                piece: piece,
                eat: eaten
            });
        }
        return;
    },
    /**
     * 
     * Remove all possible track for a color
     * If there is no color given, then remove all tracks
     * 
     * @param {integer} color
     */
    resetTracks: function (color) {
        if (!color) {
            this.each(function (value) {
                value.reset();
            });
        } else {
            this.each(function (chessBox) {
                if (!_.isEmpty(chessBox.getBegun(color))) {
                    chessBox.reset(color);
                }
            });
        }
        return;
    },
    /**
     * 
     * Update all the pieces of the board
     * Update a color, then another, to avoid kings chess problem
     * 
     * @param {integer} firstColor the color to update first
     */
    updateAll: function (firstColor) {
        firstColor = firstColor || COLOR.WHITE;
        var self = this;

        var secondUpdate = {};
        this.resetTracks();
        this.resetBeguns();
        this.resetPin();


        this.each(function (value, index) {
            if (value.getCurrent()) {
                var piece = value.getCurrent();
                if (Tools.sameColor(piece, firstColor)) {
                    var begunPin = self.updatePiece(value.getCurrent(), index);
                    if (Tools.containPinOrBegun(begunPin)) {
                        self.updateKingBegunAndPin(Tools.getInvertColor(firstColor), begunPin);
                    }
                } else {
                    secondUpdate[index] = value;
                }
            }
        });
        _.each(secondUpdate, function (value, index) {
            var begunPin = self.updatePiece(value.getCurrent(), parseInt(index));
            if (Tools.containPinOrBegun(begunPin)) {
                self.updateKingBegunAndPin(firstColor, begunPin);
            }
        });
        return;
    },
    /**
     * Helper to determinate if there is chessmate.
     * 
     * @param {integer} color the color of the king we want to know if he can move or not
     * @returns {Boolean} if the king cannot move
     */
    kingCannotMove: function (color) {
        var kingIndex = this.findColorKing(color);
        if (kingIndex >= 0) {
            var king = this.at(kingIndex).getCurrent();
            return !this.kingHasTrack(king);
        }
        return false;
    },
    /**
     * Helper to determinate if there is chessmate
     * 
     * @param {integer} color the color of the king who can be protected
     * @returns {Boolean} if some piece can protect the begun kin
     */
    canProtectKing: function (color) {
        var tracks = this.myKingIsChess(color);
        var canProtect = false;
        if (Tools.pieceCanProtect(tracks)) {
            _.each(tracks[0], function (box) {
                if (box.colorHasTrack(color)) {
                    canProtect = true;
                }
            });
        }
        return canProtect;
    },
    /**
     * Helper to know if the king has a track on the board
     * 
     * @param {integer} king the piece code of the king
     * @returns {Boolean} if king has a track on the board or not
     */
    kingHasTrack: function (king) {
        var hasTrack = false;
        this.each(function (box) {
            if (box.hasATrack(king)) {
                hasTrack = true;
            }
        });
        return hasTrack;
    },
    /**
     * 
     * Helper to determinate if the is stalemate
     * 
     * @param {integer} color the color we want to know if it can move
     * @returns {Boolean} if the color can't move
     */
    colorCantMove: function (color) {
        var canMove = false;
        this.each(function (box) {
            if (box.colorHasTrack(color)) {
                canMove = true;
            }
        });
        return !canMove;
    },
    /**
     * Helper to determinate if there is stalemate
     * 
     * @returns {Boolean} if there is only Two pieces left on the board
     */
    onlyTwoLeft: function () {
        var totalNumber = 0;
        this.each(function (box) {
            if (!box.isEmpty()) {
                totalNumber++;
            }
        });
        return totalNumber === 2;
    },
    /*
     * |----------------------------------------------|
     * | All the functions that update the chessboard |
     * |----------------------------------------------|
     */

    /**
     * 
     * @param {int} piece_code The number/code of the current piece to update
     * @param {int} index The position on the board of the piece (the origin, not the destionation)
     * @returns {Object<begun,pin>}
     */
    updatePiece: function (piece_code, index) {
        var integer = Tools.getPieceType(piece_code),
                tracks = this.myKingIsChess(piece_code),
                begunPin;
        if (Tools.pieceCanProtect(tracks) || Tools.sameType(integer, P_HEX.KING)) {
            switch (integer) {
                case P_HEX.KING:
                    begunPin = this.updateKing(piece_code, index);
                    break;
                case P_HEX.QUEEN :
                    begunPin = this.updateQueen(piece_code, index);
                    break;
                case P_HEX.ROOK :
                    begunPin = this.updateRook(piece_code, index);
                    break;
                case P_HEX.KNIGHT:
                    begunPin = this.updateKnight(piece_code, index);
                    break;
                case P_HEX.BISHOP :
                    begunPin = this.updateBishop(piece_code, index);
                    break;
                case P_HEX.PAWN :
                    begunPin = this.updatePawn(piece_code, index);
                    break;
            }
        }
        return begunPin;
    },
    /**
     * Add tracks and begun for the king piece
     * 
     * @param {integer} kingPiece code of piece
     * @param {integer} index position of the king
     */
    updateKing: function (kingPiece, index) {
        this.setKingPosition(kingPiece,index);
        var color = Tools.getPieceColor(kingPiece);
        var self = this;
        var possDirection = [-1, 1, -7, 7, -8, 8, -9, 9];
        _.each(possDirection, function (value) {
            self.kingConditions(kingPiece, parseInt(index), value, color);
        });
        return;

    },
    /**
     * Check if the king can go to the selected box, and add it if it can
     * 
     * @param {integer} king piece code
     * @param {integer} index king position
     * @param {integer} incrementation to get destination
     * @param {integer} color kings color
     * @returns {undefined|ChessBox} ChessBox if there if a possible track for the king
     */
    kingConditions: function (king, index, incrementation, color) {
        var dIndex = index + incrementation;
        var ennemies = {},
                invertColor;
        if (Tools.isValidIndex(dIndex) && !(Tools.isAtLeftBorder(index) && Tools.turnLeft(incrementation)
                || Tools.isAtRightBorder(index) && Tools.turnRight(incrementation))) {
            var newPos = this.at(dIndex);
            if (newPos) {
                if (color === COLOR.BLACK) {
                    ennemies = newPos.getWhiteBegun();
                    invertColor = COLOR.WHITE;
                } else {
                    ennemies = newPos.getBlackBegun();
                    invertColor = COLOR.BLACK;
                }
                if ((newPos.canBeEaten(king) || newPos.isEmpty()) && _.isEmpty(ennemies)) {
                    newPos.addTrAndBg(king);
                    return newPos;
                }
            }
        }
        return;
    },
    /**
     * Add tracks and begun for the queen
     * 
     * @param {integer} queenPiece piece code
     * @param {integer} index queens position
     * @returns {undefined|Object<begun,pin>}
     */
    updateQueen: function (queenPiece, index) {
        var trackToKing1 = this.updateRook(queenPiece, index);
        var trackToKing2 = this.updateBishop(queenPiece, index);
        if (!_.isEmpty(trackToKing1)) {
            return trackToKing1;
        } else if (!_.isEmpty(trackToKing2)) {
            return trackToKing2;
        } else {
            return;
        }
    },
    /**
     * Add tracks and begun for the rook
     * 
     * @param {integer} rookPiece piece code
     * @param {integer} index rook position
     * @returns {Object<begun,pin>}
     */
    updateRook: function (rookPiece, index) {
        var directions = [-1, 1, -8, 8];
        var self = this;
        var iGotTheKing = [];
        _.each(directions, function (dir) {
            var res = self.checkDiagonal(rookPiece, index, dir);
            if (!_.isEmpty(res) && res && res.begun && res.pin
                    && (!_.isEmpty(res.begun) || !_.isEmpty(res.pin))) {
                iGotTheKing = res;
            }
        });
        return iGotTheKing;
    },
    /**
     * Add tracks and begun for the knight
     * 
     * @param {integer} knightPiece piece code
     * @param {integer} index knight position
     * @returns {Object<begun,pin>}
     */
    updateKnight: function (knightPiece, index) {
        var possibilities = [];
        var self = this;
        var kingInTarget = {begun: [], pin: []};

        switch (Tools.getPositionFromLeft(index)) {
            case 0:
                possibilities = [index - 15, index - 6, index + 10, index + 17];
                break;
            case 1:
                possibilities = [index - 17, index - 15, index - 6, index + 10, index + 15, index + 17];
                break;
            case 6:
                possibilities = [index - 17, index - 15, index - 10, index + 6, index + 15, index + 17];
                break;
            case 7:
                possibilities = [index - 17, index - 10, index + 6, index + 15];
                break;
            default:
                possibilities = [index - 17, index - 15, index - 10, index - 6, index + 6, index + 10, index + 15, index + 17];
                break;
        }

        _.each(possibilities, function (value) {
            if (value >= 0) {
                var mBox = self.at(value);
                if (!_.isUndefined(mBox) && (mBox.isEmpty() || mBox.canBeEaten(knightPiece))) {
                    var pin = self.myKingIsPin(knightPiece);
                    //If the piece is pinned, it can't move (the knigth can hardly move)
                    var imPin = Tools.pieceIsPin(pin, self.at(index));
                    var tracks = self.myKingIsChess(knightPiece);
                    if (imPin) {
                        Tools.addIfSame(pin, mBox, knightPiece);
                    } else if (tracks && tracks[0]) {
                        Tools.addIfSame(tracks[0], mBox, knightPiece);
                    } else {
                        mBox.addTrAndBg(knightPiece);
                        var invertColor = Tools.getInvertColor(knightPiece);
                        //On met le roi en échec
                        if (mBox.containKing(invertColor)) {
                            //On ajoute donc soit même comme étant une menace au roi
                            kingInTarget.begun.push(self.at(index));
                        }
                    }
                }
            }
        });
        return  kingInTarget;

    },
    /**
     * Add tracks and beguns for bishop
     * 
     * @param {integer} bishopPiece piece code
     * @param {integer} index bishop position
     * @returns {Object<begun,pin>}
     */
    updateBishop: function (bishopPiece, index) {
        var directions = [-9, 9, -7, 7];
        var self = this;
        var iGotTheKing = {};

        _.each(directions, function (dir) {
            var begunPin = self.checkDiagonal(bishopPiece, index, dir);
            if (_.isEmpty(iGotTheKing) && begunPin && begunPin.begun && begunPin.pin
                    && (!_.isEmpty(begunPin.begun) || !_.isEmpty(begunPin.pin))) {
                iGotTheKing = begunPin;
            }
        });
        return iGotTheKing;
    },
    /**
     * 
     * @param {integer} pawnPiece piece code
     * @param {integer} index pawn position
     * @returns {Object<begun,pin>|undefined} object if the pawn begun the enemy king
     */
    updatePawn: function (pawnPiece, index) {
        var kingInTarget = [],
                tracks = this.myKingIsChess(pawnPiece),
                pin = this.myKingIsPin(pawnPiece),
                imPin = Tools.pieceIsPin(pin, this.at(index));

        var color = Tools.getPieceColor(pawnPiece),
                pGauche = 7,
                pDevant = 8,
                pDroite = 9;
        if (color === COLOR.BLACK) {
            pDevant = -pDevant,
                    pDroite = -pDroite,
                    pGauche = -pGauche;
        }

        //Ils ne peuvent qu'avancer (ou aller en diagonale)

        var devant = Tools.isValidIndex(index + pDevant) && this.at(index + pDevant);
        if (devant && devant.isEmpty()) {
            if (imPin) {
                Tools.addIfSame(imPin, devant, pawnPiece, "addTrack");
            } else if (tracks) {
                Tools.addIfSame(tracks, devant, pawnPiece, "addTrack");
            } else {
                devant.addTrack(pawnPiece);
            }
        }

        if (this.isAtStart(pawnPiece, index)) {
            var devant2 = this.at(index + pDevant * 2);
            if (!_.isUndefined(devant2) && devant.isEmpty() && devant2.isEmpty()) {
                if (imPin) {
                    Tools.addIfSame(imPin, devant2, pawnPiece, "addTrack");
                } else if (tracks && tracks[0]) {
                    Tools.addIfSame(tracks[0], devant2, pawnPiece, "addTrack");
                } else {
                    devant2.addTrack(pawnPiece);

                }
            }
        }


        var droite = Tools.isValidIndex(index + pDroite) && this.at(index + pDroite);
        if (droite) {
            !Tools.isAtRightBorder(index) && droite.addBegun(pawnPiece);

            if (!Tools.isAtRightBorder(index) && !_.isUndefined(droite) && droite.canBeEaten(pawnPiece)) {
                if (imPin) {
                    Tools.addIfSame(imPin, droite, pawnPiece, "addTrack");
                } else if (tracks && tracks[0]) {
                    Tools.addIfSame(tracks[0], droite, pawnPiece, "addTrack");
                } else {
                    droite.addTrack(pawnPiece);
                    var invertColor = Tools.getInvertColor(pawnPiece);
                    if (droite.containKing(invertColor)) {
                        //Le roi est mis en échecc par le pion
                        kingInTarget.push(this.at(index));
                    }
                }
            }
        }


        var gauche = Tools.isValidIndex(index + pGauche) && this.at(index + pGauche);
        if (gauche) {
            !Tools.isAtLeftBorder(index) && gauche.addBegun(pawnPiece);

            if (!Tools.isAtLeftBorder(index) && !_.isUndefined(gauche) && gauche.canBeEaten(pawnPiece)) {
                if (imPin) {
                    Tools.addIfSame(imPin, droite, pawnPiece, "addTrack");
                } else if (tracks && tracks[0]) {
                    Tools.addIfSame(tracks[0], gauche, pawnPiece, gauche.addTrack);
                } else {
                    gauche.addTrack(pawnPiece);
                    var invertColor = Tools.getInvertColor(pawnPiece);
                    if (gauche.containKing(invertColor)) {
                        kingInTarget.push(this.at(index));
                    }
                }
            }
        }
        return !_.isEmpty(kingInTarget) ? {'begun': kingInTarget} : undefined;
    },
    /**
     * Works only for pawns
     *
     * @param {Number} piece_code the Code of the piece you want to know if it is at the start or not
     * @param {Number} index the position in itself of the piece.
     * @returns {Boolean} return if the index given and the color of the piece correspond to the start's place.
     */
    isAtStart: function (piece_code, index) {
        var color = Tools.getPieceColor(piece_code);
        var integer = Tools.getPieceType(piece_code);
        if (integer === P_HEX.PAWN &&
                ((color === COLOR.WHITE && (index >= 8 && index <= 15)) ||
                        (color === COLOR.BLACK && (index >= 48 && index <= 55)))) {
            return true;
        } else {
            return false;
        }
    },
    /**
     * Big function used by all the pieces that can move more than one box at once 
     * (rook, bishop, queen)
     * 
     * @param {integer} piece piece code
     * @param {integer} indexStart piece origin
     * @param {integer} incrementation number to increase the origin with to get the destination
     * @returns {Object<begun,pin>} the begun and the pin for the ennemy king
     */
    checkDiagonal: function (piece, indexStart, incrementation) {
        //If there are two tracks to the king, moving a piece won't resolve the problem
        var dIndex = indexStart + incrementation,
                pathToKing = [this.at(indexStart)],
                pinPath = [this.at(indexStart)],
                kingFound = false,
                tracks = this.myKingIsChess(piece),
                pin = this.myKingIsPin(piece),
                imPin = Tools.pieceIsPin(pin, this.at(indexStart)),
                direction = this.at(dIndex),
                firstCollision = false,
                kingPin = false;
        if (!(Tools.isAtRightBorder(indexStart) && Tools.turnRight(incrementation)
                || Tools.isAtLeftBorder(indexStart) && Tools.turnLeft(incrementation))) {
            while (!_.isUndefined(direction) && dIndex >= 0 && dIndex <= 64) {

                // For "pin"
                pinPath.push(direction);

                //For "chess"
                if (!kingFound) {
                    pathToKing.push(direction);
                }

                //Exit if encountring an ennemy
                if (!direction.isEmpty()) {
                    if (!Tools.sameColor(direction.getCurrent(), piece)) {
                        if (imPin) {
                            Tools.addIfSame(imPin, direction, piece);
                        } else if (tracks && tracks[0]) {
                            Tools.addIfSame(tracks[0], direction, piece);
                        } else {
                            !firstCollision && direction.addTrAndBg(piece);
                        }

                        var invertColor = Tools.getInvertColor(piece);
                        if (direction.containKing(invertColor)) {
                            kingPin = true;
                            pinPath.pop();
                            if (!firstCollision) {
                                pathToKing.pop();
                                kingFound = true;
                            }
                        }
                        //Si on a déjà eu une collision, ou que l'on croise un pion de la même couleur
                        // On ne vas pas chercher plus loin pour le clouage
                    } else {
                        //On ajoute une "menace" pour le que le roi ne puisse pas manger cette pièce
                        !firstCollision && direction.addBegun(piece);
                    }

                    if (firstCollision || Tools.sameColor(direction.getCurrent(), piece)) {
                        break;
                    } else {
                        firstCollision = true;
                    }
                }

                //Exit if is at border
                if ((Tools.isAtRightBorder(direction.id) && Tools.turnRight(incrementation) ||
                        Tools.isAtLeftBorder(direction.id) && Tools.turnLeft(incrementation))) {

                    if (imPin) {
                        Tools.addIfSame(imPin, direction, piece);
                    } else if (tracks && tracks[0]) {
                        Tools.addIfSame(tracks[0], direction, piece);
                    } else {
                        !firstCollision && direction.addTrAndBg(piece);
                        firstCollision && direction.addBegun(piece);
                    }
                    break;
                }

                //Default = adding tracks, or "obligatory" tracks if king in chess
                if (imPin) {
                    Tools.addIfSame(imPin, direction, piece);
                } else if (tracks && tracks[0]) {
                    Tools.addIfSame(tracks[0], direction, piece);
                } else {
                    !firstCollision && direction.addTrAndBg(piece);
                    firstCollision && direction.isEmpty() && direction.addBegun(piece);
                }

                dIndex += incrementation;
                direction = this.at(dIndex);
            }
        }
        if (!kingFound) {
            pathToKing = [];
        }
        if (!kingPin) {
            pinPath = [];
        }

        return {
            'begun': pathToKing,
            'pin': pinPath
        };
    },
    /*
     * Utilies function about the king
     * - Get the pin Array
     * - Get the begun Array
     * - Get the king position
     * - Set the kings position
     * - Set the pin Array
     * - Set the begun Array
     * - Reset the pins array
     * - Reset the beguns array
     */

    blackIsChess: function () {
        return !_.isEmpty(this.blackKingBegunTrack) ? this.blackKingBegunTrack : false;
    },
    whiteIsChess: function () {
        return !_.isEmpty(this.whiteKingBegunTrack) ? this.whiteKingBegunTrack : false;
    },
    blackIsPin: function () {
        return !_.isEmpty(this.blackPin) ? this.blackPin : false;
    },
    whiteIsPin: function () {
        return !_.isEmpty(this.whitePin) ? this.whitePin : false;
    },
    myKingIsChess: function (piece) {
        return Tools.ifWhiteElseIfBlack(piece, this.whiteIsChess(), this.blackIsChess());
    },
    myKingIsPin: function (piece) {
        return Tools.ifWhiteElseIfBlack(piece, this.whiteIsPin(), this.blackIsPin());
    },
    setKingPosition: function (piece, position) {
        var color = Tools.getPieceColor(piece);
        color === COLOR.WHITE ? this.kingsPosition.white = position : this.kingsPosition.black = position;
    },
    resetBeguns: function () {
        this.whiteKingBegunTrack = [];
        this.blackKingBegunTrack = [];
    },
    resetPin: function () {
        this.whitePin = [];
        this.blackPin = [];
    },
    updateKingBegunAndPin: function (color, begunPin) {
        var begun = begunPin.begun;
        var pin = begunPin.pin;
        if (color === COLOR.WHITE) {
            !_.isEmpty(begun) && this.whiteKingBegunTrack.push(begun);
            !_.isEmpty(pin) && this.whitePin.push(pin);
        } else {
            !_.isEmpty(begun) && this.blackKingBegunTrack.push(begun);
            !_.isEmpty(pin) && this.blackPin.push(pin);
        }
    },
    findColorKing: function (color) {
        return Tools.ifWhiteElseIfBlack(color,this.kingsPosition.white,this.kingsPosition.black);
    },
});
