import React, { useState, useEffect } from 'react';
import { Route, Routes, Link, useNavigate } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import Products from '../components/Products';
import Orders from '../components/Orders';
import Users from '../components/Users';
import Sales from '../components/Sales';
import Navbar from '../components/Navbar';
import { getDashboardMetrics, getRecentOrders, getRecentUsers, getLowStockProducts, getCompletedOrders } from '../services/adminService';
import axios from 'axios';
import '../styles/AdminPage.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const AdminPage = ({ setAdminAuthenticated }) => {
    const [metrics, setMetrics] = useState({ totalUsers: 0, totalOrders: 0, totalSales: 0, newUsers: 0 });
    const [recentOrders, setRecentOrders] = useState([]);
    const [recentUsers, setRecentUsers] = useState([]);
    const [lowStockProducts, setLowStockProducts] = useState([]);
    const [salesData, setSalesData] = useState({ labels: [], datasets: [] });
    const [showChart, setShowChart] = useState(localStorage.getItem('showChart') !== 'false');
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [taskForm, setTaskForm] = useState({ name: '', description: '', dueDate: '' });
    const [tasks, setTasks] = useState([]);
    const navigate = useNavigate();

    const formatPrice = (price) => price.toLocaleString('en-GB', { style: 'currency', currency: 'GBP' });
    const formatDate = (date) => new Date(date).toLocaleDateString('en-GB');

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setIsLoading(true);
                const [metricsRes, ordersRes, usersRes, lowStockRes, completedOrdersRes] = await Promise.all([
                    getDashboardMetrics(),
                    getRecentOrders(),
                    getRecentUsers(),
                    getLowStockProducts(),
                    getCompletedOrders(),
                ]);

                const completedOrders = completedOrdersRes.data || [];
                const totalSales = completedOrders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);

                const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
                const dailySales = {};
                completedOrders.forEach(order => {
                    const date = new Date(order.createdAt).toLocaleDateString('en-GB');
                    if (new Date(order.createdAt) >= thirtyDaysAgo) {
                        dailySales[date] = (dailySales[date] || 0) + (order.totalPrice || 0);
                    }
                });
                const labels = Object.keys(dailySales).sort((a, b) => new Date(a.split('/').reverse().join('-')) - new Date(b.split('/').reverse().join('-')));
                const amounts = labels.map(date => dailySales[date]);

                setMetrics({
                    totalUsers: metricsRes.data.totalUsers || 0,
                    totalOrders: metricsRes.data.totalOrders || 0,
                    totalSales,
                    newUsers: metricsRes.data.newUsers || 0,
                });
                setRecentOrders(ordersRes.data || []);
                setRecentUsers(usersRes.data || []);
                setLowStockProducts(lowStockRes.data || []);

                setSalesData({
                    labels,
                    datasets: [{
                        label: 'Daily Sales (GBP)',
                        data: amounts,
                        borderColor: '#007bff',
                        backgroundColor: 'rgba(0, 123, 255, 0.3)',
                        fill: true,
                        tension: 0.4,
                    }],
                });

                console.log('Dashboard data fetched:', {
                    metrics: { totalUsers: metricsRes.data.totalUsers, totalOrders: metricsRes.data.totalOrders, totalSales, newUsers: metricsRes.data.newUsers },
                    orders: ordersRes.data.length,
                    users: usersRes.data.length,
                    completedOrders: completedOrders.length,
                });
                setError(null);
            } catch (err) {
                console.error('Fetch dashboard error:', err.response?.data || err.message);
                if (err.response?.status === 401) {
                    setAdminAuthenticated(false);
                    navigate('/login');
                }
                setError('Failed to load dashboard data. Please try again.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchDashboardData();
    }, [navigate, setAdminAuthenticated]);

    const handleLogout = async () => {
        try {
            await axios.post('https://ecommerce-backend.onrender.com/api/admin/logout', {}, { withCredentials: true });
            setAdminAuthenticated(false);
            navigate('/login');
        } catch (error) {
            console.error('Logout error:', error.response?.data || error.message);
            alert('Logout failed');
        }
    };

    const toggleChart = () => {
        setShowChart(!showChart);
        localStorage.setItem('showChart', !showChart);
    };

    const handleTaskSubmit = (e) => {
        e.preventDefault();
        if (taskForm.name && taskForm.dueDate) {
            setTasks([...tasks, { ...taskForm, id: Date.now() }]);
            setTaskForm({ name: '', description: '', dueDate: '' });
            setShowTaskModal(false);
        }
    };

    return (
        <div className="admin-page">
            <Navbar />
            <div className="admin-container">
                <div className="logout-section">
                    <button className="action-button" onClick={handleLogout}>Logout</button>
                </div>
                <Routes>
                    <Route path="/" element={
                        <>
                            {isLoading ? (
                                <div className="loading-spinner">Loading Dashboard...</div>
                            ) : (
                                <>
                                    <h1>UWEAR Admin Dashboard</h1>
                                    {error && <p className="error">{error}</p>}

                                    {/* Section 1: Metrics */}
                                    <div className="metrics-section">
                                        <h2>Key Metrics</h2>
                                        <div className="metrics-grid">
                                            <div className="metric-card">
                                                <h3>Total Users</h3>
                                                <p>{metrics.totalUsers}</p>
                                            </div>
                                            <div className="metric-card">
                                                <h3>Total Orders</h3>
                                                <p>{metrics.totalOrders}</p>
                                            </div>
                                            <div className="metric-card">
                                                <h3>Total Sales</h3>
                                                <p>{formatPrice(metrics.totalSales)}</p>
                                            </div>
                                            <div className="metric-card">
                                                <h3>New Users (7d)</h3>
                                                <p>{metrics.newUsers}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Section 2: Sales Chart */}
                                    <div className="chart-section">
                                        <h2>Sales Trend (Last 30 Days)
                                            <button className="action-button" onClick={toggleChart}>
                                                {showChart ? 'Hide Chart' : 'Show Chart'}
                                            </button>
                                        </h2>
                                        {showChart && (
                                            <div className="chart-container">
                                                <Line data={salesData} options={{
                                                    responsive: true,
                                                    plugins: {
                                                        legend: { position: 'top' },
                                                        title: { display: true, text: 'Daily Sales', font: { size: 18 } },
                                                    },
                                                    scales: {
                                                        y: {
                                                            beginAtZero: true,
                                                            title: { display: true, text: 'Sales (GBP)' },
                                                            ticks: {
                                                                callback: (value) => formatPrice(value).replace('GBP', '£')
                                                            }
                                                        },
                                                        x: { title: { display: true, text: 'Date' } },
                                                    },
                                                }} />
                                            </div>
                                        )}
                                    </div>

                                    {/* Section 3: Recent Activity */}
                                    <div className="activity-section">
                                        <h2>Recent Activity</h2>
                                        <div className="activity-grid">
                                            <div className="activity-card">
                                                <h3>Recent Orders</h3>
                                                {recentOrders.length === 0 ? (
                                                    <p>No recent orders.</p>
                                                ) : (
                                                    <table className="admin-table">
                                                        <thead>
                                                            <tr>
                                                                <th>Order ID</th>
                                                                <th>Customer</th>
                                                                <th>Total</th>
                                                                <th>Status</th>
                                                                <th>Date</th>
                                                                <th>Action</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {recentOrders.map(order => (
                                                                <tr key={order._id}>
                                                                    <td>{order._id.slice(-6)}</td>
                                                                    <td>{order.user?.email || 'N/A'}</td>
                                                                    <td>{formatPrice(order.totalPrice)}</td>
                                                                    <td>{order.status || (order.isPaid ? 'Paid' : 'Pending')}</td>
                                                                    <td>{formatDate(order.createdAt)}</td>
                                                                    <td>
                                                                        <Link to="/orders" className="action-button">View</Link>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                )}
                                            </div>
                                            <div className="activity-card">
                                                <h3>Recent Users</h3>
                                                {recentUsers.length === 0 ? (
                                                    <p>No recent users.</p>
                                                ) : (
                                                    <table className="admin-table">
                                                        <thead>
                                                            <tr>
                                                                <th>Name</th>
                                                                <th>Email</th>
                                                                <th>Joined</th>
                                                                <th>Action</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {recentUsers.map(user => (
                                                                <tr key={user._id}>
                                                                    <td>{user.firstName} {user.lastName}</td>
                                                                    <td>{user.email}</td>
                                                                    <td>{formatDate(user.createdAt)}</td>
                                                                    <td>
                                                                        <Link to="/users" className="action-button">View</Link>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Section 4: Quick Actions & Tasks */}
                                    <div className="actions-tasks-section">
                                        <h2>Quick Actions & Tasks</h2>
                                        <div className="actions-tasks-grid">
                                            <div className="actions-card">
                                                <h3>Quick Actions</h3>
                                                <div className="actions-grid">
                                                    <Link to="/products" className="action-button">Add Product</Link>
                                                    <Link to="/users" className="action-button">Manage Users</Link>
                                                    <Link to="/orders" className="action-button">View Orders</Link>
                                                    <Link to="/sales" className="action-button">Sales Reports</Link>
                                                </div>
                                            </div>
                                            <div className="tasks-card">
                                                <h3>Tasks</h3>
                                                <button className="action-button" onClick={() => setShowTaskModal(true)}>Add Task</button>
                                                {tasks.length === 0 ? (
                                                    <p>No tasks assigned.</p>
                                                ) : (
                                                    <ul className="tasks-list">
                                                        {tasks.map(task => (
                                                            <li key={task.id} className="task">
                                                                <div>
                                                                    <strong>{task.name}</strong>
                                                                    <p>{task.description}</p>
                                                                    <p>Due: {formatDate(task.dueDate)}</p>
                                                                </div>
                                                                <button className="action-button delete-button" onClick={() => setTasks(tasks.filter(t => t.id !== task.id))}>Delete</button>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Task Modal */}
                                    {showTaskModal && (
                                        <div className="modal">
                                            <div className="modal-content">
                                                <h2>Add New Task</h2>
                                                <form onSubmit={handleTaskSubmit}>
                                                    <div className="form-group">
                                                        <label>Task Name</label>
                                                        <input
                                                            type="text"
                                                            value={taskForm.name}
                                                            onChange={(e) => setTaskForm({ ...taskForm, name: e.target.value })}
                                                            required
                                                        />
                                                    </div>
                                                    <div className="form-group">
                                                        <label>Description</label>
                                                        <textarea
                                                            value={taskForm.description}
                                                            onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                                                            rows="4"
                                                        />
                                                    </div>
                                                    <div className="form-group">
                                                        <label>Due Date</label>
                                                        <input
                                                            type="date"
                                                            value={taskForm.dueDate}
                                                            onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                                                            required
                                                        />
                                                    </div>
                                                    <div className="modal-buttons">
                                                        <button type="submit" className="action-button">Save Task</button>
                                                        <button type="button" className="action-button delete-button" onClick={() => setShowTaskModal(false)}>Cancel</button>
                                                    </div>
                                                </form>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </>
                    } />
                    <Route path="products" element={<Products />} />
                    <Route path="users" element={<Users />} />
                    <Route path="orders" element={<Orders />} />
                    <Route path="sales" element={<Sales />} />
                </Routes>
            </div>
        </div>
    );
};

export default AdminPage;