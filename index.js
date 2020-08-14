import dotenv from 'dotenv';
import fastify from 'fastify';

dotenv.config();

const app = fastify()
app.listen(3000, (err) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log("serv on 3k");
})
app.get('/', function (req, res) {
  res.send("Hi there 👋");
})

import root_cmd from './roots/cmd/index.js'
root_cmd(app);
import root_mongo from './roots/mongo/index.js'
root_mongo(app);

