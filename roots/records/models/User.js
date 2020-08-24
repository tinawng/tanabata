// https://mongoosejs.com/docs/guide.html

import mongoose from 'mongoose';
import unique_validator from 'mongoose-unique-validator';
import { db_records } from '../../../mongo.js';

const Schema = mongoose.Schema;

let user_schema = new Schema({
  name: {
    type: String,
    unique: true
  },
  password: String,
  permissions: { type: Array, default: [] },
},
  {
    collection: 'users'
  }
)
user_schema.plugin(unique_validator, { message: 'Name already in use.' });

export default db_records.model('User', user_schema);