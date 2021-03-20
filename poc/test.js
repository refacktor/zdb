var request = require("request");
let url = "http://localhost:3000/db/testDB:json";
let i = 0;
let data = {
    string: `This is testing simple DB!This is testing simple DB!This is testing simple DB!This is testing simple DB!
    This is testing simple DB!This is testing simple DB!This is testing simple DB!This is testing simple DB!
    This is testing simple DB!This is testing simple DB!This is testing simple DB!This is testing simple DB!
    This is testing simple DB!This is testing simple DB!This is testing simple DB!This is testing simple DB!`
}
let lastTime = new Date();
function test(i){
    i++;
    if(i==499){
        console.log(new Date() - lastTime);
    }
    request({ url: url + i, method: 'PUT', json: data}, function(err, callback){
        if(i<500)
            test(i);
    });
}
test(i);