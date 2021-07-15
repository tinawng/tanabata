import dotenv from 'dotenv';
import fs from 'fs';
import fastify from 'fastify';
import cors from 'fastify-cors'
import jwt from 'jsonwebtoken';
import log from './logger/index.js';
import multipart from 'fastify-multipart'
import ky from 'ky-universal';

dotenv.config();

const app = fastify({
  http2: true,
  https: {
    allowHTTP1: true,
    key: fs.readFileSync(process.env.CERT_PATH + 'privkey.pem'),
    cert: fs.readFileSync(process.env.CERT_PATH + 'cert.pem')
  }
});
app.listen(process.env.SERVER_PORT, process.env.SERVER_HOST, (err) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log("🎋 Tanabata Server \n🚀 Deployed on " + process.env.SERVER_HOST + ":" + process.env.SERVER_PORT);
});

app.register(cors, { origin: '*' });
app.register(multipart);

const ky_local = ky.create({
  prefixUrl: "https://tanabata.tina.cafe/",
  headers: {
    secret: process.env.SECRET
  }
});


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

  // 💫 If request comes from server itself, bypass token checking
  if (req.headers.secret === process.env.SECRET) {
    // 🔓 Log as OP
    req.is_auth = true;
    // 👥 Log as someone else ?
    req.user_id = req.body ? req.body.as_user ? req.body.as_user : process.env.SECRET : process.env.SECRET;
  }
  else if (req.headers.authorization) {
    try {
      const token = req.headers.authorization.split(" ")[1];
      var decoded = jwt.verify(token, process.env.SECRET);
      req.is_auth = true;
      req.user_id = decoded.user_id;
    } catch (error) {
      reply.code(401).send({ message: "Invalid Token 💔" });
    }
  }
  else if (req.query.auth_token) {
    try {
      const token = req.query.auth_token;
      var decoded = jwt.verify(token, process.env.SECRET);
      req.is_auth = true;
      req.user_id = decoded.user_id;
    } catch (error) {
      reply.code(401).send({ message: "Invalid Token 💔" });
    }
  }
  else if (process.env.NODE_ENV === "development") {
    req.is_auth = true;
    req.user_id = process.env.SECRET;
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

import root_auth from './roots/auth/index.js';
app.register(root_auth, { prefix: "/auth" });
import root_backup from './roots/backup/index.js';
app.register(root_backup, { prefix: "/backup" });
import root_dango from './roots/dango/index.js';
app.register(root_dango, { prefix: "/dango" });
import root_yubin from './roots/yubin/index.js';
app.register(root_yubin, { prefix: "/yubin" });
// import root_cmd from './roots/cmd/index.js';
// app.register(root_cmd, { prefix: "/cmd" });
// import root_mongo from './roots/mongo/index.js';
// app.register(root_mongo, { prefix: "/mongo" });
import root_lotus from './roots/lotus/index.js'
app.register(root_lotus, { prefix: "/lotus", ky: ky, ky_local: ky_local })
import root_firebase_storage from './roots/firebase/storage/index.js';
app.register(root_firebase_storage, { prefix: "/firebase/storage" });
// import root_records from './roots/records/index.js';
// app.register(root_records, { prefix: "/records", ky: ky, ky_local: ky_local });
// import root_records_faker from './roots/records/faker.js';
// app.register(root_records_faker, { prefix: "/records/faker", ky: ky, ky_local: ky_local });

