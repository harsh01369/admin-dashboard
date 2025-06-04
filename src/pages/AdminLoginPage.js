import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AdminLoginPage = ({ setAdminAuthenticated }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

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
            alert('Invalid credentials or session error');
        }
    };

    return (
        <div>
            <h2>Admin Login</h2>
            <form onSubmit={handleLogin}>
                <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Username"
                />
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                />
                <button type="submit">Login</button>
            </form>
        </div>
    );
};

export default AdminLoginPage;