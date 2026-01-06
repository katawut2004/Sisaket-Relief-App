import { connectToDatabase as dbConnect } from '@/lib/db';
import Item from '@/models/Item';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    await dbConnect();
    const items = await Item.find({}).sort({ lastUpdated: -1 });
    return NextResponse.json(items);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await dbConnect();
    const body = await req.json();
    
    // ตรวจสอบข้อมูลก่อนบันทึก
    if (!body.name || !body.quantity || !body.unit) {
      return NextResponse.json({ error: 'กรุณากรอกข้อมูลให้ครบถ้วน' }, { status: 400 });
    }

    const newItem = await Item.create(body);
    return NextResponse.json(newItem, { status: 201 });
  } catch (error) {
    console.error("Database Error:", error); // ดู Error ใน Terminal ของ VS Code
    return NextResponse.json({ error: error.message || 'Failed to create item' }, { status: 500 });
  }
}