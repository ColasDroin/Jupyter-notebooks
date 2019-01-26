let boids = [];
let preds = [];
let l_count_boids = [];
let l_count_preds = [];

function setup() {
  //const canvas = createCanvas(windowWidth/2, windowHeight/2);
  const canvas = createCanvas(1000, 400);
  canvas.parent('sketch-holder');

  // Add an initial set of boids into the system
  for (let i = 0; i < 150; i++) {
    boids[i] = new Boid(random(width-500), random(height));
  }

  // Add an initial set of predators into the system
  for (let i = 0; i <5; i++) {
    preds[i] = new Pred(random(width-500), random(height));
  }

  // keep track of the number of boids/preds
  l_count_boids[0] = boids.length;
  l_count_preds[0] = preds.length;
}

function draw() {
  fill(255, 255, 255, 90);
  noStroke();
  rect(0, 0, width, height);
	// Run all the boids
  for (let i = 0; i < boids.length; i++) {
    boids[i].run(boids, preds);
  }
  for (let i = 0; i < preds.length; i++) {
    preds[i].run(boids, preds);
		}
 // Make predators die if boids ressources get limited
	if (boids.length/(5*preds.length)<random()) {
    if (preds.length>1 || boids.length<2){
		preds.splice(random(preds.length-1),1);
    }
	}
  // Make preys die randomly if ressource get limited
  if ( ((frameCount/1000)%1)/20 >random()) {
    boids.splice(random(boids.length-1),1);
  }

  //text((frameCount/1000)%1, width/2+400, 88);


  fill(255, 255, 255);
  rect(width-500, 0, 15, height);


  // keep track of the number of boids/preds
  l_count_boids.push( boids.length );
  l_count_preds.push( preds.length );

  if (l_count_boids.length>width-550) {
    l_count_boids.shift();
    l_count_preds.shift();
  }

  // curves to track the evolution in time
  noFill();
  beginShape();
  for (var x = 0; x < l_count_boids.length; x++) {
    stroke(66, 134, 244, 100);
    vertex(550+x, height-l_count_boids[x]);
    vertex(550+x, height);
  }
  endShape();

  beginShape();
  for (var x = 0; x < l_count_preds.length; x++) {
    stroke(255, 140, 130, 100);
    vertex(550+x, height-l_count_preds[x]*5);
    vertex(550+x, height);
  }
  endShape();

  //text
  //noStroke();
  //fill(100);
  //rect(550, 0, width-551, 100, 5);


  noStroke();
  fill(255, 140, 130);
  rect(width/2+389, 10, 80, 30, 20);
  fill(66, 134, 244);
  rect(width/2+389, 50, 80, 30, 20);


  fill(255)
  textSize(15)
  text('Predators', width/2+400, 28);
  text('  Preys', width/2+400, 68);


  //some cosmetic
  stroke(211,211,211);
  fill(255,255,255,0);
  rect(0, 0, width-500, height-1, 5);
  rect(550, 0, width-551, height-1, 5);

  //noStroke()
  //fill(255)
  //text('Click to reset', 600, 68);
}



function reset(){
  // Add an initial set of boids into the system
  for (let i = 0; i < 150; i++) {
    boids[i] = new Boid(random(width-500), random(height));
  }

  // Add an initial set of predators into the system
  for (let i = 0; i <5; i++) {
    preds[i] = new Pred(random(width-500), random(height));
  }
}

function mousePressed(){
    reset();
}

// Boid class
// Methods for Separation, Cohesion, Alignment added
class Boid {
  constructor(x, y) {
    this.acceleration = createVector(0, 0);
    this.velocity = p5.Vector.random2D(); //unit vector
    this.position = createVector(x, y);
    this.r = 3.0; //to handle boundaries
    this.maxspeed = 2;    // Maximum speed
    this.maxforce = 0.05; // Maximum steering force

  }

  run(boids, preds) {
    this.flock(boids, preds);
		this.reproduce(boids);
    this.update();
    this.borders();
    this.render();
  }

  // Forces go into acceleration
  applyForce(force) {
    this.acceleration.add(force);
  }

  // We accumulate a new acceleration each time based on three rules
  flock(boids, preds) {
    let sep = this.separate(boids); // Separation
    let ali = this.align(boids);    // Alignment
    let coh = this.cohesion(boids); // Cohesion
		let flee = this.flee(preds); // avoid preds
    // Arbitrarily weight these forces
    sep.mult(2.5);
    ali.mult(1.0);
    coh.mult(2.0);
		flee.mult(4.0);
    // Add the force vectors to acceleration
    this.applyForce(sep);
    this.applyForce(ali);
    this.applyForce(coh);
		this.applyForce(flee);
  }

  // Method to update location
  update() {
    // Update velocity
    this.velocity.add(this.acceleration);
    // Limit speed
    this.velocity.limit(this.maxspeed);
    this.position.add(this.velocity);
    // Reset acceleration to 0 each cycle
    this.acceleration.mult(0);
  }

