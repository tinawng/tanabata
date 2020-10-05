// https://mongoosejs.com/docs/connections.html#multiple_connections

import dotenv from 'dotenv';
dotenv.config(); // preload env vars

import mongoose from 'mongoose';
mongoose.set('useNewUrlParser', true);      // deprecation warning
mongoose.set('useUnifiedTopology', true);   // deprecation warning
mongoose.set('useCreateIndex', true);       // deprecation warning
mongoose.set('useFindAndModify', false);    // deprecation warning
mongoose.set('returnOriginal', false);

const db_garden = mongoose.createConnection('mongodb://' + process.env.MONGODB_HOST + '/garden');
const db_records = mongoose.createConnection('mongodb://' + process.env.MONGODB_HOST + '/records');
const db_logs = mongoose.createConnection('mongodb://' + process.env.MONGODB_HOST + '/logs');

export { db_garden, db_records, db_logs };