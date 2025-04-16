let nn;
let dataFile;
let trainingData = [];
let labels = [];
let labelList = [];
let lossPlot = [];
let training = false;
let epoch = 0;
let totalEpochs = 200;
let trained = false;
let tf;

function setup() {
  tf = ml5.tf;
  createCanvas(600, 400);
  background(240);
  createP('Upload your dataset CSV:');
  let fileInput = createFileInput(handleFile);
  fileInput.elt.accept = '.csv';
  createButton('Start Training').mousePressed(startTraining);
  createButton('Save Model').mousePressed(saveModel);
  textSize(14);
}

function handleFile(file) {
  if (file.type === 'text') {
    let rows = file.data.split('\n').map(row => row.trim()).filter(r => r);
    let headers = rows[0].split(',');
    let labelIndex = headers.indexOf('mudra_name');

    for (let i = 1; i < rows.length; i++) {
      let cols = rows[i].split(',');
      if (cols.length < headers.length) continue;

      let input = cols.slice(2).map(Number); // assuming first two are labels: mudra_name, hand
      let label = cols[labelIndex];

      trainingData.push({ input, output: { label } });

      if (!labelList.includes(label)) labelList.push(label);
    }

    console.log('Loaded samples:', trainingData.length);
    console.log('Classes:', labelList);
  }
}

async function startTraining() {
  if (trainingData.length === 0) {
    alert('Upload data first!');
    return;
  }

  // Wait for TensorFlow.js to be ready
  await tf.ready();
  console.log("TensorFlow.js is ready");

  training = true;
  trained = false;
  lossPlot = [];
  epoch = 0;

  // Create a classification NN with 2 hidden layers
  const options = {
    task: 'classification',
    inputs: 42,
    outputs: labelList.length,
    debug: true,
    learningRate: 0.1,
    hiddenUnits: 16
  };

  nn = ml5.neuralNetwork(options);

  for (let data of trainingData) {
    nn.addData(data.input, [data.output.label]);
  }

  nn.normalizeData();

  nn.train({ epochs: totalEpochs }, whileTraining, finishedTraining);
}


function whileTraining(loss) {
  if (loss) {
    lossPlot.push(loss.loss);
    epoch++;
    redraw();
  }
}

function finishedTraining() {
  training = false;
  trained = true;
  console.log('Training complete!');
}

function draw() {
  background(255);
  fill(0);
  text(`Epoch: ${epoch}/${totalEpochs}`, 20, 20);

  if (lossPlot.length > 1) {
    stroke(0, 100, 200);
    noFill();
    beginShape();
    for (let i = 0; i < lossPlot.length; i++) {
      let x = map(i, 0, lossPlot.length - 1, 50, width - 50);
      let y = map(lossPlot[i], 0, Math.max(...lossPlot), height - 50, 50);
      vertex(x, y);
    }
    endShape();
    fill(0);
    text("Loss", width - 60, height - 60);
  }

  if (trained) {
    fill(0, 150, 0);
    text("Training complete. You can now save the model.", 20, height - 30);
  }
}

function saveModel() {
  if (trained && nn) {
    nn.save();
  } else {
    alert('Train the model first!');
  }
}
