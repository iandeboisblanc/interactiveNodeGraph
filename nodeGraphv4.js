/*******************
TODO:
- replace circles with groups (<g>) of 2 circles, so it can have a ring when selected
- move settings into world istance
- figure out how to handle only having ONE selected at a time (parent listener?)
- add collisions
- make vectors a class so they're easier to use correctly
********************/

// Global settings
const settings = {
  timeStep: 1,
  springDamping: 0.99,
  fluidResistance: 0.005,
  defaultSpringConstant: 1,
  width: window.innerWidth - 40,
  height: window.innerHeight - 40,
};

// Helper Functions
function generateId() {
  return Math.floor(Math.random() * 10000000);
}

function randomProperty(obj) {
  const keys = Object.keys(obj);
  return obj[keys[ keys.length * Math.random() << 0]];
};

function getDistance(mass1, mass2) {
  const dx = mass2.position[0] - mass1.position[0];
  const dy = mass2.position[1] - mass1.position[1];
  return Math.sqrt(dx*dx + dy*dy);
}

// d3 Functions
const drag = d3.drag()
  .on('drag.drag', (d) => {
    d.beingDragged = true;
    const x = Math.min(Math.max(d3.event.x, d.mass), settings.width - d.mass);
    const y = Math.min(Math.max(d3.event.y, d.mass), settings.height - d.mass);
    const velocity = [(x - d.position[0]) / settings.timeStep / 2.5, (y - d.position[1]) / settings.timeStep / 2.5];
    d.setVelocity(velocity);
    d.setPosition([x,y]);
  })
  .on('end.drag', function(d) {
    if (d.beingDragged) {
      d.beingDragged = false;
      return;
    }
    // can handle click (not drag) events here
  });

function resize() {
  settings.width = window.innerWidth - 40;
  settings.height = window.innerHeight - 40;
  d3.select('svg')
    .attr('width', settings.width)
    .attr('height', settings.height);
}

d3.selection.prototype.moveToFront = function() {
  return this.each(function(){
    this.parentNode.appendChild(this);
  });
};


class World {
  constructor(settings) {
    this.masses = [];
    this.springs = [];
    /*
    this.settings = {
      timeStep: 1,
      springDamping: 0.99,
      fluidResistance: 0.05,
      defaultSpringConstant: 1,
      width: window.innerWidth - 40,
      height: window.innerHeight - 40,
    };
    */
  }

  setSettings(settings) {
    Object.assign(this.settings, settings);
  }

  init() {
    this.createBoard();
    this.createMasses(15);
    this.createSprings(20);
    setInterval(this.update.bind(this),settings.stepTime)
  }

  createBoard() {
    d3.select('body').selectAll('svg')
      .data([{width:settings.width, height:settings.height}])
      .enter()
      .append('svg')
      .attr('class', 'board')
      .attr('width', d => d.width)
      .attr('height', d => d.height);
    d3.select(window)
      .on('resize', resize);
  }

  createMasses(n) {
    for(let i = 0; i < n; i++) {
      const mass = new Mass(Math.floor(Math.random() * 10 + 3), [Math.random() * 300, Math.random() * 300]);
      this.masses.push(mass);
    }

    d3.select('.board')
      .selectAll('circle')
      .data(this.masses, d => d.id)
      .enter()
      .append('g')
      .attr('class', 'mass');

    d3.select('.board')
      .selectAll('.mass')
      .data(this.masses, d => d.id)
      .append('circle')
      .attr('class', 'visible')
      .attr('r', d => d.mass)
      .attr('cx', d => d.position[0])
      .attr('cy', d => d.position[1])
      .on('mouseover', function(d) {
        d3.select(this).classed('hover', true)
      })
      .on('mouseout', function(d) {
        d3.select(this).classed('hover', false)
      })
      .call(drag)

    d3.select('.board')
      .selectAll('.mass')
      .data(this.masses, d => d.id)
      .append('circle')
      .attr('class', 'ring')
      .attr('r', d => d.mass + 5)
      .attr('cx', d => d.position[0])
      .attr('cy', d => d.position[1])
  }

  createSprings(n) {
    for(let i = 0; i < n; i++) {
      const mass1 = randomProperty(this.masses);
      const mass2 = randomProperty(this.masses);
      if (mass1 === mass2) continue; // skip if same mass
      if (this.springs.filter(spring => spring.id == `${mass1.id}-${mass2.id}`).length) {
        // skip if spring already exists (switch to object keys?)
        continue;
      }
      const spring = new Spring(mass1, mass2);
      this.springs.push(spring);
    }

    d3.select('.board')
      .selectAll('line')
      .data(this.springs, d => d.id)
      .enter()
      .append('line')
      .attr('x1', d => d.masses[0].position[0])
      .attr('y1', d => d.masses[0].position[1])
      .attr('x2', d => d.masses[1].position[0])
      .attr('y2', d => d.masses[1].position[1]);
  }

