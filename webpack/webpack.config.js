const path = require('path');
const HtmlWebPackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
	entry   : path.resolve(__dirname, '../src/app.js'),
	output  : {
		path     : path.resolve(__dirname, '..', 'dist'),
		filename : 'chess.js'
	},
	plugins : [
		new MiniCssExtractPlugin(),
		new HtmlWebPackPlugin({
			title    : 'Chess',
			template : path.resolve(__dirname, 'index.ejs'),
			inject   : 'head'
		})
	],
	module  : {
		rules : [
			{
				test : /\.less$/,
				use  : [
					MiniCssExtractPlugin.loader,
					'css-loader',
					{
						loader  : 'less-loader',
						options : {
							paths : [ path.resolve(__dirname, '../node_modules') ]
						}
					}
				]
			}
		]
	},
	mode    : 'development'
};
