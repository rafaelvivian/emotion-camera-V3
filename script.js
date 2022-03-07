const webcam = document.querySelector('#video');
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
        //console.log(status);
        //console.log(emotion);        
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

function gravar() {
  recording = 1;
  return recording;
}

function download() {
  let text = emotion;
  let title = "myemotions";
  let blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  saveAs(blob, title + ".csv");
}