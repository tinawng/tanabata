// https://mongoosejs.com/docs/guide.html

import mongoose from 'mongoose';
import unique_validator from 'mongoose-unique-validator';
import { db_records } from '../../../mongoose.config.js';

const Schema = mongoose.Schema;

let user_schema = new Schema({
  name: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  group_id: { type: Schema.Types.ObjectId, required: true, default: mongoose.Types.ObjectId("5f7253f6fbc2b3da76ab5648") },
},
  {
    collection: 'users'
  }
)
user_schema.plugin(unique_validator, { message: 'Name already in use.' });

export default db_records.model('User', user_schema);