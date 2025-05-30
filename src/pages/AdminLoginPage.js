import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/AdminLoginPage.css';

const AdminLoginPage = ({ setAdminAuthenticated }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('https://ecommerce-backend.onrender.com/api/admin/login', { username, password }, { withCredentials: true });

            if (response.status === 200) {
                localStorage.setItem('adminToken', response.data.token);
                setAdminAuthenticated(true);
                navigate('/admin');
            }
        } catch (error) {
            alert('Invalid credentials');
        }
    };

    return (
        <div className="admin-login-page">
            <h1>Admin Login</h1>
            <form onSubmit={handleLogin}>
                <div className="form-group">
                    <label htmlFor="username">Username</label>
                    <input type="text" id="username" value={username} onChange={(e) => setUsername(e.target.value)} required />
                </div>
                <div className="form-group">
                    <label htmlFor="password">Password</label>
                    <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                <button type="submit">Login</button>
            </form>
        </div>
    );
};

export default AdminLoginPage;
