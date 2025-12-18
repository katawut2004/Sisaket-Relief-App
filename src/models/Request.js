import mongoose from 'mongoose';

const RequestSchema = new mongoose.Schema({
  centerId: { type: Number, required: true }, // ID ศูนย์อพยพ
  centerName: { type: String, required: true }, // ชื่อศูนย์ (Mock)
  items: [{
    itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item' },
    itemName: String,
    quantity: Number
  }],
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'], 
    default: 'pending' 
  },
  requestDate: { type: Date, default: Date.now }
});

export default mongoose.models.Request || mongoose.model('Request', RequestSchema);