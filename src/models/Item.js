import mongoose from 'mongoose';

const ItemSchema = new mongoose.Schema({
  name: { type: String, required: true }, // ชื่อของ (เช่น ข้าวสาร, นมผง)
  category: { 
    type: String, 
    required: true,
    enum: ['consumables', 'personal', 'bedding', 'kids'] // 4 หมวดหมู่ที่คุณระบุ
  },
  quantity: { type: Number, required: true, default: 0 }, // จำนวนคงเหลือ
  unit: { type: String, required: true }, // หน่วย (ถุง, แพ็ค, ขวด)
  lastUpdated: { type: Date, default: Date.now }
});

export default mongoose.models.Item || mongoose.model('Item', ItemSchema);