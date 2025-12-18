import dbConnect from '@/lib/db'; // ตรวจสอบ path ว่าไฟล์ db หรือ dbConnect อยู่ที่ไหนแน่ (บางทีเป็น @/lib/dbConnect)
import Request from '@/models/Request';
import { NextResponse } from 'next/server';

export async function GET() {
  await dbConnect();
  try {
    // เรียงเอาคำร้องล่าสุดขึ้นก่อน
    const requests = await Request.find({}).sort({ requestDate: -1 });
    return NextResponse.json(requests);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  await dbConnect();
  try {
    const body = await req.json();
    
    // 1. Log ดูข้อมูลที่ส่งเข้ามา (ดูได้ใน Terminal VS Code) ช่วย debug ได้มาก
    console.log("📥 Data received at API:", body);

    // 2. สร้างข้อมูลลง Database
    const newRequest = await Request.create(body);
    
    // 3. ส่งข้อมูลกลับพร้อม status 201 (Created)
    return NextResponse.json(newRequest, { status: 201 });

  } catch (error) {
    // 4. ถ้ามี Error ให้ Log และส่งข้อความกลับไปบอกหน้าบ้าน
    console.error("❌ API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}