import React, { useEffect, useState } from 'react';
import { getAdminProducts, createProduct, updateProduct } from '../services/productService';
import Navbar from './Navbar';
import '../styles/products.css';

const Products = () => {
    const [products, setProducts] = useState([]);
    const [error, setError] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        description: '',
        productCategory: '',
        interestCategory: '',
        genderCategory: '',
        saleCategory: '',
        isNewArrival: false,
        isOnSale: false,
        countInStock: '',
        size: [],
        onOff: true,
        serialNumber: '',
        images: [],
        existingImages: [],
    });
    const [editingProductId, setEditingProductId] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const productsPerPage = 10;

    const sizes = ['S', 'M', 'L', 'XL', 'XXL', 'ONESIZE', 'ONESIZE LADYSOCKS', 'ONESIZE MANSOCKS'];
    const formatPrice = (price) => `\u00A3${parseFloat(price).toFixed(2)}`;

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const data = await getAdminProducts();
                setProducts(data);
                setError(null);
            } catch (error) {
                setError('Failed to fetch products. Please log in again.');
            }
        };
        fetchProducts();
    }, []);

    const handleInputChange = (e) => {
        const { name, value, type, checked, files } = e.target;
        if (type === 'checkbox' && sizes.includes(name)) {
            setFormData((prev) => ({
                ...prev,
                size: checked ? [...prev.size, name] : prev.size.filter((size) => size !== name),
            }));
        } else if (type === 'checkbox') {
            setFormData({ ...formData, [name]: checked });
        } else if (type === 'file') {
            const validImages = Array.from(files).filter((file) => {
                const isValidType = ['image/jpeg', 'image/png'].includes(file.type);
                const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB
                if (!isValidType) setError('Only JPEG/PNG images are allowed.');
                if (!isValidSize) setError('Image size must be less than 5MB.');
                return isValidType && isValidSize;
            });
            setFormData({ ...formData, images: validImages });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleRemoveImage = (index, isExisting = false) => {
        if (isExisting) {
            setFormData((prev) => ({
                ...prev,
                existingImages: prev.existingImages.filter((_, i) => i !== index),
            }));
        } else {
            setFormData((prev) => ({
                ...prev,
                images: prev.images.filter((_, i) => i !== index),
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.images.length === 0 && formData.existingImages.length === 0 && !editingProductId) {
            setError('At least one image is required.');
            return;
        }

        const formDataToSend = new FormData();
        for (const key in formData) {
            if (key === 'size' || key === 'existingImages') {
                formDataToSend.append(key, JSON.stringify(formData[key]));
            } else if (key === 'images') {
                formData[key].forEach((file) => {
                    formDataToSend.append('images', file);
                });
            } else {
                formDataToSend.append(key, formData[key]);
            }
        }

        const confirmAction = window.confirm(editingProductId ? 'Are you sure you want to update this product?' : 'Are you sure you want to add this product?');
        if (!confirmAction) return;

        try {
            if (editingProductId) {
                await updateProduct(editingProductId, formDataToSend);
            } else {
                await createProduct(formDataToSend);
            }
            setFormData({
                name: '',
                price: '',
                description: '',
                productCategory: '',
                interestCategory: '',
                genderCategory: '',
                saleCategory: '',
                isNewArrival: false,
                isOnSale: false,
                countInStock: '',
                size: [],
                onOff: true,
                serialNumber: '',
                images: [],
                existingImages: [],
            });
            setEditingProductId(null);
            setShowForm(false);
            const data = await getAdminProducts();
            setProducts(data);
            setError(null);
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to update/create product. Please try again.');
        }
    };

    const handleEdit = (product) => {
        setFormData({
            ...product,
            size: Array.isArray(product.size) ? product.size : JSON.parse(product.size || '[]'),
            existingImages: product.images || [],
            images: [],
        });
        setEditingProductId(product._id);
        setShowForm(true);
    };

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1);
    };

    const handleFilterChange = (e) => {
        setFilterCategory(e.target.value);
        setCurrentPage(1);
    };

    const filteredProducts = products.filter(product => {
        return (
            product.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
            (filterCategory ? (
                product.productCategory === filterCategory ||
                product.interestCategory === filterCategory ||
                product.genderCategory === filterCategory ||
                product.saleCategory === filterCategory
            ) : true)
        );
    });

    const totalProducts = filteredProducts.length;
    const totalOnSale = filteredProducts.filter(product => product.isOnSale).length;

    const indexOfLastProduct = currentPage * productsPerPage;
    const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
    const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    return (
        <div className="products-page">
            <Navbar />
            <div className="products-content">
                <h1>Products</h1>
                {error && <p className="error">{error}</p>}
                <button className="add-product-button" onClick={() => setShowForm(true)}>Add Product</button>
                {showForm && (
                    <form onSubmit={handleSubmit} className="product-form">
                        <div className="form-field">
                            <label>Name</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                required
                            />
                        </div>
                        <div className="form-field">
                            <label>Price</label>
                            <input
                                type="number"
                                name="price"
                                value={formData.price}
                                onChange={handleInputChange}
                                min="0"
                                step="0.01"
                                required
                            />
                        </div>
                        <div className="form-field">
                            <label>Description</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                required
                            />
                        </div>
                        <div className="form-field">
                            <label>Product Category</label>
                            <select
                                name="productCategory"
                                value={formData.productCategory}
                                onChange={handleInputChange}
                            >
                                <option value="">Select Product Category</option>
                                <option value="T-shirt">T-shirt</option>
                                <option value="Lounge Pants">Lounge Pants</option>
                                <option value="Hoodies">Hoodies</option>
                                <option value="Hosiery">Hosiery</option>
                                <option value="Nightwear">Nightwear</option>
                                <option value="Boxers">Boxers</option>
                                <option value="Accessories">Accessories</option>
                                <option value="Gift">Gift</option>
                            </select>
                        </div>
                        <div className="form-field">
                            <label>Interest Category</label>
                            <select
                                name="interestCategory"
                                value={formData.interestCategory}
                                onChange={handleInputChange}
                            >
                                <option value="">Select Interest Category</option>
                                <option value="Sesame Street">Sesame Street</option>
                                <option value="DC Comics">DC Comics</option>
                                <option value="Cartoons">Cartoons</option>
                                <option value="Festive">Festive</option>
                                <option value="KENDAL">KENDAL</option>
                                <option value="Music Bands">Music Bands</option>
                                <option value="Warner Bros">Warner Bros</option>
                            </select>
                        </div>
                        <div className="form-field">
                            <label>Gender Category</label>
                            <select
                                name="genderCategory"
                                value={formData.genderCategory}
                                onChange={handleInputChange}
                                required
                            >
                                <option value="">Select Gender Category</option>
                                <option value="MEN">MEN</option>
                                <option value="WOMEN">WOMEN</option>
                                <option value="UNISEX">UNISEX</option>
                            </select>
                        </div>
                        <div className="form-field">
                            <label>Sizes</label>
                            <div className="size-checkboxes">
                                {sizes.map((size) => (
                                    <div key={size} className="checkbox-item">
                                        <input
                                            type="checkbox"
                                            name={size}
                                            checked={formData.size.includes(size)}
                                            onChange={handleInputChange}
                                        />
                                        <label>{size}</label>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="form-field">
                            <label>Sale</label>
                            <input
                                type="checkbox"
                                name="isOnSale"
                                checked={formData.isOnSale}
                                onChange={handleInputChange}
                            />
                        </div>
                        {formData.isOnSale && (
                            <div className="form-field">
                                <label>Sale Category</label>
                                <select
                                    name="saleCategory"
                                    value={formData.saleCategory}
                                    onChange={handleInputChange}
                                >
                                    <option value="">Select Sale Category</option>
                                    <option value="Limited Offer">Limited Offer</option>
                                    <option value="Clearance">Clearance</option>
                                </select>
                            </div>
                        )}
                        <div className="form-field">
                            <label>New Arrival</label>
                            <input
                                type="checkbox"
                                name="isNewArrival"
                                checked={formData.isNewArrival}
                                onChange={handleInputChange}
                            />
                        </div>
                        <div className="form-field">
                            <label>Count In Stock</label>
                            <input
                                type="number"
                                name="countInStock"
                                value={formData.countInStock}
                                onChange={handleInputChange}
                                min="0"
                                required
                            />
                        </div>
                        <div className="form-field">
                            <label>On/Off</label>
                            <input
                                type="checkbox"
                                name="onOff"
                                checked={formData.onOff}
                                onChange={handleInputChange}
                            />
                        </div>
                        <div className="form-field">
                            <label>Serial Number</label>
                            <input
                                type="text"
                                name="serialNumber"
                                value={formData.serialNumber}
                                onChange={handleInputChange}
                                required
                            />
                        </div>
                        <div className="form-field">
                            <label>Images</label>
                            <input
                                type="file"
                                name="images"
                                onChange={handleInputChange}
                                multiple
                                accept="image/jpeg,image/png"
                            />
                            <div className="image-preview">
                                {formData.existingImages.map((image, idx) => (
                                    <div key={`existing-${idx}`} className="image-item">
                                        <img src={`http://localhost:5000${image}`} alt="Product" />
                                        <button type="button" onClick={() => handleRemoveImage(idx, true)}>Remove</button>
                                    </div>
                                ))}
                                {formData.images.map((image, idx) => (
                                    <div key={`new-${idx}`} className="image-item">
                                        <img src={URL.createObjectURL(image)} alt="Product" />
                                        <button type="button" onClick={() => handleRemoveImage(idx)}>Remove</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="form-buttons">
                            <button type="submit" className="submit-button">{editingProductId ? 'Update' : 'Add'} Product</button>
                            <button type="button" className="close-button" onClick={() => setShowForm(false)}>Close</button>
                        </div>
                    </form>
                )}
                <div className="search-filter">
                    <input
                        type="text"
                        placeholder="Search by name"
                        value={searchTerm}
                        onChange={handleSearchChange}
                        className="search-input"
                    />
                    <select value={filterCategory} onChange={handleFilterChange} className="filter-select">
                        <option value="">All Categories</option>
                        <option value="T-shirt">T-shirt</option>
                        <option value="Lounge Pants">Lounge Pants</option>
                        <option value="Hoodies">Hoodies</option>
                        <option value="Hosiery">Hosiery</option>
                        <option value="Nightwear">Nightwear</option>
                        <option value="Boxers">Boxers</option>
                        <option value="Accessories">Accessories</option>
                        <option value="Gift">Gift</option>
                        <option value="Sesame Street">Sesame Street</option>
                        <option value="DC Comics">DC Comics</option>
                        <option value="Cartoons">Cartoons</option>
                        <option value="Festive">Festive</option>
                        <option value="KENDAL">KENDAL</option>
                        <option value="Music Bands">Music Bands</option>
                        <option value="Warner Bros">Warner Bros</option>
                        <option value="MEN">MEN</option>
                        <option value="WOMEN">WOMEN</option>
                        <option value="UNISEX">UNISEX</option>
                        <option value="Limited Offer">Limited Offer</option>
                        <option value="Clearance">Clearance</option>
                    </select>
                </div>
                <table className="products-table">
                    <thead>
                        <tr>
                            <th>Serial No.</th>
                            <th>Name</th>
                            <th>Price</th>
                            <th>Description</th>
                            <th>Product Category</th>
                            <th>Interest Category</th>
                            <th>Gender Category</th>
                            <th>Sale Category</th>
                            <th>New Arrival</th>
                            <th>Count In Stock</th>
                            <th>Size</th>
                            <th>On/Off</th>
                            <th>Image</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentProducts.map((product) => (
                            <tr key={product._id}>
                                <td>{product.serialNumber}</td>
                                <td>{product.name}</td>
                                <td>{formatPrice(product.price)}</td>
                                <td>{product.description}</td>
                                <td>{product.productCategory}</td>
                                <td>{product.interestCategory}</td>
                                <td>{product.genderCategory}</td>
                                <td>{product.saleCategory}</td>
                                <td>{product.isNewArrival ? 'Yes' : 'No'}</td>
                                <td>{product.countInStock}</td>
                                <td>{Array.isArray(product.size) ? product.size.join(', ') : product.size}</td>
                                <td>{product.onOff ? 'On' : 'Off'}</td>
                                <td>
                                    {product.images.slice(0, 2).map((image, idx) => (
                                        <img key={idx} src={`http://localhost:5000${image}`} alt={product.name} />
                                    ))}
                                    {product.images.length > 2 && <span>+{product.images.length - 2} more</span>}
                                </td>
                                <td>
                                    <button className="edit-button" onClick={() => handleEdit(product)}>Edit</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div className="pagination">
                    {Array.from({ length: Math.ceil(totalProducts / productsPerPage) }, (_, index) => (
                        <button key={index + 1} onClick={() => paginate(index + 1)} className={currentPage === index + 1 ? 'active' : ''}>
                            {index + 1}
                        </button>
                    ))}
                </div>
                <div className="product-summary">
                    <p>Total Products: {totalProducts}</p>
                    <p>Products on Sale: {totalOnSale}</p>
                </div>
            </div>
        </div>
    );
};

export default Products;