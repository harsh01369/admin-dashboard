import axios from 'axios';

const API_URL = 'https://ecommerce-backend-gpta.onrender.com/api/admin';
const ORDERS_URL = 'https://ecommerce-backend-gpta.onrender.com/api/orders';

export const getDashboardMetrics = () => {
    return axios.get(`${API_URL}/metrics`, { withCredentials: true })
        .catch(err => {
            console.error('getDashboardMetrics error:', {
                status: err.response?.status,
                data: err.response?.data,
                message: err.message,
                stack: err.stack
            });
            throw err;
        });
};

export const getRecentOrders = () => {
    return axios.get(`${API_URL}/recent-orders`, { withCredentials: true })
        .catch(err => {
            console.error('getRecentOrders error:', {
                status: err.response?.status,
                data: err.response?.data,
                message: err.message,
                stack: err.stack
            });
            throw err;
        });
};

export const getRecentUsers = () => {
    return axios.get(`${API_URL}/recent-users`, { withCredentials: true })
        .catch(err => {
            console.error('getRecentUsers error:', {
                status: err.response?.status,
                data: err.response?.data,
                message: err.message,
                stack: err.stack
            });
            throw err;
        });
};

export const getLowStockProducts = () => {
    return axios.get(`${API_URL}/low-stock`, { withCredentials: true })
        .catch(err => {
            console.error('getLowStockProducts error:', {
                status: err.response?.status,
                data: err.response?.data,
                message: err.message,
                stack: err.stack
            });
            throw err;
        });
};

export const getCompletedOrders = () => {
    return axios.get(`${ORDERS_URL}`, { withCredentials: true, params: { isPaid: true } })
        .catch(err => {
            console.error('getCompletedOrders error:', {
                status: err.response?.status,
                data: err.response?.data,
                message: err.message,
                stack: err.stack
            });
            throw err;
        });
};