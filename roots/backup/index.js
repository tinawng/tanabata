import fs from "fs";
import youtubedl from "youtube-dl";

export default async function (app, opts) {

  app.post("/video", (req, res) => {
    if (req.headers.secret === process.env.SECRET) {
      const { name, url } = req.body;

      youtubedl.exec(url, ['-o', process.env.BACKUP_PATH + name + '.%(ext)s'], {}, (err, output) => {
        if (err) throw err;

        // console.log(output.join('\n'))
      })

      res.send("Video should be downloading 🚚");
    }
    else
        res.code(401).send();
  });

};