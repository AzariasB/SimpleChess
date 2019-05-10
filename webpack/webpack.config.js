const path = require('path');
const HtmlWebPackPlugin = require('html-webpack-plugin');

module.exports = {
	entry   : path.resolve(__dirname, '../src/app.js'),
	output  : {
		path     : path.resolve(__dirname, '..', 'dist'),
		filename : 'chess.js'
	},
	resolve : {
		extensions : [ '.js' ],
		alias      : {
			angular : path.resolve(__dirname, '../node_modules/'),
			jQuery  : path.resolve(__dirname, '../node_modules/jquery/')
		}
	},
	plugins : [
		new HtmlWebPackPlugin({
			title    : 'Chess',
			template : path.resolve(__dirname, 'index.ejs')
		})
	],
	mode    : 'development'
};
