import dotenv from 'dotenv';
import fastify from 'fastify';
import cors from 'fastify-cors'
import jwt from 'jsonwebtoken';

dotenv.config();

const app = fastify()
app.listen(8082, '0.0.0.0', (err) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log("serv on 3k");
})

// app.addHook('preValidation', (req, res, done) => {
//   console.log('on every request');
//   done()
// })

// Add cors header
app.register(cors, { origin: '*' });

// Decorate request with a 'user' property
app.decorateRequest('is_auth', '')
// Update our property
app.addHook('preHandler', (req, reply, done) => {
  req.is_auth = false;

  if (req.headers.authorization)
    try {
      const token = req.headers.authorization.split(" ")[1];
      var decoded = jwt.verify(token, process.env.SECRET);
      req.is_auth = true;
      req.user_id = decoded.user_id;
    } catch (error) {
      reply.code(401).send({ message: "Invalid Token 💔" });
    }

  done()
})

app.get('/', (req, reply) => {
  if (req.is_auth)
    reply.send("You're in 🔓 \nHi there 👋 " + req.user_id)
  else
    reply.send("You're out 🔒")
})
app.post('/is_token_valid', (req, reply) => {
  try {
    const token = req.body.token;
    jwt.verify(token, process.env.SECRET);
    reply.code(200).send(true);
  } catch (error) {
    reply.code(200).send(false);
  }
})

// app.get('/', function (req, res) {
//   res.send("Hi there 👋");
// })

import root_cmd from './roots/cmd/index.js';
app.register(root_cmd, { prefix: "/cmd" });
import root_mongo from './roots/mongo/index.js';
app.register(root_mongo, { prefix: "/mongo" });
import root_records from './roots/records/index.js';
app.register(root_records, { prefix: "/records" });

