import React, { useState, useEffect } from 'react';
import './Dashboard.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function Dashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');

    try {
      const [dashboardRes, ordersRes] = await Promise.all([
        fetch(`${API_BASE}/dashboard`),
        fetch(`${API_BASE}/orders?limit=5`)
      ]);

      if (!dashboardRes.ok || !ordersRes.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const dashboard = await dashboardRes.json();
      const orders = await ordersRes.json();

      setDashboardData(dashboard);
      setRecentOrders(orders);
    } catch (err) {
      setError('Error loading dashboard: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) =>
    typeof value === 'number' ? `₹${value.toFixed(2)}` : '₹0.00';

  const formatDate = (date) =>
    new Date(date).toLocaleDateString();

  if (loading) return <div className="loading">Loading dashboard...</div>;

  if (error) return <div className="error">{error}</div>;

  return (
    <div className="dashboard-container">

      {/* HEADER */}
      <div className="dashboard-header">
        <h2>📊 Dashboard Overview</h2>
        <button className="refresh-btn" onClick={fetchDashboardData}>
          🔄 Refresh
        </button>
      </div>

      {/* METRICS */}
      <div className="metrics-grid">
        <div className="metric-card primary">
          <div className="metric-label">Total Orders</div>
          <div className="metric-value">
            {dashboardData?.totalOrders || 0}
          </div>
        </div>

        <div className="metric-card success">
          <div className="metric-label">Total Revenue</div>
          <div className="metric-value">
            {formatCurrency(dashboardData?.totalRevenue)}
          </div>
        </div>
      </div>

      {/* STATUS BREAKDOWN */}
      <div>
        <h3>📦 Orders by Status</h3>
        <div className="status-breakdown">
          {dashboardData?.statusBreakdown &&
            Object.entries(dashboardData.statusBreakdown).map(
              ([status, count]) => (
                <div
                  key={status}
                  className={`status-item ${status.toLowerCase()}`}
                >
                  <div className="status-item-label">{status}</div>
                  <div className="status-item-value">{count}</div>
                </div>
              )
            )}
        </div>
      </div>

      {/* RECENT ORDERS */}
      <div className="recent-orders">
        <h3>🕒 Recent Orders</h3>

        {recentOrders.length === 0 ? (
          <p className="noDataText">No orders yet.</p>
        ) : (
          <table className="recent-orders-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>

            <tbody>
              {recentOrders.map((order) => (
                <tr key={order.id}>
                  <td className="order-id-small">{order.id}</td>
                  <td>{order.customerName}</td>
                  <td>{formatCurrency(order.totalBill)}</td>
                  <td>
                    <span className={`status-badge status-${order.status.toLowerCase()}`}>
                      {order.status}
                    </span>
                  </td>
                  <td>{formatDate(order.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}