  // A method that calculates and applies a steering force towards a target
  // STEER = DESIRED MINUS VELOCITY
  seek(target) {
    let desired = p5.Vector.sub(target, this.position); // A vector pointing from the location to the target
    // Normalize desired and scale to maximum speed
    desired.normalize();
    desired.mult(this.maxspeed);
    // Steering = Desired minus Velocity
    let steer = p5.Vector.sub(desired, this.velocity);
    steer.limit(this.maxforce); // Limit to maximum steering force
    return steer;
  }

  // Draw boid as a line
  render() {
	  fill(66, 134, 244);
    stroke(66, 134, 244);
    line(this.position.x, this.position.y, this.position.x + 3*this.velocity.x, this.position.y + 3*this.velocity.y);
  }

  // Wraparound
  borders() {
    if (this.position.x < -this.r) this.position.x = width-500 + this.r;
    if (this.position.y < -this.r) this.position.y = height + this.r;
    if (this.position.x > width-500 + this.r) this.position.x = -this.r;
    if (this.position.y > height + this.r) this.position.y = -this.r;
  }

  // Separation
  // Method checks for nearby boids and steers away
  separate(boids) {
    let desiredseparation = 25.0;
    let steer = createVector(0, 0);
    let count = 0;
    // For every boid in the system, check if it's too close
    for (let i = 0; i < boids.length; i++) {
      let d = p5.Vector.dist(this.position, boids[i].position);
      // If the distance is greater than 0 and less than an arbitrary amount (0 when you are yourself)
      if ((d > 0) && (d < desiredseparation)) {
        // Calculate vector pointing away from neighbor
        let diff = p5.Vector.sub(this.position, boids[i].position);
        diff.normalize();
        diff.div(d); // Weight by distance
        steer.add(diff);
        count++; // Keep track of how many
      }
    }
    // Average -- divide by how many
    if (count > 0) {
      steer.div(count);
    }

    // As long as the vector is greater than 0
    if (steer.mag() > 0) {
      // Implement Reynolds: Steering = Desired - Velocity
      steer.normalize();
      steer.mult(this.maxspeed);
      steer.sub(this.velocity);
      steer.limit(this.maxforce);
    }
    return steer;
  }

  // Alignment
  // For every nearby boid in the system, calculate the average velocity
  align(boids) {
    let neighbordist = 50;
    let sum = createVector(0, 0);
    let count = 0;
    for (let i = 0; i < boids.length; i++) {
      let d = p5.Vector.dist(this.position, boids[i].position);
      if ((d > 0) && (d < neighbordist)) {
        sum.add(boids[i].velocity);
        count++;
      }
    }
    if (count > 0) {
      sum.div(count);
      sum.normalize();
      sum.mult(this.maxspeed);
      let steer = p5.Vector.sub(sum, this.velocity);
      steer.limit(this.maxforce);
      return steer;
    } else {
      return createVector(0, 0);
    }
  }

  // Cohesion
  // For the average location (i.e. center) of all nearby boids, calculate steering vector towards that location
  cohesion(boids) {
    let neighbordist = 50;
    let sum = createVector(0, 0); // Start with empty vector to accumulate all locations
    let count = 0;
    for (let i = 0; i < boids.length; i++) {
      let d = p5.Vector.dist(this.position, boids[i].position);
      if ((d > 0) && (d < neighbordist)) {
        sum.add(boids[i].position); // Add location
        count++;
      }
    }
    if (count > 0) {
      sum.div(count);
      return this.seek(sum); // Steer towards the location
    } else {
      return createVector(0, 0);
    }
  }

  // Avoid predators
  // Method checks for nearby predators and steers away
  flee(preds) {
    let desiredseparation = 100.0;
    let steer = createVector(0, 0);
    let count = 0;
    // For every pred in the system, check if it's too close
    for (let i = 0; i < preds.length; i++) {
      let d = p5.Vector.dist(this.position, preds[i].position);
      // If the distance is greater than 0 and less than an arbitrary amount (0 when you are yourself)
      if ((d > 0) && (d < desiredseparation)) {
        // Calculate vector pointing away from neighbor
        let diff = p5.Vector.sub(this.position, preds[i].position);
        diff.normalize();
        diff.div(d); // Weight by distance
        steer.add(diff);
        count++; // Keep track of how many
      }
    }
    // Average -- divide by how many
    if (count > 0) {
      steer.div(count);
    }

    // As long as the vector is greater than 0
    if (steer.mag() > 0) {
      // Implement Reynolds: Steering = Desired - Velocity
      steer.normalize();
      steer.mult(this.maxspeed);
      steer.sub(this.velocity);
      steer.limit(this.maxforce);
    }
    return steer;
  }

