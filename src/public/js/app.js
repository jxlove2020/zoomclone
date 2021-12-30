const socket = io();

const myFace = document.getElementById('myFace');
const muteBtn = document.getElementById('mute');
const cameraBtn = document.getElementById('camera');
const camerasSelect = document.getElementById('cameras');

const welcome = document.getElementById('welcome');
const call = document.getElementById('call');

call.hidden = true;

let myStream;
let muted = false;
let cameraOff = false;
let roomName;

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
}

muteBtn.addEventListener('click', handleMuteBtn);
cameraBtn.addEventListener('click', handleCameraBtn);
camerasSelect.addEventListener('input', handleCameraChange);

welcomeForm = welcome.querySelector('form');

function startMedia() {
  welcome.hidden = true;
  call.hidden = false;
  getMedia();
}

function handleWelcomeSubmit(event) {
  event.preventDefault();
  const input = welcomeForm.querySelector('input');
  socket.emit('join_room', input.value, startMedia);
  roomName = input.value;
  input.value = '';
}

welcomeForm.addEventListener('submit', handleWelcomeSubmit);

socket.on('welcome', () => {
  console.log('someone joined');
});
