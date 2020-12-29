import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

import user_model from './models/User.js';

export default async function (app, opts) {
  app.post("/login", async (req, res) => {
    let user = null;
    if (req.body.name)
      user = await user_model.findOne({ name: req.body.name});
    if (req.body.email)
      user = await user_model.findOne({ email: req.body.email });

    if (!user || !bcrypt.compareSync(req.body.password, user.password)) return res.code(404).send({ message: "Authentication failed 🔒" });

    const jwt_token = jwt.sign({ user_id: user._id }, process.env.SECRET);

    delete user._doc.password;
    res.code(200).send({ token: jwt_token, user: user });
  })
  app.post("/register", async (req, res) => {
    if (req.user_id === process.env.SECRET) {
      const hash = bcrypt.hashSync(req.body.password, 10);
      const user = new user_model({ ...req.body, password: hash });
      await user.save();
      
      delete user._doc.password;
      res.code(201).send(user);
    }
    else
      res.code(401).send({ message: "Missing permission 🔒" });
  })
}