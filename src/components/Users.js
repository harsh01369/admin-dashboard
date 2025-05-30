import React, { useState, useEffect } from 'react';
import { getAllUsers, deleteUserById } from '../services/userService';
import '../styles/Users.css';

const Users = () => {
    const [users, setUsers] = useState([]);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const formatPrice = (price) => price.toLocaleString('en-GB', { style: 'currency', currency: 'GBP' });

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                setIsLoading(true);
                const response = await getAllUsers();
                console.log('Users fetched:', response.data);
                setUsers(response.data || []);
                setError(null);
            } catch (err) {
                console.error('Fetch users error:', err.response?.data || err.message);
                setError('Failed to fetch users. Please try again.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchUsers();
    }, []);

    // Delete user
    const handleDeleteUser = async (userId) => {
        if (!window.confirm('Are you sure you want to delete this user?')) return;
        try {
            await deleteUserById(userId);
            setUsers(users.filter(user => user._id !== userId));
            console.log('Deleted user:', userId);
        } catch (err) {
            console.error('Delete user error:', err.response?.data || err.message);
            setError('Failed to delete user.');
        }
    };

    // Aggregate top products in carts
    const getTopCartProducts = () => {
        const productMap = {};
        users.forEach(user => {
            user.cart.forEach(item => {
                const key = `${item.product}|${item.name}`;
                if (!productMap[key]) {
                    productMap[key] = {
                        name: item.name,
                        timesAdded: 0,
                        totalQuantity: 0,
                    };
                }
                productMap[key].timesAdded += 1;
                productMap[key].totalQuantity += item.quantity;
            });
        });
        const topProducts = Object.values(productMap)
            .sort((a, b) => b.timesAdded - a.timesAdded || b.totalQuantity - a.totalQuantity)
            .slice(0, 30);
        console.log('Top cart products:', topProducts);
        return topProducts;
    };

    // Aggregate top products in wishlists
    const getTopWishlistProducts = () => {
        const productMap = {};
        users.forEach(user => {
            user.wishlist.forEach(item => {
                const key = `${item.product}|${item.name}`;
                if (!productMap[key]) {
                    productMap[key] = {
                        name: item.name,
                        timesAdded: 0,
                    };
                }
                productMap[key].timesAdded += 1;
            });
        });
        const topProducts = Object.values(productMap)
            .sort((a, b) => b.timesAdded - a.timesAdded)
            .slice(0, 30);
        console.log('Top wishlist products:', topProducts);
        return topProducts;
    };

    const topCartProducts = getTopCartProducts();
    const topWishlistProducts = getTopWishlistProducts();

    return (
        <div className="users-container">
            <h1>User Management</h1>
            {isLoading && <p>Loading users...</p>}
            {error && <p className="error">{error}</p>}

            {/* Users List */}
            <div className="users-section">
                <h2>Users</h2>
                {users.length === 0 && !isLoading ? (
                    <p>No users found.</p>
                ) : (
                    <table className="users-table">
                        <thead>
                            <tr>
                                <th>First Name</th>
                                <th>Last Name</th>
                                <th>Email</th>
                                <th>Phone</th>
                                <th>Newsletter</th>
                                <th>Email Offers</th>
                                <th>Phone Offers</th>
                                <th>Is Admin</th>
                                <th>Total Orders</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => (
                                <tr key={user._id}>
                                    <td>{user.firstName}</td>
                                    <td>{user.lastName}</td>
                                    <td>{user.email}</td>
                                    <td>{user.phone || 'N/A'}</td>
                                    <td>{user.newsletter ? 'Yes' : 'No'}</td>
                                    <td>{user.emailOffers ? 'Yes' : 'No'}</td>
                                    <td>{user.phoneOffers ? 'Yes' : 'No'}</td>
                                    <td>{user.isAdmin ? 'Yes' : 'No'}</td>
                                    <td>{user.totalOrders || 0}</td>
                                    <td>
                                        <button
                                            className="action-button delete-button"
                                            onClick={() => handleDeleteUser(user._id)}
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* User Carts */}
            <div className="users-section">
                <h2>User Carts</h2>
                {users.every(user => user.cart.length === 0) ? (
                    <p>No items in any user carts.</p>
                ) : (
                    users.map(user => (
                        user.cart.length > 0 && (
                            <div key={user._id} className="user-cart-section">
                                <h3>{user.firstName} {user.lastName} ({user.email})</h3>
                                <table className="users-table">
                                    <thead>
                                        <tr>
                                            <th>Product Name</th>
                                            <th>Quantity</th>
                                            <th>Size</th>
                                            <th>Price</th>
                                            <th>Image</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {user.cart.map((item, index) => (
                                            <tr key={index}>
                                                <td>{item.name}</td>
                                                <td>{item.quantity}</td>
                                                <td>{item.size}</td>
                                                <td>{formatPrice(item.price)}</td>
                                                <td>
                                                    <img
                                                        src={item.image}
                                                        alt={item.name}
                                                        style={{ width: '50px', height: 'auto' }}
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )
                    ))
                )}
            </div>

            {/* User Wishlists */}
            <div className="users-section">
                <h2>User Wishlists</h2>
                {users.every(user => user.wishlist.length === 0) ? (
                    <p>No items in any user wishlists.</p>
                ) : (
                    users.map(user => (
                        user.wishlist.length > 0 && (
                            <div key={user._id} className="user-wishlist-section">
                                <h3>{user.firstName} {user.lastName} ({user.email})</h3>
                                <table className="users-table">
                                    <thead>
                                        <tr>
                                            <th>Product Name</th>
                                            <th>Price</th>
                                            <th>Image</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {user.wishlist.map((item, index) => (
                                            <tr key={index}>
                                                <td>{item.name}</td>
                                                <td>{formatPrice(item.price)}</td>
                                                <td>
                                                    <img
                                                        src={item.image}
                                                        alt={item.name}
                                                        style={{ width: '50px', height: 'auto' }}
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )
                    ))
                )}
            </div>

            {/* Top Products in Carts */}
            <div className="users-section">
                <h2>Top 30 Products in Carts</h2>
                {topCartProducts.length === 0 ? (
                    <p>No products in carts.</p>
                ) : (
                    <table className="users-table">
                        <thead>
                            <tr>
                                <th>Product Name</th>
                                <th>Times Added</th>
                                <th>Total Quantity</th>
                            </tr>
                        </thead>
                        <tbody>
                            {topCartProducts.map((product, index) => (
                                <tr key={index}>
                                    <td>{product.name}</td>
                                    <td>{product.timesAdded}</td>
                                    <td>{product.totalQuantity}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Top Products in Wishlists */}
            <div className="users-section">
                <h2>Top 30 Products in Wishlists</h2>
                {topWishlistProducts.length === 0 ? (
                    <p>No products in wishlists.</p>
                ) : (
                    <table className="users-table">
                        <thead>
                            <tr>
                                <th>Product Name</th>
                                <th>Times Added</th>
                            </tr>
                        </thead>
                        <tbody>
                            {topWishlistProducts.map((product, index) => (
                                <tr key={index}>
                                    <td>{product.name}</td>
                                    <td>{product.timesAdded}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default Users;