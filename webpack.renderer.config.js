const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');

module.exports = {
  module: {
    rules: [
      { test: /native_modules[/\\].+\.node$/, use: 'node-loader' },
      {
        test: /[/\\]node_modules[/\\].+\.(m?js|node)$/,
        parser: { amd: false },
        use: {
          loader: '@vercel/webpack-asset-relocator-loader',
          options: { outputAssetBase: 'native_modules' },
        },
      },
      {
        test: /\.tsx?$/,
        exclude: /(node_modules|\.webpack)/,
        use: { loader: 'ts-loader', options: { transpileOnly: true } },
      },
      { test: /\.css$/, use: ['style-loader', 'css-loader', 'postcss-loader'] },
    ],
  },
  plugins: [new ForkTsCheckerWebpackPlugin()],
  resolve: { extensions: ['.js', '.ts', '.jsx', '.tsx', '.css'] },
};