let handPose;
let images = [];
let currentIndex = 0;
let hands = [];
let csv;
let imageData = [];
let headers = ['mudra_name', 'hand',
  'wrist_x', 'wrist_y',
  'thumb_cmc_x', 'thumb_cmc_y',
  'thumb_mcp_x', 'thumb_mcp_y',
  'thumb_ip_x', 'thumb_ip_y',
  'thumb_tip_x', 'thumb_tip_y',
  'index_finger_mcp_x', 'index_finger_mcp_y',
  'index_finger_pip_x', 'index_finger_pip_y',
  'index_finger_dip_x', 'index_finger_dip_y',
  'index_finger_tip_x', 'index_finger_tip_y',
  'middle_finger_mcp_x', 'middle_finger_mcp_y',
  'middle_finger_pip_x', 'middle_finger_pip_y',
  'middle_finger_dip_x', 'middle_finger_dip_y',
  'middle_finger_tip_x', 'middle_finger_tip_y',
  'ring_finger_mcp_x', 'ring_finger_mcp_y',
  'ring_finger_pip_x', 'ring_finger_pip_y',
  'ring_finger_dip_x', 'ring_finger_dip_y',
  'ring_finger_tip_x', 'ring_finger_tip_y',
  'pinky_finger_mcp_x', 'pinky_finger_mcp_y',
  'pinky_finger_pip_x', 'pinky_finger_pip_y',
  'pinky_finger_dip_x', 'pinky_finger_dip_y',
  'pinky_finger_tip_x', 'pinky_finger_tip_y'
];

function preload() {
  imageData = loadJSON('fileList.json');
  handPose = ml5.handPose();
}

function setup() {
  createCanvas(400, 400);
  csv = new p5.Table();
  
  for (let h of headers) {
    csv.addColumn(h);
  }
  
  loadAllImages();
}

let imageFiles;
let imageLoadIndex = 0;

function loadAllImages() {
  imageFiles = Array.isArray(imageData) ? imageData : Object.values(imageData);
  imageFiles = imageFiles.map(f => f.trim().replace(/['"]/g, '')); // clean filenames
  loadNextImage();
}

function loadNextImage() {
  if (imageLoadIndex >= imageFiles.length) {
    processNextImage(); // start processing once all images are loaded
    return;
  }

  let imgFile = imageFiles[imageLoadIndex];
  let imgPath = 'Mudras_Compiled/' + imgFile;
  console.log("Loading image:", imgPath);

  loadImage(imgPath,
    (img) => {
      images.push({
        img: img,
        filename: imgFile
      });
      imageLoadIndex++;
      loadNextImage();
    },
    (err) => {
      console.error('Error loading image:', imgPath, err);
      imageLoadIndex++;
      loadNextImage(); // continue even if one fails
    }
  );
}


function processNextImage() {
  if (currentIndex < images.length) {
    let currentImage = images[currentIndex];
    try {
      image(currentImage.img, 0, 0);
      handPose.detect(currentImage.img, gotHands);
    } catch (err) {
      console.error('Error processing image:', currentImage.filename, err);
      currentIndex++;
      processNextImage();
    }
  } else {
    if (csv.getRowCount() > 0) {
      saveTable(csv, 'hand_data.csv');
      console.log('CSV saved with', csv.getRowCount(), 'entries');
    }
    noLoop();
  }
}

function gotHands(results) {
  let currentImage = images[currentIndex];
  hands = results;
  
  if (hands && hands.length > 0) {
    let row = csv.addRow();
    row.set('mudra_name', getMudraName(currentImage.filename));
    row.set('hand', getHandOrientation(currentImage.filename));
    
    let flattened = flattenHandData(hands[0]);
    for (let i = 0; i < flattened.length; i++) {
      if (i + 2 < headers.length) {
        row.set(headers[i + 2], flattened[i]);
      }
    }
  }
  
  currentIndex++;
  processNextImage();
}

function flattenHandData(hand) {
  let data = [];
  if (hand && hand.keypoints) {
    for (let i = 0; i < hand.keypoints.length; i++) {
      // Round coordinates to 2 decimal places
      data.push(round(hand.keypoints[i].x * 100) / 100);
      data.push(round(hand.keypoints[i].y * 100) / 100);
    }
  }
  return data;
}

function getMudraName(filename) {
  if (!filename) return 'unknown';
  if (filename.includes('M1')) return 'arala';
  if (filename.includes('M2')) return 'kapita';
  if (filename.includes('M3')) return 'katari';
  if (filename.includes('M4')) return 'katakamukha';
  if (filename.includes('M5')) return 'mayura';
  return 'unknown';
}

function getHandOrientation(filename) {
  if (!filename) return 'unknown';
  if (filename.includes('L')) return 'left';
  if (filename.includes('R')) return 'right';
  return 'unknown';
}