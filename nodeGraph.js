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
      radius: 0
    };
    nodeData.position.x = floor(random() * 800);
    nodeData.position.y = floor(random() * 500);
    nodeData.radius = floor(random() * 20) + 5;
    //radius based on number of junctions?
    nodes.push(nodeData);
  }
}

function createJunctionsData() {
  //populate junctions array
  //need to pick two nodes to connect
}