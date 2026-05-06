let gameState = "START";
let particles = []; 
let rain = [];
let bestScore = 0;
let newRecord = false;

let player;
let debris = [];
let coins = [];
let items = [];
let score = 0;
let gameOver = false;
let shakeIntensity = 0;
let level = 1;
let spawnRate = 0.02;
let gamePaused = false;
let invincible = false;
let invincibleTimer = 0;

// player
class Player {
  constructor() {
    this.x = 400;
    this.y = 500;
    this.w = 30;
    this.h = 40;
    this.speed = 6;
    this.lives = 3;
  }

  update() {
    if (keyIsDown(LEFT_ARROW)) this.x -= this.speed;
    if (keyIsDown(RIGHT_ARROW)) this.x += this.speed;
    if (keyIsDown(UP_ARROW)) this.y -= this.speed;
    if (keyIsDown(DOWN_ARROW)) this.y += this.speed;

    this.x = constrain(this.x, 0, width - this.w);
    this.y = constrain(this.y, 0, height - this.h);
  }

  display() {
    push();
    translate(this.x, this.y);

    // the character flashes when the character is invincible.
    if (invincible && frameCount % 10 < 5) {
      fill(255, 255, 0);
    } else {
      fill(90, 160, 255);
    }

    rect(5, 15, this.w - 10, this.h - 10, 8);

    fill(255, 220, 180);
    ellipse(this.w / 2, 10, 18);

    fill(0);
    ellipse(this.w / 2 - 4, 10, 3);
    ellipse(this.w / 2 + 4, 10, 3);
    pop();
  }

  collidesWith(d) {
    return this.x < d.x + d.w &&
           this.x + this.w > d.x &&
           this.y < d.y + d.h &&
           this.y + this.h > d.y;
  }
}

// debris
class Debris {
  constructor() {
    this.x = random(width - 40);
    this.y = -50;
    this.w = random(30, 60);
    this.h = random(30, 60);
    this.speedY = random(3, 7);
    this.speedX = random(-2, 2);
    this.rotation = random(TWO_PI);
    this.rotationSpeed = random(-0.05, 0.05);
  }

  update() {
    this.y += this.speedY;
    this.x += this.speedX + sin(frameCount * 0.01) * 0.5;
    this.rotation += this.rotationSpeed;
  }

  display() {
    push();
    translate(this.x + this.w / 2, this.y + this.h / 2);
    rotate(this.rotation);

    fill(120, 90, 60);
    stroke(70);
    strokeWeight(2);

    beginShape();
    vertex(-this.w/2, -this.h/3);
    vertex(this.w/4, -this.h/2);
    vertex(this.w/2, -this.h/4);
    vertex(this.w/3, this.h/2);
    vertex(-this.w/3, this.h/3);
    endShape(CLOSE);

    noStroke();
    fill(180, 140, 90, 120);
    ellipse(-8, -8, 10);
    pop();
  }

  isOffScreen() {
    return this.y > height;
  }
}

// coins
class Coin {
  constructor() {
    this.x = random(width - 20);
    this.y = -30;
    this.r = 10;
    this.speedY = random(3, 6);
  }

  update() {
    this.y += this.speedY;
  }

  display() {
    push();
    translate(this.x, this.y);
    noStroke();
    fill(255, 200, 0);
    ellipse(0, 0, this.r * 2);
    fill(255, 240, 150);
    ellipse(-3, -3, 6);
    pop();
  }

  isOffScreen() {
    return this.y > height + 20;
  }

  collidesWith(player) {
    let d = dist(player.x + player.w/2, player.y + player.h/2, this.x, this.y);
    return d < this.r + player.w / 2;
  }
}

// first aid kit
class Item {
  constructor() {
    this.x = random(width - 30);
    this.y = -40;
    this.size = 26;
    this.speedY = 3;
  }

  update() {
    this.y += this.speedY;
  }

  display() {
    push();
    translate(this.x, this.y);
    fill(220, 40, 40);
    rect(0, 0, this.size, this.size, 5);
    fill(255);
    rect(this.size/2 - 3, 5, 6, 16);
    rect(5, this.size/2 - 3, 16, 6);
    pop();
  }

