
/* global _, Backbone */

//HTML  char corresponding
var PIECES_CHAR = {
    WHITE: {
        KING: '9812',
        QUEEN: '9813',
        ROOK: '9814',
        BISHOP: '9815',
        KNIGHT: '9816',
        PAWN: '9817'
    },
    BLACK: {
        KING: '9818',
        QUEEN: '9819',
        ROOK: '9820',
        BISHOP: '9821',
        KNIGHT: '9822',
        PAWN: '9823'
    }
};
//Hexadecimal value of each chessman
var P_HEX = {
    PAWN: 0x6,
    BISHOP: 0x5,
    KNIGHT: 0x4,
    ROOK: 0x3,
    QUEEN: 0x2,
    KING: 0x1
};
//Possibles color
var COLOR = {
    WHITE: 0x8,
    BLACK: 0x10
};

/**
 * Gen => Generator
 * Helper to generate the chessmen and the board
 * Here are the possibles options to generate differents board
 */
var Gen = {
    idW: 0x20,
    idB: 0x20,
    boardOptions: {
        normalBoard: "normalBoard",
        onlyPawn: "onlyPawnBoard",
        noPawn: "noPawnBoard",
        kingNRook: "kingAndRook",
        kingNQueen: "kingAndQueen",
    },
    baseLine: [
        P_HEX.ROOK,
        P_HEX.KNIGHT,
        P_HEX.BISHOP,
        P_HEX.KING,
        P_HEX.QUEEN,
        P_HEX.BISHOP,
        P_HEX.KNIGHT,
        P_HEX.ROOK
    ],
    onlyKing: [0, 0, 0, 0, P_HEX.KING, 0, 0, 0],
    kingNRook: [P_HEX.ROOK, 0, 0, P_HEX.KING, 0, 0, 0, P_HEX.ROOK],
    kingNQueen: [0, 0, 0, P_HEX.KING, P_HEX.QUEEN, 0, 0, 0],
    newWPiece: function (piece_code) {
        if (piece_code !== 0) {
            piece_code += this.idW;
            piece_code += COLOR.WHITE;
            this.idW += 0x20;
        }
        return piece_code;
    },
    newBPiece: function (piece_code) {
        if (piece_code !== 0) {
            piece_code += this.idB;
            piece_code += COLOR.BLACK;
            this.idB += 0x20;
        }
        return piece_code;
    },
    genBoard: function (option, random) {
        random = random || false;
        var normalBoard = this[option] && this[option]();
        return random ? _.shuffle(normalBoard) : normalBoard;
    },
    normalBoard: function () {
        return this._theGenerator(this.baseLine, true);
    },
    onlyPawnBoard: function () {
        return this._theGenerator(this.onlyKing, true);

    },
    noPawnBoard: function () {
        return this._theGenerator(this.baseLine, false);
    },
    kingAndRook: function () {
        return this._theGenerator(this.kingNRook, true);
    },
    kingAndQueen: function () {
        return this._theGenerator(this.kingNQueen, false);
    },
    /**
     * 
     * @param {Array} baseLine the board
     * @param {boolean} pawn if an array of pawn is necessary
     * @returns {Array} board filled
     */
    _theGenerator: function (baseLine, pawn) {
        var whiteBLine = this.genLine(baseLine, this.newWPiece),
                whitePLine = pawn ? this.genPawnLine(this.newWPiece) : this.genEmptyLines(8),
                empty = this.genEmptyLines(),
                blackPLine = pawn ? this.genPawnLine(this.newBPiece) : this.genEmptyLines(8),
                blackBLine = this.genLine(baseLine, this.newBPiece);

        return whiteBLine.concat(whitePLine, empty, blackPLine, blackBLine);
    },
    genPawnLine: function (funcGen) {
        var board = [];
        funcGen = funcGen.bind(this);
        _.each(_.range(8), function () {
            board.push(funcGen(P_HEX.PAWN));
        });
        return board;
    },
    genEmptyLines: function (length) {
        return Array.apply(null, Array(length || 8 * 4)).map(Number.prototype.valueOf, 0);
    },
    genLine: function (line, funcGen) {
        var board = [];
        funcGen = funcGen.bind(this);
        _.each(line, function (piece) {
            board.push(funcGen(piece));
        });
        return board;
    },
};


/**
 * Some useful function to have less code in the main parts
 */
