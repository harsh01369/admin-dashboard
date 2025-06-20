import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getOrders, cancelOrder, markOrderDelivered, moveOrdersToSales } from '../services/orderService';
import PrintOrder from './PrintOrder';
import '../styles/Orders.css';

// Add a sound file (e.g., 'notification.mp3') to your public folder
const notificationSound = new Audio('/notification.mp3'); // Ensure this file exists

const Orders = () => {
    const [orders, setOrders] = useState([]);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedOrders, setSelectedOrders] = useState([]);
    const [showNotification, setShowNotification] = useState(false);
    const navigate = useNavigate();
    const previousOrderCount = useRef(0);

    const formatPrice = (price) => price.toLocaleString('en-GB', { style: 'currency', currency: 'GBP' });

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                setIsLoading(true);
                const response = await getOrders();
                console.log('Orders fetched:', response.data);
                const currentOrders = response.data || [];
                setOrders(currentOrders);
                setError(null);

                // Check for new orders and trigger notification
                const newOrderCount = currentOrders.filter(order => !order.isDelivered && !order.isMovedToSales).length;
                if (newOrderCount > previousOrderCount.current && newOrderCount > 0) {
                    notificationSound.play().catch(err => console.error('Sound playback failed:', err));
                    setShowNotification(true);
                }
                previousOrderCount.current = newOrderCount;
            } catch (err) {
                console.error('Fetch orders error:', err.response?.data || err.message);
                setError('Failed to fetch orders. Please try again.');
                if (err.response?.status === 401 || err.response?.status === 403) {
                    navigate('/login');
                }
            } finally {
                setIsLoading(false);
            }
        };

        fetchOrders();
        const intervalId = setInterval(fetchOrders, 5000); // Poll every 5 seconds

        return () => clearInterval(intervalId); // Cleanup on unmount
    }, [navigate]);

    const handleCancelOrder = async (orderId) => {
        if (window.confirm('Are you sure you want to cancel this order?')) {
            try {
                await cancelOrder(orderId);
                setOrders(orders.filter((order) => order._id !== orderId));
                setError(null);
                setSuccess('Order cancelled successfully.');
            } catch (err) {
                console.error('Cancel order error:', err.response?.data || err.message);
                setError('Failed to cancel order. Please try again.');
            }
        }
    };

    const handlePrintAll = async () => {
        try {
            const printWindow = window.open('', '_blank');
            printWindow.document.write(`
                <html>
                    <head>
                        <title>Delivery Orders</title>
                        <style>
                            body { font-family: Arial, sans-serif; padding: 20px; margin: 0; }
                            .order-container { margin-bottom: 30px; border: 1px solid #ccc; padding: 15px; page-break-after: always; }
                            .order-container:last-child { page-break-after: auto; }
                            .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; }
                            .shipping-address { width: 50%; }
                            .shipping-address p { margin: 5px 0; font-weight: bold; font-size: 16px; }
                            .order-info { text-align: right; }
                            .order-info p { margin: 5px 0; font-size: 12px; }
                            .underline { border-bottom: 1px solid #000; margin-bottom: 10px; }
                            .customer-details p { margin: 5px 0; font-size: 14px; }
                            .thin-line { border-top: 1px solid #000; margin: 15px 0; }
                            .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                            .items-table th, .items-table td { border: 1px solid #000; padding: 8px; text-align: left; }
                            .items-table th { background-color: #f2f2f2; font-weight: bold; }
                            .totals { text-align: right; }
                            .totals p { margin: 5px 0; font-weight: bold; }
                            .footer p { margin: 5px 0; font-size: 14px; }
                            @page { margin: 2cm; size: A4; }
                        </style>
                    </head>
                    <body>
                        ${sortedNewOrders.map(ord => `
                            <div class="order-container">
                                <div class="header">
                                    <div class="shipping-address">
                                        <p><strong>Shipping Address:</strong></p>
                                        <p>${ord.shippingAddress?.street || 'N/A'}</p>
                                        <p>${ord.shippingAddress?.city || ''}, ${ord.shippingAddress?.postalCode || ''}</p>
                                        <p>${ord.shippingAddress?.country || ''} (${ord.shippingAddress?.type || 'N/A'})</p>
                                    </div>
                                    <div class="order-info">
                                        <p>Order #${ord._id}</p>
                                        <p>Date: ${new Date(ord.createdAt).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <div class="underline"></div>
                                <div class="customer-details">
                                    <p><strong>Customer:</strong> ${ord.customerDetails?.firstName || ''} ${ord.customerDetails?.lastName || ''}</p>
                                    <p><strong>Email:</strong> ${ord.customerDetails?.email || 'N/A'}</p>
                                </div>
                                <div class="thin-line"></div>
                                <table class="items-table">
                                    <thead>
                                        <tr>
                                            <th>Serial Number</th>
                                            <th>Item</th>
                                            <th>Size</th>
                                            <th>Quantity</th>
                                            <th>Price</th>
                                            <th>Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${ord.orderItems.map(item => `
                                            <tr>
                                                <td>${item.serialNumber || 'N/A'}</td>
                                                <td>${item.name}</td>
                                                <td>${item.size}</td>
                                                <td>${item.quantity}</td>
                                                <td>${formatPrice(item.price)}</td>
                                                <td>${formatPrice(item.quantity * item.price)}</td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                                <div class="totals">
                                    <p>Items Price: ${formatPrice(ord.itemsPrice)}</p>
                                    <p>Shipping Price: ${formatPrice(ord.shippingPrice)}</p>
                                    <p>Total Price: ${formatPrice(ord.totalPrice)}</p>
                                </div>
                                <div class="footer">
                                    <p><strong>Delivery Service:</strong> ${ord.shippingMethod}</p>
                                    <p><strong>UWEAR</strong></p>
                                    <p>Jay Maa Building, Droylsden, Manchester, M43 7DJ</p>
                                </div>
                            </div>
                        `).join('')}
                    </body>
                </html>
            `);
            printWindow.document.close();
            printWindow.print();

            await Promise.all(
                sortedNewOrders.map(async (order) => {
                    await markOrderDelivered(order._id);
                })
            );
            const response = await getOrders();
            setOrders(response.data || []);
            setSuccess('All orders printed and marked as delivered.');
        } catch (err) {
            console.error('Print all orders error:', err.response?.data || err.message);
            setError('Failed to process orders. Please try again.');
        }
    };

    const handleSelectOrder = (orderId) => {
        setSelectedOrders((prev) =>
            prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]
        );
    };

    const handleMoveSelectedToSales = async () => {
        if (selectedOrders.length === 0) {
            setError('Please select at least one order to move.');
            return;
        }
        if (window.confirm('Are you sure you want to move selected orders to Sales and Performance?')) {
            try {
                console.log('Moving selected orders:', selectedOrders);
                const response = await moveOrdersToSales(selectedOrders);
                console.log('Raw move selected response:', response);
                const responseData = response.data;
                console.log('Move selected response data:', responseData);
                if (!responseData || typeof responseData.modifiedCount === 'undefined') {
                    throw new Error('Invalid response from server');
                }
                if (responseData.modifiedCount === 0) {
                    setError('No orders were moved. Ensure selected orders are delivered.');
                } else {
                    setSuccess(`${responseData.modifiedCount} orders moved to Sales.`);
                }
                const updatedOrders = await getOrders();
                console.log('Updated orders after move:', updatedOrders.data);
                setOrders(updatedOrders.data || []);
                setSelectedOrders([]);
                setError(null);
            } catch (err) {
                console.error('Move selected orders error:', {
                    message: err.message,
                    response: err.response?.data,
                    stack: err.stack
                });
                setError(err.response?.data?.message || 'Failed to move orders. Please try again.');
            }
        }
    };

    const handleMoveAllToSales = async () => {
        if (completedOrders.length === 0) {
            setError('No completed orders to move.');
            return;
        }
        if (window.confirm('Are you sure you want to move all completed orders to Sales and Performance?')) {
            try {
                const completedOrderIds = completedOrders.map((order) => order._id);
                console.log('Moving all orders:', completedOrderIds);
                const response = await moveOrdersToSales(completedOrderIds);
                console.log('Raw move all response:', response);
                const responseData = response.data;
                console.log('Move all response data:', responseData);
                if (!responseData || typeof responseData.modifiedCount === 'undefined') {
                    throw new Error('Invalid response from server');
                }
                if (responseData.modifiedCount === 0) {
                    setError('No orders were moved. Ensure completed orders are delivered.');
                } else {
                    setSuccess(`${responseData.modifiedCount} orders moved to Sales.`);
                }
                const updatedOrders = await getOrders();
                console.log('Updated orders after move:', updatedOrders.data);
                setOrders(updatedOrders.data || []);
                setSelectedOrders([]);
                setError(null);
            } catch (err) {
                console.error('Move all orders error:', {
                    message: err.message,
                    response: err.response?.data,
                    stack: err.stack
                });
                setError(err.response?.data?.message || 'Failed to move orders. Please try again.');
            }
        }
    };

    const newOrders = orders.filter((order) => !order.isDelivered && !order.isMovedToSales);
    const completedOrders = orders.filter((order) => order.isDelivered && !order.isMovedToSales);

    // Sort new orders: multi-item orders first, then single-item orders grouped by serial number
    const sortedNewOrders = [...newOrders].sort((a, b) => {
        // Count unique serial numbers to determine multi-item orders
        const aSerials = [...new Set(a.orderItems.map(item => item.serialNumber || 'N/A'))];
        const bSerials = [...new Set(b.orderItems.map(item => item.serialNumber || 'N/A'))];
        const aIsMulti = aSerials.length > 1;
        const bIsMulti = bSerials.length > 1;

        // Multi-item orders come first, sorted by createdAt (newest first)
        if (aIsMulti && !bIsMulti) return -1;
        if (!aIsMulti && bIsMulti) return 1;
        if (aIsMulti && bIsMulti) {
            return new Date(b.createdAt) - new Date(a.createdAt);
        }

        // For single-item orders, group by serial number
        const aSerial = aSerials[0] || 'N/A';
        const bSerial = bSerials[0] || 'N/A';
        if (aSerial === bSerial) {
            // Within same serial number, sort by createdAt (newest first)
            return new Date(b.createdAt) - new Date(a.createdAt);
        }
        // Sort groups alphabetically by serial number
        return aSerial.localeCompare(bSerial);
    });

    // Log sorted orders for debugging
    console.log('Sorted New Orders:', sortedNewOrders.map(order => ({
        _id: order._id,
        createdAt: order.createdAt,
        serialNumbers: [...new Set(order.orderItems.map(item => item.serialNumber || 'N/A'))],
        items: order.orderItems.map(item => ({
            serialNumber: item.serialNumber,
            name: item.name,
            quantity: item.quantity
        }))
    }));

    return (
        <div className="orders-container">
            <h1>Orders</h1>
            {isLoading && <p>Loading orders...</p>}
            {error && <p className="error">{error}</p>}
            {success && <p className="success">{success}</p>}

            {/* Notification Popup */}
            {showNotification && (
                <div className="notification-popup">
                    <div className="notification-content">
                        <h3>New Order Received!</h3>
                        <p>A new order has been added. Please check the list below.</p>
                        <button onClick={() => setShowNotification(false)}>Close</button>
                    </div>
                </div>
            )}

            <h2>New Orders</h2>
            {newOrders.length > 0 && (
                <button className="print-all-button" onClick={handlePrintAll}>
                    Print All Orders
                </button>
            )}
            {newOrders.length === 0 && !isLoading ? (
                <p>No new orders.</p>
            ) : (
                <table className="orders-table">
                    <thead>
                        <tr>
                            <th>Order ID</th>
                            <th>Customer</th>
                            <th>Items</th>
                            <th>Total</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedNewOrders.map((order) => (
                            <tr key={order._id}>
                                <td>{order._id}</td>
                                <td>
                                    {order.customerDetails?.firstName} {order.customerDetails?.lastName}
                                    <br />
                                    {order.customerDetails?.email}
                                </td>
                                <td>
                                    {order.orderItems.map((item, index) => (
                                        <div key={index}>
                                            {item.name} (x{item.quantity}, Size: {item.size})
                                        </div>
                                    ))}
                                </td>
                                <td>{formatPrice(order.totalPrice)}</td>
                                <td>
                                    {order.stripeSessionId ? 'Confirmed' : 'Not Confirmed'},{' '}
                                    {order.isDelivered ? 'Delivered' : 'Not Delivered'}
                                </td>
                                <td>
                                    <PrintOrder
                                        order={order}
                                        onPrint={() =>
                                            markOrderDelivered(order._id).then(() =>
                                                getOrders().then((res) => setOrders(res.data || []))
                                            )
                                        }
                                    />
                                    <button
                                        className="cancel-button"
                                        onClick={() => handleCancelOrder(order._id)}
                                        disabled={order.stripeSessionId}
                                    >
                                        Cancel
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            <h2>Completed Orders</h2>
            {completedOrders.length > 0 && (
                <div className="move-buttons">
                    <button className="move-selected-button" onClick={handleMoveSelectedToSales}>
                        Move Selected to Sales
                    </button>
                    <button className="move-all-button" onClick={handleMoveAllToSales}>
                        Move All Completed Orders
                    </button>
                </div>
            )}
            {completedOrders.length === 0 && !isLoading ? (
                <p>No completed orders.</p>
            ) : (
                <table className="orders-table">
                    <thead>
                        <tr>
                            <th>Select</th>
                            <th>Order ID</th>
                            <th>Customer</th>
                            <th>Items</th>
                            <th>Total</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {completedOrders.map((order) => (
                            <tr key={order._id}>
                                <td>
                                    <input
                                        type="checkbox"
                                        checked={selectedOrders.includes(order._id)}
                                        onChange={() => handleSelectOrder(order._id)}
                                    />
                                </td>
                                <td>{order._id}</td>
                                <td>
                                    {order.customerDetails?.firstName} {order.customerDetails?.lastName}
                                    <br />
                                    {order.customerDetails?.email}
                                </td>
                                <td>
                                    {order.orderItems.map((item, index) => (
                                        <div key={index}>
                                            {item.name} (x{item.quantity}, Size: {item.size})
                                        </div>
                                    ))}
                                </td>
                                <td>{formatPrice(order.totalPrice)}</td>
                                <td>
                                    {order.stripeSessionId ? 'Confirmed' : 'Not Confirmed'},{' '}
                                    {order.isDelivered ? 'Delivered' : 'Not Delivered'}
                                </td>
                                <td>
                                    <PrintOrder order={order} />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default Orders;