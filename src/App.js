import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import axios from 'axios';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminPage from './pages/AdminPage';
import Products from './components/Products';
import Orders from './components/Orders';
import Users from './components/Users';
import Sales from './components/Sales';
import PrintOrder from './components/PrintOrder';

function App() {
    const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const response = await axios.get('http://localhost:5000/api/admin/checkAuth', { withCredentials: true });
                if (response.status === 200 && response.data.isAdmin) {
                    setIsAdminAuthenticated(true);
                } else {
                    setIsAdminAuthenticated(false);
                }
            } catch (error) {
                setIsAdminAuthenticated(false);
            } finally {
                setIsLoading(false);
            }
        };
        checkAuth();
    }, []);

    const handleLogin = () => {
        setIsAdminAuthenticated(true);
    };

    const handleLogout = async () => {
        try {
            await axios.post('http://localhost:5000/api/admin/logout', {}, { withCredentials: true });
            setIsAdminAuthenticated(false);
            localStorage.removeItem('adminToken');
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    if (isLoading) return <div>Loading...</div>;

    return (
        <Router>
            <div className="App">
                <main className="App-main">
                    <Routes>
                        <Route path="/login" element={<AdminLoginPage setAdminAuthenticated={handleLogin} />} />
                        <Route path="/admin/*" element={
                            isAdminAuthenticated ? <AdminPage setAdminAuthenticated={handleLogout} /> : <Navigate to="/login" />
                        } />
                        <Route path="/products" element={isAdminAuthenticated ? <Products /> : <Navigate to="/login" />} />
                        <Route path="/orders" element={isAdminAuthenticated ? <Orders /> : <Navigate to="/login" />} />
                        <Route path="/users" element={isAdminAuthenticated ? <Users /> : <Navigate to="/login" />} />
                        <Route path="/sales" element={isAdminAuthenticated ? <Sales /> : <Navigate to="/login" />} />
                        <Route path="/print-order/:orderId" element={isAdminAuthenticated ? <PrintOrder /> : <Navigate to="/login" />} />
                        <Route path="/" element={<Navigate to="/login" />} />
                    </Routes>
                </main>
            </div>
        </Router>
    );
}

export default App;