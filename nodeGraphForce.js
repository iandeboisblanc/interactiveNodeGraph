//settings
var settings = {
  nodeCount: 20,
  junctionCount: 27,
  stepTime: 10,
  width: 1250,
  height: 570
}

//variables to hold data
var nodes = [];
var junctions = [];

//helpful things
var random = Math.random;
var max = Math.max;
var min = Math.min;
var floor = Math.floor;
var sqrt = Math.sqrt;
var pow = Math.pow;
var sin = Math.sin;
var cos = Math.cos;
var atan = Math.atan;
var findDistance = function(pos1, pos2) {
  return sqrt(pow(pos2.x - pos1.x, 2) + pow(pos2.y - pos1.y, 2));
}
var limitPositions = function(x,y,r) {
  x = max(r + 5, min(x, (settings.width - (r + 5))));
  y = max(r + 5, min(y, (settings.height - (r + 5))));
  return [x,y];
}

//enables drag functionality on circles
var drag = d3.behavior.drag()
    .on("drag", function(d,i) {
      d.beingDragged = true;
      var x = d3.event.x;
      var y = d3.event.y;
      var xy = limitPositions(x, y, d.radius);
      d.position.x = xy[0];
      d.position.y = xy[1];
      d3.select(this)
        .attr("cx", d.position.x)
        .attr("cy", d.position.y);
    })
    .on('dragend', function(d) {
      d.beingDragged = false;
    });

//start everything going!
init();

//functions:
function init() {
  createBoard();
  createNodesData();
  createJunctionsData();
  generateJunctions();
  generateNodes();
}

function createBoard() {
  d3.select('body').selectAll('svg')
    .data([{width:settings.width, height:settings.height}])
    .enter()
    .append('svg')
    .attr('class', 'board')
    .attr('width', settings.width)
    .attr('height', settings.height);
}

function createNodesData() {
  for(var i = 0; i < settings.nodeCount; i++) {
    var nodeData = {
      position: {},
      radius: 0,
      beingDragged: false
    };
    nodeData.radius = floor(random() * 20) + 5;
    var xy = limitPositions(random() * settings.width, random() * settings.height, nodeData.radius);
    nodeData.position.x = xy[0];
    nodeData.position.y = xy[1];
    nodes.push(nodeData);
  }
}

function createJunctionsData() {
  var possibleJunctions = [];
  for(var i = 0; i < settings.nodeCount; i++) {
    for(var j = i + 1; j < settings.nodeCount; j++) {
      possibleJunctions.push([i,j]);
    }
  }
  for(var i = 0; i < settings.junctionCount; i++) {
    var junctionData = {nodeIndices: [], length: 0, k:1};
    var index = floor(random() * possibleJunctions.length);
    junctionData.nodeIndices = possibleJunctions.splice(index, 1)[0];
    var node1Pos = nodes[junctionData.nodeIndices[0]].position;
    var node2Pos = nodes[junctionData.nodeIndices[1]].position;
    junctionData.length = findDistance(node1Pos, node2Pos);
    junctions.push(junctionData);
  }
}

function generateNodes() {
  d3.select('.board').selectAll('circle')
    .data(nodes)
    .enter()
    .append('circle')
    .attr('cx', function(d) {
      return d.position.x;
    })
    .attr('cy', function(d) {
      return d.position.y;
    })
    .attr('r', function(d) {
      return d.radius;
    })
    .call(drag);
}

function generateJunctions() {
  d3.select('.board').selectAll('line')
    .data(junctions)
    .enter()
    .append('line')
    .attr('x1', function(d) {
      var node1 = nodes[d.nodeIndices[0]];
      return node1.position.x;
    })
    .attr('y1', function(d) {
      var node1 = nodes[d.nodeIndices[0]];
      return node1.position.y;
    })
    .attr('x2', function(d) {
      var node2 = nodes[d.nodeIndices[1]];
      return node2.position.x;
    })
    .attr('y2', function(d) {
      var node2 = nodes[d.nodeIndices[1]];
      return node2.position.y;
    })
}

function updateLines() {
  d3.select('.board').selectAll('line')
    .data(junctions)
    .attr('x1', function(d) {
      var node1 = nodes[d.nodeIndices[0]];
      return node1.position.x;
    })
    .attr('y1', function(d) {
      var node1 = nodes[d.nodeIndices[0]];
      return node1.position.y;
    })
    .attr('x2', function(d) {
      var node2 = nodes[d.nodeIndices[1]];
      return node2.position.x;
    })
    .attr('y2', function(d) {
      var node2 = nodes[d.nodeIndices[1]];
      return node2.position.y;
    });
}

function updateNodePositions() {
  for(var i = 0; i < junctions.length; i++) {
    var node1Index = junctions[i].nodeIndices[0];
    var node2Index = junctions[i].nodeIndices[1];
    var node1 = nodes[node1Index];
    var node2 = nodes[node2Index];
    var newDistance = findDistance(node1.position, node2.position);
    var displacement = newDistance - junctions[i].length;
    if(displacement) {
      var force = -1 * junctions[i].k * displacement;
      var velocity1 = force / node1.radius;
      var velocity2 = force / node2.radius;
      var xDisplacement = node2.position.x - node1.position.x;
      var yDisplacement = node2.position.y - node1.position.y;
      if(xDisplacement === 0) {
        var theta = Math.PI;
      }
      else {
        var theta = atan(yDisplacement/xDisplacement);
      }
      if (xDisplacement <= 0) {
        velocity1 *= -1;
        velocity2 *= -1;
      }
      var x1 = node1.position.x - velocity1 * cos(theta);
      var y1 = node1.position.y - velocity1 * sin(theta);
      var x2 = node2.position.x + velocity2 * cos(theta);
      var y2 = node2.position.y + velocity2 * sin(theta);
      var xy1 = limitPositions(x1, y1, node1.radius);
      var xy2 = limitPositions(x2, y2, node2.radius);
      if(!node1.beingDragged) {
        node1.position.x = xy1[0];
        node1.position.y = xy1[1];
      }
      if(!node2.beingDragged) {
        node2.position.x = xy2[0];
        node2.position.y = xy2[1];
      }
    }
  }
  d3.select('.board').selectAll('circle')
    .data(nodes)
    .attr('cx', function(d) {
      return d.position.x;
    })
    .attr('cy', function(d) {
      return d.position.y;
    });
}

setInterval(function() {
  updateNodePositions();
  updateLines();
}, settings.stepTime);
