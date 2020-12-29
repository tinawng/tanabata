import mongoose from 'mongoose';
import unique_validator from 'mongoose-unique-validator';
import { db_auth } from '../../../mongoose.config.js';

const Schema = mongoose.Schema;

let user_schema = new Schema({
  name: {
    type: String,
    unique: true
  },
  email: {
    type: String,
    unique: true
  },
  password: String
},
  {
    collection: 'users'
  }
)
user_schema.plugin(unique_validator, { message: 'Already in use.' });

export default db_auth.model('User', user_schema);