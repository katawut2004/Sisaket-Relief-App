import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET() {
  try {
    // อ่านไฟล์จาก src/data/centers.json
    const jsonDirectory = path.join(process.cwd(), 'src', 'data');
    const fileContents = await fs.readFile(jsonDirectory + '/centers.json', 'utf8');
    const jsonData = JSON.parse(fileContents);
    
    // ตรวจสอบโครงสร้างไฟล์ (บางทีมาเป็น Array เลย หรือมาเป็น { data: [...] })
    const data = Array.isArray(jsonData) ? jsonData : (jsonData.data || []);

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error reading centers file:", error);
    // ถ้าหาไฟล์ไม่เจอ ให้ส่ง Array ว่างกลับไป (ไม่เอาข้อมูลจำลองแล้ว)
    return NextResponse.json([]);
  }
}