const express = require('express')
const spawn = require("child_process").spawn;

const app = express()

app.listen(3000, () => {
  console.log("serv on 3k")
})

app.get("/cmd/temp", (req, res) => {
  var regex = /temp=([^'C]+)/;
  var cmd = spawn("/opt/vc/bin/vcgencmd", ["measure_temp"]);
  cmd.stdout.on("data", function (buf) {
    var obj = parseFloat(regex.exec(buf.toString("utf8"))[1]);
    res.json(obj);
  });
});

app.get("/cmd/:cmd", (req, res) => {
  let params = req.params.cmd.split(' ')
  let cmd = spawn(params[0], params.slice(1))

  cmd.stdout.on("data", function (buf) {
    res.json(buf.toString("utf8"));
  });
});

app.post("/cmd", (req, res) => {
  let params = req.query.cmd.split(' ')
  let cmd = spawn(params[0], params.slice(1))

  cmd.stdout.on("data", function (buf) {
    res.json(buf.toString("utf8"));
  });
})