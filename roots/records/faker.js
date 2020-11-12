import casual from "casual";


export default async function (app, opts) {

  Array.prototype.random = function () {
    return this[Math.floor((Math.random() * this.length))];
  }

  app.post("/user", async (req, res) => {
    let users = [];
    for (let i = 0; i < req.body.quantity; i++) {
      const user = {
        name: casual.random_element(["Tiaw", "Thao", "Leah", "Freya", "April", "Kabu", "Kiko", "Aja", "Jiro", "Jeong", "Yeon", "Jeju", "Loah", "Thuy", "Latte", "Kew", "Lai"]),
        password: casual.password,
        group_id: "5f7252b9fbc2b3da76ab5645"
      };
      users.push(await (await opts.ky_local.post("records/register", { json: user })).json());
    }
    res.code(201).send(users);
  });

  app.post("/album", async (req, res) => {
    const users = req.body.random_users ? (await (await opts.ky_local.get("records/group/5f7252b9fbc2b3da76ab5645")).json()).users : req.body.user;

    let albums = [];
    for (let i = 0; i < req.body.quantity; i++) {
      const title = casual.title;
      const description = casual.description;
      const as_user = users.random()._id;
      const album = await (await opts.ky_local.post("records/album", { json: { as_user, title, description } })).json();


      if (req.body.random_tracks)
        await opts.ky_local.post("records/faker/track", {
          json: {
            quantity: casual.integer(3, 6),
            album_id: album._id,
            random_reviews: req.body.random_reviews
          }
        });

      albums.push(album);
    }

    res.code(201).send(albums);
  });

  app.post("/track", async (req, res) => {
    let tracks = [];
    for (let i = 0; i < req.body.quantity; i++) {
      const title = casual.title;
      const file_url = "https://s3-us-west-2.amazonaws.com/s.cdpn.io/123941/Yodel_Sound_Effect.mp3";
      const track = await (await opts.ky_local.post("records/track", {
        json: {
          title,
          file_url,
          album_id: req.body.album_id,
          is_reference: i == 0
        }
      })).json();

      if (req.body.random_reviews)
        await opts.ky_local.post("records/faker/review", {
          json: {
            quantity: casual.integer(2, 8),
            track_id: track._id,
            random_users: true
          }
        })

      tracks.push(track)
    }

    res.code(201).send(tracks);
  });

  app.post("/review", async (req, res) => {
    const users = req.body.random_users ? (await (await opts.ky_local.get("records/users")).json()) : req.body.user;

    let reviews = [];
    for (let i = 0; i < req.body.quantity; i++) {

      const as_user = users.random()._id;
      const mode = req.body.review_mode || 'stars-and-comment';
      const content = {}
      if (mode == 'stars-and-comment') {
        content.comment = casual.sentence;
        content.rating = casual.integer(1, 5);
      }
      const date_offset = req.body.random_date ? casual.integer(-3, 4) : 0;
      var date = Date.now() + 86400000*date_offset;
      const review = await (await opts.ky_local.post("records/review", {
        json: {
          as_user,
          track_id: req.body.track_id,
          content,
          date
        }
      })).json();

      reviews.push(review);
    }
    res.code(201).send(reviews);
  });

}