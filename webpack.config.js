const path = require("path");
const webpack = require("webpack");

module.exports = {
    mode: "production",
    entry: "./src/gatsby-react-lightweight-charts.js",
    output: {
        path: path.resolve("dist"),
        filename: "gatsby-react-lightweight-charts.min.js",
        libraryTarget: "commonjs2"
    },
    module: {
        rules: [
            { test: /\.js$/, exclude: /node_modules/, loader: "babel-loader" },
            {
                test: /\.css$/,
                loader: "style-loader!css-loader"
            }
        ]
    },
    externals: {
        react: "react"
    },
    plugins: [
        new webpack.BannerPlugin({
            banner: "const _win=(global.window||{locale:\"en\",userAgent:\"\"}),_nav={}",
            raw: true
        }),
        new webpack.DefinePlugin({
            "window": "_win",
            "navigator": "_nav"
        })
    ]
};
