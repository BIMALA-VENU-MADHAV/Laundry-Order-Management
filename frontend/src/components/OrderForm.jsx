import { useState, useEffect } from 'react';
import './OrderForm.css';

// Use environment variable if available, fallback to localhost for development
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function OrderForm({ onOrderCreated }) {
  const [pricing, setPricing] = useState({});
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedGarment, setSelectedGarment] = useState('');
  const [selectedQuantity, setSelectedQuantity] = useState(1);

  const [formData, setFormData] = useState({
    customerName: '',
    phoneNumber: '',
    garments: []
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchPricing();
  }, []);

  const fetchPricing = async () => {
    try {
      const res = await fetch(`${API_BASE}/pricing`);
      const data = await res.json();
      setPricing(data);

      const firstCategory = Object.keys(data)[0];
      if (firstCategory) {
        setSelectedCategory(firstCategory);
        const firstGarment = Object.keys(data[firstCategory])[0];
        setSelectedGarment(firstGarment);
      }
    } catch (error) {
      console.error('Error fetching pricing:', error);
    }
  };

  const categories = Object.keys(pricing);
  const garmentOptions = pricing[selectedCategory]
    ? Object.keys(pricing[selectedCategory])
    : [];

  const handleAddGarment = () => {
    if (!selectedGarment) {
      setMessage('❌ Select garment first');
      return;
    }

    const newGarment = {
      name: selectedGarment,
      quantity: Number(selectedQuantity),
      pricePerItem: pricing[selectedCategory][selectedGarment],
      category: selectedCategory
    };

    setFormData(prev => ({
      ...prev,
      garments: [...prev.garments, newGarment]
    }));

    setSelectedQuantity(1);
    setMessage('');
  };

  const handleRemoveGarment = (index) => {
    setFormData(prev => ({
      ...prev,
      garments: prev.garments.filter((_, i) => i !== index)
    }));
  };

  const calculateTotal = () =>
    formData.garments.reduce(
      (sum, g) => sum + g.quantity * g.pricePerItem,
      0
    );

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.customerName || !formData.phoneNumber || formData.garments.length === 0) {
      setMessage('❌ Fill all fields and add garments');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!res.ok) throw new Error('Failed to create order');

      const order = await res.json();

      setMessage(`✅ Order created! ID: ${order.id}`);

      setFormData({
        customerName: '',
        phoneNumber: '',
        garments: []
      });

      setTimeout(() => {
        onOrderCreated?.();
      }, 1200);

    } catch (error) {
      setMessage(`❌ ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="order-form-container">
      <h2>➕ Create New Order</h2>

      <form onSubmit={handleSubmit} className="order-form">

        {/* CUSTOMER INFO */}
        <div className="form-group">
          <label>Customer Name *</label>
          <input
            value={formData.customerName}
            onChange={(e) =>
              setFormData({ ...formData, customerName: e.target.value })
            }
            placeholder="Enter name"
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label>Phone Number *</label>
          <input
            value={formData.phoneNumber}
            onChange={(e) =>
              setFormData({ ...formData, phoneNumber: e.target.value })
            }
            placeholder="Enter phone"
            disabled={loading}
          />
        </div>

        {/* GARMENT SELECTOR */}
        <div className="garment-selector">
          <h3>Select Garments</h3>

          <div className="category-buttons">
            {categories.map(cat => (
              <button
                key={cat}
                type="button"
                className={`category-btn ${selectedCategory === cat ? 'active' : ''}`}
                onClick={() => {
                  setSelectedCategory(cat);
                  setSelectedGarment(Object.keys(pricing[cat])[0]);
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="garment-input-group">
            <select
              value={selectedGarment}
              onChange={(e) => setSelectedGarment(e.target.value)}
            >
              {garmentOptions.map(item => (
                <option key={item} value={item}>
                  {item} (₹{pricing[selectedCategory][item]})
                </option>
              ))}
            </select>

            <input
              type="number"
              min="1"
              value={selectedQuantity}
              onChange={(e) => setSelectedQuantity(e.target.value)}
            />

            <button type="button" className="add-btn" onClick={handleAddGarment}>
              Add
            </button>
          </div>
        </div>

        {/* SELECTED GARMENTS */}
        {formData.garments.length > 0 && (
          <div className="garments-list">
            <h3>Selected Items</h3>

            {formData.garments.map((g, i) => (
              <div key={i} className="garment-item">
                <span>
                  <strong>{g.category}</strong> - {g.quantity}x {g.name}
                </span>

                <span>₹{g.quantity * g.pricePerItem}</span>

                <button onClick={() => handleRemoveGarment(i)} className="remove-btn">
                  ✕
                </button>
              </div>
            ))}

            <div className="total-bill">
              Total: ₹{calculateTotal()}
            </div>
          </div>
        )}

        {/* MESSAGE */}
        {message && (
          <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}

        {/* SUBMIT */}
        <button
          type="submit"
          className="submit-btn"
          disabled={loading || formData.garments.length === 0}
        >
          {loading ? 'Creating...' : 'Create Order'}
        </button>

      </form>
    </div>
  );
}

export default OrderForm;