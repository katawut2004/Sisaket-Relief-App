'use client';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';

export default function UserDashboard() {
  const [items, setItems] = useState([]);
  const [centers, setCenters] = useState([]);
  const [requests, setRequests] = useState([]);
  
  const [selectedItem, setSelectedItem] = useState(null);
  const [centerSearch, setCenterSearch] = useState('');
  const [selectedCenter, setSelectedCenter] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchWrapperRef = useRef(null);

  const [qty, setQty] = useState(1);
  const [role, setRole] = useState(null); 
  const [activeCategory, setActiveCategory] = useState('all'); 

  const categories = [
    { id: 'all', label: 'ทั้งหมด', icon: 'fa-layer-group', color: 'btn-dark' },
    { id: 'consumables', label: 'อาหาร/ยา', icon: 'fa-utensils', color: 'btn-success' },
    { id: 'personal', label: 'ของใช้ส่วนตัว', icon: 'fa-pump-soap', color: 'btn-info' },
    { id: 'bedding', label: 'เครื่องนอน', icon: 'fa-bed', color: 'btn-warning' },
    { id: 'kids', label: 'แม่และเด็ก', icon: 'fa-baby', color: 'btn-danger' },
  ];

  const fetchData = async () => {
    try {
        const resItems = await fetch('/api/items');
        if(resItems.ok) setItems(await resItems.json());

        const resReqs = await fetch('/api/requests');
        if(resReqs.ok) setRequests(await resReqs.json());
    } catch (err) {
        console.error("Error loading data", err);
    }
  };

  useEffect(() => {
    const userRole = localStorage.getItem('userRole');
    setRole(userRole);
    fetchData();
    
    // โหลดข้อมูลศูนย์
    const loadCenters = async () => {
      try {
        const res = await fetch('/api/centers');
        if (res.ok) {
          const data = await res.json();
          setCenters(Array.isArray(data) ? data : []);
        }
      } catch (e) {
        setCenters([]); 
      }
    };
    loadCenters();

    const handleClickOutside = (event) => {
        if (searchWrapperRef.current && !searchWrapperRef.current.contains(event.target)) {
            setShowSuggestions(false);
        }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleRequest = async () => {
    if(!selectedCenter || !selectedItem) return;

    try {
        const payload = {
            centerId: String(selectedCenter._id), 
            centerName: selectedCenter.name,
            items: [{
                itemId: String(selectedItem._id),
                itemName: selectedItem.name,
                quantity: Number(qty)
            }],
            status: 'pending'
        };

        const res = await fetch('/api/requests', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
    
        if (res.ok) {
          alert('✅ ส่งคำร้องเรียบร้อย!');
          setQty(1);
          setCenterSearch('');
          setSelectedCenter(null);
          
          // ปิด Modal
          const modalBackdrop = document.querySelector('.modal-backdrop');
          if(modalBackdrop) modalBackdrop.remove();
          document.body.classList.remove('modal-open');
          document.body.style = '';

          fetchData(); 
          window.location.reload(); 
        } else {
          const text = await res.text();
          alert(`❌ บันทึกไม่สำเร็จ: ${text}`);
        }
    } catch (e) {
        alert(`❌ เชื่อมต่อไม่ได้: ${e.message}`);
    }
  };

  // กรองรายชื่อศูนย์
  const filteredCenters = centers.filter(c => 
    c.name && c.name.toLowerCase().includes((centerSearch || '').toLowerCase())
  ).slice(0, 10);

  // กรองรายการสินค้า (จุดที่แก้บั๊ก)
  const filteredItems = Object.values(
    (activeCategory === 'all' ? items : items.filter(item => item.category === activeCategory))
    .reduce((acc, item) => {
      // ✅ แก้ไข: เพิ่ม (item.name || '') เพื่อป้องกัน Error ถ้่าชื่อเป็น null
      const normalizedName = (item.name || '').trim(); 
      
      if (!normalizedName) return acc; // ถ้าไม่มีชื่อ ข้ามไปเลย

      if (acc[normalizedName]) {
        acc[normalizedName].quantity += Number(item.quantity);
        if (acc[normalizedName].quantity <= 0 && item.quantity > 0) acc[normalizedName]._id = item._id;
      } else {
        acc[normalizedName] = { ...item, quantity: Number(item.quantity) };
      }
      return acc;
    }, {})
  );

  return (
    <div className="container-fluid py-4" style={{backgroundColor: '#f4f6f9', minHeight: '100vh'}}>
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark mb-4 rounded shadow-sm px-3">
        <div className="container-fluid px-0">
            <a className="navbar-brand d-flex align-items-center" href="#">
                <img src="/logo.png" alt="Logo" width="45" height="45" className="d-inline-block align-text-top me-2 rounded-circle border border-2 border-white" />
                <span>ศรีสะเกษพร้อม</span>
            </a>
            <div className="ms-auto">
                {!role ? (
                      <Link href="/login" className="btn btn-primary btn-sm px-3 rounded-pill">
                        <i className="fas fa-sign-in-alt me-1"></i> เข้าสู่ระบบ
                      </Link>
                ) : (
                      <div className="d-flex gap-2">
                         {role === 'admin' && (
                             <Link href="/admin" className="btn btn-warning btn-sm rounded-pill"><i className="fas fa-cog me-1"></i>Admin</Link>
                         )}
                         <button onClick={() => {localStorage.clear(); window.location.reload()}} className="btn btn-outline-danger btn-sm rounded-pill">ออกจากระบบ</button>
                      </div>
                )}
            </div>
        </div>
      </nav>

      <div className="row mb-4 g-3">
        <div className="col-md-4">
          <div className="card text-white border-0 shadow-sm h-100" style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}}>
            <div className="card-body d-flex justify-content-between align-items-center">
              <div><h6 className="card-subtitle mb-1 text-white-50">ศูนย์อพยพ</h6><h2 className="card-title mb-0 fw-bold">{centers.length} <small className="fs-6 fw-normal">แห่ง</small></h2></div>
              <i className="fas fa-home fa-2x text-white-50"></i>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card text-white border-0 shadow-sm h-100" style={{background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)'}}>
            <div className="card-body d-flex justify-content-between align-items-center">
              <div><h6 className="card-subtitle mb-1 text-white-50">สินค้าคงคลัง</h6><h2 className="card-title mb-0 fw-bold">{items.reduce((acc, i) => acc + (parseInt(i.quantity) || 0), 0)} <small className="fs-6 fw-normal">ชิ้น</small></h2></div>
              <i className="fas fa-boxes fa-2x text-white-50"></i>
            </div>
          </div>
        </div>
         <div className="col-md-4">
          <div className="card text-white border-0 shadow-sm h-100" style={{background: 'linear-gradient(135deg, #ff9966 0%, #ff5e62 100%)'}}>
            <div className="card-body d-flex justify-content-between align-items-center">
              <div><h6 className="card-subtitle mb-1 text-white-50">คำร้องรออนุมัติ</h6><h2 className="card-title mb-0 fw-bold">{requests.filter(r => r.status === 'pending').length} <small className="fs-6 fw-normal">รายการ</small></h2></div>
              <i className="fas fa-clipboard-check fa-2x text-white-50"></i>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-lg-8 mb-4">
            <div className="d-flex flex-wrap gap-2 mb-4 bg-white p-3 rounded shadow-sm">
                {categories.map((cat) => (
                    <button key={cat.id} onClick={() => setActiveCategory(cat.id)} className={`btn btn-sm rounded-pill px-3 d-flex align-items-center gap-2 ${activeCategory === cat.id ? cat.color + ' text-white shadow' : 'btn-outline-secondary border-0'}`}>
                        <i className={`fas ${cat.icon}`}></i> {cat.label}
                    </button>
                ))}
            </div>

            <div className="row g-3">
                {filteredItems.length === 0 && (
                    <div className="col-12 text-center py-5 text-muted"><i className="fas fa-box-open fa-3x mb-3"></i><p>ไม่มีสินค้าในหมวดหมู่นี้</p></div>
                )}
                {filteredItems.map((item) => (
                <div key={item._id} className="col-md-4 col-sm-6">
                    <div className="card h-100 shadow-sm border-0">
                        <div className="card-body d-flex flex-column">
                            <div className="d-flex justify-content-between mb-2">
                                <span className={`badge ${item.category === 'consumables' ? 'bg-success' : item.category === 'personal' ? 'bg-info text-dark' : item.category === 'bedding' ? 'bg-warning text-dark' : 'bg-danger'} rounded-pill`}>
                                    {categories.find(c => c.id === item.category)?.label || item.category}
                                </span>
                            </div>
                            <h5 className="card-title fw-bold text-dark mb-1">{item.name}</h5>
                            <p className="text-muted small mb-3">คงเหลือปัจจุบัน</p>
                            <div className="d-flex justify-content-between align-items-end mt-auto">
                                <h3 className={`mb-0 fw-bold ${item.quantity > 0 ? 'text-dark' : 'text-danger'}`}>{item.quantity} <small className="fs-6 fw-normal text-muted">{item.unit}</small></h3>
                                {role ? (
                                    <button 
                                        className={`btn btn-sm px-3 rounded-pill ${item.quantity > 0 ? 'btn-primary' : 'btn-secondary disabled'}`}
                                        data-bs-toggle="modal" 
                                        data-bs-target="#requestModal"
                                        onClick={() => {
                                            setSelectedItem(item);
                                            setQty(1);
                                            setCenterSearch(''); 
                                            setSelectedCenter(null);
                                        }}
                                        disabled={item.quantity <= 0}
                                    >
                                        {item.quantity > 0 ? 'เบิกของ' : 'หมด'}
                                    </button>
                                ) : (
                                    <Link href="/login" className="btn btn-sm btn-outline-primary rounded-pill px-3"><i className="fas fa-lock me-1"></i> เข้าสู่ระบบ</Link>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                ))}
            </div>
        </div>

        <div className="col-lg-4">
            <div className="card shadow-sm border-0 mb-3">
                <div className="card-header bg-white py-3"><h6 className="mb-0 fw-bold"><i className="fas fa-history me-2 text-warning"></i>ประวัติการเบิกของล่าสุด</h6></div>
                <div className="list-group list-group-flush">
                    {requests.slice(0, 8).map(req => (
                        <div key={req._id} className="list-group-item px-3 py-3">
                            <div className="d-flex w-100 justify-content-between align-items-center mb-1">
                                <strong className="text-truncate" style={{maxWidth: '180px', fontSize: '0.9rem'}}>{req.centerName}</strong>
                                <span className={`badge rounded-pill ${req.status === 'approved' ? 'bg-success' : req.status === 'rejected' ? 'bg-danger' : 'bg-secondary'}`}>
                                    {req.status === 'pending' ? 'รออนุมัติ' : req.status === 'approved' ? 'อนุมัติแล้ว' : 'ปฏิเสธ'}
                                </span>
                            </div>
                            <div className="small text-muted">{req.items.map((i, idx) => (<span key={idx}>{i.itemName} <b>x{i.quantity}</b> </span>))}</div>
                        </div>
                    ))}
                    {requests.length === 0 && <div className="p-4 text-center text-muted">ยังไม่มีประวัติการเบิกจ่าย</div>}
                </div>
            </div>
        </div>
      </div>

      <div className="modal fade" id="requestModal" tabIndex="-1">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content border-0 shadow-lg">
            <div className="modal-header bg-primary text-white">
              <h5 className="modal-title">เบิกสินค้า: {selectedItem?.name}</h5>
              <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal"></button>
            </div>
            <div className="modal-body p-4">
              
              <div className="mb-3 position-relative" ref={searchWrapperRef}>
                <label className="form-label fw-bold">ระบุศูนย์อพยพปลายทาง</label>
                
                <input 
                    type="text" 
                    className={`form-control form-control-lg ${selectedCenter ? 'is-valid' : ''}`}
                    placeholder="พิมพ์ชื่อศูนย์เพื่อค้นหา..."
                    value={centerSearch}
                    onChange={(e) => {
                        setCenterSearch(e.target.value);
                        setSelectedCenter(null); 
                        setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                />
                
                {showSuggestions && centerSearch && (
                    <div className="list-group position-absolute w-100 shadow-lg" style={{zIndex: 1000, maxHeight: '200px', overflowY: 'auto'}}>
                        {filteredCenters.length > 0 ? (
                            filteredCenters.map(c => (
                                <button 
                                    key={c._id} 
                                    className="list-group-item list-group-item-action"
                                    onClick={() => {
                                        setCenterSearch(c.name); 
                                        setSelectedCenter(c);    
                                        setShowSuggestions(false); 
                                    }}
                                >
                                    {c.name} <small className="text-muted">({c.district})</small>
                                </button>
                            ))
                        ) : (
                            <div className="list-group-item text-muted">ไม่พบศูนย์ที่ค้นหา</div>
                        )}
                    </div>
                )}
                {selectedCenter && <small className="text-success"><i className="fas fa-check-circle"></i> เลือก: {selectedCenter.name}</small>}
              </div>

              <div className="mb-3">
                <label className="form-label fw-bold">ระบุจำนวน ({selectedItem?.unit})</label>
                <div className="d-flex align-items-center gap-2">
                    <button className="btn btn-outline-secondary" onClick={() => setQty(q => Math.max(1, q-1))}><i className="fas fa-minus"></i></button>
                    <input type="number" className="form-control form-control-lg text-center" value={qty} max={selectedItem?.quantity} min={1} onChange={(e) => setQty(Number(e.target.value))} />
                     <button className="btn btn-outline-secondary" onClick={() => setQty(q => Math.min(selectedItem?.quantity || 1, q+1))}><i className="fas fa-plus"></i></button>
                </div>
              </div>
            </div>
            <div className="modal-footer bg-light">
              <button type="button" className="btn btn-link text-muted" data-bs-dismiss="modal">ยกเลิก</button>
              <button 
                type="button" 
                className="btn btn-primary px-4 rounded-pill shadow-sm" 
                onClick={handleRequest} 
                data-bs-dismiss="modal" 
                disabled={!selectedCenter || !selectedItem} 
              >
                ยืนยันการเบิกจ่าย
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}