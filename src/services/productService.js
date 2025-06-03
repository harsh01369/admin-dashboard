import axios from 'axios';

const API_URL = 'https://ecommerce-backend-gpta.onrender.com/api/products';

const getAdminProducts = async () => {
    try {
        const response = await axios.get(`${API_URL}/admin`, { withCredentials: true });
        console.log('getAdminProducts response:', response.data);
        return response.data;
    } catch (error) {
        console.error('getAdminProducts error:', {
            status: error.response?.status,
            data: error.response?.data,
            message: error.message,
            stack: error.stack
        });
        throw error;
    }
};

const getPublicProducts = async () => {
    try {
        const response = await axios.get(API_URL);
        console.log('getPublicProducts response:', response.data);
        return response.data;
    } catch (error) {
        console.error('getPublicProducts error:', {
            status: error.response?.status,
            data: error.response?.data,
            message: error.message,
            stack: error.stack
        });
        throw error;
    }
};

const createProduct = async (productData) => {
    try {
        const response = await axios.post(API_URL, productData, {
            withCredentials: true,
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        console.log('createProduct response:', response.data);
        return response.data;
    } catch (error) {
        console.error('createProduct error:', {
            status: error.response?.status,
            data: error.response?.data,
            message: error.message,
            stack: error.stack
        });
        throw error;
    }
};

const updateProduct = async (id, productData) => {
    try {
        const response = await axios.put(`${API_URL}/${id}`, productData, {
            withCredentials: true,
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        console.log('updateProduct response:', response.data);
        return response.data;
    } catch (error) {
        console.error('updateProduct error:', {
            status: error.response?.status,
            data: error.response?.data,
            message: error.message,
            stack: error.stack
        });
        throw error;
    }
};

export { getAdminProducts, getPublicProducts, createProduct, updateProduct };