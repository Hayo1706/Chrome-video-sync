var connection;

var host = false;

var video;
var forward;
var back;

const MAX_DIFFERENCE = 0.2;

var peer = new Peer();
var peerId = 'Error retrieving ID';

var disableSeekEvent = false;
var disablePlayEvent = false;


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
});


function connectToId(id){
    connection = peer.connect(id)
    onNewConnection();
};

function onNewConnection(){
    video = document.getElementsByTagName("video")[0];
    forward = document.getElementsByClassName("ff-10sec-icon")[0];
    back = document.getElementsByClassName("rwd-10sec-icon")[0];

    connection.on('open', function() {
        // Receive messages
        connection.on('data', function(data) {

            const recievedMessage = JSON.parse(data);
            switch (recievedMessage.command) {
                case 'sync':
                    handleSync(recievedMessage);
                    break;
                case 'pause':
                    if(recievedMessage.value === "paused")
                    	video.pause();
                    else {
                        disablePlayEvent = true;
                        video.play();
                    }
                    break;
                default:
                    console.log('Unknown message')
            }
        });
        if(host){
            console.log('Syncing');
            sendCurrentTime();
        }
    });

    video.addEventListener("seeked", handleSeekedEvent);

    video.addEventListener("pause", (event2) => {
        connection.send(JSON.stringify({'command':'pause','value': 'paused'}))
    });
    video.addEventListener("play", handlePlayEvent);
}
const sendCurrentTime = () => {
    connection.send(JSON.stringify({'command':'sync','value': video.currentTime}))
    console.log(video.currentTime);
};

const sendUnpauseEvent = () => {
    console.log('unpauseeeee')
    if (!disablePlayEvent){
        connection.send(JSON.stringify({'command':'pause','value': 'unpaused'}))
        sendCurrentTime();
    }
    else {
        disablePlayEvent = false;
    }
}

let doSeekAction = sendCurrentTime;
let doPlayAction = sendUnpauseEvent;
function handleSeekedEvent(){
    doSeekAction();
    if (video.paused)
        disablePlayEvent = true;
    video.play();
}

function handlePlayEvent(){
    doPlayAction();
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.getPeerId) {
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

function handleSync(recievedMessage) {
    function calculateClicks(difference) {
        let clicks = Math.floor(Math.abs(difference) / 10);
        return difference >= 0 ? clicks: clicks + 1;
    }

    function seekVideo(difference, clicks) {
        const clickFunction = difference >= 0 ? () => {forward.click();} : () => {back.click();}
        for (let i = 0; i < clicks; i++) {
            clickFunction();
        }
    }

    function syncVideo(){
        setTimeout(() => {
            doSeekAction = () => {};
            let seekDuration = video.paused ? 0: performance.now() - startTimeSeek;
            let newTime = Math.round((aim + (seekDuration / 1000)) * 100) / 100;

            console.log('Supposed time:',newTime);
            video.currentTime = newTime;
            console.log('Actual time:', video.currentTime);

            setTimeout(() => {
                doSeekAction = sendCurrentTime;
                disablePlayEvent = false;
            }, 100);

        }, 400);
    }

    let startTimeSeek = performance.now();
    let aim = parseFloat(recievedMessage.value)
    let difference = aim - video.currentTime;

    console.log('Received', aim);

    if (Math.abs(video.currentTime - aim ) > MAX_DIFFERENCE) {
        doSeekAction = () => {};

        disablePlayEvent = true;
        console.log('big difference')

        let clicks = calculateClicks(difference)

        if (clicks > 0) {
            doSeekAction = syncVideo;
            seekVideo(difference,clicks);
        }
        else {
            syncVideo();
        }
    }
}



