import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/LoginPage.css';

const AdminLoginPage = ({ setAdminAuthenticated }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const response = await axios.get('https://ecommerce-backend-gpta.onrender.com/api/admin/checkAuth', {
                    withCredentials: true,
                });
                if (response.data.isAdmin) {
                    setAdminAuthenticated(true);
                    navigate('/admin');
                }
            } catch (error) {
                console.log('Not authenticated:', error.message);
            }
        };
        checkAuth();
    }, [navigate, setAdminAuthenticated]);

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post(
                'https://ecommerce-backend-gpta.onrender.com/api/admin/login',
                { username: 'Admin', password: 'Jaymaa1' }, // Replace with actual password
                { withCredentials: true }
            );
            if (response.status === 200 && response.data.isAdmin) {
                setAdminAuthenticated(true);
                navigate('/admin');
            } else {
                alert('Login failed');
            }
        } catch (error) {
            console.error('Login error:', error.response?.data || error.message);
            alert('Invalid credentials');
        }
    };

    return (
        <div className="admin-login-page">
            <h1>Admin Login</h1>
            <form onSubmit={handleLogin}>
                <div className="form-group">
                    <label htmlFor="username">Username</label>
                    <input
                        type="text"
                        id="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="password">Password</label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                <button type="submit">Login</button>
            </form>
        </div>
    );
};

export default AdminLoginPage;