  updateDom() {
    d3.select('.board')
      .selectAll('line')
      .data(this.springs, d => d.id)
      .attr('x1', d => d.masses[0].position[0])
      .attr('y1', d => d.masses[0].position[1])
      .attr('x2', d => d.masses[1].position[0])
      .attr('y2', d => d.masses[1].position[1]);

    const masses = d3.select('.board')
      .selectAll('.mass')
      .data(this.masses, d => d.id);

    masses.select('.visible')
      .attr('cx', d => d.position[0])
      .attr('cy', d => d.position[1])
      .attr('r', d => d.mass);

    masses.select('.ring')
      .attr('cx', d => d.position[0])
      .attr('cy', d => d.position[1])
      .attr('r', d => d.mass + 5);

    masses.moveToFront();
  }

  update() {
    this.springs.forEach(spring => spring.applyForces());
    this.masses.forEach(mass => mass.updatePosition());
    this.updateDom();
  }
}

// Class declarations
class Mass {
  constructor(mass, position, velocity = [0,0]) {
    this.id = generateId();
    this.mass = mass; // equivalent to radius
    this.position = position; // [x,y]
    this.velocity = velocity; // [x,y]
    this.beingDragged = false;
  }

  // probably unnecessary
  getMass() {
    return this.mass;
  }

  setMass(mass) {
    this.mass = mass;
    return this.mass;
  }

  // probably unnecessary
  getPosition() {
    return this.position;
  }

  setPosition(positionVector) {
    this.position = positionVector;
    return this.position;
  }

  setXPosition(xValue) {
    this.position[0] = xValue;
    return this.position;
  }

  setYPosition(yValue) {
    this.position[1] = yValue;
    return this.position;
  }

  // probably unnecessary
  getVelocity() {
    return this.velocity;
  }

  setVelocity(velocityVector) {
    this.velocity = velocityVector;
    return this.velocity;
  }

  setXVelocity(xValue) {
    this.velocity[0] = xValue;
    return this.velocity;
  }

  setYVelocity(yValue) {
    this.velocity[1] = yValue;
    return this.velocity;
  }

  updateVelocityFromForce(forceVector) {
    if (this.beingDragged) { return; }
    let acceleration = forceVector.map(dimension => dimension / this.mass);
    let velocity = this.velocity.map((dimension, i) => {
      return dimension + (acceleration[i] || 0) * settings.timeStep;
    });
    this.setVelocity(velocity);
  }

  updatePosition() {
    if (this.beingDragged) { return; }
    let position = this.position.map((dimension, i) => {
      return dimension + (this.velocity[i] || 0) * settings.timeStep;
    });
    this.setPosition(position);
    this.setVelocity(this.velocity.map(dimension => dimension * (1 - settings.fluidResistance)));
    this.checkForWallHit();
    return this.position;
  }

  checkForWallHit() {
    // This function could contain wall losses
    if (this.position[0] < this.mass) {
      this.setXPosition(this.mass);
      this.setXVelocity(Math.abs(this.velocity[0]));
    }
    if (this.position[0] > settings.width - this.mass) {
      this.setXPosition(settings.width - this.mass);
      this.setXVelocity(Math.abs(this.velocity[0]) * -1);
    }
    if (this.position[1] < this.mass) {
      this.setYPosition(this.mass);
      this.setYVelocity(Math.abs(this.velocity[1]));
    }
    if (this.position[1] > settings.height - this.mass) {
      this.setYPosition(settings.height - this.mass);
      this.setYVelocity(Math.abs(this.velocity[1]) * -1);
    }
  }
}

class Spring {
  constructor(mass1, mass2, k = settings.defaultSpringConstant) {
    this.id = `${mass1.id}-${mass2.id}`;
    this.k = k;
    this.staticLength = getDistance(mass1, mass2);
    this.masses = [mass1, mass2];
  }

  setSpringConstant(k) {
    this.k = k;
    return k;
  }

  getDisplacement() {
    return getDistance(this.masses[0], this.masses[1]) - this.staticLength;
  }

  applyForces() {
    const mass1 = this.masses[0];
    const mass2 = this.masses[1];
    let force = this.getDisplacement() * this.k * (1 - settings.springDamping);
    const xLength = mass2.position[0] - mass1.position[0];
    const yLength = mass2.position[1] - mass1.position[1];
    let theta;
    if(xLength === 0) {
      theta = Math.PI;
    }
    else {
      theta = Math.atan(yLength / xLength);
    }
    if (xLength <= 0) {
      force *= -1;
    }
    mass1.updateVelocityFromForce([force * Math.cos(theta), force * Math.sin(theta)]);
    mass2.updateVelocityFromForce([-force * Math.cos(theta), -force * Math.sin(theta)]);
  }
}

let world = new World();
world.init();
