'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = (e) => {
    e.preventDefault();
    if (username === 'admin' && password === '123456') {
      localStorage.setItem('userRole', 'admin'); // เก็บสถานะแบบง่าย
      router.push('/admin');
    } else if (username === 'user' && password === '123456') {
      localStorage.setItem('userRole', 'user');
      router.push('/');
    } else {
      setError('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
    }
  };

  return (
    <div className="d-flex align-items-center justify-content-center vh-100 bg-dark">
      <div className="card p-4 shadow-lg" style={{ width: '400px', backgroundColor: '#1e293b', color: 'white' }}>
        <h3 className="text-center mb-4">เข้าสู่ระบบ Sisaket EMS</h3>
        {error && <div className="alert alert-danger">{error}</div>}
        <form onSubmit={handleLogin}>
          <div className="mb-3">
            <label>Username</label>
            <input 
              type="text" 
              className="form-control" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required 
            />
          </div>
          <div className="mb-3">
            <label>Password</label>
            <input 
              type="password" 
              className="form-control" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
          </div>
          <button type="submit" className="btn btn-primary w-100">เข้าสู่ระบบ</button>
        </form>
      </div>
    </div>
  );
}