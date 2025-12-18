import dbConnect from '@/lib/db';
import Item from '@/models/Item';
import { NextResponse } from 'next/server';

export async function PUT(req, { params }) {
  await dbConnect();
  // ต้อง await params ก่อนใช้งาน (แก้ error Next.js ล่าสุด)
  const { id } = await params; 
  const body = await req.json();
  const updatedItem = await Item.findByIdAndUpdate(id, body, { new: true });
  return NextResponse.json(updatedItem);
}

export async function DELETE(req, { params }) {
  await dbConnect();
  // ต้อง await params ก่อนใช้งาน
  const { id } = await params;
  
  // >>> จุดที่แก้ไข: เปลี่ยนจากลบทิ้ง เป็นการอัปเดตสถานะ <<<
  // เปลี่ยน isDeleted เป็น true เพื่อซ่อนสินค้าแทนการลบ
  await Item.findByIdAndUpdate(id, { isDeleted: true });
  
  return NextResponse.json({ message: 'Deleted (Soft Delete)' });
}