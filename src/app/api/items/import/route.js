import { connectToDatabase as dbConnect } from '@/lib/db';
import Item from '@/models/Item';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    await dbConnect(); // เชื่อมต่อฐานข้อมูล
    const items = await req.json(); // รับข้อมูล JSON ที่ส่งมาจากหน้าบ้าน

    // 1. ตรวจสอบว่ามีข้อมูลส่งมาไหม
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลรายการ หรือรูปแบบข้อมูลไม่ถูกต้อง' }, { status: 400 });
    }

    // 2. วนลูปเพื่อ Update หรือ Insert (Upsert)
    // การใช้ bulkWrite จะเร็วกว่าการวนลูป insert ทีละอัน
    const operations = items.map(item => ({
      updateOne: {
        filter: { name: item.name }, // เช็คจากชื่อสินค้า
        update: { 
          $set: { 
            category: item.category,
            unit: item.unit,
            lastUpdated: new Date()
          },
          $inc: { quantity: item.quantity } // บวกจำนวนเพิ่มเข้าไปจากของเดิม (ถ้าอยากให้ทับค่าเดิมให้เปลี่ยน $inc เป็น $set)
        },
        upsert: true // ถ้าไม่มีชื่อนี้ให้สร้างใหม่
      }
    }));

    const result = await Item.bulkWrite(operations);

    return NextResponse.json({ 
      message: 'Import สำเร็จ', 
      count: result.upsertedCount + result.modifiedCount 
    });

  } catch (error) {
    console.error('Import Error:', error);
    return NextResponse.json({ error: `เกิดข้อผิดพลาด: ${error.message}` }, { status: 500 });
  }
}