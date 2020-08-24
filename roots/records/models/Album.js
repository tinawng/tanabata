// https://mongoosejs.com/docs/guide.html

import mongoose from 'mongoose';
import unique_validator from 'mongoose-unique-validator';
import { db_records } from '../../../mongo.js';

const Schema = mongoose.Schema;

let album_schema = new Schema({
  title: {
    type: String,
    unique: true
  },
  tracks: Array,
  description: { type: String, default: "" },
  author: { type: String, default: "Various artists" },
  date: { type: Date, default: Date.now },
  icon: { type: String, default: "music-circle-outline"},
  is_hidden: { type: Boolean, default: false },
},
  {
    collection: 'albums'
  }
)
album_schema.plugin(unique_validator, { message: 'Title already in use.' });

export default db_records.model('Album', album_schema);