  isOffScreen() {
    return this.y > height;
  }

  collidesWith(player) {
    return player.x < this.x + this.size &&
           player.x + player.w > this.x &&
           player.y < this.y + this.size &&
           player.y + player.h > this.y;
  }
}

// particle for when debris hit the player
class Particle {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.speedX = random(-5, 3);
    this.speedY = random(-5, 3); 
    this.size = random(2, 5); 
    this.life = 200; 

    let color = [
      [200, 0, 0],
      [80, 0, 0],
      [40, 40, 40],
      [255, 100, 100]
    ];
    this.col = random(color);
  }

  update() {
    this.x += this.speedX;
    this.y += this.speedY;
    this.speedY += 0.1;
    this.speedX *= 0.9;
    this.life -= 5;
  }

  display() {
    noStroke();
    fill(this.col[0], this.col[1], this.col[2], this.life);
    rect(this.x, this.y, this.size, this.size);
  }

  isDead() {
    return this.life <= 0;
  }
}

// Rain, rain get heavy when game goes
class Rain {
  constructor() {
    this.x = random(width);
    this.y = random(-height, 0);
    this.length = random(5, 15);
    this.speed = random(5, 20);
  }

  update() {
    this.y += this.speed;
    if (this.y > height) {
      this.y = random(-50, 0);
      this.x = random(width);
    }
  }

  display() {
    stroke(120, 140, 180, 100);
    strokeWeight(1);
    line(this.x, this.y, this.x, this.y + this.length);
  }
}

function setup() {
  createCanvas(800, 600);
  player = new Player();
  for (let i = 0; i < 3; i++) debris.push(new Debris());
  for (let i = 0; i < 3; i++) coins.push(new Coin());

  // save the best score
  let saved = localStorage.getItem('gamebestscore');
  if (saved !== null) {
    bestScore = parseInt(saved);
  }
}

