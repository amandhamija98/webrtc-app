"use strict";

var connection = new signalR.HubConnectionBuilder().withUrl("/videoCallHub").build();
var currentUserName = UserName;
var activeUsers = [];
var onCall = false;
var mediaConstraints = {
    audio: true, 
    video: true 
  };
var myPeerConnection = null;
var targetConnectionId;


connection.start().then(()=> {
    console.log("SignalR connection begun");
}).then(()=>{
    connection.invoke("NewUser",currentUserName);
}).then(()=>{
    console.log("Others have been informed");
}).catch( (err) => {
    return console.error(err.toString());
});

connection.on("NewUserJoined",(newUserInfo)=>{
    activeUsers.push(newUserInfo);
    var newUserCard = makeNewUserCard(newUserInfo["userName"],newUserInfo["connectionId"]);
    console.log(newUserInfo);
    document.getElementById("activeUsersList").appendChild(newUserCard);
    connection.invoke("GreetNewUser",newUserInfo["connectionId"],currentUserName,onCall);
},reportError);

connection.on("ExistingUserGreeting",(existingUserInfo)=>{
    activeUsers.push(existingUserInfo);
    var existingUserCard = makeNewUserCard(existingUserInfo["userName"], existingUserInfo["connectionId"]);
    document.getElementById("activeUsersList").appendChild(existingUserCard);
}, reportError);

connection.on("ReceiveVideoOffer", handleVideoOfferMsg,reportError);

connection.on("ReceiveVideoAnswer",handleVideoAnswerMsg,reportError);

connection.on("ReceiveNewIceCAndidate",handleNewICECandidateMsg,reportError);

//Frontend Functions

function reportError(err){
    console.error(err.toString());
}

function makeNewUserCard(name,id){
    var card = document.createElement("div");
    card.id = id;
    card.addEventListener("click",userCardOnClickListener);
    card.classList.add("list-group-item");
    card.classList.add("active-user-card");
    var cardBody = document.createElement("h4");
    cardBody.innerText = name;
    card.appendChild(cardBody);
    return card;
}

function userCardOnClickListener(){
    if(myPeerConnection){
        alert("You are already on a call");
        return ;
    }

    targetConnectionId = this.id; //connectionId of clicked user

    // if( !!activeUsers.find(user=> user.connectionId === targetConnectionId)){
    //     alert("This user is already on another call");
    //     return;
    // }
    
    //to-do: upadate on call value for all peers

    createPeerConnection();

    navigator.mediaDevices.getUserMedia(mediaConstraints)
    .then(function(localStream) {
      document.getElementById("vid-small").srcObject = localStream;
      localStream.getTracks().forEach(track => myPeerConnection.addTrack(track, localStream));
    })
    .catch(handleGetUserMediaError);
}

function handleGetUserMediaError(e) {
    switch(e.name) {
      case "NotFoundError":
        alert("Unable to open your call because no camera and/or microphone" +
              "were found.");
        break;
      case "SecurityError":
      case "PermissionDeniedError":
        // Do nothing; this is the same as the user canceling the call.
        break;
      default:
        alert("Error opening your camera and/or microphone: " + e.message);
        break;
    }
  
    closeVideoCall();
}

