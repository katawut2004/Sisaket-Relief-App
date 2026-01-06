import { connectToDatabase } from '@/lib/db'; // แก้ตรงนี้: ใส่ปีกกา {}
import Item from '@/models/Item';
import { NextResponse } from 'next/server';

// ฟังก์ชันสำหรับแก้ไขข้อมูล (PUT)
export async function PUT(req, { params }) {
  try {
    const { id } = params;
    const body = await req.json();

    await connectToDatabase();

    // ค้นหาและอัปเดต
    const updatedItem = await Item.findByIdAndUpdate(id, body, { new: true });

    if (!updatedItem) {
      return NextResponse.json({ error: 'ไม่พบสินค้า' }, { status: 404 });
    }

    return NextResponse.json(updatedItem);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'แก้ไขข้อมูลไม่สำเร็จ' }, { status: 500 });
  }
}

// ฟังก์ชันสำหรับลบข้อมูล (DELETE)
export async function DELETE(req, { params }) {
  try {
    const { id } = params;

    await connectToDatabase();

    // ค้นหาและลบ
    const deletedItem = await Item.findByIdAndDelete(id);

    if (!deletedItem) {
      return NextResponse.json({ error: 'ไม่พบสินค้าที่จะลบ' }, { status: 404 });
    }

    return NextResponse.json({ message: 'ลบสำเร็จ' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'ลบข้อมูลไม่สำเร็จ' }, { status: 500 });
  }
}