  // Reproduce
  // Method checks for nearby boids and reproduce with a probability proportionnal to this number
  reproduce(boids) {
    let reproductionradius = 100.0;
    let count = 0;
		let prepr = 0;
    // For every boid in the system, check if it's close
    for (let i = 0; i < boids.length; i++) {
      let d = p5.Vector.dist(this.position, boids[i].position);
      // If the distance is greater than 0 and less than an arbitrary amount (0 when you are yourself)
      if ((d > 0) && (d < reproductionradius)) {
        // Calculate vector pointing away from neighbor
        let diff = p5.Vector.sub(this.position, boids[i].position);
        count++; // Keep track of how many
      }
    }

    let thres_reproduce = 0.005;
		prepr = count / 1000;
    // Average -- divide by how many
    if ((prepr > thres_reproduce)&&(boids.length>100)) {
      prepr = thres_reproduce;
    }

		if (prepr >= random()) {
    	boids[boids.length] = new Boid(this.position.x, this.position.y);
		}
  }

}

// Pred class
class Pred extends Boid{
  constructor(x, y) {
		super(x, y);
		this.velocity.mult(2); //unit vector
		this.maxspeed = 4;    // Maximum speed
		this.maxforce = 0.1;
		this.killed = 0;
  }

  run(boids, preds) {
    this.flock(boids, preds);
		this.kill(boids);
		this.reproduce(preds);
    this.update();
    this.borders();
    this.render();
  }

  // No real flocking for the predators
  flock(boids, preds) {
    let coh = this.cohesion(boids); // Cohesion
		let sep = this.separate(preds); // Separation

    // Arbitrarily weight these forces
    coh.mult(1.0);
		sep.mult(1.0);
    // Add the force vectors to acceleration
    this.applyForce(coh);
		this.applyForce(sep);
  }


  // Cohesion
  // For the average location (i.e. center) of all nearby boids, calculate steering vector towards that location
  cohesion(boids) {
    let neighbordist = 80;
    let sum = createVector(0, 0); // Start with empty vector to accumulate all locations
    let count = 0;
    for (let i = 0; i < boids.length; i++) {
      let d = p5.Vector.dist(this.position, boids[i].position);
      if ((d > 0) && (d < neighbordist)) {
        sum.add(boids[i].position); // Add location
        count++;
      }
    }
    if (count > 0) {
      sum.div(count);
      return this.seek(sum); // Steer towards the location
    } else {
      return createVector(0, 0);
    }
  }

  // Separation
  // Method checks for nearby boids and steers away
  separate(boids) {
    let desiredseparation = 100;
    let steer = createVector(0, 0);
    let count = 0;
    // For every boid in the system, check if it's too close
    for (let i = 0; i < boids.length; i++) {
      let d = p5.Vector.dist(this.position, boids[i].position);
      // If the distance is greater than 0 and less than an arbitrary amount (0 when you are yourself)
      if ((d > 0) && (d < desiredseparation)) {
        // Calculate vector pointing away from neighbor
        let diff = p5.Vector.sub(this.position, boids[i].position);
        diff.normalize();
        diff.div(d); // Weight by distance
        steer.add(diff);
        count++; // Keep track of how many
      }
    }
    // Average -- divide by how many
    if (count > 0) {
      steer.div(count);
    }

    // As long as the vector is greater than 0
    if (steer.mag() > 0) {
      // Implement Reynolds: Steering = Desired - Velocity
      steer.normalize();
      steer.mult(this.maxspeed);
      steer.sub(this.velocity);
      steer.limit(this.maxforce);
    }
    return steer;
  }

  // Kill
  // Method checks for nearby boids and kill them
  kill(boids) {
    let killradius = 20.0;
    let count = 0;
		let prepr = 0;
		let removeValFromIndex = [];
    // For every boid in the system, check if it's close
    for (let i = 0; i < boids.length; i++) {
      let d = p5.Vector.dist(this.position, boids[i].position);
      // If the distance is greater than 0 and less than an arbitrary amount (0 when you are yourself)
      if ((d > 0) && (d < killradius)) {
        // Calculate vector pointing away from neighbor
        let diff = p5.Vector.sub(this.position, boids[i].position);
				removeValFromIndex[count] = i;
        count++; // Keep track of how many
      }
    }

		//remove the killed boids
		for (var i = removeValFromIndex.length -1; i >= 0; i--) {
   		boids.splice(removeValFromIndex[i],1);
		}
		this.killed += count;

  }

  // Reproduce
  // Method checks for number of killed boids and reproduce accordingly
  reproduce(preds) {
		if (this.killed/200 >= random()) {
			preds[preds.length] = new Pred(this.position.x, this.position.y);
			this.killed = 0;
		}
  }


  // Draw predators as circle + triangle (aka pacman)
  render() {
    //fill(255, 140, 130);
    //noStroke();
    //ellipse(this.position.x, this.position.y, 20, 20);
    var angle = atan2(this.velocity.y, this.velocity.x);


    fill(255, 140, 130);
    noStroke();
    arc(this.position.x, this.position.y, 20, 20, angle-2.5+PI, angle+2.5+PI, PIE);
  }
}
