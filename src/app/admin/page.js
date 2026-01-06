'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import * as XLSX from 'xlsx'; // เพิ่ม Library สำหรับอ่าน Excel

export default function AdminDashboard() {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [requests, setRequests] = useState([]);
  
  // State สำหรับการ Upload
  const [isUploading, setIsUploading] = useState(false);
  
  // Form State สำหรับเพิ่มของ
  const [newItem, setNewItem] = useState({ 
    name: '', 
    category: 'consumables', 
    quantity: 0, 
    unit: '' 
  });

  useEffect(() => {
    // เช็คสิทธิ์ Admin
    const role = localStorage.getItem('userRole');
    if (role !== 'admin') {
      router.push('/login');
    }
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // ดึงข้อมูลสินค้า
      const resItems = await fetch('/api/items');
      if (resItems.ok) {
        setItems(await resItems.json());
      }

      // ดึงข้อมูลคำร้อง
      const resReqs = await fetch('/api/requests');
      if (resReqs.ok) {
        setRequests(await resReqs.json());
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  // --- ฟังก์ชัน Import Excel ---
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const workbook = XLSX.read(event.target.result, { type: 'binary' });
        const sheetName = workbook.SheetNames[0]; // อ่าน Sheet แรก
        const sheet = workbook.Sheets[sheetName];
        const rawData = XLSX.utils.sheet_to_json(sheet);

        // แปลงหัวข้อภาษาไทย -> Field ใน Database
        const formattedData = rawData.map(row => ({
          name: row['ชื่อสินค้า'],
          category: row['หมวดหมู่'] || 'consumables', // ค่า default
          quantity: row['จำนวน'] || 0,
          unit: row['หน่วย'] || 'หน่วย',
          lastUpdated: new Date()
        }));

        if (formattedData.length === 0) {
            alert('ไม่พบข้อมูลในไฟล์ Excel');
            setIsUploading(false);
            return;
        }

        // ส่งข้อมูลไปยัง API
        const response = await fetch('/api/items/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formattedData),
        });

        if (response.ok) {
          const result = await response.json();
          alert(`✅ นำเข้าข้อมูลสำเร็จ ${result.count} รายการ`);
          fetchData(); // รีโหลดตาราง
          e.target.value = ''; // เคลียร์ช่อง input
        } else {
          alert('❌ เกิดข้อผิดพลาดในการบันทึกข้อมูล');
        }

      } catch (error) {
        console.error(error);
        alert('❌ อ่านไฟล์ Excel ไม่สำเร็จ (ตรวจสอบรูปแบบไฟล์)');
      } finally {
        setIsUploading(false);
      }
    };
    reader.readAsBinaryString(file);
  };
  // ------------------------------------

  // ฟังก์ชันเพิ่มสินค้า (ทีละชิ้น)
  const handleAddItem = async (e) => {
    e.preventDefault();
    
    if(!newItem.name || !newItem.unit || newItem.quantity < 0) {
      alert("กรุณากรอกข้อมูลให้ครบและถูกต้อง");
      return;
    }

    try {
      const res = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'บันทึกไม่สำเร็จ');
      }

      alert('✅ เพิ่มสินค้าเรียบร้อยแล้ว');
      setNewItem({ name: '', category: 'consumables', quantity: 0, unit: '' });
      fetchData();

    } catch (error) {
      alert(`❌ เกิดข้อผิดพลาด: ${error.message}`);
      console.error(error);
    }
  };

  // ฟังก์ชันแก้ไขจำนวนสินค้า
  const handleEditItem = async (item) => {
    const rawValue = prompt(`แก้ไขจำนวนคงเหลือของ "${item.name}"`, item.quantity);
    if (rawValue === null || rawValue.trim() === "") return;
    
    const newQuantity = parseInt(rawValue.replace(/,/g, ''), 10);

    if (isNaN(newQuantity) || newQuantity < 0) {
      alert("กรุณากรอกตัวเลขที่ถูกต้อง (ห้ามติดลบ)");
      return;
    }

    try {
      const res = await fetch(`/api/items/${item._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: newQuantity }),
      });

      if (!res.ok) {
        throw new Error('อัปเดตไม่สำเร็จ');
      }

      alert('✅ อัปเดตยอดคงเหลือเรียบร้อย');
      fetchData();
    } catch (error) {
      alert(`❌ เกิดข้อผิดพลาด: ${error.message}`);
    }
  };

  // --- ส่วนที่แก้ไข: ลบสินค้าแบบแจ้งเตือน Error ---
  const handleDeleteItem = async (id) => {
    if(!confirm('ยืนยันการลบสินค้านี้?')) return;
    try {
      const res = await fetch(`/api/items/${id}`, { method: 'DELETE' });
      
      // เช็คว่า Server ตอบกลับมาว่า OK หรือไม่
      if (!res.ok) {
          const errorData = await res.json();
          // โยน Error ออกไปที่ catch เพื่อแสดง Alert
          throw new Error(errorData.error || 'ลบสินค้าไม่สำเร็จ (Server Error)');
      }

      // ถ้าลบสำเร็จ
      alert('✅ ลบสินค้าเรียบร้อย');
      fetchData(); 
    } catch (error) {
      // แสดงข้อความ Error ที่แท้จริง
      alert(`❌ เกิดข้อผิดพลาด: ${error.message}`);
    }
  };

  // จัดการคำร้อง
  const handleRequestAction = async (id, status) => {
    try {
      const res = await fetch(`/api/requests/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      
      if (!res.ok) {
        const error = await res.json();
        alert(error.error || 'เกิดข้อผิดพลาด');
      } else {
        alert(status === 'approved' ? 'อนุมัติและตัดสต็อกเรียบร้อย' : 'ปฏิเสธคำร้องแล้ว');
        fetchData();
      }
    } catch (error) {
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    }
  };

  return (
    <div className="container-fluid py-4 bg-light min-vh-100">
      <nav className="navbar navbar-dark bg-dark mb-4 px-3 rounded d-flex justify-content-between shadow-sm">
         <span className="navbar-brand mb-0 h1"><img src="/logo.png" alt="Logo" width="40" height="40" className="me-2 rounded-circle border border-white" /><i className="fas fa-user-shield me-2"></i>Admin Dashboard</span>
         <button onClick={() => router.push('/')} className="btn btn-outline-light btn-sm">ไปหน้าบ้าน (User)</button>
      </nav>

      <div className="row">
        {/* ฝั่งซ้าย: จัดการคำร้อง */}
        <div className="col-lg-6 mb-4">
          <div className="card shadow-sm h-100">
            <div className="card-header bg-warning text-dark d-flex justify-content-between align-items-center">
              <h5 className="mb-0"><i className="fas fa-clipboard-list me-2"></i>คำร้องขอเบิกของ</h5>
              <button className="btn btn-sm btn-outline-dark" onClick={fetchData}><i className="fas fa-sync"></i> Refresh</button>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover mb-0 align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>ศูนย์อพยพ</th>
                      <th>รายการ</th>
                      <th>สถานะ</th>
                      <th>จัดการ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map((req) => (
                      <tr key={req._id}>
                        <td className="fw-bold">{req.centerName}</td>
                        <td>
                          {req.items.map((i, idx) => (
                            <div key={idx}><small>• {i.itemName} <span className="text-primary fw-bold">x{i.quantity}</span></small></div>
                          ))}
                        </td>
                        <td>
                          <span className={`badge rounded-pill ${
                            req.status === 'approved' ? 'bg-success' : 
                            req.status === 'rejected' ? 'bg-danger' : 'bg-secondary'
                          }`}>
                            {req.status === 'pending' ? 'รออนุมัติ' : req.status}
                          </span>
                        </td>
                        <td>
                          {req.status === 'pending' && (
                            <div className="d-flex gap-1">
                              <button onClick={() => handleRequestAction(req._id, 'approved')} className="btn btn-sm btn-success" title="อนุมัติ"><i className="fas fa-check"></i></button>
                              <button onClick={() => handleRequestAction(req._id, 'rejected')} className="btn btn-sm btn-outline-danger" title="ปฏิเสธ"><i className="fas fa-times"></i></button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                    {requests.length === 0 && <tr><td colSpan="4" className="text-center py-4 text-muted">ไม่มีคำร้องใหม่</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* ฝั่งขวา: จัดการสินค้าในคลัง */}
        <div className="col-lg-6">
          
          {/* >>> ส่วน Import Excel (เพิ่มใหม่) <<< */}
          <div className="card shadow-sm mb-4 border-success border-top border-4">
            <div className="card-header bg-white">
              <h5 className="mb-0 text-success"><i className="fas fa-file-excel me-2"></i>นำเข้าข้อมูลจาก Excel</h5>
            </div>
            <div className="card-body bg-white">
              <div className="mb-2">
                <input
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                  className="form-control"
                />
              </div>
              <small className="text-muted d-block">
                <i className="fas fa-info-circle me-1"></i>
                ไฟล์ต้องมีหัวตาราง: <b>ชื่อสินค้า, หมวดหมู่, จำนวน, หน่วย</b>
              </small>
              {isUploading && <div className="text-success mt-2 small"><i className="fas fa-spinner fa-spin me-1"></i> กำลังอัปโหลด...</div>}
            </div>
          </div>

          {/* ฟอร์มเพิ่มสินค้า (Manual) */}
          <div className="card shadow-sm mb-4 border-primary border-top border-4">
            <div className="card-header bg-white">
              <h5 className="mb-0 text-primary"><i className="fas fa-plus-circle me-2"></i>เพิ่มสินค้าใหม่ (รายชิ้น)</h5>
            </div>
            <div className="card-body bg-white">
              <form onSubmit={handleAddItem} className="row g-2">
                <div className="col-md-4">
                  <label className="form-label small text-muted">ชื่อสินค้า</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="เช่น ข้าวสาร" 
                    required 
                    value={newItem.name} 
                    onChange={e => setNewItem({...newItem, name: e.target.value})} 
                  />
                </div>
                <div className="col-md-3">
                  <label className="form-label small text-muted">หมวดหมู่</label>
                  <select 
                    className="form-select" 
                    value={newItem.category} 
                    onChange={e => setNewItem({...newItem, category: e.target.value})}
                  >
                    <option value="consumables">อุปโภคบริโภค</option>
                    <option value="personal">ของใช้ส่วนตัว</option>
                    <option value="bedding">เครื่องนอน</option>
                    <option value="kids">ของเด็ก</option>
                  </select>
                </div>
                <div className="col-md-2">
                  <label className="form-label small text-muted">จำนวน</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    placeholder="0" 
                    required 
                    min="0"
                    value={newItem.quantity} 
                    onChange={e => setNewItem({...newItem, quantity: e.target.value})} 
                  />
                </div>
                <div className="col-md-2">
                   <label className="form-label small text-muted">หน่วย</label>
                   <input 
                    type="text" 
                    className="form-control" 
                    placeholder="เช่น ถุง" 
                    required 
                    value={newItem.unit} 
                    onChange={e => setNewItem({...newItem, unit: e.target.value})} 
                   />
                </div>
                <div className="col-md-1 d-flex align-items-end">
                  <button type="submit" className="btn btn-primary w-100"><i className="fas fa-save"></i></button>
                </div>
              </form>
            </div>
          </div>

          {/* ตารางสินค้า */}
          <div className="card shadow-sm">
            <div className="card-header bg-white d-flex justify-content-between align-items-center">
              <h5 className="mb-0"><i className="fas fa-boxes me-2"></i>รายการสินค้าคงเหลือ ({items.length})</h5>
            </div>
            <div className="table-responsive" style={{maxHeight: '500px'}}>
              <table className="table table-striped table-hover mb-0 align-middle">
                <thead className="table-light sticky-top">
                  <tr>
                    <th>ชื่อสินค้า</th>
                    <th>หมวด</th>
                    <th>คงเหลือ</th>
                    <th className="text-end">จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item._id}>
                      <td>{item.name}</td>
                      <td>
                        <span className="badge bg-light text-dark border">
                          {item.category === 'consumables' ? 'อุปโภคบริโภค' :
                           item.category === 'personal' ? 'ของใช้ส่วนตัว' :
                           item.category === 'bedding' ? 'เครื่องนอน' : 'ของเด็ก'}
                        </span>
                      </td>
                      <td>
                        <span className={item.quantity === 0 ? 'text-danger fw-bold' : 'fw-bold text-success'}>
                          {Number(item.quantity).toLocaleString()}
                        </span> 
                        <span className="small text-muted ms-1">{item.unit}</span>
                      </td>
                      <td className="text-end">
                        <button 
                          onClick={() => handleEditItem(item)} 
                          className="btn btn-sm btn-outline-warning border-0 me-1" 
                          title="แก้ไขจำนวน"
                        >
                          <i className="fas fa-pen"></i>
                        </button>
                        <button 
                          onClick={() => handleDeleteItem(item._id)} 
                          className="btn btn-sm btn-outline-danger border-0"
                          title="ลบ"
                        >
                          <i className="fas fa-trash-alt"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {items.length === 0 && <tr><td colSpan="4" className="text-center py-4 text-muted">ยังไม่มีสินค้าในคลัง</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}