var Tools = {
    addIfSame: function (tracks, targetBox, piece, wayToAdd) {
        _.each(tracks, function (track) {
            if (track === targetBox) {
                if (wayToAdd && targetBox[wayToAdd]) {
                    targetBox[wayToAdd](piece);
                } else {
                    targetBox.addTrAndBg(piece);
                }
            }
        });
    },
    containPinOrBegun: function (begunPin) {
        return begunPin && (begunPin.begun || begunPin.pin)
                && (!_.isEmpty(begunPin.begun) || !_.isEmpty(begunPin.pin));
    },
    isWhite: function (piece) {
        return (piece & COLOR.WHITE) !== 0;
    },
    isBlack: function (piece) {
        return (piece & COLOR.BLACK) !== 0;
    },
    sameId: function (piece1, piece2) {
        piece1 = piece1 & 0x1111E0;
        piece2 = piece2 & 0x1111E0;
        return piece1 === piece2;
    },
    isValidIndex: function (index) {
        return index >= 0 && index <= 63;
    },
    sameType: function (piece1, piece2) {
        return this.getPieceType(piece1) === this.getPieceType(piece2);
    },
    getPieceColor: function (piece_code) {
        return Tools.isWhite(piece_code) ? COLOR.WHITE : Tools.isBlack(piece_code) ? COLOR.BLACK : null;
    },
    getPieceType: function (piece_code) {
        return (piece_code & 0x7);
    },
    getName: function (piece_hex, algebra) {
        algebra = algebra || false;
        var piece_type = Tools.getPieceType(piece_hex);
        switch (piece_type) {
            case P_HEX.KING :
                return algebra ? "R" : "Roi";
                break;
            case P_HEX.QUEEN :
                return algebra ? "D" : "Dame";
                break;
            case P_HEX.ROOK :
                return algebra ? "T" : "Tour";
                break;
            case P_HEX.BISHOP:
                return algebra ? "F" : "Fou";
                break;
            case P_HEX.KNIGHT:
                return algebra ? "C" : "Cavalier";
                break;
            case P_HEX.PAWN:
                return algebra ? "" : "Pion";
                break;
            default :
                return "";
                break;
        }
    },
    getColorName: function (piece) {
        return this.ifWhiteElseIfBlack(piece, "Blanc", "Noir");
    },
    getHtmlName: function (piece_number) {
        var piece_type = Tools.getPieceType(piece_number);
        var code = {};
        var hex = "&#";
        code = this.ifWhiteElseIfBlack(piece_number, PIECES_CHAR.WHITE, PIECES_CHAR.BLACK);
        if (code) {
            switch (piece_type) {
                case P_HEX.KING:
                    return hex + code.KING;
                case P_HEX.QUEEN:
                    return hex + code.QUEEN;
                case P_HEX.ROOK:
                    return hex + code.ROOK;
                case P_HEX.KNIGHT:
                    return hex + code.KNIGHT;
                case P_HEX.BISHOP:
                    return hex + code.BISHOP;
                case P_HEX.PAWN:
                    return hex + code.PAWN;
                default:
                    break;
            }
        }
    },
    isAtLeftBorder: function (div_id) {
        return ((Math.abs(div_id) % 8) === 0);
    },
    isAtRightBorder: function (div_id) {
        return (((Math.abs(div_id) + 1) % 8) === 0);
    },
    isOnHisLastLine: function (piece, position) {
        return this.ifWhiteElseIfBlack(piece, position >= 56 && position <= 63,
                position >= 0 && position <= 7);
    },
    ifWhiteElseIfBlack: function (piece, returnWhite, returnBlack) {
        var color = this.getPieceColor(parseInt(piece));
        return color === COLOR.WHITE ? returnWhite :
                color === COLOR.BLACK ? returnBlack : undefined;
    },
    sameColor: function (piece1, piece2) {
        return (Tools.getPieceColor(piece1) === Tools.getPieceColor(piece2));
    },
    getPositionFromLeft: function (div_id) {
        return (div_id % 8);
    },
    turnLeft: function (direction) {
        return (direction === 7 || direction === -9 || direction === -1);
    },
    turnRight: function (direction) {
        return (direction === 9 || direction === -7 || direction === 1);
    },
    isEven: function (number) {
        return number & 2 === 2;
    },
    isOdd: function (number) {
        return number & 2 !== 0;
    },
    getInvertColor: function (color) {
        color = this.getPieceColor(color);
        return color === COLOR.BLACK ? COLOR.WHITE : COLOR.BLACK;
    },
    getAlebraFromPosition: function (index) {
        var column = index & 0x7;
        var row = (index - column) / 8;
        return String.fromCharCode(97 + column) + (row + 1);
    },
    //TODO : improve speed of this function by adding a "break" in for loop
    pieceIsPin: function (pin, piecePos) {
        var isPin;
        _.each(pin, function (pinArray) {
            _.each(pinArray, function (box) {
                if (box === piecePos) {
                    isPin = pinArray;
                }
            });
        });
        return isPin;
    },
    pieceCanProtect: function (tracks) {
        return !tracks || tracks.length === 1;
    },
    sameColumn: function (index1, index2) {
        var minIndex = Math.min(index1, index2);
        var maxIndex = Math.max(index1, index2);
        while (minIndex < maxIndex) {
            minIndex += 8;
        }
        return minIndex === maxIndex;
    },
    changeType: function (oldPiece, nwType) {
        var noType = oldPiece & 0xFFF8;
        return noType + nwType;
    }
};


