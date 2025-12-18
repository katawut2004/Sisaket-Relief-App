import './globals.css'
import Head from 'next/head'

export const metadata = {
  title: 'ศรีสะเกษพร้อม - ระบบบริหารจัดการสินค้าบริจาค',
  description: 'ระบบจัดสรรสินค้าคงคลังช่วยเหลือผู้อพยพ',
}

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <head>
        {/* Bootstrap 5 CSS */}
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet" />
        {/* Font Awesome สำหรับไอคอน */}
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" />
      </head>
      <body style={{ backgroundColor: '#f4f6f9' }}>
        {children}
        {/* Bootstrap 5 JS Bundle */}
        <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js" async></script>
      </body>
    </html>
  )
}