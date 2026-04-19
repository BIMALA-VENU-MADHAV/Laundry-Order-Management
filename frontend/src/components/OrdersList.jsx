import React, { useState, useEffect } from 'react';
import './OrdersList.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const STATUS_OPTIONS = ['RECEIVED', 'PROCESSING', 'READY', 'DELIVERED'];

export default function OrdersList() {
  const [orders, setOrders] = useState([]);
  const [filters, setFilters] = useState({
    status: '',
    customerName: '',
    phoneNumber: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [updatingOrderId, setUpdatingOrderId] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, [filters]);

  const fetchOrders = async () => {
    setLoading(true);
    setError('');

    try {
      const query = new URLSearchParams(filters).toString();
      const res = await fetch(`${API_BASE}/orders?${query}`);

      if (!res.ok) throw new Error('Failed to fetch orders');

      const data = await res.json();
      setOrders(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id, status) => {
    setUpdatingOrderId(id);

    try {
      const res = await fetch(`${API_BASE}/orders/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });

      if (!res.ok) throw new Error('Update failed');

      setOrders(prev =>
        prev.map(o => (o.id === id ? { ...o, status } : o))
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleDeleteOrder = async (id) => {
    const confirmDelete = window.confirm("Delete this order?");
    if (!confirmDelete) return;

    setUpdatingOrderId(id);

    try {
      const res = await fetch(`${API_BASE}/orders/${id}`, {
        method: 'DELETE'
      });

      if (!res.ok) throw new Error('Delete failed');

      setOrders(prev => prev.filter(o => o.id !== id));
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const formatDate = (d) => new Date(d).toLocaleDateString();

  return (
    <div className="orders-list-container">
      <h2>📋 Manage Orders</h2>

      {error && <div className="error">{error}</div>}

      {/* FILTERS */}
      <div className="filter-section">
        <div className="filter-group">
          <label>Name</label>
          <input
            placeholder="Customer name"
            value={filters.customerName}
            onChange={(e) =>
              setFilters({ ...filters, customerName: e.target.value })
            }
          />
        </div>

        <div className="filter-group">
          <label>Phone</label>
          <input
            placeholder="Phone number"
            value={filters.phoneNumber}
            onChange={(e) =>
              setFilters({ ...filters, phoneNumber: e.target.value })
            }
          />
        </div>

        <div className="filter-group">
          <label>Status</label>
          <select
            value={filters.status}
            onChange={(e) =>
              setFilters({ ...filters, status: e.target.value })
            }
          >
            <option value="">All</option>
            {STATUS_OPTIONS.map(s => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>

        <button
          className="btn secondary"
          onClick={() =>
            setFilters({ status: '', customerName: '', phoneNumber: '' })
          }
        >
          Clear
        </button>
      </div>

      {/* CONTENT */}
      {loading ? (
        <div className="loading">Loading orders...</div>
      ) : orders.length === 0 ? (
        <div className="no-data">No orders found</div>
      ) : (
        <table className="orders-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Phone</th>
              <th>Total</th>
              <th>Status</th>
              <th>Date</th>
              <th>Update</th>
              <th>Delete</th>
            </tr>
          </thead>

          <tbody>
            {orders.map(order => (
              <tr key={order.id}>
                <td className="order-id">{order.id}</td>
                <td>{order.customerName}</td>
                <td>{order.phoneNumber}</td>
                <td>₹{order.totalBill}</td>

                <td>
                  <span className={`status-badge status-${order.status.toLowerCase()}`}>
                    {order.status}
                  </span>
                </td>

                <td>{formatDate(order.createdAt)}</td>

                <td>
                  <select
                    className="status-update-select"
                    value={order.status}
                    onChange={(e) =>
                      handleStatusUpdate(order.id, e.target.value)
                    }
                    disabled={updatingOrderId === order.id}
                  >
                    {STATUS_OPTIONS.map(s => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </td>

                <td>
                  <button
                    className="delete-btn"
                    onClick={() => handleDeleteOrder(order.id)}
                    disabled={updatingOrderId === order.id}
                    title="Delete Order"
                  >
                    🗑
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}