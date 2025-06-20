import React from 'react';
import '../styles/PrintOrder.css';

const PrintOrder = ({ order, orders, onPrint }) => {
    const formatPrice = (price) => `\u00A3${parseFloat(price).toFixed(2)}`;

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        const printContent = orders ? orders : [order];
        printWindow.document.write(`
            <html>
                <head>
                    <title>Delivery Order${orders ? 's' : ' - ' + order._id}</title>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 20px; margin: 0; }
                        .order-container { margin-bottom: 30px; border: 1px solid #ccc; padding: 15px; page-break-after: always; }
                        .order-container:last-child { page-break-after: auto; }
                        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
                        .shipping-address { width: 60%; font-size: 1.2rem; }
                        .shipping-address p { margin: 8px 0; font-weight: bold; }
                        .company-info { width: 35%; text-align: right; }
                        .company-info img { max-width: 100px; max-height: 50px; margin-bottom: 10px; }
                        .company-info p { margin: 5px 0; font-size: 14px; }
                        .underline { border-bottom: 2px solid #000; margin-bottom: 15px; }
                        .customer-details p { margin: 5px 0; font-size: 1.1rem; }
                        .thin-line { border-top: 1px solid #000; margin: 15px 0; }
                        .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                        .items-table th, .items-table td { border: 1px solid #000; padding: 10px; text-align: left; }
                        .items-table th { background-color: #f2f2f2; font-weight: bold; }
                        .totals { text-align: right; }
                        .totals p { margin: 5px 0; font-weight: bold; }
                        .footer p { margin: 5px 0; font-size: 14px; }
                        .return-section { margin-top: 20px; font-size: 0.9rem; color: #555; }
                    </style>
                </head>
                <body>
                    ${printContent
                .map(
                    (ord) => `
                                <div class="order-container">
                                    <div class="header">
                                        <div class="shipping-address">
                                            <p><strong>Shipping Address:</strong></p>
                                            <p>${ord.shippingAddress?.street || 'N/A'}</p>
                                            <p>${ord.shippingAddress?.city || ''}, ${ord.shippingAddress?.postalCode || ''}</p>
                                            <p>${ord.shippingAddress?.country || ''} (${ord.shippingAddress?.type || 'N/A'})</p>
                                        </div>
                                        <div class="company-info">
                                            <img src="/logo.png" alt="UWEAR Logo" />
                                            <p><strong>U WEAR UK</strong></p>
                                            <p>Jay Maa Building</p>
                                            <p>Droylsden, Manchester, M43 7DJ</p>
                                        </div>
                                    </div>
                                    <div class="underline"></div>
                                    <div class="customer-details">
                                        <p><strong>Customer:</strong> ${ord.customerDetails?.firstName} ${ord.customerDetails?.lastName}</p>
                                        <p><strong>Order #:</strong> ${ord._id}</p>
                                        <p><strong>Date:</strong> ${new Date(ord.createdAt).toLocaleDateString()}</p>
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
                                            ${ord.orderItems
                            .map(
                                (item) => `
                                                        <tr>
                                                            <td>${item.serialNumber || 'N/A'}</td>
                                                            <td>${item.name}</td>
                                                            <td>${item.size}</td>
                                                            <td>${item.quantity}</td>
                                                            <td>${formatPrice(item.price)}</td>
                                                            <td>${formatPrice(item.quantity * item.price)}</td>
                                                        </tr>
                                                    `
                            )
                            .join('')}
                                        </tbody>
                                    </table>
                                    <div class="totals">
                                        <p>Items Price: ${formatPrice(ord.itemsPrice)}</p>
                                        <p>Shipping Price: ${formatPrice(ord.shippingPrice)}</p>
                                        <p>Total Price: ${formatPrice(ord.totalPrice)}</p>
                                    </div>
                                    <div class="footer">
                                        <p><strong>Delivery Service:</strong> ${ord.shippingMethod}</p>
                                    </div>
                                    <div class="return-section">
                                        <p><strong>Return:</strong></p>
                                        <p>Contact us at support@uwearuk.com to initiate your return and obtain a return authorization.</p>
                                    </div>
                                </div>
                            `
                )
                .join('')}
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
        if (onPrint) onPrint();
    };

    return (
        <button className="print-button" onClick={handlePrint}>
            Print
        </button>
    );
};

export default PrintOrder;