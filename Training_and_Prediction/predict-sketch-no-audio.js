let video;
let handpose;
let predictions = [];
let nn;
let ready = false;
let handResults = [];
let lastHandUpdate = 0;

function setup() {
  createCanvas(640, 480);

  video = createCapture(VIDEO);
  video.size(640, 480);
  video.hide();

  nn = ml5.neuralNetwork({ task: 'classification' });
  nn.load('model/model.json', modelLoaded);

  handpose = ml5.handpose(video, () => {
    console.log('Handpose model ready');
  });

  handpose.on('predict', (results) => {
    predictions = results;
    if (ready && millis() - lastHandUpdate > 200) { // Throttle updates
      classifyHands();
      lastHandUpdate = millis();
    }
  });
}

function modelLoaded() {
  console.log('Classifier model loaded');
  ready = true;
}

function classifyHands() {
  // Clear previous results if no hands detected
  if (predictions.length === 0) {
    handResults = [];
    return;
  }

  // Reset hand results array
  handResults = new Array(predictions.length).fill(null);

  // Process each hand
  predictions.forEach((hand, index) => {
    if (hand.landmarks.length === 21) {
      let inputs = [];
      for (let pt of hand.landmarks) {
        inputs.push(pt[0]);
        inputs.push(pt[1]);
      }

      nn.classify(inputs, (error, results) => {
        if (error) {
          console.error(error);
          return;
        }
        
        if (results[0]) {
          // CORRECTED handedness detection - swapped left/right
          let handedness = "Unknown";
          if (hand.handedness) {
            // Flip the handedness detection
            handedness = hand.handedness.toLowerCase().includes('left') ? 'Right' : 'Left';
          } else {
            // Fallback: Determine handedness by position (also flipped)
            handedness = hand.landmarks[0][0] < width/2 ? 'Right' : 'Left';
          }

          handResults[index] = {
            label: results[0].label,
            confidence: results[0].confidence,
            handedness: handedness,
            position: hand.landmarks[0],
            landmarks: hand.landmarks
          };
        }
      });
    }
  });
}

function draw() {
  // Mirror video
  push();
  translate(width, 0);
  scale(-1, 1);
  image(video, 0, 0, width, height);
  pop();

  drawKeypoints();
  drawResults();
}

function drawKeypoints() {
  // Draw points for ALL hands
  for (let i = 0; i < predictions.length; i++) {
    const landmarks = predictions[i].landmarks;
    for (let j = 0; j < landmarks.length; j++) {
      let [x, y] = landmarks[j];
      x = width - x; // mirror X

      // Different colors for different hands
      const pointColor = i === 0 ? color(0, 255, 255) : color(255, 0, 255);
      fill(pointColor);
      noStroke();
      ellipse(x, y, 8, 8);
    }
  }
}

function drawResults() {
  if (predictions.length === 0) {
    fill(255, 0, 0);
    textSize(20);
    textAlign(LEFT, BOTTOM);
    text("No hand sign detected", 10, height - 10);
    return;
  }

  // Draw results for ALL detected hands
  for (let i = 0; i < handResults.length; i++) {
    const result = handResults[i];
    if (result) {
      let [x, y] = result.position;
      x = width - x; // Flip to match mirrored view
      y = y - 30 - (i * 40); // Offset for multiple hands

      // Different colors for left/right hands
      const handColor = result.handedness === 'Left' ? color(255, 100, 100) : color(100, 100, 255);
      fill(handColor);
      
      noStroke();
      textSize(16);
      textAlign(LEFT, CENTER);
      text(
        `${result.handedness}: ${result.label} (${(result.confidence * 100).toFixed(1)}%)`,
        x + 10,
        y
      );

      // Draw connecting lines for better visualization
      if (result.landmarks) {
        stroke(handColor);
        strokeWeight(2);
        noFill();
        beginShape();
        for (let j = 0; j < result.landmarks.length; j++) {
          let [lx, ly] = result.landmarks[j];
          lx = width - lx;
          vertex(lx, ly);
        }
        endShape();
      }
    }
  }
}