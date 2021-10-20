const socket = io();

const myFace = document.getElementById('myFace');
const muteBtn = document.getElementById('mute');
const cameraBtn = document.getElementById('camera');
const camerasSelect = document.getElementById('cameras');

let myStream;
let muted = false;
let cameraOff = false;

// 카메라 정보 가져오기
async function getCameras() {
  try {
    // 연결된 디바이스 정보 가져오기
    const devices = await navigator.mediaDevices.enumerateDevices();
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
async function getMedia(devicdId) {
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
      devicdId ? cameraConstraints : initialConstraints
    );
    myFace.srcObject = myStream;
    if (!deviceId) {
      await getCameras;
    }
  } catch (e) {
    console.log(e);
  }
}

getMedia();

// Mute 버튼 컨트롤
function handleMuteBtn() {
  myStream.getAudioTracks().forEach(track => {
    track.enabled = !track.enabled;
  });
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
  myStream.getVideoTracks().forEach(track => {
    track.enabled = enabled;
  });
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
  await getMedia();
}

muteBtn.addEventListener('click', handleMuteBtn);
cameraBtn.addEventListener('click', handleCameraBtn);
camerasSelect.addEventListener('input', handleCameraChange);
