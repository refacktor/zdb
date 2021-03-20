'use strict';
const { parentPort } = require('worker_threads');
// See the Github repo for the full sudoku solving code
var child_process = require("child_process");

// parentPort is the Worker’s way of communicating with the parent, similar to
// window.onmessage in Web Workers.
parentPort.on('message', (cmd) => {
    child_process.exec(cmd, function(err, out){
        if(err)
            console.log(err);
        parentPort.postMessage("successfully!");
    });
});