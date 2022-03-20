const webcam = document.querySelector('#video');
var cronometro = document.getElementById('cronometro');
var frame = 0;
var emotion = "";
var recording = 0;

Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri('./models'), // detecção facial
  faceapi.nets.faceLandmark68Net.loadFromUri('./models'), // pontos de referência na face
  faceapi.nets.faceRecognitionNet.loadFromUri('./models'), // localização da face no vídeo
  faceapi.nets.faceExpressionNet.loadFromUri('./models') // emoção  
]).then(startVideo)

async function startVideo() {
  const constraints = { video: true };
  try {
    let stream = await navigator.mediaDevices.getUserMedia(constraints);
    webcam.srcObject = stream;
    webcam.onloadedmetadata = e => {
      webcam.play();
    }
  } catch (err) {
    console.error(err);
  }
  document.getElementById('loading').style.display = 'none';
  document.getElementById('cronometro').style.display = 'block';
  document.getElementById('recording').style.display = 'block';
  document.getElementById('download-disabled').style.display = 'block';
}

webcam.addEventListener('play', () => {  
  const canvas = faceapi.createCanvasFromMedia(video)
  document.body.append(canvas)
  const displaySize = { width: webcam.width, height: webcam.height }
  faceapi.matchDimensions(canvas, displaySize)
  // intervalo de detecção de face a cada 100ms
  setInterval(async () => {
    const detections = await faceapi.detectAllFaces(
      webcam,
      // biblioteca para detectar face
      new faceapi.TinyFaceDetectorOptions()
    )
    // desenha marcação na face
    .withFaceLandmarks()
    // determina expressões
    .withFaceExpressions()
    // redimensiona as detecções
    const resizedDetections = faceapi.resizeResults(detections, displaySize)
    // apaga canvas antes de desenhar outro
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height)
    // desenha detecções
    faceapi.draw.drawDetections(canvas, resizedDetections)
    // desenha pontos de referência
    //faceapi.draw.drawFaceLandmarks(canvas, resizedDetections)
    // desenha expressões
    faceapi.draw.drawFaceExpressions(canvas, resizedDetections)
        
    if(detections.length > 0) {      
      detections.forEach(element => {
        let status = "";
        let valueStatus = 0.0;
        for (const [key, value] of Object.entries(element.expressions)) {          
          if (value > valueStatus) {
            status = key;
            valueStatus = value;
          }          
        }
        if (recording == 1) {
          frame = frame + 1;
          hora = time();
          emotion = emotion + frame + "," + hora + "," + status + ";";          
        }        
      });
    }    
    
  }, 100);  
})

function time() {
  today = new Date();
  h = today.getHours();
  m = today.getMinutes();
  s = today.getSeconds();
  hora = h + ":" + m + ":" + s;
  return hora;
}

let hour = 0;
let minute = 0;
let second = 0;
let millisecond = 0;
let cron;

function startCron() {
  cron = setInterval(() => { timer(); }, 7);
}

function stopCron() {
  clearInterval(cron);
  hour = 0;
  minute = 0;
  second = 0;
  millisecond = 0;
  cronometro.innerText = "00:00:00:00";
}

function timer() {
  if ((millisecond += 1) == 100) {
    millisecond = 0;
    second++;
  }
  if (second == 60) {
    second = 0;
    minute++;
  }
  if (minute == 60) {
    minute = 0;
    hour++;
  }
  cronometro.innerText = returnData(hour) + ":" + returnData(minute) + ":" + returnData(second) + ":" + returnData(millisecond);
}

function returnData(input) {
  return input >= 10 ? input : `0${input}`;
}

function gravar() {
  if (recording == 0) {
    frame = 0;
    emotion = "";
    recording = 1;
    document.getElementById('download-able').style.display = 'none';
    document.getElementById('download-disabled').style.display = 'block';
    document.getElementById('recording-button').src = './assets/images/recording-on.png';
    startCron();
  }  
  else if (recording == 1) {
    recording = 0;
    stopCron();
    document.getElementById('recording-button').src = './assets/images/recording-off.png';
    document.getElementById('download-disabled').style.display = 'none';
    document.getElementById('download-able').style.display = 'block';
  }  
  return recording;
}

function download() {
  let text = emotion;
  let title = "myemotions";
  let blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  saveAs(blob, title + ".csv");
}