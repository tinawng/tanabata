// https://mongoosejs.com/docs/guide.html

import mongoose from 'mongoose';
import unique_validator from 'mongoose-unique-validator';
import { db_records } from '../../../mongoose.config.js';

const Schema = mongoose.Schema;

let group_schema = new Schema({
    name: { type: String, unique: true, required: true },
    permissions: { type: Array, default: [] }
},
    {
        collection: 'groups'
    }
)
group_schema.plugin(unique_validator, { message: 'Name already in use.' });

export default db_records.model('Group', group_schema);