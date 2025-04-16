let video;
let handpose;
let predictions = [];
let nn;
let ready = false;
let handResults = [];
let lastHandUpdate = 0;
let sounds = {};
let currentPlaying = null;
let stableSign = null;
let signStartTime = 0;
let minimumHoldTime = 1000; // 1 second minimum hold time
let detectionHistory = [];
let historyLength = 5; // Number of frames to consider for stabilization

// Predefined mapping between mudras and audio files
const mudraToAudio = {
  'arala': 'Hamsadhwani',
  'kapita': 'Kalyani',
  'katari': 'Kedaragaula',
  'katakamukha': 'Mohana',
  'mayura': 'Nattakkuranji'
};

function preload() {
  // Load all audio files
  sounds.Hamsadhwani = loadSound('Chittaswarams/Hamsadhwani.mp3');
  sounds.Kalyani = loadSound('Chittaswarams/Kalyani.mp3');
  sounds.Kedaragaula = loadSound('Chittaswarams/Kedaragaula.mp3');
  sounds.Mohana = loadSound('Chittaswarams/Mohana.mp3');
  sounds.Nattakkuranji = loadSound('Chittaswarams/Nattakkuranji.mp3');
}

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
    if (ready && millis() - lastHandUpdate > 200) {
      classifyHands();
      lastHandUpdate = millis();
    }
  });
}

function modelLoaded() {
  console.log('Classifier model loaded');
  ready = true;
}

function getStableSign() {
  if (detectionHistory.length < historyLength) return null;
  
  // Count occurrences of each sign in history
  const signCounts = {};
  detectionHistory.forEach(sign => {
    signCounts[sign] = (signCounts[sign] || 0) + 1;
  });
  
  // Find the most frequent sign
  let maxCount = 0;
  let mostFrequentSign = null;
  for (const [sign, count] of Object.entries(signCounts)) {
    if (count > maxCount) {
      maxCount = count;
      mostFrequentSign = sign;
    }
  }
  
  // Only return if the sign appears in majority of frames
  return maxCount >= Math.floor(historyLength * 0.7) ? mostFrequentSign : null;
}

function classifyHands() {
  // Clear previous results if no hands detected
  if (predictions.length === 0) {
    handResults = [];
    detectionHistory.push(null); // Record no detection
    if (detectionHistory.length > historyLength) {
      detectionHistory.shift();
    }
    checkStableSign();
    return;
  }

  // Reset hand results array
  handResults = new Array(predictions.length).fill(null);
  let currentSign = null;

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
          const label = results[0].label;
          currentSign = label; // Track the current sign

          let handedness = "Unknown";
          if (hand.handedness) {
            handedness = hand.handedness.toLowerCase().includes('left') ? 'Right' : 'Left';
          } else {
            handedness = hand.landmarks[0][0] < width/2 ? 'Right' : 'Left';
          }

          handResults[index] = {
            label: label,
            confidence: results[0].confidence,
            handedness: handedness,
            position: hand.landmarks[0],
            landmarks: hand.landmarks
          };
        }
        
        // Update detection history
        detectionHistory.push(currentSign);
        if (detectionHistory.length > historyLength) {
          detectionHistory.shift();
        }
        
        checkStableSign();
      });
    }
  });
}

function checkStableSign() {
  const newStableSign = getStableSign();
  
  // If the stable sign has changed
  if (newStableSign !== stableSign) {
    // Stop current audio if playing
    if (stableSign && mudraToAudio[stableSign] && sounds[mudraToAudio[stableSign]]) {
      sounds[mudraToAudio[stableSign]].stop();
    }
    
    // Update stable sign
    stableSign = newStableSign;
    signStartTime = millis();
    
    // Start new audio if valid sign
    if (stableSign && mudraToAudio[stableSign] && sounds[mudraToAudio[stableSign]]) {
      sounds[mudraToAudio[stableSign]].loop();
      currentPlaying = mudraToAudio[stableSign];
    } else {
      currentPlaying = null;
    }
  }
  
  // If we have a stable sign, check minimum hold time
  if (stableSign && millis() - signStartTime < minimumHoldTime) {
    // Keep the audio playing until minimum hold time is reached
    return;
  }
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
  
  // Display current audio status
  if (currentPlaying) {
    fill(0, 255, 0);
    textSize(16);
    textAlign(RIGHT, TOP);
    text(`Playing: ${currentPlaying}`, width - 20, 20);
  }
}

function drawKeypoints() {
  for (let i = 0; i < predictions.length; i++) {
    const landmarks = predictions[i].landmarks;
    for (let j = 0; j < landmarks.length; j++) {
      let [x, y] = landmarks[j];
      x = width - x; // mirror X

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

  for (let i = 0; i < handResults.length; i++) {
    const result = handResults[i];
    if (result) {
      let [x, y] = result.position;
      x = width - x;
      y = y - 30 - (i * 40);

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

      // Visual feedback for stable sign
      if (stableSign === result.label) {
        fill(0, 255, 0);
        ellipse(x - 15, y, 10, 10);
      }
    }
  }
}