var line = Number(process.argv[2]);
var column = Number(process.argv[3]);

var sourceMap = require('source-map');
var rawSourceMap = require("./app-service.map.json")

sourceMap.SourceMapConsumer.with(rawSourceMap, null, consumer => {
  console.log("originalPositionFor: line :", line, "column:", column, "\n", consumer.originalPositionFor({
    source: "./",
    line: line,
    column: column
  }));
});