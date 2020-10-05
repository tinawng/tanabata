import admin from 'firebase-admin';
import fs from 'fs';

export default async function (app, opts) {

    var serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: "gs://" + serviceAccount.project_id + ".appspot.com"
    });

    var bucket = admin.storage().bucket();

    app.post("/uploadlocal", async (req, res) => {
        if (req.headers.secret === process.env.SECRET) {
            await bucket.upload(req.body.path);
            if (req.body.cleanup)
                fs.unlinkSync(req.body.path);
            res.code(200).send();
        }
        else
            res.code(401).send();

    });

    app.post("/delete", async (req, res) => {
        if (req.headers.secret === process.env.SECRET) {
            const file_name = extractFileName(req.body.path)
            await bucket.file(file_name).delete();
            res.code(200).send();
        }
        else
            res.code(401).send();
    })

    app.post("/makepublic", async (req, res) => {
        if (req.headers.secret === process.env.SECRET) {
            const file = bucket.file(req.body.path)
            file.makePublic(function (err, api_res) {
                res.code(200).send("https://www.googleapis.com/download/storage/v1/b/" + serviceAccount.project_id + ".appspot.com/o/" + api_res.object + "?generation=" + api_res.generation + "&alt=media");
            });
        }
        else
            res.code(401).send();
    })

    function extractFileName(url) {
        let str = url.split(".appspot.com/o/")[1]
        str = str.split("?generation")[0]
        return str
    }
}