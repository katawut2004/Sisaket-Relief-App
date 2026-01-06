import mongoose from 'mongoose';

const RequestSchema = new mongoose.Schema({
  // เปลี่ยนเป็น String เพื่อรองรับ ID จากไฟล์ JSON
  centerId: {
    type: String, 
    required: true,
  },
  centerName: {
    type: String,
    required: true,
  },
  items: [
    {
      // เปลี่ยน itemId เป็น String ด้วย เผื่อสินค้ายังเป็น Mock Data (id=1) จะได้ไม่ Error
      itemId: { type: String, required: true }, 
      itemName: String,
      quantity: Number,
    },
  ],
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.Request || mongoose.model('Request', RequestSchema);