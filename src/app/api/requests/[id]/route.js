import dbConnect from '@/lib/db';
import Request from '@/models/Request';
import Item from '@/models/Item';
import { NextResponse } from 'next/server';

export async function PUT(req, { params }) {
  try {
    await dbConnect();

    // --- จุดที่แก้ไขสำหรับ Next.js 15 ---
    // params จำเป็นต้อง await ก่อนเรียกใช้
    const { id } = await params;
    // --------------------------------

    console.log("กำลังดำเนินการกับ Request ID:", id); // เช็คใน Terminal ว่า ID ขึ้นไหม

    const { status } = await req.json(); 

    // 1. ค้นหาคำร้อง
    const request = await Request.findById(id);
    if (!request) {
      console.error(`หา Request ID ${id} ไม่เจอใน Database`);
      return NextResponse.json({ error: 'ไม่พบข้อมูลคำร้องนี้ (ID ผิดพลาดหรือถูกลบ)' }, { status: 404 });
    }

    // 2. ถ้าเป็นการ "อนุมัติ" (Approved) ต้องเช็คของในคลังก่อน
    if (status === 'approved' && request.status !== 'approved') {
      
      for (const reqItem of request.items) {
        const itemInStock = await Item.findById(reqItem.itemId);

        // กรณี: หาของไม่เจอ
        if (!itemInStock) {
           return NextResponse.json({ 
             error: `ไม่พบข้อมูลสินค้า "${reqItem.itemName}" ในระบบ (อาจถูกลบไปแล้ว)` 
           }, { status: 400 });
        }

        // กรณี: ของไม่พอ
        if (itemInStock.quantity < reqItem.quantity) {
          return NextResponse.json({ 
            error: `ไม่สามารถอนุมัติได้: สินค้า "${itemInStock.name}" มีไม่พอ (คงเหลือ ${itemInStock.quantity}, ขอเบิก ${reqItem.quantity})` 
          }, { status: 400 });
        }

        // ตัดสต็อก
        itemInStock.quantity -= reqItem.quantity;
        await itemInStock.save();
      }
    }

    // 3. อัปเดตสถานะ
    request.status = status;
    const updatedRequest = await request.save();

    return NextResponse.json(updatedRequest);

  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: 'Server Error: ' + error.message }, { status: 500 });
  }
}