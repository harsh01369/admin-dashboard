import axios from 'axios';

const API_URL = 'https://ecommerce-backend-gpta.onrender.com/api/users';

export const getAllUsers = () => {
    return axios.get(API_URL, { withCredentials: true })
        .catch(err => {
            console.error('getAllUsers error:', {
                status: err.response?.status,
                data: err.response?.data,
                message: err.message,
                stack: err.stack
            });
            throw err;
        });
};

export const updateUserById = (id, data) => {
    return axios.put(`${API_URL}/${id}`, data, { withCredentials: true })
        .catch(err => {
            console.error('updateUserById error:', {
                status: err.response?.status,
                data: err.response?.data,
                message: err.message,
                stack: err.stack
            });
            throw err;
        });
};

export const deleteUserById = (id) => {
    return axios.delete(`${API_URL}/${id}`, { withCredentials: true })
        .catch(err => {
            console.error('deleteUserById error:', {
                status: err.response?.status,
                data: err.response?.data,
                message: err.message,
                stack: err.stack
            });
            throw err;
        });
};