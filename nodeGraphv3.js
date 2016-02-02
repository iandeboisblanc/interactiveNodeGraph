//settings
var settings = {
  nodeCount: 20,
  springCount: 27,
  springConstant: 0.05,
  springDamping: 0.9, //between 0 and 1
  airResistance: 0.005,  //between 0 and 1, for velocity loss
  wallLoss: 0.05,    //between 0 and 1, for vel loss on wall hit
  stepTime: 5,
  width: window.innerWidth - 40,
  height: window.innerHeight - 40,
}

//variables to hold data
var nodes = [];
var springs = [];

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
  x = max(r, min(x, (settings.width - r)));
  y = max(r, min(y, (settings.height - r)));
  return [x,y];
}

//enables drag functionality on circles
var drag = d3.behavior.drag()
    .on("drag", function(d,i) {
      d.beingDragged = true;
      var x = d3.event.x;
      var y = d3.event.y;
      var xy = limitPositions(x, y, d.mass);
      d.velocity.x = (xy[0] - d.position.x) / settings.stepTime * 2.5;
      d.velocity.y = (xy[1] - d.position.y) / settings.stepTime * 2.5;
      d.position.x = xy[0];
      d.position.y = xy[1];
      //edit velocities
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
  createSpringsData();
  generateSprings();
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
      velocity: {},
      mass: 0,
      beingDragged: false
    };
    nodeData.mass = floor(random() * 20) + 5;
    var xy = limitPositions(random() * settings.width, random() * settings.height, nodeData.mass);
    nodeData.position.x = xy[0];
    nodeData.position.y = xy[1];
    nodeData.velocity.x = 0; 
    nodeData.velocity.y = 0;
    nodes.push(nodeData);
  }
}

function createSpringsData() {
  var possibleSprings = [];
  for(var i = 0; i < settings.nodeCount; i++) {
    for(var j = i + 1; j < settings.nodeCount; j++) {
      possibleSprings.push([i,j]);
    }
  }
  for(var i = 0; i < settings.springCount; i++) {
    var springData = {nodeIndices: [], length: 0, k:settings.springConstant};
    var index = floor(random() * possibleSprings.length);
    springData.nodeIndices = possibleSprings.splice(index, 1)[0];
    var node1Pos = nodes[springData.nodeIndices[0]].position;
    var node2Pos = nodes[springData.nodeIndices[1]].position;
    springData.length = findDistance(node1Pos, node2Pos);
    springs.push(springData);
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
      return d.mass;
    })
    .call(drag);
}

function generateSprings() {
  d3.select('.board').selectAll('line')
    .data(springs)
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
    .data(springs)
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

function applySpringForces() {
  for(var i = 0; i < springs.length; i++) {
    var node1Index = springs[i].nodeIndices[0];
    var node2Index = springs[i].nodeIndices[1];
    var node1 = nodes[node1Index];
    var node2 = nodes[node2Index];
    var newDistance = findDistance(node1.position, node2.position);
    var displacement = newDistance - springs[i].length;
    if(displacement) {
      var velDiff = findDistance(node1.velocity, node2.velocity);
      var force = springs[i].k * displacement * (1 - settings.springDamping);
      var xPosDiff = node2.position.x - node1.position.x;
      var yPosDiff = node2.position.y - node1.position.y;
      if(xPosDiff === 0) {
        var theta = Math.PI;
      }
      else {
        var theta = atan(yPosDiff / xPosDiff);
      }
      if (xPosDiff <= 0) {
        force *= -1;
      }
      var dVx1 = force / node1.mass * cos(theta);
      var dVy1 = force / node1.mass * sin(theta);
      var dVx2 = -force / node2.mass * cos(theta);
      var dVy2 = -force / node2.mass * sin(theta);
      if(!node1.beingDragged) {
        node1.velocity.x += dVx1;
        node1.velocity.y += dVy1;
      } 
      if(!node2.beingDragged) {
        node2.velocity.x += dVx2;
        node2.velocity.y += dVy2;
      }
    }
  }
}

function updateNodePositions() {
  for(var i = 0; i < nodes.length; i++) {
    var node = nodes[i];
    if(!(node.beingDragged)){
      node.position.x += node.velocity.x;
      if(node.position.x <= node.mass || node.position.x >= settings.width - node.mass) {
        node.position.x = limitPositions(node.position.x,1,node.mass)[0];
        node.velocity.x = (settings.wallLoss - 1) * node.velocity.x;
      }
      node.position.y += node.velocity.y;
      if(node.position.y <= node.mass || node.position.y >= settings.height - node.mass) {
        node.position.y = limitPositions(1,node.position.y,node.mass)[1];
        node.velocity.y = (settings.wallLoss - 1) * node.velocity.y;
      }
      node.velocity.x *= 1 - (settings.airResistance);
      node.velocity.y *= 1 - (settings.airResistance);
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

function resize() {
  settings.width = window.innerWidth - 40;
  settings.height = window.innerHeight - 40;
  d3.select('svg')
    .attr('width', settings.width)
    .attr('height', settings.height);
}

setInterval(function() {
  applySpringForces();
  updateNodePositions();
  updateLines();
}, settings.stepTime);

d3.select(window).on('resize', resize);
