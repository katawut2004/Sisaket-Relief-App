import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db'; // แก้ path ให้ถูกต้อง
import Request from '@/models/Request';
import Item from '@/models/Item'; // เพิ่ม: เพื่อให้ตัดสต็อกได้เมื่ออนุมัติ

// ฟังก์ชันสำหรับ อนุมัติ (Approve) หรือ ปฏิเสธ (Reject)
export async function PUT(req, { params }) {
  await connectToDatabase();
  const { id } = params;

  try {
    const body = await req.json();
    const { status } = body; // status จะส่งมาเป็น 'approved' หรือ 'rejected'

    // 1. ค้นหาคำร้องนี้ก่อน
    const request = await Request.findById(id);

    if (!request) {
      return NextResponse.json({ error: 'ไม่พบคำร้องนี้' }, { status: 404 });
    }

    // 2. ถ้าเลือก "อนุมัติ" (approved) -> ให้ไปตัดจำนวนของในคลัง (Items)
    if (status === 'approved' && request.status !== 'approved') {
      // วนลูปสินค้าทุกชิ้นในใบคำร้อง เพื่อไปลบจำนวนออก
      for (const item of request.items) {
        if (item.itemId) {
          // ค้นหาสินค้าและลดจำนวนลง ($inc: { quantity: -จำนวน })
          await Item.findByIdAndUpdate(item.itemId, { 
            $inc: { quantity: -item.quantity } 
          });
        }
      }
    }

    // 3. อัปเดตสถานะของคำร้อง
    request.status = status;
    await request.save();

    return NextResponse.json({ message: 'อัปเดตสถานะเรียบร้อย', request });

  } catch (error) {
    console.error("Update Request Error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด: " + error.message }, { status: 500 });
  }
}

// ฟังก์ชันสำหรับ ลบคำร้อง (Delete)
export async function DELETE(req, { params }) {
  await connectToDatabase();
  const { id } = params;

  try {
    const deletedRequest = await Request.findByIdAndDelete(id);
    if (!deletedRequest) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลที่ต้องการลบ' }, { status: 404 });
    }
    return NextResponse.json({ message: 'ลบข้อมูลสำเร็จ' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}