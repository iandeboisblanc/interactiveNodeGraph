//settings
var settings = {
  nodeCount: 20,
  junctionCount: 40
}

//variable delcarations
var nodes = [];
var junctions = [];

//helpful things
var random = Math.random;
var max = Math.max;
var min = Math.min;
var floor = Math.floor;

//functions
function createNodesData() {
  //populate nodes array
  for(var i = 0; i < settings.nodeCount; i++) {
    var nodeData = {
      position: {},
      size: 0
    };
    nodeData.position.x = random();
    nodeData.position.y = random();
  }
  //need size and position (maybe not in this function)
    //size based on number of junctions?
}

function createJunctionsData() {
  //populate junctions array
  //need to pick two nodes to connect
}