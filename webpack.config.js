const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const HtmlWebpackSkipAssetsPlugin =
	require("html-webpack-skip-assets-plugin").HtmlWebpackSkipAssetsPlugin;
const CopyPlugin = require("copy-webpack-plugin");
const baseManifest = require("./chrome/manifest.json");
const WebpackExtensionManifestPlugin = require("webpack-extension-manifest-plugin");
const glob = require("glob");
const _ = require("lodash");

const config = {
	mode: "development",
	devtool: "cheap-module-source-map",
	entry: {
		app: path.join(__dirname, "static", "index.js"),
		"content-script": path.join(__dirname, "app/content-scripts", "content-script.js"),
		...Object.fromEntries(
			_.zip(
				// keys eg. [ 'handlers/nico-douga', ...]
				glob.sync("handlers/*.js", { cwd: "app" }).map((filename) => filename.split(".")[0]),
				// values eg. [ './app/handlers/nico-douga.js', ...]
				glob.sync("./app/handlers/*.js")
			)
		),
	},
	output: {
		path: path.resolve(__dirname, "build"),
		filename: "[name].js",
	},
	resolve: {
		extensions: ["", "*", ".js"],
	},
	plugins: [
		new HtmlWebpackPlugin({
			title: "MEextension",
			meta: {
				charset: "utf-8",
				viewport: "width=device-width, initial-scale=1, shrink-to-fit=no",
				"theme-color": "#000000",
			},
			manifest: "manifest.json",
			filename: "index.html",
			template: "./static/index.html",
			hash: true,
		}),
		new HtmlWebpackSkipAssetsPlugin({
			excludeAssets: [/handlers\/*/],
		}),
		new CopyPlugin({
			patterns: [
				{
					from: "chrome/icons",
					to: "icons",
				},
			],
		}),
		new WebpackExtensionManifestPlugin({
			config: {
				base: baseManifest,
			},
		}),
	],
	module: {
		rules: [
			{
				test: /\.js$/,
				exclude: /node_modules/,
				use: ["babel-loader"],
			},
			{
				test: /\.css$/,
				use: ["style-loader", "css-loader", "postcss-loader"],
			},
			{
				test: /\.(png|svg|jpg|gif)$/,
				use: ["file-loader"],
			},
		],
	},
};
module.exports = config;