function createPeerConnection() {
    myPeerConnection = new RTCPeerConnection({
        iceServers: [     
          {
            urls: "stun:stun.stunprotocol.org"
          }
        ]
    });
  
    myPeerConnection.onicecandidate = handleICECandidateEvent;
    myPeerConnection.ontrack = handleTrackEvent;
    myPeerConnection.onnegotiationneeded = handleNegotiationNeededEvent;
    myPeerConnection.onremovetrack = handleRemoveTrackEvent;
    myPeerConnection.oniceconnectionstatechange = handleICEConnectionStateChangeEvent;
    myPeerConnection.onicegatheringstatechange = handleICEGatheringStateChangeEvent;
    myPeerConnection.onsignalingstatechange = handleSignalingStateChangeEvent;
  }

  function handleNegotiationNeededEvent() {
    myPeerConnection.createOffer()
    .then(function(offer)
     {
      return myPeerConnection.setLocalDescription(offer);
    })
    .then(function() {
    let msg = {
        sender: "",
        target: targetConnectionId,
        sdp: myPeerConnection.localDescription
    };

    connection.invoke("SendVideoOffer",msg);
    })
    .catch(reportError);
  }


  function handleVideoOfferMsg(msg) {
    var localStream = null;
  
    targetConnectionId = msg.sender;
    createPeerConnection();
  
    var desc = new RTCSessionDescription(msg.sdp);
  
    myPeerConnection.setRemoteDescription(desc).then(function () {
      return navigator.mediaDevices.getUserMedia(mediaConstraints);
    })
    .then(function(stream) {
      localStream = stream;
      document.getElementById("vid-small").srcObject = localStream;
  
      localStream.getTracks().forEach(track => myPeerConnection.addTrack(track, localStream));
    })
    .then(function() {
      return myPeerConnection.createAnswer();
    })
    .then(function(answer) {
      return myPeerConnection.setLocalDescription(answer);
    })
    .then(function() {    
        var message = {
            sender: "",
            target: targetConnectionId,
            sdp: myPeerConnection.localDescription
        };
      connection.invoke("SendVideoAnswer",message);
    })
    .catch(handleGetUserMediaError);
  }

  async function handleVideoAnswerMsg(msg) {
  
    // Configure the remote description, which is the SDP payload
    // in our "video-answer" message.
  
    var desc = new RTCSessionDescription(msg.sdp);
    await myPeerConnection.setRemoteDescription(desc).catch(reportError);
  }

  function handleICECandidateEvent(event) {
    if (!!event.candidate) {
        let message = {
            sender: "",
            target: targetConnectionId,
            sdp: event.candidate
        };
        connection.invoke("SendNewIceCandidate",message);
    }
  }

  function handleNewICECandidateMsg(msg) {
    var candidate = new RTCIceCandidate(msg.sdp);
  
     myPeerConnection.addIceCandidate(candidate)
      .catch(reportError);
  }

  function handleTrackEvent(event) {
    document.getElementById("received_video").srcObject = event.streams[0];
    document.getElementById("hangup-button").disabled = false;
  }

  function handleRemoveTrackEvent() {
    var stream = document.getElementById("received_video").srcObject;
    var trackList = stream.getTracks();
   
    if (trackList.length == 0) {
      closeVideoCall();
    }
  }

  function closeVideoCall() {
    var remoteVideo = document.getElementById("received_video");
    var localVideo = document.getElementById("vid-small");
  
    if (myPeerConnection) {
      myPeerConnection.ontrack = null;
      myPeerConnection.onremovetrack = null;
      myPeerConnection.onremovestream = null;
      myPeerConnection.onicecandidate = null;
      myPeerConnection.oniceconnectionstatechange = null;
      myPeerConnection.onsignalingstatechange = null;
      myPeerConnection.onicegatheringstatechange = null;
      myPeerConnection.onnegotiationneeded = null;
  
      if (remoteVideo.srcObject) {
        remoteVideo.srcObject.getTracks().forEach(track => track.stop());
      }
  
      if (localVideo.srcObject) {
        localVideo.srcObject.getTracks().forEach(track => track.stop());
      }
  
      myPeerConnection.close();
      myPeerConnection = null;
    }
  
    remoteVideo.removeAttribute("src");
    remoteVideo.removeAttribute("srcObject");
    localVideo.removeAttribute("src");
    remoteVideo.removeAttribute("srcObject");
  
    document.getElementById("hangup-button").disabled = true;
    targetConnectionId = null;
  }

  function handleICEConnectionStateChangeEvent() {
    switch(myPeerConnection.iceConnectionState) {
      case "closed":
      case "failed":
      case "disconnected":
        closeVideoCall();
        break;
    }
  }

  function handleSignalingStateChangeEvent(event) {
    switch(myPeerConnection.signalingState) {
      case "closed":
        closeVideoCall();
        break;
    }
  };

  function handleICEGatheringStateChangeEvent(event) {
    console.log("In ICE Gathering state change event");
  }