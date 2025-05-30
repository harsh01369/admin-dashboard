import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/Navbar.css';

const Navbar = () => {
    const navigate = useNavigate();

    const handleLogOff = async () => {
        try {
            await axios.post('http://localhost:5000/api/admin/logout', {}, { withCredentials: true });
            navigate('/login');
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    return (
        <nav className="admin-nav">
            <div className="logo">
                <Link to="/admin">UWEAR</Link>
            </div>
            <div className="nav-links">
                <Link to="/admin/products">Products</Link>
                <Link to="/admin/orders">Orders</Link>
                <Link to="/admin/users">Customers</Link>
                <Link to="/admin/sales">Sales & Performance</Link>
            </div>
            <button className="logoff-button" onClick={handleLogOff}>Log Off</button>
        </nav>
    );
};

export default Navbar;