function draw() {
    // start screen
  if (gameState === "START") {
    drawStartScreen();
    return; 
  }

  // screen shaking
  if (shakeIntensity > 0) {
    translate(random(-shakeIntensity, shakeIntensity),
              random(-shakeIntensity, shakeIntensity));
    shakeIntensity *= 0.95;
  }

  // sky
  for (let y = 0; y < height; y++) {
    let c = lerpColor(color(30, 40, 80), color(120, 180, 255), y / height);
    stroke(c);
    line(0, y, width, y);
  }

  // mountain
  noStroke();
  fill(60, 80, 120);
  ellipse(150, height - 80, 400, 200);
  ellipse(550, height - 100, 500, 240);

  // land
  fill(70, 150, 90);
  rect(0, height - 30, width, 15);
  fill(120, 90, 60);
  rect(0, height - 15, width, 15);

  // rain
  if (gameState === "PLAYING") {
    updateRainIntensity();
    for (let i = 0; i < rain.length; i++) {
      if (!gamePaused) rain[i].update();
      rain[i].display();
    }
  }

  // invincible timer
  if (invincible) {
    invincibleTimer--;
    if (invincibleTimer <= 0) invincible = false;
  }

  if (!gameOver && !gamePaused) {
    player.update();

    if (random() < spawnRate) debris.push(new Debris());
    if (random() < 0.015) coins.push(new Coin());
    if (random() < 0.003) items.push(new Item());
  }

  // debris
  for (let i = debris.length - 1; i >= 0; i--) {
    if (!gamePaused) debris[i].update();
    debris[i].display();

    if (!invincible && player.collidesWith(debris[i]) && !gamePaused) {
      let impactX = debris[i].x + debris[i].w / 2;
      let impactY = debris[i].y + debris[i].h / 2;
      for (let j = 0; j < 25; j++) {
        particles.push(new Particle(impactX, impactY));
      }

      debris.splice(i, 1);
      player.lives--;
      shakeIntensity = 8;
      
      if (player.lives <= 0) {
        gameOver = true;
        if (score > bestScore) {
          bestScore = score;
          newRecord = true;
          localStorage.setItem('gamebestscore', bestScore);
  }
}
    } 
    else if (debris[i] && debris[i].isOffScreen()) {
      debris.splice(i, 1);
      score += 10;
      spawnRate = min(0.08, spawnRate + 0.001);
    }
  }

  // coins
  for (let i = coins.length - 1; i >= 0; i--) {
    if (!gamePaused) coins[i].update();
    coins[i].display();

    if (coins[i].collidesWith(player) && !gamePaused) {
      coins.splice(i, 1);
      score += 50;
      shakeIntensity = 3;
    } 
    else if (coins[i] && coins[i].isOffScreen()) {
      coins.splice(i, 1);
    }
  }

  // first aid kit
  for (let i = items.length - 1; i >= 0; i--) {
    if (!gamePaused) items[i].update();
    items[i].display();

    if (items[i].collidesWith(player) && !gamePaused) {
      items.splice(i, 1);
      gamePaused = true;
    }
  }

  // particles
  for (let i = particles.length - 1; i >= 0; i--) {
    if (!gamePaused) particles[i].update();
    particles[i].display();
    if (particles[i].isDead()) {
      particles.splice(i, 1);
    }
  }

  player.display();

  level = floor(score / 300) + 1;

  textAlign(LEFT, TOP);
  fill(0, 120);
  rect(10, 10, 220, 110, 12);
  fill(255);
  textSize(18);
  text("SCORES: " + score, 50, 25);
  text("LEVEL: " + level, 50, 55);

  let hearts = "";
  for (let i = 0; i < player.lives; i++) hearts += "❤ ";
  text("HP: " + hearts, 50, 85);

  if (gamePaused) {
    fill(0, 200);
    rect(0, 0, width, height);

    fill(255);
    textAlign(CENTER, CENTER);
    textSize(26);
    text("please check your first aid kit regularly\npreventing natural disasters\n\npress any key to continue the game", width / 2, height / 2);
  }

  if (gameOver) {
    fill(0, 180);
    rect(0, 0, width, height);
    textAlign(CENTER, CENTER);

    // game over
    fill(255);
    textSize(46);
    text("GAME OVER", width / 2, height / 2 - 100);

    // current score
    fill(255);
    textSize(26);
    text("Your Score: " + score, width / 2, height / 2 - 30);

    // best score
    fill(200);
    textSize(20);
    text("Best Score: " + bestScore, width / 2, height / 2 + 10);

    // restart
    fill(255);
    textSize(18);
    text("press R to restart", width / 2, height / 2 + 120);

    // new record
    if (newRecord && frameCount % 40 < 30) {
    fill(255, 220, 0);
    textSize(28);
    text("NEW RECORD!", width / 2, height / 2 + 60);
    }
  }
}

function keyPressed() {
  if (gameState === "START" && key === ' ') {
    gameState = "PLAYING";
    return;
  }

  if (gamePaused) {
    gamePaused = false;
    invincible = true;
    invincibleTimer = 60 * 5; 
  }

  if ((key === 'r' || key === 'R') && gameOver) {
    gameOver = false;
    newRecord = false;
    score = 0;
    level = 1;
    spawnRate = 0.02;
    debris = [];
    coins = [];
    items = [];
    player = new Player();
    for (let i = 0; i < 3; i++) debris.push(new Debris());
    for (let i = 0; i < 3; i++) coins.push(new Coin());
  }
}

// game start screen
function drawStartScreen() {
  // background
  for (let y = 0; y < height; y++) {
    let c = lerpColor(color(0, 0, 0), color(70, 20, 10), y / height);
    stroke(c);
    line(0, y, width, y);
  }

  // title
  noStroke();
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(44);
  text("DISASTER GAME", width / 2, height / 2 - 120);

  //sub title
  textSize(22);
  fill(255, 200, 100);
  text("Drop, Cover, Hold", width / 2, height / 2 - 70);

  // hints
  textSize(12);
  fill(180);
  text("arrow keys to move", width / 2, height / 2 + 90);

  // start button
  if (frameCount % 60 < 50) {
    textSize(18);
    fill(255);
    text("Press SPACE to start", width / 2, height / 2 + 140);
  }
}

// rain level changes 
function updateRainIntensity() {
  let targetCount = 30 + level * 20;

  while (rain.length < targetCount) {
    rain.push(new Rain());
  }

  while (rain.length > targetCount) {
    rain.pop();
  }
}