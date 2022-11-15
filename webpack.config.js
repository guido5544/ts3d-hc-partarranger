const path = require('path');

module.exports = {
  entry: './dev/public/js/hcPartArranger/PartArranger.js',
  mode: "production",
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'hcPartArranger.min.js',
    library: 'hcPartArranger', //add this line to enable re-use
  },
};
