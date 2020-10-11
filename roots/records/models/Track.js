// https://mongoosejs.com/docs/guide.html

import mongoose from 'mongoose';
import { db_records } from '../../../mongoose.config.js';

const Schema = mongoose.Schema;

let track_schema = new Schema({
  title: { type: String, required: true },
  file_url: { type: String, required: true },
  album_id: { type: Schema.Types.ObjectId, required: true },
  is_reference: { type: Boolean, default: false }
},
  {
    collection: 'tracks'
  }
)

export default db_records.model('Track', track_schema);