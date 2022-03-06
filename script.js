const webcam = document.querySelector('#video')

Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri('./models'), // Detecção facial
  faceapi.nets.faceLandmark68Net.loadFromUri('./models'), // Pontos de referência na face
  faceapi.nets.faceRecognitionNet.loadFromUri('./models'), // Localização da face no vídeo
  faceapi.nets.faceExpressionNet.loadFromUri('./models') // Emoção
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
  // Intervalo de detecção de face a cada 100ms
  setInterval(async () => {
    const detections = await faceapi.detectAllFaces(
      webcam,
      // Biblioteca para detectar face
      new faceapi.TinyFaceDetectorOptions()
    )
    // Desenha marcação na face
    .withFaceLandmarks()
    // Determina expressões
    .withFaceExpressions()
    // Redimensiona as detecções
    const resizedDetections = faceapi.resizeResults(detections, displaySize)
    // Apaga canvas antes de desenhar outro
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height)
    // Desenha detecções
    faceapi.draw.drawDetections(canvas, resizedDetections)
    // Desenha pontos de referência
    //faceapi.draw.drawFaceLandmarks(canvas, resizedDetections)
    // Desenha expressões
    faceapi.draw.drawFaceExpressions(canvas, resizedDetections)
  }, 100);
})