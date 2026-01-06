import { NextResponse } from 'next/server';
// *** แก้ไขบรรทัดนี้: เปลี่ยนจาก @/lib/mongodb เป็น @/lib/db และใช้ connectToDatabase ***
import { connectToDatabase } from '@/lib/db'; 
import Request from '@/models/Request';

export async function GET() {
  // *** เรียกใช้ฟังก์ชันให้ถูกชื่อ ***
  await connectToDatabase();
  try {
    const requests = await Request.find({}).sort({ createdAt: -1 });
    return NextResponse.json(requests);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  // *** เรียกใช้ฟังก์ชันให้ถูกชื่อ ***
  await connectToDatabase();
  try {
    const body = await req.json();
    const { centerId, centerName, items } = body;

    // ตรวจสอบข้อมูลเบื้องต้น
    if (!centerId || !centerName || !items || items.length === 0) {
      return NextResponse.json({ error: 'ข้อมูลไม่ครบถ้วน (Missing fields)' }, { status: 400 });
    }

    // สร้าง Request ใหม่ (รองรับ String ID ตามที่คุณต้องการ)
    const newRequest = await Request.create({
      centerId: String(centerId), 
      centerName,
      items: items.map(item => ({
          itemId: String(item.itemId), 
          itemName: item.itemName,
          quantity: Number(item.quantity)
      })),
      status: 'pending'
    });

    return NextResponse.json(newRequest, { status: 201 });
  } catch (error) {
    console.error("Create Request Error:", error);
    return NextResponse.json({ error: "บันทึกไม่สำเร็จ: " + error.message }, { status: 500 });
  }
}