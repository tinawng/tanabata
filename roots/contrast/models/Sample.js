import mongoose from 'mongoose';
import { db_contrast } from '../../../mongoose.config.js';

const Schema = mongoose.Schema;

let sample_schema = new Schema({
  file_url: { type: String, required: true },
  recording_id: { type: Schema.Types.ObjectId, required: true },
  original_file_name: { type: String, required: true },
  is_reference: { type: Boolean, default: false }
},
  {
    collection: 'samples'
  }
)

export default db_contrast.model('Sample', sample_schema);