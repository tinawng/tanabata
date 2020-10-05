import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';
import fs from 'fs';
import util from 'util';
import { pipeline } from 'stream';
const pump = util.promisify(pipeline);

import album_model from './models/Album.js';
import review_model from './models/Review.js';
import track_model from './models/Track.js';
import user_model from './models/User.js';
import group_model from './models/Group.js';

export default async function (app, opts) {

  // ALBUM
  app.post("/album", async (req, res) => {
    if (await hasPermission(req.user_id, "album.manage")) {
      const album = new album_model({ user_id: req.user_id, ...req.body });
      await album.save();
      res.code(201).send(album);
    }
    else
      res.code(401).send({ message: "Missing permission 🔒" });
  });
  app.put("/album/:album_id", async (req, res) => {
    if (await hasPermission(req.user_id, "album.manage") || await isOwner(req.user_id, req.params.album_id))
      res.code(200).send(await album_model.findOneAndUpdate({ _id: req.params.album_id }, req.body));
    else
      res.code(401).send({ message: "Missing permission 🔒" });
  })
  app.delete("/album/:album_id", async (req, res) => {
    if (await hasPermission(req.user_id, "album.manage") || await isOwner(req.user_id, req.params.album_id)) {
      // 🔍 Finding all album tracks
      const tracks = await track_model.find({ album_id: req.params.album_id }).exec();
      // 🗑️ Deleting tracks
      tracks.forEach(async (track) => {
        await opts.ky.delete("track/" + track._id);
      })
      // 🗑️ Deleting album
      await album_model.deleteOne({ _id: req.params.album_id });

      res.code(200).send({ message: "Album, tracks, reviews & sound files deleted 🗑️" });
    }
    else
      res.code(401).send({ message: "Missing permission 🔒" });
  })
  app.get("/albums", async (req, res) => {
    if (req.is_auth) {
      if (await hasPermission(req.user_id, "album.see-hidden"))
        res.code(200).send(await album_model.find({}).exec());
      else
        res.code(200).send(await album_model.find({ is_hidden: false }).exec());
    }
    else
      res.code(401).send({ message: "No logged user 🔒" });
  });
  app.get("/album/:album_id", async (req, res) => {
    if (req.is_auth) {
      const album = await hasPermission(req.user_id, "album.see-hidden") || await isOwner(req.user_id, req.params.album_id)
        ? await album_model.findById(req.params.album_id).exec()
        : await album_model.findOne({ _id: req.params.album_id, is_hidden: false }).exec();

      res.code(200).send(album);
    }
    else
      res.code(401).send({ message: "No logged user 🔒" });
  });
  app.get("/is_reviewed/:album_id", async (req, res) => {
    if (req.is_auth) {
      const tracks = await track_model.find({ album_id: req.params.album_id }).exec();

      var found = false;
      for (let i = 0; i < tracks.length; i++) {
        const track = tracks[i];
        await review_model.find({ user_id: req.user_id, track_id: track.id }, (err, review) => {
          found = review.length > 0 ? true : found;
        })
      }

      res.code(200).send(found)
    }
    else
      res.code(401).send({ message: "No logged user 🔒" });
  });

  // TRACK rw delete
  app.post("/track", async (req, res) => {
    if (await hasPermission(req.user_id, "track.manage")) {
      const track = new track_model(req.body);
      await track.save();
      res.code(201).send(track);
    }
    else
      res.code(401).send({ message: "Missing permission 🔒" });
  });
  app.post("/track/upload", async (req, res) => {
    if (await hasPermission(req.user_id, "create-album")) {
      try {
        // ⬇️ Retrieving file data from request
        const data = await req.file()
        // ✏️ Writing the file in .temp/ with unique name
        const file_name = uuid();
        await pump(data.file, fs.createWriteStream("roots/records/.temp/" + file_name));

        // ⬆️ Uploading file to Firebase Storage and clean up
        await got.post('http://127.0.0.1:' + process.env.SERVER_PORT + "/firebase/storage/uploadlocal", {
          json: {
            secret: process.env.SECRET,
            path: "roots/records/.temp/" + file_name,
            cleanup: true,
          },
          responseType: 'json'
        });

        // 🌐 Setting file access to public and get its url
        var { body } = await got.post('http://127.0.0.1:' + process.env.SERVER_PORT + "/firebase/storage/makepublic", {
          json: {
            secret: process.env.SECRET,
            path: file_name,
          }
        });

        res.code(201).send({ path: body })
      } catch (error) {
        res.code(500).send(error);
      }
    }
    else
      res.code(401).send({ message: "Missing permission 🔒" });
  })
  app.delete("/track/:track_id", async (req, res) => {
    if (await hasPermission(req.user_id, "track.manage") || await isOwner(req.user_id, req.params.track_id)) {

      // // 🔍 Searching for audio file path
      // const { path } = await track_model.findById(req.params.track_id);
      // // 🗑️ Deleting audio file
      // await opts.ky.post("/firebase/storage/delete", {
      //   json: {
      //     path: path,
      //   }
      // });
      // 🗑️ Deleting all associated reviews
      await review_model.deleteMany({ track_id: req.params.track_id });
      // 🗑️ Deleting track
      await track_model.deleteOne({ _id: req.params.track_id });

      res.code(200).send({ message: "Track, reviews & sound files deleted 🗑️" });
    }
    else
      res.code(401).send({ message: "Missing permission 🔒" });
  })
  app.get("/tracks/:album_id", async (req, res) => {
    if (req.is_auth)
      res.code(200).send(await track_model.find({ album_id: req.params.album_id }).exec());
    else
      res.code(401).send({ message: "No logged user 🔒" });
  });

  // REVIEW
  app.post("/review", async (req, res) => {
    if (req.is_auth) {
      const found_review = await review_model.findOne({ track_id: req.body.track_id, user_id: req.user_id })

      if (found_review) {
        const review =  await (await opts.ky.put("review/" + found_review._id, { json: req.body })).json()
        res.code(200).send(review);
      }
      else {
        const review = new review_model({ user_id: req.user_id, ...req.body });
        await review.save();
        res.code(201).send(review);
      }
    }
    else
      res.code(401).send({ message: "No logged user 🔒" });
  });
  app.put("/review/:review_id", async (req, res) => {
    if (await hasPermission(req.user_id, "review.manage") || await isOwner(req.user_id, req.params.review_id))
      res.code(200).send(await review_model.findOneAndUpdate({ _id: req.params.review_id }, { content: req.body.content, date: Date.now() }));
    else
      res.code(401).send({ message: "Missing permission 🔒" });
  });
  app.delete("/review/:review_id", async (req, res) => {
    if (await hasPermission(req.user_id, "review.manage") || await isOwner(req.user_id, req.params.review_id)) {
      await review_model.deleteOne({ _id: req.params.review_id });
      res.code(200).send({ message: "Review deleted 🗑️" });
    }
    else
      res.code(401).send({ message: "Missing permission 🔒" });

  });
  app.get("/reviews/track/:track_id", async (req, res) => {
    if (req.is_auth)
      res.code(200).send(await review_model.find({ track_id: req.params.track_id }).exec());
    else
      res.code(401).send({ message: "No logged user 🔒" });
  });
  app.get("/reviews/user/:user_id", async (req, res) => {
    if (req.is_auth)
      res.code(200).send(await review_model.find({ user_id: req.params.user_id }).exec());
    else
      res.code(401).send({ message: "No logged user 🔒" });
  });

  // USER
  app.post("/register", async (req, res) => {
    if (await hasPermission(req.user_id, "user.manage")) {
      const hash = bcrypt.hashSync(req.body.password, 10);
      const user = new user_model({ ...req.body, password: hash });
      await user.save();
      res.code(201).send(user);
    }
    else
      res.code(401).send({ message: "Missing permission 🔒" });
  });
  app.post("/login", async (req, res) => {
    const user = await user_model.findOne({ name: req.body.name });
    if (!user || !bcrypt.compareSync(req.body.password, user.password)) return res.code(404).send({ message: "Authentication failed 🔒" });
    const jwt_token = jwt.sign({ user_id: user._id }, process.env.SECRET);
    delete user._doc.password;
    res.code(200).send({ token: jwt_token, user: user });
  });
  app.put("/user/:user_id", async (req, res) => {
    if (await hasPermission(req.user_id, "user.manage")) {
      res.code(200).send(await user_model.findOneAndUpdate({ '_id': req.params.user_id }, req.body));
    }
    else
      res.code(401).send({ message: "Missing permission 🔒" });
  });
  app.delete("/user/:user_id", async (req, res) => {
    if (await hasPermission(req.user_id, "user.manage")) {
      user_model.deleteOne({ _id: req.params.user_id });
    }
    else
      res.code(401).send({ message: "Missing permission 🔒" });
  });
  app.get("/users", async (req, res) => {
    if (await hasPermission(req.user_id, "user.manage"))
      res.code(200).send(await user_model.find({}, 'name group_id'))
    else
      res.code(401).send({ message: "Missing permission 🔒" });
  })
  app.get("/user/:user_id", async (req, res) => {
    const params = await hasPermission(req.user_id, "user.manage", req.params.user_id) ? "name group_id" : "name";
    res.code(200).send(await user_model.findById(req.params.user_id, params))
  });

  // GROUP
  app.post("/group", async (req, res) => {
    if (await hasPermission(req.user_id, "group.manage")) {
      const group = new group_model(req.body);
      await group.save();
      res.code(201).send(group);
    }
    else
      res.code(401).send({ message: "Missing permission 🔒" });
  });
  app.put("/group/:group_id", async (req, res) => {
    if (await hasPermission(req.user_id, "group.manage"))
      res.code(200).send(await group_model.findOneAndUpdate({ '_id': req.params.group_id }, req.body));
    else
      res.code(401).send({ message: "Missing permission 🔒" });
  });
  app.get("/groups", async (req, res) => {
    if (await hasPermission(req.user_id, "group.manage"))
      res.code(200).send(await group_model.find({}));
    else
      res.code(401).send({ message: "Missing permission 🔒" });
  });
  app.get("/group/:group_id", async (req, res) => {
    if (req.is_auth)
      res.code(200).send(await group_model.findById({_id: req.params.group_id}))
    else
      res.code(401).send({ message: "No logged user 🔒" });
  })

  async function hasPermission(user_id, permission, object_id) {
    if(!user_id) return false;
    
    // 💫 Request comes from server itself, open bar!
    if (user_id === process.env.SECRET) return true;

    let rep;
    try {
      const user = await user_model.findById(user_id).exec();
      const group = await group_model.findById(user.group_id).exec();
      rep = group.permissions.includes(permission);
    } catch (error) {
      rep = false;
    }

    // ⚡️ Shortcut for checking ownership
    rep = object_id ? rep || isOwner(user_id, object_id) : rep;
    return rep;
  };
  async function isOwner(user_id, object_id) {
    let rep;
    rep = await album_model.findOne({ user_id: user_id, _id: object_id }).exec();
    rep = rep ? rep : await review_model.findOne({ user_id: user_id, _id: object_id }).exec();

    if (!rep) {
      var track = await track_model.findOne({ _id: object_id }).exec();
      rep = track ? await album_model.findOne({ user_id: user_id, _id: track.album_id }).exec() : false;
    }

    rep = rep ? rep : user_id === object_id;

    return rep
  };
}