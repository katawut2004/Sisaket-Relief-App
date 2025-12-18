import { NextResponse } from 'next/server';

export async function GET() {
  // สร้าง Mock Data 529 ศูนย์
  const centers = Array.from({ length: 529 }, (_, i) => ({
    id: i + 1,
    name: `ศูนย์พักพิงชั่วคราวที่ ${i + 1}`,
    location: 'จ.ศรีสะเกษ',
    population: Math.floor(Math.random() * 200) + 50 // สุ่มจำนวนคนผู้อพยพ
  }));

  return NextResponse.json(centers);
}