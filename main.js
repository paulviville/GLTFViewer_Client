

const port = 8080;
const socket = new WebSocket(`ws://localhost:${port}`);

socket.onmessage = function( event ) {
    // console.log(event);
    const messageString = event.data;
    const messageData = JSON.parse(messageString);
    console.log(messageData)
};


socket.onopen = function ( ) {
    console.log('WebSocket connection established.');
};

socket.onerror = function ( error ) {
    console.error('WebSocket error:', error);
};

socket.onclose = function ( event ) {
    if ( event.wasClean ) {
        console.log(`WebSocket closed cleanly, code=${event.code}, reason=${event.reason}`);
    } else {
        console.warn('WebSocket connection closed unexpectedly.');
    }
};