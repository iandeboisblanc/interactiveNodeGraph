//settings
var settings = {
  nodeCount: 3,
  junctionCount: 3,
  // boardWidth: 800,
  // boardHeight: 500
}

//variable delcarations
var nodes = [];
var junctions = [];
var lastNodePositions = [];
var nodeJunctionMap = {};

//helpful things
var random = Math.random;
var max = Math.max;
var min = Math.min;
var floor = Math.floor;
var trunc = Math.trunc;


var drag = d3.behavior.drag()
    .on("drag", function(d,i){
      var x = d3.event.x;
      var y = d3.event.y;
      // console.log(x,y,this,d);
      x = max(d.radius + 5, min(x, (800 - (d.radius + 5))));
      y = max(d.radius + 5, min(y, (500 - (d.radius + 5))));
      d.position.x = x;
      d.position.y = y;
      d3.select(this)
        .attr("cx", d.position.x)
        .attr("cy", d.position.y);
      var connectedLines = updateDraggedNodeLines(x,y,i);
      // //maybe have function here to update 'forces' which updates data everywhere
      // //have setinterval that regerates positions every all the time?
      // var secondaryNodeIndices = connectedLines.map(function(line) {
      //   var lineIndexMappings = d3.select(line).data()[0];
      //   if(lineIndexMappings[0] !== i) {
      //     return lineIndexMappings[0];
      //   }
      //   else {
      //     return lineIndexMappings[1];
      //   }
      // });
      // updateSecondaryNodes(connectedLines, secondaryNodeIndices);
    });

init();

function init() {
  // $svg = $('<svg />').addClass('board');
  // $svg.attr('viewBox',"5 0 90 100");
  // $('body').append($svg);
  createNodesData();
  createJunctionsData();
  generateJunctions();
  generateNodes();
}

//functions
function createNodesData() {
  //populate nodes array
  for(var i = 0; i < settings.nodeCount; i++) {
    var nodeData = {
      position: {},
      radius: 0
    };
    nodeData.radius = floor(random() * 20) + 5;
    //hardwired in size of board and stroke width:
    nodeData.position.x = max(nodeData.radius + 5, floor(random() * (800 - (nodeData.radius + 5)))); 
    nodeData.position.y = max(nodeData.radius + 5, floor(random() * (500 - (nodeData.radius + 5))));
    //radius based on number of junctions?
    nodes.push(nodeData);
    lastNodePositions.push(JSON.parse(JSON.stringify(nodeData)));
  }
}

function createJunctionsData() {
  //instead of random junctions, have random forces between nodes?
  //junctions just represent the invisible forces?
  for(var i = 0; i < settings.junctionCount; i++) {
    var junctionData = [];
    var node1Index = floor(random() * settings.nodeCount);
    var node2Index = floor(random() * settings.nodeCount);
    while (node1Index === node2Index) {
      node2Index = floor(random() * settings.nodeCount);
    }
    if(!nodeJunctionMap[node1Index]) {
      nodeJunctionMap[node1Index] = [];
    }
    if(!nodeJunctionMap[node2Index]) {
      nodeJunctionMap[node2Index] = [];
    }
    nodeJunctionMap[node1Index].push(i + 'node1');
    nodeJunctionMap[node2Index].push(i + 'node2');
    junctionData = [node1Index, node2Index];
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
      var node1 = nodes[d[0]];
      return node1.position.x;
    })
    .attr('y1', function(d) {
      var node1 = nodes[d[0]];
      return node1.position.y;
    })
    .attr('x2', function(d) {
      var node2 = nodes[d[1]];
      return node2.position.x;
    })
    .attr('y2', function(d) {
      var node2 = nodes[d[1]];
      return node2.position.y;
    })
}

function updateDraggedNodeLines(x, y, nodeIndex) {
  var headLines = 
    d3.selectAll('line')
      .filter(function(d,i){
        return (nodeJunctionMap[nodeIndex].indexOf(i + 'node1') >= 0);
      })
      .attr('x1', x)
      .attr('y1', y);
  var tailLines =
    d3.selectAll('line')
      .filter(function(d,i){
        return (nodeJunctionMap[nodeIndex].indexOf(i + 'node2') >= 0);
      })
      .attr('x2', x)
      .attr('y2', y);
  return headLines[0].concat(tailLines[0]);
}

// function updateSecondaryNodes(lines, nodeIndices) {
//   console.log(lines, nodeIndices);
// }

function updateLines() {
  //cycle through all lines
  d3.select('.board').selectAll('line')
    .data(junctions)
    .attr('x1', function(d) {
      var node1 = nodes[d[0]];
      return node1.position.x;
    })
    .attr('y1', function(d) {
      var node1 = nodes[d[0]];
      return node1.position.y;
    })
    .attr('x2', function(d) {
      var node2 = nodes[d[1]];
      return node2.position.x;
    })
    .attr('y2', function(d) {
      var node2 = nodes[d[1]];
      return node2.position.y;
    });
}

function updateNodePositions() {
  for(var i = 0; i < junctions.length; i++) {
    //check what nodes are attached
    var node1 = junctions[i][0];
    var node2 = junctions[i][1];
    //if my attached nodes are in a new position relative to last time
    if(nodes[node1].position.x !== lastNodePositions[node1].position.x){
      //node2 x needs to change
      var offset = nodes[node1].position.x - lastNodePositions[node1].position.x;
      nodes[node2].position.x = nodes[node2].position.x + trunc(offset * 0.9);
    }
    if(nodes[node1].position.y !== lastNodePositions[node1].position.y){
      var offset = nodes[node1].position.y - lastNodePositions[node1].position.y;
      nodes[node2].position.y = nodes[node2].position.y + trunc(offset * 0.9);
      //node2 y needs to change
    }
    if(nodes[node2].position.x !== lastNodePositions[node2].position.x){
      var offset = nodes[node2].position.x - lastNodePositions[node2].position.x;
      nodes[node1].position.x = nodes[node1].position.x + trunc(offset * 0.9);
      //node1 x needs to change
    }
    if(nodes[node2].position.y !== lastNodePositions[node2].position.y){
      var offset = nodes[node2].position.y - lastNodePositions[node2].position.y;
      nodes[node1].position.y = nodes[node1].position.y + trunc(offset * 0.9);
      //node1 y needs to change
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

  lastNodePositions = JSON.parse(JSON.stringify(nodes));
}

setInterval(function() {
  updateNodePositions();
  updateLines();
}, 10);

// setInterval(function(){
//   d3.selectAll('circle')
//     .style('fill', function() {
//       var colors = ['red', 'blue', 'green'];
//       color = colors[floor(random() * colors.length)];
//       return color;
//     })
// },1);