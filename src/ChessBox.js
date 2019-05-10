/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */


/* global Backbone, Tools, _, COLOR, P_HEX */


var ChessBox = Backbone.Model.extend({
    defaults: {
        PRESENT: 0,
        WHITEBEGUN: [],
        BLACKBEGUN: [],
        TRACKS: [],
    },
    /**
     * Set the current chessman of the box
     * 
     * @param {type} chessman the new current chessman to set
     * @returns {integer} chessman code of the previous current (if there was one)
     */
    setCurrent: function (chessman) {
        var eaten = this.getCurrent();
        this.set({"PRESENT": chessman});
        return eaten;
    },
    //Getters ...
    getCurrent: function () {
        return this.get("PRESENT");
    },
    getWhiteBegun: function () {
        return this.get("WHITEBEGUN");
    },
    getBlackBegun: function () {
        return this.get("BLACKBEGUN");
    },
    getTracks: function () {
        return this.get("TRACKS");
    },
    /**
     * Remove the current chessman
     * 
     * @returns {integer} chessman code of the chessman removed
     */
    removePiece: function () {
        var p = this.getCurrent();
        this.setCurrent(0);
        return p;
    },
    /**
     * Add a track and a begun to the current box
     * 
     * @param {integer} chessman the chessman code that we want to add in Track and begun arrays
     */
    addTrAndBg: function (chessman) {
        this.addTrack(chessman);
        this.addBegun(chessman);
        return;
    },
    /**
     * Add a track with the chessman code
     * 
     * @param {integer} chessman
     */
    addTrack: function (chessman) {
        this.getTracks().push(chessman);
        return;
    },
    /**
     * More getter 
     */
    getBegun: function (color) {
        return Tools.ifWhiteElseIfBlack(color, this.getWhiteBegun(), this.getBlackBegun());
    },
    /**
     * To know if the current chessman is begun by his enemy
     * 
     * @returns {boolean} if there is a chessman on the box, and a begun of the ennemy
     */
    currentIsBegun: function () {
        return this.getCurrent() &&
                !_.isEmpty(this.getBegun(Tools.getInvertColor(this.getCurrent())));
    },
    /**
     * Add the chessman in the good begun array
     * 
     * @param {integer} chessman the chessman code to add in begun
     */
    addBegun: function (chessman) {
        var toPush = Tools.ifWhiteElseIfBlack(chessman, this.getWhiteBegun(), this.getBlackBegun());
        toPush && toPush.push(chessman);
        return;
    },
    /**
     * Return the begunners of the current chessman
     * 
     * @returns {Array<integer>|undefined} array if there is a current chessman in the box
     */
    getBegunner: function () {
        var present = this.getCurrent();
        if (present && this.currentIsBegun()) {
            return Tools.ifWhiteElseIfBlack(present, this.getBlackBegun(), this.getWhiteBegun());
            return Tools.getPieceColor(present) === COLOR.WHITE ? this.getBlackBegun() : this.getWhiteBegun();
        } else {
            return;
        }
    },
    /**
     * Remove a chessman from "track" and "begun" arrays
     * 
     * @param {integer} chessman the code of the chessman that we want to remove from track and begun
     */
    removeTrAndBg: function (chessman) {
        this.removeTrack(chessman);
        this.removeBegun(chessman);
        return;
    },
    /**
     * Remove track for a single chessman
     * 
     * @param {integer} chessman the code of the chessman we want to remove from track
     */
    removeTrack: function (chessman) {
        var self = this;
        _.each(this.getTracks(), function (tracker, index) {
            if (Tools.sameId(tracker, chessman)) {
                self.getTracks().split(index, 1);
            }
        });
        return;
    },
    /**
     * Remove all begun and track for the color "color" if there's one
     * Else, remove all the tracks and beguns.
     * 
     * @param {integer} color color to remove from begun and track
     */
    reset: function (color) {
        if (!color) {
            this.set({
                WHITEBEGUN: [],
                BLACKBEGUN: [],
                TRACKS: []
            });
        } else {
            if (color === COLOR.BLACK) {
                this.set({
                    BLACKBEGUN: []
                });
                this.resetTrackByColor(COLOR.BLACK);
            } else {
                this.set({
                    WHITEBEGUN: []
                });
                this.resetTrackByColor(COLOR.WHITE);
            }
        }
        return;
    },
    /**
     * Remove track only if is the same color of "color"
     * 
     * @param {integer} color
     */
    resetTrackByColor: function (color) {
        var self = this;
        _.each(this.getTracks(), function (chessman, index) {
            if (Tools.sameColor(chessman, color)) {
                self.getTracks().splice(index, 1);
            }
        });
        return;
    },
    /**
     * Remove the begun of a single chessman
     * 
     * @param {integer} chessman the chessman code
     */
    removeBegun: function (chessman) {
        var toRemove = Tools.ifWhiteElseIfBlack(chessman, this.getWhiteBegun(), this.getBlackBegun());
        _.each(toRemove, function (mPiece, index) {
            if (Tools.sameId(mPiece, chessman) && Tools.sameColor(mPiece,chessman)) {
                toRemove.splice(index, 1);
            }
        });
        Tools.isWhite(chessman) ? (this.set({WHITEBEGUN: toRemove})) : (this.set({BLACKGEBUN: toRemove}));
        return;
    },
    /**
     * Helper for the castling, to know if the king can go throw the box
     * 
     * @param {integer} begunner chessman code of the possible begguner 
     * @returns {Boolean} if the current box (and not chessman) contain a begun of the color
     */
    isBegunBy: function (begunner) {
        var color = Tools.getPieceColor(begunner);
        return Tools.isWhite(color) ? !_.isEmpty(this.getWhiteBegun()) :
                Tools.isBlack(color) ? !_.isEmpty(this.getBlackBegun()) : undefined;
    },
    /**
     * Helper to know if it's save for a king to move on this box
     * 
     * @param {integer} king the chessman code of the king
     * @returns {Boolean} if the king can move on the box without danger
     */
    kingCanComeHere: function (king) {
        var color = Tools.getPieceColor(king);
        return (this.isEmpty() && Tools.ifWhiteElseIfBlack(king, _.isEmpty(this.getBlackBegun()), _.isEmpty(this.getWhiteBegun())))
                || (!this.isEmpty() && !Tools.sameColor(this.getCurrent(), color) &&
                        Tools.ifWhiteElseIfBlack(king, _.isEmpty(this.getBlackBegun(), _.isEmpty(this.getWhiteBegun()))));
    },
    /**
     * 
     * @returns {Boolean} if there's nobody here, on this box !
     */
    isEmpty: function () {
        return (this.getCurrent() === 0);
    },
    /**
     * This function does not check if the eater's got tracks on this box
     * It's just check if there's somedy on the box, and that the color is not the same
     * 
     * @param {integer} eater the chessman code of the eater
     * @returns {Boolean} if the eater can eat the current chessman
     */
    canBeEaten: function (eater) {
        return !this.isEmpty() && !Tools.sameColor(this.getCurrent(), eater);
    },
    /**
     * Test if the box contain the same type of piece than the one given in parameter
     * 
     * @param {integer} chessmanHex code of the other chessman
     * @returns {Boolean} if the box contain the same type as the chessManHex
     */
    containsPiece: function (chessmanHex) {
        var present = this.getCurrent();
        return Tools.sameType(chessmanHex, present);
    },
    /**
     * To know if the king is in this box
     * 
     * @param {integer} color the color of the king we're looking for
     * @returns {Boolean} if the king is here
     */
    containKing: function (color) {
        var present = this.getCurrent();
        return Tools.sameType(present, P_HEX.KING) && Tools.sameColor(color, present);
    },
    /**
     * Helper to know if the chessman has a track on this box
     * 
     * @param {integer} chessman chessman code
     * @returns {Boolean} if the chessman got a track in this box
     */
    hasATrack: function (chessman) {
        var color = Tools.getPieceColor(chessman);

        var hasTrack = false;
        _.each(this.getTracks(), function (value) {
            if (Tools.sameId(value, chessman) && Tools.sameType(value, chessman) && Tools.sameColor(value, chessman)) {
                hasTrack = true;
            }
        });
        return hasTrack;
    },
    /**
     * Helper to know if a certain color has a track on this box
     * 
     * @param {integer} color color who can have a track
     * @returns {Boolean} if the color has a track
     */
    colorHasTrack: function (color) {
        var hasTrack = false;
        _.each(this.getTracks(), function (track) {
            if (Tools.sameColor(track, color)) {
                hasTrack = true;
            }
        });
        return hasTrack;
    }
});