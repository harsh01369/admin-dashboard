import axios from 'axios';

const API_URL = 'https://ecommerce-backend-gpta.onrender.com/api/orders';

const getOrders = async (page = 1, limit = 50) => {
    try {
        console.log('Sending getOrders request to:', `${API_URL}?page=${page}&limit=${limit}`);
        const response = await axios.get(`${API_URL}?page=${page}&limit=${limit}`, { withCredentials: true });
        console.log('getOrders response:', response.data);
        return response;
    } catch (error) {
        console.error('getOrders error:', {
            status: error.response?.status,
            data: error.response?.data,
            message: error.message,
            stack: error.stack
        });
        throw error;
    }
};

const cancelOrder = async (orderId) => {
    try {
        console.log('Sending cancelOrder request for orderId:', orderId);
        const response = await axios.delete(`${API_URL}/${orderId}`, { withCredentials: true });
        console.log('cancelOrder response:', response.data);
        return response;
    } catch (error) {
        console.error('cancelOrder error:', {
            status: error.response?.status,
            data: error.response?.data,
            message: error.message,
            stack: error.stack
        });
        throw error;
    }
};

const markOrderDelivered = async (orderId) => {
    try {
        console.log('Sending markOrderDelivered request for orderId:', orderId);
        const response = await axios.put(`${API_URL}/${orderId}/delivered`, {}, { withCredentials: true });
        console.log('markOrderDelivered response:', response.data);
        return response;
    } catch (error) {
        console.error('markOrderDelivered error:', {
            status: error.response?.status,
            data: error.response?.data,
            message: error.message,
            stack: error.stack
        });
        throw error;
    }
};

const moveOrdersToSales = async (orderIds) => {
    try {
        console.log('Sending moveOrdersToSales request:', { url: `${API_URL}/move-to-sales`, orderIds });
        const response = await axios.put(`${API_URL}/move-to-sales`, { orderIds }, { withCredentials: true });
        console.log('moveOrdersToSales response:', { status: response.status, data: response.data });
        if (!response.data) {
            throw new Error('No data received from server');
        }
        return response;
    } catch (error) {
        console.error('moveOrdersToSales error:', {
            status: error.response?.status,
            data: error.response?.data,
            message: error.message,
            stack: error.stack
        });
        throw error;
    }
};

export { getOrders, cancelOrder, markOrderDelivered, moveOrdersToSales };