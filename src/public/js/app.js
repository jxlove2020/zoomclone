const socket = io();

const myFace = document.getElementById('myFace');
const muteBtn = document.getElementById('mute');
const cameraBtn = document.getElementById('camera');
const camerasSelect = document.getElementById('cameras');

const welcome = document.getElementById('welcome');
const call = document.getElementById('call');

// 카메라 화면 숨김
call.hidden = true;

let myStream;
let muted = false;
let cameraOff = false;
let roomName;
let myPeerConnection;

// 카메라 정보 가져오기
async function getCameras() {
  try {
    // 연결된 디바이스 정보 가져오기
    const devices = await navigator.mediaDevices.enumerateDevices();
    // console.log(devices);
    // 전체 디바이스 중에서 카메라 정보만 가져오기
    const cameras = devices.filter(device => device.kind === 'videoinput');

    // 현재 카메라가 무엇인지 확인
    const currentCamera = myStream.getVideoTracks()[0];

    // 가져온 카메라 정보를 selectBox 에 넣어주기
    cameras.forEach(camera => {
      const option = document.createElement('option');
      option.value = camera.deviceId;
      option.innerText = camera.label;

      if (currentCamera.label === camera.label) {
        option.selected = true;
      }
      camerasSelect.appendChild(option);
    });
  } catch (e) {
    console.log(e);
  }
}

// 오디오/비디오 화면에 뿌려주기
async function getMedia(deviceId) {
  // 셀피 카메라 모드 ( fancingmode: 'user' )
  const initialConstraints = {
    audio: true,
    video: { fancingmode: 'user' },
  };
  const cameraConstraints = {
    audio: true,
    video: { deviceId: { exact: deviceId } },
  };
  try {
    myStream = await navigator.mediaDevices.getUserMedia(
      deviceId ? cameraConstraints : initialConstraints
    );

    myFace.srcObject = myStream;
    if (!deviceId) {
      await getCameras();
    }
  } catch (e) {
    console.log(e);
  }
}

// Mute 버튼 컨트롤
function handleMuteBtn() {
  // 오디오 뮤트 토글
  myStream.getAudioTracks().forEach(track => {
    track.enabled = !track.enabled;
  });

  // 버튼 텍스트 변환
  if (!muted) {
    muteBtn.innerText = 'Unmute';
    muted = true;
  } else {
    muteBtn.innerText = 'Mute';
    muted = false;
  }
}

// 카메라 버튼 컨트롤
function handleCameraBtn() {
  // 카메라화면 켜고 끄는 토글
  myStream.getVideoTracks().forEach(track => {
    track.enabled = !track.enabled;
  });

  // 버튼 텍스트 변환
  if (cameraOff) {
    cameraBtn.innerText = 'Turn Camera Off';
    cameraOff = false;
  } else {
    cameraBtn.innerText = 'Turn Camera On';
    cameraOff = true;
  }
}

async function handleCameraChange() {
  // console.log(camerasSelect.value);
  await getMedia(camerasSelect.value);

  if(myPeerConnection){
    const videoTrack = myStream.getVideoTracks()[0];
    console.log(myPeerConnection.getSenders());
    const videoSender = myPeerConnection.getSenders().find(sender=>sender.track.kind === "video");
    console.log(videoSender);
    videoSender.replaceTrack(videoTrack);
  }
}

muteBtn.addEventListener('click', handleMuteBtn);
cameraBtn.addEventListener('click', handleCameraBtn);
camerasSelect.addEventListener('input', handleCameraChange);

welcomeForm = welcome.querySelector('form');

// 카메라 화면 보임
async function initCall() {
  welcome.hidden = true;
  call.hidden = false;
  await getMedia();
  makeConnection();
}

async function handleWelcomeSubmit(event) {
  event.preventDefault();
  const input = welcomeForm.querySelector('input');
  await initCall();
  socket.emit('join_room', input.value);
  roomName = input.value;
  input.value = '';
}

welcomeForm.addEventListener('submit', handleWelcomeSubmit);

// Socket Code
// Peer A 
socket.on('welcome', async () => {
  // console.log('someone joined');
  const offer = await myPeerConnection.createOffer();
  // console.log(offer)
  myPeerConnection.setLocalDescription(offer);
  console.log("sent the offer")
  socket.emit("offer", offer, roomName);
});

// Peer B 
socket.on("offer", async (offer)=>{
  // console.log(offer);
  console.log("received the offer");
  myPeerConnection.setRemoteDescription(offer);
  const answer = await myPeerConnection.createAnswer();
  // console.log(answer);
  myPeerConnection.setLocalDescription(answer);
  socket.emit("answer", answer, roomName);
  console.log("sent the answer");
})

socket.on("answer", answer => {
  console.log("received the answer");
  myPeerConnection.setRemoteDescription(answer);
});

socket.on("ice", ice => {
  console.log("received candidate");
  myPeerConnection.addIceCandidate(ice);
})

// RTC Code
function makeConnection() {
  myPeerConnection = new RTCPeerConnection();
  myPeerConnection.addEventListener("icecandidate", handleIce);
  myPeerConnection.addEventListener("addstream", handleAddStream);
  myStream.getTracks().forEach(track => myPeerConnection.addTrack(track, myStream));
}

function handleIce(data) {
  console.log("sent candidate");
  socket.emit("ice", data.candidate, roomName);
  // console.log("got ice candidate");
  // console.log(data);
}

function handleAddStream(data) {
  // console.log("got an event from my peer");
  // console.log("Peer's Stream", data.stream);
  // console.log("My Stream", myStream);
  const peerFace = document.getElementById("peerFace");
  peerFace.srcObject = data.stream;
}