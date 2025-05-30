import React, { useState, useEffect } from 'react';
import { getOrders } from '../services/orderService';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval, parseISO, getYear, getMonth } from 'date-fns';
import '../styles/Sales.css';

const Sales = () => {
    const [sales, setSales] = useState([]);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedMonth, setSelectedMonth] = useState('');

    const formatPrice = (price) => price.toLocaleString('en-GB', { style: 'currency', currency: 'GBP' });
    const calculateStripeFee = (totalPrice) => totalPrice * 0.025; // 2.5% fee

    useEffect(() => {
        const fetchSales = async () => {
            try {
                setIsLoading(true);
                const response = await getOrders();
                console.log('Sales fetched:', response.data);
                console.log('Sales state:', response.data.map(order => ({
                    _id: order._id,
                    isDelivered: order.isDelivered,
                    isMovedToSales: order.isMovedToSales,
                    createdAt: order.createdAt,
                    orderItems: order.orderItems.map(item => ({
                        serialNumber: item.serialNumber,
                        name: item.name,
                        size: item.size,
                        quantity: item.quantity,
                        price: item.price,
                    })),
                })));
                setSales(response.data || []);
                setError(null);
            } catch (err) {
                console.error('Fetch sales error:', err.response?.data || err.message);
                setError('Failed to fetch sales. Please try again.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchSales();
    }, []);

    // Get unique months for selector
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const monthOptions = [];
    sales.forEach(order => {
        const date = parseISO(order.createdAt);
        const year = getYear(date);
        const month = months[getMonth(date)];
        const key = `${month} ${year}`;
        if (!monthOptions.includes(key)) {
            monthOptions.push(key);
        }
    });
    monthOptions.sort((a, b) => {
        const [monthA, yearA] = a.split(' ');
        const [monthB, yearB] = b.split(' ');
        if (yearA !== yearB) return yearB - yearA;
        return months.indexOf(monthB) - months.indexOf(monthA);
    });
    if (!selectedMonth && monthOptions.length > 0) {
        setSelectedMonth(monthOptions[0]);
    }

    // Filter sales by selected month
    const getFilteredSales = () => {
        if (!selectedMonth) return [];
        const [monthName, year] = selectedMonth.split(' ');
        const monthIndex = months.indexOf(monthName);
        const start = new Date(parseInt(year), monthIndex, 1);
        const end = endOfMonth(start);

        const filtered = sales.filter((order) => {
            const orderDate = parseISO(order.createdAt);
            return order.isMovedToSales && isWithinInterval(orderDate, { start, end });
        });
        console.log('Filtered sales:', filtered.map(order => ({
            _id: order._id,
            createdAt: order.createdAt,
            isMovedToSales: order.isMovedToSales,
            orderItems: order.orderItems.map(item => ({
                serialNumber: item.serialNumber,
                name: item.name,
                size: item.size,
                quantity: item.quantity,
            })),
        })));
        return filtered;
    };

    // Calculate total sales and order count
    const filteredSales = getFilteredSales();
    const totalSales = filteredSales.reduce((sum, order) => sum + order.totalPrice, 0);
    const totalOrders = filteredSales.length;

    // Best performer stock (top 10 by quantity sold)
    const getBestPerformers = () => {
        const productMap = {};
        filteredSales.forEach((order) => {
            order.orderItems.forEach((item) => {
                const key = `${item.serialNumber}|${item.name}`;
                if (!productMap[key]) {
                    productMap[key] = {
                        serialNumber: item.serialNumber || 'N/A',
                        name: item.name,
                        quantity: 0,
                        revenue: 0,
                    };
                }
                productMap[key].quantity += item.quantity;
                productMap[key].revenue += item.price * item.quantity;
            });
        });
        const performers = Object.values(productMap)
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 10);
        console.log('Best performers:', performers);
        return performers;
    };

    // Weekly invoice data
    const getWeeklyInvoice = () => {
        const start = startOfWeek(new Date(), { weekStartsOn: 0 });
        const end = endOfWeek(new Date(), { weekStartsOn: 0 });
        const weeklySales = sales.filter(
            (order) =>
                order.isMovedToSales &&
                isWithinInterval(parseISO(order.createdAt), { start, end })
        );

        const itemMap = {};
        weeklySales.forEach((order) => {
            order.orderItems.forEach((item) => {
                const key = `${item.serialNumber}|${item.name}`;
                if (!itemMap[key]) {
                    itemMap[key] = {
                        serialNumber: item.serialNumber || 'N/A',
                        name: item.name,
                        quantity: 0,
                        netPrice: 0,
                    };
                }
                itemMap[key].quantity += item.quantity;
                itemMap[key].netPrice += item.price * item.quantity;
            });
        });

        const invoiceItems = Object.values(itemMap);
        const totalNetPrice = invoiceItems.reduce((sum, item) => sum + item.netPrice, 0);
        const totalGrossPrice = weeklySales.reduce((sum, order) => sum + order.totalPrice, 0);
        const totalStripeFees = calculateStripeFee(totalGrossPrice);
        const weeklyOrderCount = weeklySales.length;

        console.log('Weekly invoice:', { invoiceItems, totalNetPrice, totalGrossPrice, totalStripeFees, weeklyOrderCount });
        return { invoiceItems, totalNetPrice, totalGrossPrice, totalStripeFees, weeklyOrderCount };
    };

    // Monthly invoice data
    const getMonthlyInvoice = () => {
        const start = startOfMonth(new Date());
        const end = endOfMonth(new Date());
        const monthlySales = sales.filter(
            (order) =>
                order.isMovedToSales &&
                isWithinInterval(parseISO(order.createdAt), { start, end })
        );

        const itemMap = {};
        monthlySales.forEach((order) => {
            order.orderItems.forEach((item) => {
                const key = `${item.serialNumber}|${item.name}`;
                if (!itemMap[key]) {
                    itemMap[key] = {
                        serialNumber: item.serialNumber || 'N/A',
                        name: item.name,
                        quantity: 0,
                        netPrice: 0,
                    };
                }
                itemMap[key].quantity += item.quantity;
                itemMap[key].netPrice += item.price * item.quantity;
            });
        });

        const invoiceItems = Object.values(itemMap);
        const totalNetPrice = invoiceItems.reduce((sum, item) => sum + item.netPrice, 0);
        const totalGrossPrice = monthlySales.reduce((sum, order) => sum + order.totalPrice, 0);

        console.log('Monthly invoice items:', invoiceItems);
        return { invoiceItems, totalNetPrice, totalGrossPrice };
    };

    const { invoiceItems: weeklyInvoiceItems, totalNetPrice: weeklyNetPrice, totalGrossPrice: weeklyGrossPrice, totalStripeFees: weeklyStripeFees, weeklyOrderCount } = getWeeklyInvoice();
    const { invoiceItems: monthlyInvoiceItems, totalNetPrice: monthlyNetPrice, totalGrossPrice: monthlyGrossPrice } = getMonthlyInvoice();
    const bestPerformers = getBestPerformers();

    const handlePrintWeeklyInvoice = () => {
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>Weekly Invoice</title>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 20px; margin: 0; }
                        .invoice-container { max-width: 800px; margin: 0 auto; }
                        h2 { font-size: 18pt; text-align: center; margin-bottom: 20px; color: #000; }
                        .invoice-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                        .invoice-table th, .invoice-table td { border: 2px solid #000; padding: 12px; text-align: left; font-size: 14pt; }
                        .invoice-table th { background-color: #e0e0e0; font-weight: bold; }
                        .invoice-table td { color: #000; }
                        .invoice-table tfoot td { border-top: 3px solid #000; font-weight: bold; }
                        @page { margin: 2cm; size: A4; }
                    </style>
                </head>
                <body>
                    <div class="invoice-container">
                        <h2>Weekly Invoice (Sunday - Saturday)</h2>
                        <table class="invoice-table">
                            <thead>
                                <tr>
                                    <th>Serial Number</th>
                                    <th>Item Name</th>
                                    <th>Quantity</th>
                                    <th>Net Price</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${weeklyInvoiceItems.map((item, index) => `
                                    <tr>
                                        <td>${item.serialNumber}</td>
                                        <td>${item.name}</td>
                                        <td>${item.quantity}</td>
                                        <td>${formatPrice(item.netPrice)}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                            <tfoot>
                                <tr>
                                    <td colspan="3"><strong>Total Orders</strong></td>
                                    <td><strong>${weeklyOrderCount}</strong></td>
                                </tr>
                                <tr>
                                    <td colspan="3"><strong>Total Net Price</strong></td>
                                    <td><strong>${formatPrice(weeklyNetPrice)}</strong></td>
                                </tr>
                                <tr>
                                    <td colspan="3"><strong>Total Gross Price (with Shipping)</strong></td>
                                    <td><strong>${formatPrice(weeklyGrossPrice)}</strong></td>
                                </tr>
                                <tr>
                                    <td colspan="3"><strong>Total Stripe Fees (2.5%)</strong></td>
                                    <td><strong>${formatPrice(weeklyStripeFees)}</strong></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
    };

    const handlePrintMonthlyInvoice = () => {
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>Monthly Invoice</title>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 20px; margin: 0; }
                        .invoice-container { max-width: 800px; margin: 0 auto; }
                        h2 { font-size: 18pt; text-align: center; margin-bottom: 20px; color: #000; }
                        .invoice-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                        .invoice-table th, .invoice-table td { border: 2px solid #000; padding: 12px; text-align: left; font-size: 14pt; }
                        .invoice-table th { background-color: #e0e0e0; font-weight: bold; }
                        .invoice-table td { color: #000; }
                        .invoice-table tfoot td { border-top: 3px solid #000; font-weight: bold; }
                        @page { margin: 2cm; size: A4; }
                    </style>
                </head>
                <body>
                    <div class="invoice-container">
                        <h2>Monthly Invoice</h2>
                        <table class="invoice-table">
                            <thead>
                                <tr>
                                    <th>Serial Number</th>
                                    <th>Item Name</th>
                                    <th>Quantity</th>
                                    <th>Net Price</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${monthlyInvoiceItems.map((item, index) => `
                                    <tr>
                                        <td>${item.serialNumber}</td>
                                        <td>${item.name}</td>
                                        <td>${item.quantity}</td>
                                        <td>${formatPrice(item.netPrice)}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                            <tfoot>
                                <tr>
                                    <td colspan="3"><strong>Total Net Price</strong></td>
                                    <td><strong>${formatPrice(monthlyNetPrice)}</strong></td>
                                </tr>
                                <tr>
                                    <td colspan="3"><strong>Total Gross Price (with Shipping)</strong></td>
                                    <td><strong>${formatPrice(monthlyGrossPrice)}</strong></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
    };

    return (
        <div className="sales-container">
            <h1>Sales and Performance</h1>
            {isLoading && <p>Loading sales...</p>}
            {error && <p className="error">{error}</p>}

            {/* Total Sales Section */}
            <div className="sales-section">
                <h2>Total Sales</h2>
                <div className="month-selector">
                    <label>Select Month: </label>
                    <select
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                    >
                        <option value="">Select a month</option>
                        {monthOptions.map(month => (
                            <option key={month} value={month}>{month}</option>
                        ))}
                    </select>
                </div>
                <p>Total Sales: {formatPrice(totalSales)}</p>
                <p>Total Orders: {totalOrders}</p>
            </div>

            {/* Best Performer Stock Section */}
            <div className="sales-section">
                <h2>Best Performer Stock (Top 10)</h2>
                {bestPerformers.length === 0 ? (
                    <p>No sales data for this period.</p>
                ) : (
                    <table className="sales-table">
                        <thead>
                            <tr>
                                <th>Serial Number</th>
                                <th>Item Name</th>
                                <th>Quantity Sold</th>
                                <th>Revenue</th>
                            </tr>
                        </thead>
                        <tbody>
                            {bestPerformers.map((product, index) => (
                                <tr key={index}>
                                    <td>{product.serialNumber}</td>
                                    <td>{product.name}</td>
                                    <td>{product.quantity}</td>
                                    <td>{formatPrice(product.revenue)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Weekly Invoice Section */}
            <div className="sales-section weekly-invoice-section">
                <h2>Weekly Invoice (Sunday - Saturday)</h2>
                {weeklyInvoiceItems.length === 0 ? (
                    <p>No sales data for this week.</p>
                ) : (
                    <>
                        <table className="sales-table invoice-table">
                            <thead>
                                <tr>
                                    <th>Serial Number</th>
                                    <th>Item Name</th>
                                    <th>Quantity</th>
                                    <th>Net Price</th>
                                </tr>
                            </thead>
                            <tbody>
                                {weeklyInvoiceItems.map((item, index) => (
                                    <tr key={index}>
                                        <td>{item.serialNumber}</td>
                                        <td>{item.name}</td>
                                        <td>{item.quantity}</td>
                                        <td>{formatPrice(item.netPrice)}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr>
                                    <td colSpan="3"><strong>Total Orders</strong></td>
                                    <td><strong>{weeklyOrderCount}</strong></td>
                                </tr>
                                <tr>
                                    <td colSpan="3"><strong>Total Net Price</strong></td>
                                    <td><strong>{formatPrice(weeklyNetPrice)}</strong></td>
                                </tr>
                                <tr>
                                    <td colSpan="3"><strong>Total Gross Price (with Shipping)</strong></td>
                                    <td><strong>{formatPrice(weeklyGrossPrice)}</strong></td>
                                </tr>
                                <tr>
                                    <td colSpan="3"><strong>Total Stripe Fees (2.5%)</strong></td>
                                    <td><strong>{formatPrice(weeklyStripeFees)}</strong></td>
                                </tr>
                            </tfoot>
                        </table>
                        <button className="print-button" onClick={handlePrintWeeklyInvoice}>
                            Print Weekly Invoice
                        </button>
                    </>
                )}
            </div>

            {/* Monthly Invoice Section */}
            <div className="sales-section monthly-invoice-section">
                <h2>Monthly Invoice</h2>
                {monthlyInvoiceItems.length === 0 ? (
                    <p>No sales data for this month.</p>
                ) : (
                    <>
                        <table className="sales-table invoice-table">
                            <thead>
                                <tr>
                                    <th>Serial Number</th>
                                    <th>Item Name</th>
                                    <th>Quantity</th>
                                    <th>Net Price</th>
                                </tr>
                            </thead>
                            <tbody>
                                {monthlyInvoiceItems.map((item, index) => (
                                    <tr key={index}>
                                        <td>{item.serialNumber}</td>
                                        <td>{item.name}</td>
                                        <td>{item.quantity}</td>
                                        <td>{formatPrice(item.netPrice)}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr>
                                    <td colSpan="3"><strong>Total Net Price</strong></td>
                                    <td><strong>{formatPrice(monthlyNetPrice)}</strong></td>
                                </tr>
                                <tr>
                                    <td colSpan="3"><strong>Total Gross Price (with Shipping)</strong></td>
                                    <td><strong>{formatPrice(monthlyGrossPrice)}</strong></td>
                                </tr>
                            </tfoot>
                        </table>
                        <button className="print-button" onClick={handlePrintMonthlyInvoice}>
                            Print Monthly Invoice
                        </button>
                    </>
                )}
            </div>

            {/* Sales Details Section */}
            <div className="sales-section">
                <h2>Sales Details</h2>
                {filteredSales.length === 0 && !isLoading && !error ? (
                    <p>No sales data for this period.</p>
                ) : (
                    <table className="sales-table">
                        <thead>
                            <tr>
                                <th>Order ID</th>
                                <th>Customer</th>
                                <th>Items</th>
                                <th>Total</th>
                                <th>Status</th>
                                <th>Shipping Method</th>
                                <th>Order Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredSales.map((order) => (
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
                                        Paid, {order.isDelivered ? 'Delivered' : 'Not Delivered'}
                                    </td>
                                    <td>{order.shippingMethod}</td>
                                    <td>
                                        {new Date(order.createdAt).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default Sales;