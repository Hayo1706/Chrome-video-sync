let intervalId;
var connection;

var host = false;
var video;

const MAX_DIFFERENCE = 0.2;

var peer = new Peer();
var peerId = 'Error retrieving ID';
var disableClick = false;
const intervalTime = 2000;

//Getting new peer id
peer.on('open', function(id) {
    peerId = id;
});


//When other peer connects with my peer id
peer.on('connection', function(conn) {
    connection = conn
    host = true;

    onNewConnection();
    
    console.log('recieved connection ID');
    

    //checkTimeline();
    
});


function connectToId(id){
    connection = peer.connect(id)
    onNewConnection();
};

function onNewConnection(){
    video = document.getElementsByTagName("video")[0];

    connection.on('open', function() {
        // Receive messages
        connection.on('data', function(data) {

            const recievedMessage = JSON.parse(data);
            switch (recievedMessage.command) {
                case 'sync':
                    console.log('Received', recievedMessage.value, 'current time:', video.currentTime);
                    if (Math.abs(video.currentTime - parseFloat(recievedMessage.value) ) > MAX_DIFFERENCE)
                        syncVideo(parseFloat(recievedMessage.value));
                    break;
                case 'pause':
                    if(recievedMessage.value === "paused")
                    	video.pause();
                    else
                        video.play();
                    break;
                default:
                    console.log('Unknown message')
            }
        });
        if(host){
            console.log('Syncing');
            checkTimeline();
        }
    });

    video.addEventListener("seeked", (event1) => {
        if (!disableClick)
            checkTimeline();

    });
    video.addEventListener("pause", (event2) => {
        if (checkHuman(event2)){
            connection.send(JSON.stringify({'command':'pause','value': 'paused'}))
            stopSyncingLoop();
        }
    });
    video.addEventListener("play", (event3) => {
        if (checkHuman(event3)){
            connection.send(JSON.stringify({'command':'pause','value': 'unpaused'}))
            if(host)
                startSyncingLoop();

        }
    });
}

const checkTimeline = () => {
    connection.send(JSON.stringify({'command':'sync','value': video.currentTime}))
    console.log(video.currentTime);
};

function startSyncingLoop() {
    if (connection == null){
        console.log("Can't start sync, not connected yet!")
        return false
    }
    checkTimeline()
    //intervalId = setInterval(checkTimeline, intervalTime);
    return true
};

function stopSyncingLoop() {
    clearInterval(intervalId);
};


function checkHuman(event){
    return event.isTrusted;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.listener) {
        console.log('got request1')
        sendResponse({succes: startSyncingLoop()});
    } 
    else if (request.stopListener) {
        console.log('got request2')
        stopSyncingLoop();
        sendResponse();
    }
    else if (request.getPeerId) {
        console.log('got request3')
        sendResponse({peerId:peerId});
    }
    else if (request.submittedId){
        console.log('Got new id:' + request.submittedId)
        connectToId(request.submittedId)
        sendResponse();
    }
    else if (request.pause){
        sendResponse();
    }
    else
        console.log('Unrecognized Message')
});


function syncVideo(aim){
    let forward = document.getElementsByClassName("ff-10sec-icon")[0];
    let back = document.getElementsByClassName("rwd-10sec-icon")[0];

    let difference = aim - video.currentTime;
    let clicks = Math.floor(Math.abs(difference) / 10);
    console.log('Clicks:', clicks);
    disableClick = true;

    if (difference >= 0) {
        for (let i = 0; i < clicks; i++) {
            disableClick = true;
            forward.click();
        }
        
    }
    else {
        for (let i = 0; i <= clicks; i++) {
            disableClick = true;
            back.click();
        }
    }
    setTimeout(() => {
        console.log('Current time:',video.currentTime, 'Current aim:', aim);
        video.currentTime = aim + 0.4;
        console.log('Time after:',video.currentTime);
        
    }, 400);

    setTimeout(() => {
        disableClick = false;
    }, 1500);
}



