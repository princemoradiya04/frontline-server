import { Schema, model } from 'mongoose';

// Define the schema
const formSchema = new Schema({
  // Header fields
  areticalNo: { type: String, required: true },
  name: { type: String, required: true },
  date: { type: String, required: true },

  warpDetails: { type: Array, required: true },
  weftDetails: { type: Array, required: true },

  // Mill Details
  dyingMillName: { type: String, default: "" },
  fabricsShortage: { type: String, default: "" },
  barcode: { type: String, required: true },
  weftRate: { type: String },
  warpRate: { type: String }
}, { timestamps: true });

// Create the model
const FormModel = model('Form', formSchema);

export default FormModel;