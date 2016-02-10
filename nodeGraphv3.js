//settings
var settings = {
  nodeCount: 20,
  springCount: 27,
  // springConstant: 0.005,
  springDamping: 0.99, //between 0 and 1 DEPRECATED
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
var log10 = Math.log10;
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

//Given a scale between 0 and 100, how should values be mapped?
function mapSettingsValues(d, value, direction) {
  if(d.scale === 'linear') {
    if(direction === 'toPercentage') {
      return (value - d.min) / (d.max - d.min) * 100;
    } 
    if (direction === 'toSettingsValue') {
      return value / 100 * (d.max - d.min) + d.min;
    }
  }
  if(d.scale === 'log') {
    if(direction === 'toPercentage') {
      return pow(10,(value - d.min) / (d.max - d.min) * 2);
    }
    if(direction === 'toSettingsValue') {
      return log10(value) / 2 * (d.max - d.min) + d.min;
    }
  }
}

function factorial (n) {
  if (n == 0 || n == 1)
    return 1;
  else {
    return factorial(n-1) * n;
  } 
}

d3.selection.prototype.moveToFront = function() {
  return this.each(function(){
    this.parentNode.appendChild(this);
  });
};

//start everything going!
var possibleSprings = [];
init();

//functions:
function init() {
  createBoard();
  createMenu();
  createNodesData();
  createSpringsData();
  generateSprings();
  generateNodes();
  setInterval(function() {
    applySpringForces();
    updateNodePositions();
    updateLines();
  }, settings.stepTime);
d3.select(window).on('resize', resize);
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
  
function createMenu() {
  d3.select('.tab')
    .data([{open:false}])
    .on('click', function(d) {
      if(d.open) {
        d3.select('.sideBar')
          .style('left', '-167px');
        d.open = false;
      } else {
        d3.select('.sideBar')
          .style('left', '-10px');
        d.open = true;
      }
    });
  populateMenu();
}

function populateMenu() {
  //Clicky Controls
  var clickControls = [
  {setting:'nodeCount', min:0, max:function(){return 500}, name:'Nodes', callback:updateNodes},
  {setting:'springCount',min:0, 
    max: function(){return factorial(settings.nodeCount)/(2 * factorial(settings.nodeCount - 2))},
    name:'Springs', callback:updateSprings}]
  d3.select('.settings')
    .selectAll('div')
    .data(clickControls)
    .enter()
    .append('div')
    .attr('class', 'settingHolder')
    .append('label')
    .attr('for', function(d) {
      return d.setting + 'Control';
    })
    .text(function(d){return d.name});
  d3.selectAll('.settingHolder')
    .append('container')
    .attr('class', 'incrementers')
    .append('span')
    .attr('id', function(d) {
      return d.setting + 'Minus';
    })
    .text('-')
    .on('click', function(d) {
      settings[d.setting]--;
      d.callback();
    });
  d3.selectAll('.settingHolder container')
    .append('span')
    .attr('id', function(d) {
      return d.setting + 'Plus';
    })
    .text('+')
    .on('click', function(d) {
      settings[d.setting]++;
      d.callback();
    });
  //Slidey Controls
  var slideControls = [
    {setting:'springDamping', min:0.9, max:0.999, name: 'Spring Damping', scale:'log'}, 
    {setting:'airResistance', min:0, max:0.05, name: 'Air Resistance', scale:'linear'}];
  d3.select('.settings')
    .selectAll('input')
    .data(slideControls)
    .enter()
    .append('div')
    .attr('class', 'settingHolder')
    .append('label')
    .attr('for', function(d) {
      return d.setting + 'Slider';
    })
    .text(function(d) {
      return d.name;
    })
    .append('input')
    .attr('class', 'slider')
    .attr('id', function(d) {
      return d.setting + 'Slider';
    })
    .attr('type', 'range')
    .attr('min', 1)
    .attr('max', 100)
    .attr('value', function(d) {
      return mapSettingsValues(d, settings[d.setting], 'toPercentage');
    })
    .attr('step', 'all')
    .on('input', function(d) {
      settings[d.setting] = mapSettingsValues(d, this.value, 'toSettingsValue');
    })
}

function createNodesData(startingPoint) {
  startingPoint = startingPoint || 0;
  for(var i = startingPoint; i < settings.nodeCount; i++) {
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
    for(var j = 0; j < settings.nodeCount; j++) {
      possibleSprings.push([j,i]);
    }
  }
}

function createSpringsData(startingPoint) {
  startingPoint = startingPoint || 0;
  for(var i = startingPoint; i < settings.springCount; i++) {
    var springData = {nodeIndices: [], length: 0, k:1}; //settings.springConstant};
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

function updateNodes(){
  var previousNodeCount = nodes.length;
  if(settings.nodeCount > previousNodeCount) {
    createNodesData(previousNodeCount);
  } else if(settings.nodeCount < previousNodeCount) {
    //remove some data?
    //delete relavent nodes
    nodes.pop();
  }
  var d3Nodes = d3.select('.board').selectAll('circle')
    .data(nodes);
  //new ones:
  d3Nodes.enter()
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
  //old ones:
  d3Nodes.exit()
    .remove();
  updateSprings();
  updateSprings();
}

function updateSprings(){
  for(var j = 0; j < possibleSprings.length; j++) {
    if(possibleSprings[j][0] >= settings.nodeCount || possibleSprings[j][1] >= settings.nodeCount) {
      possibleSprings.splice(j,1);
    }
  }
  for(var i = 0; i < springs.length; i++) {
    if(!nodes[springs[i].nodeIndices[0]] || !nodes[springs[i].nodeIndices[1]]) {
      springs.splice(i,1);
      settings.springCount--;
    }
  }
  var previousSpringCount = springs.length;
  if(settings.springCount > previousSpringCount) {
    createSpringsData(previousSpringCount);
  } else if (settings.springCount < previousSpringCount) {
    //remove some data?
    springs.pop();
    //delete relavent Springs
  }
  var d3Springs = d3.select('.board').selectAll('line')
    .data(springs);
  //new ones:
  d3Springs.enter()
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
    });
  d3.selectAll('circle').moveToFront();
  //old ones:
  d3Springs.exit()
    .remove();
}

function resize() {
  settings.width = window.innerWidth - 40;
  settings.height = window.innerHeight - 40;
  d3.select('svg')
    .attr('width', settings.width)
    .attr('height', settings.height);
}


