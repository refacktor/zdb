var express = require('express');
var router = express.Router();
var fs = require('fs');
var path = require('path');
var child_process = require("child_process");
const zstdPath = path.resolve(__dirname + "/../zstd/zstd");
let lastTime = {};
const { Worker } = require('worker_threads');
const worker = new Worker('./routes/compress.js');
let cmds = [];
let workerFlag = true;
/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'DBManager' });
});

//compress part//
worker.on("message", (data) => {
  if (cmds.length > 0) {
    setTimeout(() => worker.postMessage(cmds.shift()), 100);
  } else {
    workerFlag = true;
  }
});
/////////////////

// DB part///
router.put("/db/:id", function (req, res, next) {
  let str = req.params.id;
  let structureData = str.split(":");
  let folderName = structureData[0];
  let fileName = structureData[1];
  const dpath = path.resolve(__dirname + "/../db/" + folderName);
  let realfileName = fileName + ".json";

  fs.exists(dpath, function (exists) {

    if (exists) {
      let compressFlag = 0;
      let fpath = dpath + "/" + fileName + ".json";

      if (fs.existsSync(fpath)) {
        realfileName = fileName + new Date().getFullYear()
        + new Date().getMonth() + new Date().getDate() +
        new Date().getHours() + new Date().getSeconds()
        + new Date().getMilliseconds() + ".json";
        fpath = dpath + "/" + realfileName;
      }

      fs.appendFile(fpath, JSON.stringify(req.body), function (err) {
        let dir = fs.readdirSync(dpath);
        let totalSize = 0;

        if (dir.length >= 10) {
          for (let i = 0; i < dir.length; i++) {
            let file = dpath + "/" + dir[i];

            if (dir[i].indexOf(".zst") !== -1) {
              let existsFile = fs.existsSync(file);

              if (existsFile) {
                let fState = fs.statSync(file);
                totalSize += fState.size;
              }
            }

          }

          let MBSize = totalSize / 1024 / 1024;

          if (!lastTime.hasOwnProperty(folderName))
            lastTime[folderName] = new Date(0);

          if ((MBSize > 10 && MBSize < 20) || (MBSize >= 20 && (new Date() - lastTime[folderName]) / 1000 / 60 > 15))
            compressFlag = 1;
        }

        if (err) {
          console.log(err);
          res.end("Something went wrong!!");
        } else {

          // send to response
          res.status(200).send("sucessfully!");
          res.end();

          // for compress
          process.nextTick(() => {
            let cmd = zstdPath + " -f --exclude-compressed " + dpath + "\\" + realfileName + " --rm -o " + dpath + "\\" + fileName + ".zst";

            //if no compress condition make blank dictionary
            if (compressFlag === 0) {
              fs.exists(dpath + "/dictionary", function (existsFile) {
                if (!existsFile) {
                  fs.appendFileSync(dpath + "/dictionary", "");
                }
              });
            }

            if (compressFlag !== 0) {
              cmd += " && " + zstdPath + " --train --exclude-compressed " + dpath + "\\*.zst -o " + dpath + "\\dictionary";
              lastTime[folderName] = new Date();
            }

            cmds.push(cmd);
            if (workerFlag && cmds.length > 0) {
              workerFlag = false;
              worker.postMessage(cmds.shift());
            }
          });
          // end compress
        }
      });
    }

    else {
      let compressFlag = 0;

      fs.mkdirSync(dpath);
      const fpath = dpath + "\\" + fileName + ".json";

      if (fs.existsSync(fpath))
        fs.unlinkSync(fpath);

      fs.appendFile(fpath, JSON.stringify(req.body), function (err) {
        let dir = fs.readdirSync(dpath);
        let totalSize = 0;

        if (dir.length >= 10) {
          for (let i = 0; i < dir.length; i++) {
            let file = dpath + "/" + dir[i];
            let fState = fs.statSync(file);
            totalSize += fState.size;
          }

          let MBSize = totalSize / 1024 / 1024;

          if (!lastTime.hasOwnProperty(folderName))
            lastTime[folderName] = new Date(0);

          if ((MBSize > 10 && MBSize < 20) || (MBSize >= 20 && (new Date() - lastTime[folderName]) / 1000 / 60 > 15))
            compressFlag = 1;
        }

        if (err) {
          console.log(err);
          res.end("Something went wrong!!");
        } else {

          // send to response
          res.send("successfully!");
          res.end();

          // for compress
          process.nextTick(() => {
            let cmd = zstdPath + " -f --exclude-compressed " + dpath + "\\" + realfileName + " --rm -o " + dpath + "\\" + fileName + ".zst";

            if (compressFlag === 0) {
              fs.exists(dpath + "/dictionary", function (existsFile) {
                if (!existsFile) {
                  fs.appendFileSync(dpath + "/dictionary", "");
                }
              });
            }

            if (compressFlag !== 0) {
              cmd += " && " + zstdPath + " --train --exclude-compressed " + dpath + "\\*.zst -o " + dpath + "\\dictionary";
              lastTime[folderName] = new Date();
            }

            cmds.push(cmd);
            if (workerFlag && cmds.length > 0) {
              workerFlag = false;
              worker.postMessage(cmds.shift());
            }
          });
          // end compress
        }

      });
    }
  })
});

router.get("/db/:id", function (req, res, next) {
  let str = req.params.id;
  let structureData = str.split(":");
  let folderName = structureData[0];
  let fileName = structureData[1];
  const fpath = path.resolve(__dirname + "/../db/" + folderName + "/" + fileName + ".zst");
  fs.exists(fpath, function (exists) {
    if (exists) {
      let cmd = zstdPath + " --decompress " + fpath + " -c";
      child_process.exec(cmd, function (err, result) {
        let data = JSON.parse(result);
        res.json(data);
      });
    }
    else {
      res.json({});
    }
  });
});
////////////////////

module.exports = router;
