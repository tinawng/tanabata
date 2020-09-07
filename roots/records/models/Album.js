// https://mongoosejs.com/docs/guide.html

import mongoose from 'mongoose';
import unique_validator from 'mongoose-unique-validator';
import { db_records } from '../../../mongoose.config.js';

const Schema = mongoose.Schema;

let album_schema = new Schema({
  title: { type: String, unique: true, required: true },
  description: { type: String, default: "" },
  user_id: { type: Schema.Types.ObjectId, required: true },
  date: { type: Date, default: Date.now },
  icon: { type: String, default: "music-circle-outline" },
  is_hidden: { type: Boolean, default: false },
  reviewing_mode: { type: String, default: 'star-and-comment' }
},
  {
    collection: 'albums'
  }
)
album_schema.plugin(unique_validator, { message: 'Title already in use.' });

export default db_records.model('Album', album_schema);