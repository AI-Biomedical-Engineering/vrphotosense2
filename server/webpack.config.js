const path = require("path")

const TerserJSPlugin = require("terser-webpack-plugin")
const HtmlWebpackPlugin = require("html-webpack-plugin")
const MiniCssExtractPlugin = require("mini-css-extract-plugin")
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin")

module.exports = (env, {mode}) => {
	return {
		context: path.resolve(__dirname, "static"),
		entry: ["./js/main.js", "./css/style_all.css"],
		output: {
			path: path.resolve(__dirname, "static/dist"),
			filename: "main.js"
		},
		module: {
			rules: [{
				test: /\.css$/,
				use: [MiniCssExtractPlugin.loader, {
					loader: "css-loader",
					options: {
						url: false
					}
				}]
			}]
		},
		optimization: {minimizer: [
			new TerserJSPlugin({}),
			new CssMinimizerPlugin({test: /\.css$/})
		]},
		plugins: [
			new MiniCssExtractPlugin(),
			new HtmlWebpackPlugin({
				template: "dist/index.html",
				scriptLoading: "module",
				inject: "head"
			})
		]
	}
}