import mongoose from 'mongoose';

export default function (app) {
    if (!process.env.MONGO_HOST) return;
    mongoose.connect('mongodb://' + process.env.MONGO_HOST + '/garden', { useNewUrlParser: true, useUnifiedTopology: true });

    const db = mongoose.connection;
    db.on('error', console.error.bind(console, 'connection error:'));
    db.once('open', function () {
        // we're connected!
        console.log("CONNECTED!")
    });
}