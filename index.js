import dotenv from 'dotenv';
import fastify from 'fastify';
import cors from 'fastify-cors'
import jwt from 'jsonwebtoken';
import log from './logger/index.js';
import multipart from 'fastify-multipart'

dotenv.config();

const app = fastify();
app.listen(process.env.SERVER_PORT, process.env.SERVER_HOST, (err) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log("🥔 Potato API \n🚀 Deployed on " + process.env.SERVER_HOST + ":" + process.env.SERVER_PORT);
});

app.register(cors, { origin: '*', methods: ['GET', 'PUT', 'POST'], allowedHeaders: ['Content-Type', 'Authorization'] });
app.register(multipart);

// Causing CORS error! WTF??!
// if (process.env.LOG_REQUESTS) {
//   app.addHook('onSend', (req, reply, payload, done) => {
//     log(reply, payload);
//     done();
//   })
// }

app.decorateRequest('is_auth', '');
app.decorateRequest('user_id', '');
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

  done();
})

app.get('/', (req, reply) => {
  if (req.is_auth)
    reply.send("You're in 🔓 \nHi there 👋 " + req.user_id);
  else
    reply.send("You're out 🔒");
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

// import root_cmd from './roots/cmd/index.js';
// app.register(root_cmd, { prefix: "/cmd" });
// import root_mongo from './roots/mongo/index.js';
// app.register(root_mongo, { prefix: "/mongo" });
import root_firebase_storage from './roots/firebase/storage/index.js';
app.register(root_firebase_storage, { prefix: "/firebase/storage" });
import root_records from './roots/records/index.js';
app.register(root_records, { prefix: "/records" });

