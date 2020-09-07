// https://mongoosejs.com/docs/guide.html

import mongoose from 'mongoose';
import { db_logs } from '../../mongoose.config.js';

const Schema = mongoose.Schema;

let log_schema = new Schema({
  date: { type: Date, default: Date.now },
  method: String,
  url: String,
  params: Schema.Types.Mixed,
  ip: String,
  user_id: String,
  status_code: Number,
  request_body_size: Number,
  response_body_size: Number,
},
  {
    collection: 'records'
  }
)

export default db_logs.model('Log', log_schema);