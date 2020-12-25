import fs from "fs";
import youtubedl from "youtube-dl";

export default async function (app, opts) {

  app.post("/video", (req, res) => {
    const { name, url } = req.body;

    youtubedl.exec(url, ['-o', '/mnt/raid/videos/p0/needbackup/' + name + '.%(ext)s'], {}, (err, output) => {
      if (err) throw err;
      
      // console.log(output.join('\n'))
    })

    res.send("Video should be downloading 🚚");
  });

};