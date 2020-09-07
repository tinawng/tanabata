import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

import album_model from './models/Album.js';
import review_model from './models/Review.js';
import track_model from './models/Track.js';
import user_model from './models/User.js';

export default async function (app, opts) {

  // ALBUM
  app.post("/album", async (req, res) => {
    if (await hasPermission(req.user_id, "create-album")) {
      req.body.user_id = req.user_id;

      const album = new album_model(req.body)
      album.save().then((response) => {

        try {
          req.body.tracks.forEach(track_prep => {
            track_prep.album_id = response._id;

            const track = new track_model(track_prep);
            const error = track.validateSync()

            if (error) throw error
          });
        } catch (error) {
          album_model.deleteOne({ _id: response._id }, (err) => { });
          throw error
        }

        req.body.tracks.forEach(track_prep => {
          track_prep.album_id = response._id;

          const track = new track_model(track_prep);
          track.save();
        });

        res.code(201).send({
          message: "Album successfully created!",
          result: response
        });

      }).catch(error => {
        res.code(500).send({
          error: error
        });
      });
    }
    else
      res.code(401).send({ message: "Missing permission 🔒" });
  });
  app.delete("/album/:album_id", async (req, res) => {
    if (await hasPermission(req.user_id, "manage-album") || await isOwner(req.user_id, req.params.album_id)) {

      var tracks = await track_model.find({ album_id: req.params.album_id }).exec();
      tracks.forEach(track => {
        review_model.deleteMany({ track_id: track._id }, (err) => { });
      })
      track_model.deleteMany({ album_id: req.params.album_id }, (err) => { });
      album_model.deleteOne({ _id: req.params.album_id }, (err) => { });

      res.code(200).send({
        message: "Album successfully deleted!"
      });
    }
    else
      res.code(401).send({ message: "Missing permission 🔒 Or requested resource does not exist 🔍" });
  })
  app.get("/albums", async (req, res) => {
    if (req.is_auth) {
      if (await hasPermission(req.user_id, "see-hidden-album"))
        res.code(200).send(await album_model.find({}).exec());
      else
        res.code(200).send(await album_model.find({ is_hidden: false }).exec());
    }
    else
      res.code(401).send({ message: "No logged user 🔒" });
  });
  app.get("/album/:album_id", async (req, res) => {
    if (req.is_auth) {
      if (await hasPermission(req.user_id, "see-hidden-album") || await isOwner(req.user_id, req.params.album_id)) {
        const album = await album_model.find({ _id: req.params.album_id }).exec();
        res.code(200).send(album[0]);
      }
      else {
        const album = await album_model.find({ _id: req.params.album_id, is_hidden: false }).exec()
        res.code(200).send(album[0]);
      }
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

  // TRACK
  app.post("/track", (req, res) => {
    if (req.is_auth) {
      const track = new track_model(req.body);
      track.save().then((response) => {
        res.code(201).send({
          message: "Review successfully created!",
          result: response
        });
      }).catch(error => {
        res.code(500).send({
          error: error
        });
      });

    }
    else
      res.code(401).send({ message: "No logged user 🔒" });
  });
  app.delete("/track/:track_id", async (req, res) => {
    if (await hasPermission(req.user_id, "manage-album") || await isOwner(req.user_id, req.params.track_id)) {

      track_model.deleteOne({ _id: req.params.track_id }, (err) => { });

      res.code(200).send({
        message: "Track successfully deleted!"
      });
    }
    else
      res.code(401).send({ message: "Missing permission 🔒 Or requested resource does not exist 🔍" });
  })
  app.get("/tracks/:album_id", async (req, res) => {
    if (req.is_auth) {
      res.code(200).send(await track_model.find({ album_id: req.params.album_id }).exec());
    }
    else
      res.code(401).send({ message: "No logged user 🔒" });
  });

  // REVIEW
  app.post("/review", async (req, res) => {
    if (req.is_auth) {
      req.body.user_id = req.user_id;

      const found = await review_model.findOneAndReplace({ track_id: req.body.track_id, user_id: req.user_id }, req.body);
      if (found == null) {
        const review = new review_model(req.body);
        review.save().then((response) => {
          res.code(201).send({
            message: "Review successfully created!",
            result: response
          });
        }).catch(error => {
          res.code(500).send({
            error: error
          });
        });
      }
    }
    else
      res.code(401).send({ message: "No logged user 🔒" });
  });
  app.get("/reviews/album/:album_id", async (req, res) => {
    if (req.is_auth) {
      res.code(200).send(await review_model.find({ album_id: req.params.album_id }).exec());
    }
    else
      res.code(401).send({ message: "No logged user 🔒" });
  });
  app.get("/reviews/user/:user_id", async (req, res) => {
    if (req.is_auth) {
      res.code(200).send(await review_model.find({ user_id: req.params.user_id }).exec());
    }
    else
      res.code(401).send({ message: "No logged user 🔒" });
  });

  // USER
  app.post("/register", async (req, res) => {
    if (await hasPermission(req.user_id, "manage-users")) {
      bcrypt.hash(req.body.password, 10).then((hash) => {
        const user = new user_model({
          name: req.body.name,
          password: hash
        });
        user.save().then((response) => {
          res.code(201).send({
            message: "User successfully created!",
            result: response
          });
        }).catch(error => {
          res.code(500).send({
            error: error
          });
        });
      });
    }
    else
      res.code(401).send({ message: "Missing permission 🔒" });
  });
  app.post("/login", (req, res) => {
    let user_found;
    user_model.findOne({
      name: req.body.name
    }).then(user => {
      if (!user) {
        return res.code(200).send({
          error: "Authentication failed"
        });
      }
      user_found = user;
      return bcrypt.compare(req.body.password, user.password);
    }).then(is_valid => {
      if (!is_valid) {
        return res.code(200).send({
          error: "Authentication failed"
        });
      }
      let jwtToken = jwt.sign({
        user_id: user_found._id
      }, process.env.SECRET, {
        expiresIn: "6h"
      });
      delete user_found._doc.password;
      res.code(200).send({
        token: jwtToken,
        expiresIn: "6h",
        user: user_found
      });
    }).catch(err => {
      return res.code(500).send({
        message: "Authentication failed"
      });
    });
  });
  app.get("/users", async (req, res) => {
    if (await hasPermission(req.user_id, "manage-users")) {
      user_model.find({}, 'name permissions', (error, user) => {
        if (error) {
          res.code(500).send({
            error: error
          });
        } else {
          res.code(200).send(user)
        }
      })
    }
    else
      res.code(401).send({ message: "Missing permission 🔒" });
  })
  app.get("/user/:user_id", (req, res) => {
    user_model.findById(req.params.user_id, 'name', (error, user) => {
      if (error) {
        res.code(500).send({
          error: error
        });
      } else {
        res.code(200).send(user)
      }
    })
  });
  app.post("/user/permissions/:user_id", async (req, res) => {
    if (await hasPermission(req.user_id, "manage-users")) {
      const update = req.body;
      await user_model.findOneAndUpdate({ '_id': req.params.user_id }, update)

      const updated_user = await user_model.findOne({ '_id': req.params.user_id })
      res.code(200).send(updated_user);
    }
    else
      res.code(401).send({ message: "Missing permission 🔒" });
  })

  async function hasPermission(user_id, permission) {
    if (!user_id) return undefined
    let rep;
    await user_model.findById(user_id, 'permissions', (error, user) => {
      if (error || user == null) {
        rep = undefined;
      } else {
        rep = user.permissions.includes(permission);
      }
    });
    return rep;
  };
  async function isOwner(user_id, object_id) {
    let rep;
    rep = await album_model.findOne({ user_id: user_id, _id: object_id }).exec();
    rep = rep ? rep : await review_model.findOne({ user_id: user_id, _id: object_id }).exec();

    if (!rep) {
      var track = await track_model.findOne({ _id: object_id }).exec();
      rep = await album_model.findOne({ user_id: user_id, _id: track.album_id }).exec();
    }

    return rep
  };
}