'use strict';
const setupSocketConnectionViaPeer = (socket, myPeer) => {
  myPeer.on('open', id => {
    console.log('Peer ID:', id);
    window.localpeer=id;
    socket.emit('join-room', ROOM_ID, id);
  });
};
let shareclick = 0;
$('#stopVideo').on('click', function() {
  console.log($(this).text())
  
  if ($(this).text().includes('Выключить камеру')) {
    document.querySelector('#my-camera').srcObject=null
    $(this).text('Включить камеру')
  } else {
    document.querySelector('#my-camera').srcObject=window.stream
    $(this).text('Выключить камеру')
  }
})
const setupSocketEvents = (socket, myPeer) => {
  window.myPeer = myPeer
  socket.on('user-connected', (peerId, myPeer) => {
    console.log('connected_peer')
    window.connect_peer = peerId
    const call = window.myPeer.call(peerId, window.stream);
    window.call = call
    call.on("stream", (userVideoStream) => {
      console.log(userVideoStream)
      window.peerStream = userVideoStream; // make stream available to console
      document.querySelector('#peer-camera').srcObject = userVideoStream
    });
  });
}

$('#noneVideo').on('click', function() {
  const enabled = window.stream.getVideoTracks()[0].enabled;
  if (enabled) {
    window.stream.getVideoTracks()[0].enabled = false;
    $(this).text('Включить видео')
  } else {
    window.stream.getVideoTracks()[0].enabled = true;
    $(this).text('Выключить видео')
  }
})
//<p id="noneAudio" class="dropdown-item">Выключить Аудио</p>
$('#noneAudio').on('click', function() {
  const enabled = window.stream.getAudioTracks()[0].enabled;
  if (enabled) {
    window.stream.getAudioTracks()[0].enabled = false;
    $(this).text('Включить аудио')
  } else {
    window.stream.getAudioTracks()[0].enabled = true;
    $(this).text('Выключить аудио')
  }
})
var getUserMedia = navigator.getUserMedia ||
    navigator.webkitGetUserMedia ||
    navigator.mozGetUserMedia;

    const videoElement = document.querySelector('video');
    const audioInputSelect = document.querySelector('select#audioSource');
    const audioOutputSelect = document.querySelector('select#audioOutput');
    const videoSelect = document.querySelector('select#videoSource');
    const selectors = [audioInputSelect, audioOutputSelect, videoSelect];
    
    //audioOutputSelect.disabled = !('sinkId' in HTMLMediaElement.prototype);
    
    function gotDevices(deviceInfos) {
      // Handles being called several times to update labels. Preserve values.
      const values = selectors.map(select => select.value);
      selectors.forEach(select => {
        while (select.firstChild) {
          select.removeChild(select.firstChild);
        }
      });
      for (let i = 0; i !== deviceInfos.length; ++i) {
        const deviceInfo = deviceInfos[i];
        const option = document.createElement('option');
        option.className = "dropdown-item"
        option.value = deviceInfo.deviceId;
        if (deviceInfo.kind === 'audioinput') {
          option.text = deviceInfo.label || `microphone ${audioInputSelect.length + 1}`;
          audioInputSelect.appendChild(option);
        } else if (deviceInfo.kind === 'audiooutput') {
          option.text = deviceInfo.label || `speaker ${audioOutputSelect.length + 1}`;
          audioOutputSelect.appendChild(option);
        } else if (deviceInfo.kind === 'videoinput') {
          option.text = deviceInfo.label || `camera ${videoSelect.length + 1}`;
          videoSelect.appendChild(option);
        } else {
          console.log('Some other kind of source/device: ', deviceInfo);
        }
      }
      selectors.forEach((select, selectorIndex) => {
        if (Array.prototype.slice.call(select.childNodes).some(n => n.value === values[selectorIndex])) {
          select.value = values[selectorIndex];
        }
      });
    }
    
    navigator.mediaDevices.enumerateDevices().then(gotDevices).catch(handleError);
    
    // Attach audio output device to video element using device/sink ID.
    function attachSinkId(element, sinkId) {
      if (typeof element.sinkId !== 'undefined') {
        element.setSinkId(sinkId)
            .then(() => {
              console.log(`Success, audio output device attached: ${sinkId}`);
            })
            .catch(error => {
              let errorMessage = error;
              if (error.name === 'SecurityError') {
                errorMessage = `You need to use HTTPS for selecting audio output device: ${error}`;
              }
              console.error(errorMessage);
              // Jump back to first output device in the list as it's the default.
              audioOutputSelect.selectedIndex = 0;
            });
      } else {
        console.warn('Browser does not support output device selection.');
      }
    }

    function shareDisplay(isShere) {
      if (isShere) {
        navigator.mediaDevices.getDisplayMedia({
          video: {
            cursor: "always"
          }, 
          audio: {
            echoCancellation: true,
            noiseSuppression: true
          }
        }).then((stream) => {
          gotStream(stream)
          try {
           window.call.peerConnection.getSenders()[1].replaceTrack(stream.getTracks()[0])
          } catch(error) {
            console.log('none connect to peer')
          }
        })
      } else {
        const audioSource = audioInputSelect.value;
        const videoSource = videoSelect.value;
        const constraints = {
          audio: {deviceId: audioSource ? {exact: audioSource} : undefined},
          video: {deviceId: videoSource ? {exact: videoSource} : undefined}
        };
        navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
           try {
           window.call.peerConnection.getSenders()[1].replaceTrack(stream.getTracks()[1])
          } catch(error) {
            console.log('none connect to peer')
          }
          gotStream(stream)
        }).catch((error) => console.log(error))
       // window.call.peerConnection.getSenders()[1].replaceTrack(window.stream.getTracks()[0])
      }
      
    }
    $('#display_share').on(('click'), function() {
      if (shareclick % 2 === 0) {
        shareDisplay(true)
      } else {
        shareDisplay(false)
      }
      shareclick++
    })
    
    $('#stop_call').on(('click'), function() {
      window.call.peerConnection.close()
      document.querySelectorAll('video')[1].srcObject=null
    })
    function changeAudioDestination() {
      const audioDestination = audioOutputSelect.value;
      attachSinkId(videoElement, audioDestination);
    }
    
    function gotStream(stream) {
      window.stream = stream; // make stream available to console
      videoElement.srcObject = stream;
      // Refresh button list in case labels have become available
      return navigator.mediaDevices.enumerateDevices();
    }
    
    function handleError(error) {
      console.log('navigator.MediaDevices.getUserMedia error: ', error.message, error.name);
    }
    
    async function getConnectedDevices(type) {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.filter(device => device.kind === type)
    }
  
   
    function start() {
      if (window.stream) {
        window.stream.getTracks().forEach(track => {
          track.stop();
        });
      }
      const audioSource = audioInputSelect.value;
      const videoSource = videoSelect.value;
      const constraints = {
        audio: {deviceId: audioSource ? {exact: audioSource} : undefined},
        video: {deviceId: videoSource ? {exact: videoSource} : undefined}
      };
      if (constraints.audio.deviceId !== undefined) {
        console.log('ok')
      }
      navigator.mediaDevices.getUserMedia(constraints).then(gotStream).then(gotDevices).catch(handleError).then(() => {
        const socket = io('healthit.in.ua:3000');
        window.socket = socket;
        const myPeer = new Peer({
          host: "healthit.in.ua",
          port: 3000,
          path: '/peerjs',
          debug: 3,
          config: {
              'iceServers': [
                  { url: 'stun:stun1.l.google.com:19302' },
                  {
                      url: 'turn:numb.viagenie.ca',
                      credential: 'muazkh',
                      username: 'webrtc@live.com'
                  }
              ]
          }
        })
        
        myPeer.on("call", (call) => {
          call.answer(window.stream)
          console.log('connected_user')
          window.call = call;
          call.on("stream", (userVideoStream) => {
            console.log('userVideoStream')
            console.log(userVideoStream)
            window.peerStream = userVideoStream; // make stream available to console
            document.querySelector('#peer-camera').srcObject = userVideoStream
          })
          
        })



        setupSocketConnectionViaPeer(socket, myPeer);
        setupSocketEvents(socket, myPeer);

      });
}
    
audioInputSelect.onchange = start;
audioOutputSelect.onchange = changeAudioDestination;

videoSelect.onchange = start;
start();
