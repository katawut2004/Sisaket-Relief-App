'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [requests, setRequests] = useState([]);
  
  // Form State สำหรับเพิ่มของ
  const [newItem, setNewItem] = useState({ 
    name: '', 
    category: 'consumables', // ค่าเริ่มต้นให้ตรงกับ enum
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

  // ฟังก์ชันเพิ่มสินค้า
  const handleAddItem = async (e) => {
    e.preventDefault();
    
    // ตรวจสอบค่าว่างเบื้องต้น
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

      // ถ้าสำเร็จ
      alert('✅ เพิ่มสินค้าเรียบร้อยแล้ว');
      setNewItem({ name: '', category: 'consumables', quantity: 0, unit: '' }); // เคลียร์ค่า
      fetchData(); // โหลดตารางใหม่

    } catch (error) {
      alert(`❌ เกิดข้อผิดพลาด: ${error.message}`);
      console.error(error);
    }
  };

  // >>> ฟังก์ชันแก้ไขจำนวนสินค้า (เพิ่มใหม่) <<<
  const handleEditItem = async (item) => {
    // 1. เด้ง Popup ถามจำนวนใหม่
    const rawValue = prompt(`แก้ไขจำนวนคงเหลือของ "${item.name}"`, item.quantity);
    
    // 2. ถ้ากด Cancel หรือไม่กรอกอะไร ให้จบการทำงาน
    if (rawValue === null || rawValue.trim() === "") return;
    
    // 3. แปลงค่าเป็นตัวเลข (รองรับการใส่ลูกน้ำ เช่น 1,000)
    const newQuantity = parseInt(rawValue.replace(/,/g, ''), 10);

    // 4. ตรวจสอบความถูกต้อง
    if (isNaN(newQuantity) || newQuantity < 0) {
      alert("กรุณากรอกตัวเลขที่ถูกต้อง (ห้ามติดลบ)");
      return;
    }

    // 5. ส่ง API ไปอัปเดต
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
      fetchData(); // โหลดตารางใหม่ทันที
    } catch (error) {
      alert(`❌ เกิดข้อผิดพลาด: ${error.message}`);
    }
  };

  // ลบสินค้า
  const handleDeleteItem = async (id) => {
    if(!confirm('ยืนยันการลบสินค้านี้?')) return;
    try {
      await fetch(`/api/items/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (error) {
      alert('ลบสินค้าไม่สำเร็จ');
    }
  };

  // จัดการคำร้อง (อนุมัติ/ปฏิเสธ)
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
          {/* ฟอร์มเพิ่มสินค้า */}
          <div className="card shadow-sm mb-4 border-primary border-top border-4">
            <div className="card-header bg-white">
              <h5 className="mb-0 text-primary"><i className="fas fa-plus-circle me-2"></i>เพิ่มสินค้าใหม่</h5>
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
                        {/* ปุ่มแก้ไข (เพิ่มใหม่) */}
                        <button 
                          onClick={() => handleEditItem(item)} 
                          className="btn btn-sm btn-outline-warning border-0 me-1" 
                          title="แก้ไขจำนวน"
                        >
                          <i className="fas fa-pen"></i>
                        </button>
                        
                        {/* ปุ่มลบ */}
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