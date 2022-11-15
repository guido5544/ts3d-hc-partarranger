const path = require('path');

module.exports = {
  entry: './dev/public/js/hcPartArranger/PartArranger.js',
  mode: "production",
  experiments: {
    outputModule: true
  },
  output: {
    libraryTarget: 'module',
    path: path.resolve(__dirname, 'dist'),
    filename: 'hcPartArranger.module.min.js',
  },  
};
