#!/usr/bin/env node

/**
 * Setup script for creating React components directory and component files
 * Run with: node create-components.js
 */

const fs = require('fs');
const path = require('path');

const baseDir = process.cwd();
const componentsDir = path.join(baseDir, 'frontend', 'src', 'components');

// Create components directory
if (!fs.existsSync(componentsDir)) {
  fs.mkdirSync(componentsDir, { recursive: true });
  console.log(`✓ Created directory: ${componentsDir}`);
} else {
  console.log(`✓ Directory already exists: ${componentsDir}`);
}

// OrderForm.jsx
const orderFormContent = `import React, { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:5000/api';

export default function OrderForm() {
  const [formData, setFormData] = useState({
    customerName: '',
    phoneNumber: '',
  });

  const [selectedGarments, setSelectedGarments] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [selectedGarmentId, setSelectedGarmentId] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [pricingData, setPricingData] = useState([]);

  useEffect(() => {
    fetchPricing();
  }, []);

  const fetchPricing = async () => {
    try {
      const response = await fetch(\`\${API_BASE}/pricing\`);
      const data = await response.json();
      setPricingData(data);
    } catch (error) {
      console.error('Error fetching pricing:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleAddGarment = () => {
    if (!selectedGarmentId || quantity <= 0) {
      setMessage('Please select a garment and enter a valid quantity');
      setMessageType('error');
      return;
    }

    const garment = pricingData.find((g) => g.id === parseInt(selectedGarmentId));
    if (!garment) return;

    const totalPrice = garment.price * quantity;
    const newGarment = {
      id: Date.now(),
      garmentId: garment.id,
      name: garment.name,
      price: garment.price,
      quantity: parseInt(quantity),
      total: totalPrice,
    };

    setSelectedGarments([...selectedGarments, newGarment]);
    setQuantity(1);
    setSelectedGarmentId('');
    setMessage('');
  };

  const handleRemoveGarment = (id) => {
    setSelectedGarments(selectedGarments.filter((g) => g.id !== id));
  };

  const calculateTotal = () => {
    return selectedGarments.reduce((sum, garment) => sum + garment.total, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.customerName || !formData.phoneNumber) {
      setMessage('Please fill in customer name and phone number');
      setMessageType('error');
      return;
    }

    if (selectedGarments.length === 0) {
      setMessage('Please add at least one garment');
      setMessageType('error');
      return;
    }

    setLoading(true);
    try {
      const orderData = {
        customerName: formData.customerName,
        phoneNumber: formData.phoneNumber,
        garments: selectedGarments.map((g) => ({
          garmentId: g.garmentId,
          quantity: g.quantity,
        })),
        totalBill: calculateTotal(),
      };

      const response = await fetch(\`\${API_BASE}/orders\`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        throw new Error('Failed to create order');
      }

      const result = await response.json();
      setMessage(\`Order created successfully! Order ID: \${result.id}\`);
      setMessageType('success');
      setFormData({ customerName: '', phoneNumber: '' });
      setSelectedGarments([]);
    } catch (error) {
      setMessage('Error creating order: ' + error.message);
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const totalBill = calculateTotal();

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Create New Order</h2>

      {message && (
        <div style={styles[\`alert-\${messageType}\`]}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.section}>
          <h3>Customer Details</h3>
          <input
            type="text"
            name="customerName"
            placeholder="Customer Name"
            value={formData.customerName}
            onChange={handleInputChange}
            style={styles.input}
            required
          />
          <input
            type="tel"
            name="phoneNumber"
            placeholder="Phone Number"
            value={formData.phoneNumber}
            onChange={handleInputChange}
            style={styles.input}
            required
          />
        </div>

        <div style={styles.section}>
          <h3>Add Garments</h3>
          <div style={styles.garmentSelector}>
            <select
              value={selectedGarmentId}
              onChange={(e) => setSelectedGarmentId(e.target.value)}
              style={styles.input}
            >
              <option value="">Select a garment</option>
              {pricingData.map((garment) => (
                <option key={garment.id} value={garment.id}>
                  {garment.name} - \${\`garment.price.toFixed(2)\`}
                </option>
              ))}
            </select>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              style={{ ...styles.input, width: '100px' }}
              placeholder="Qty"
            />
            <button
              type="button"
              onClick={handleAddGarment}
              style={styles.buttonSecondary}
            >
              Add Garment
            </button>
          </div>
        </div>

        {selectedGarments.length > 0 && (
          <div style={styles.section}>
            <h3>Selected Garments</h3>
            <table style={styles.table}>
              <thead>
                <tr style={styles.tableHeader}>
                  <th>Garment</th>
                  <th>Price</th>
                  <th>Quantity</th>
                  <th>Total</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {selectedGarments.map((garment) => (
                  <tr key={garment.id} style={styles.tableRow}>
                    <td>{garment.name}</td>
                    <td>\${\`garment.price.toFixed(2)\`}</td>
                    <td>{garment.quantity}</td>
                    <td>\${\`garment.total.toFixed(2)\`}</td>
                    <td>
                      <button
                        type="button"
                        onClick={() => handleRemoveGarment(garment.id)}
                        style={styles.buttonDanger}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={styles.totalSection}>
              <h3>Total Bill: \${\`totalBill.toFixed(2)\`}</h3>
            </div>
          </div>
        )}

        <div style={styles.buttonContainer}>
          <button
            type="submit"
            disabled={loading || selectedGarments.length === 0}
            style={styles.buttonPrimary}
          >
            {loading ? 'Creating Order...' : 'Create Order'}
          </button>
        </div>
      </form>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '600px',
    margin: '20px auto',
    padding: '20px',
    backgroundColor: '#f5f5f5',
    borderRadius: '8px',
  },
  title: {
    textAlign: 'center',
    color: '#333',
    marginBottom: '20px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  section: {
    backgroundColor: '#fff',
    padding: '15px',
    borderRadius: '6px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  input: {
    width: '100%',
    padding: '10px',
    marginBottom: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    boxSizing: 'border-box',
  },
  garmentSelector: {
    display: 'flex',
    gap: '10px',
    alignItems: 'flex-start',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '10px',
  },
  tableHeader: {
    backgroundColor: '#f0f0f0',
    fontWeight: 'bold',
    borderBottom: '2px solid #ddd',
  },
  tableRow: {
    borderBottom: '1px solid #ddd',
  },
  'alert-success': {
    backgroundColor: '#d4edda',
    color: '#155724',
    padding: '12px',
    borderRadius: '4px',
    marginBottom: '15px',
    border: '1px solid #c3e6cb',
  },
  'alert-error': {
    backgroundColor: '#f8d7da',
    color: '#721c24',
    padding: '12px',
    borderRadius: '4px',
    marginBottom: '15px',
    border: '1px solid #f5c6cb',
  },
  buttonContainer: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'center',
  },
  buttonPrimary: {
    backgroundColor: '#007bff',
    color: '#fff',
    padding: '10px 20px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '16px',
  },
  buttonSecondary: {
    backgroundColor: '#6c757d',
    color: '#fff',
    padding: '10px 15px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  buttonDanger: {
    backgroundColor: '#dc3545',
    color: '#fff',
    padding: '5px 10px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
  },
  totalSection: {
    marginTop: '15px',
    padding: '10px',
    backgroundColor: '#e7f3ff',
    borderRadius: '4px',
    textAlign: 'right',
  },
};
`;

// OrdersList.jsx
const ordersListContent = `import React, { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:5000/api';

const STATUS_OPTIONS = ['RECEIVED', 'PROCESSING', 'READY', 'DELIVERED'];

export default function OrdersList() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    customerName: '',
    phoneNumber: '',
  });
  const [updatingOrderId, setUpdatingOrderId] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, [filters]);

  const fetchOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const queryParams = new URLSearchParams();
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.customerName) queryParams.append('customerName', filters.customerName);
      if (filters.phoneNumber) queryParams.append('phoneNumber', filters.phoneNumber);

      const response = await fetch(\`\${API_BASE}/orders?\${queryParams}\`);
      if (!response.ok) throw new Error('Failed to fetch orders');
      const data = await response.json();
      setOrders(data);
    } catch (err) {
      setError('Error fetching orders: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    setUpdatingOrderId(orderId);
    try {
      const response = await fetch(\`\${API_BASE}/orders/\${orderId}/status\`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error('Failed to update status');
      
      setOrders(orders.map((order) =>
        order.id === orderId ? { ...order, status: newStatus } : order
      ));
    } catch (err) {
      setError('Error updating order: ' + err.message);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Manage Orders</h2>

      {error && <div style={styles['alert-error']}>{error}</div>}

      <div style={styles.filtersSection}>
        <h3>Filters</h3>
        <div style={styles.filtersGrid}>
          <input
            type="text"
            name="customerName"
            placeholder="Customer Name"
            value={filters.customerName}
            onChange={handleFilterChange}
            style={styles.filterInput}
          />
          <input
            type="tel"
            name="phoneNumber"
            placeholder="Phone Number"
            value={filters.phoneNumber}
            onChange={handleFilterChange}
            style={styles.filterInput}
          />
          <select
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
            style={styles.filterInput}
          >
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
          <button onClick={() => setFilters({ status: '', customerName: '', phoneNumber: '' })} style={styles.buttonSecondary}>
            Clear Filters
          </button>
        </div>
      </div>

      {loading ? (
        <p style={styles.loadingText}>Loading orders...</p>
      ) : orders.length === 0 ? (
        <p style={styles.noDataText}>No orders found.</p>
      ) : (
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.tableHeader}>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Phone</th>
                <th>Total Bill</th>
                <th>Status</th>
                <th>Created Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} style={styles.tableRow}>
                  <td>{order.id}</td>
                  <td>{order.customerName}</td>
                  <td>{order.phoneNumber}</td>
                  <td>\${\`order.totalBill?.toFixed(2) || '0.00'\`}</td>
                  <td style={styles[(\`status-\${order.status.toLowerCase()}\`)]}>{order.status}</td>
                  <td>{formatDate(order.createdAt)}</td>
                  <td>
                    <select
                      value={order.status}
                      onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                      disabled={updatingOrderId === order.id}
                      style={styles.statusSelect}
                    >
                      {STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '1000px',
    margin: '20px auto',
    padding: '20px',
    backgroundColor: '#f5f5f5',
    borderRadius: '8px',
  },
  title: {
    textAlign: 'center',
    color: '#333',
    marginBottom: '20px',
  },
  'alert-error': {
    backgroundColor: '#f8d7da',
    color: '#721c24',
    padding: '12px',
    borderRadius: '4px',
    marginBottom: '15px',
    border: '1px solid #f5c6cb',
  },
  filtersSection: {
    backgroundColor: '#fff',
    padding: '15px',
    marginBottom: '20px',
    borderRadius: '6px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  filtersGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr 1fr',
    gap: '10px',
    marginTop: '10px',
  },
  filterInput: {
    padding: '8px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
  },
  tableContainer: {
    backgroundColor: '#fff',
    borderRadius: '6px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  tableHeader: {
    backgroundColor: '#f0f0f0',
    fontWeight: 'bold',
    borderBottom: '2px solid #ddd',
  },
  tableRow: {
    borderBottom: '1px solid #ddd',
  },
  statusSelect: {
    padding: '5px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '12px',
  },
  'status-received': {
    color: '#0c5460',
    backgroundColor: '#d1ecf1',
    padding: '5px 10px',
    borderRadius: '4px',
  },
  'status-processing': {
    color: '#856404',
    backgroundColor: '#fff3cd',
    padding: '5px 10px',
    borderRadius: '4px',
  },
  'status-ready': {
    color: '#155724',
    backgroundColor: '#d4edda',
    padding: '5px 10px',
    borderRadius: '4px',
  },
  'status-delivered': {
    color: '#383d41',
    backgroundColor: '#e2e3e5',
    padding: '5px 10px',
    borderRadius: '4px',
  },
  loadingText: {
    textAlign: 'center',
    padding: '20px',
    color: '#666',
  },
  noDataText: {
    textAlign: 'center',
    padding: '20px',
    color: '#999',
    backgroundColor: '#fff',
    borderRadius: '6px',
  },
  buttonSecondary: {
    backgroundColor: '#6c757d',
    color: '#fff',
    padding: '8px 15px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
  },
};
`;

// Dashboard.jsx
const dashboardContent = `import React, { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:5000/api';

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
        fetch(\`\${API_BASE}/dashboard\`),
        fetch(\`\${API_BASE}/orders?limit=5\`),
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

  const formatCurrency = (value) => {
    return typeof value === 'number' ? \`\${\`value.toFixed(2)\`}\` : '\$0.00';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return <div style={styles.center}>Loading dashboard...</div>;
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles['alert-error']}>{error}</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Dashboard</h1>

      <div style={styles.metricsGrid}>
        <div style={styles.metricCard}>
          <h3 style={styles.metricLabel}>Total Orders</h3>
          <p style={styles.metricValue}>{dashboardData?.totalOrders || 0}</p>
        </div>

        <div style={styles.metricCard}>
          <h3 style={styles.metricLabel}>Total Revenue</h3>
          <p style={styles.metricValue}>{formatCurrency(dashboardData?.totalRevenue)}</p>
        </div>
      </div>

      <div style={styles.statusBreakdownSection}>
        <h2 style={styles.sectionTitle}>Orders by Status</h2>
        <div style={styles.statusGrid}>
          {dashboardData?.statusBreakdown && Object.entries(dashboardData.statusBreakdown).map(([status, count]) => (
            <div key={status} style={{ ...styles.statusCard, ...styles[(\`status-\${status.toLowerCase()}\`)] }}>
              <h4>{status}</h4>
              <p style={styles.statusCount}>{count}</p>
            </div>
          ))}
        </div>
      </div>

      <div style={styles.recentOrdersSection}>
        <h2 style={styles.sectionTitle}>Recent Orders</h2>
        {recentOrders.length === 0 ? (
          <p style={styles.noDataText}>No orders yet.</p>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr style={styles.tableHeader}>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => (
                <tr key={order.id} style={styles.tableRow}>
                  <td>{order.id}</td>
                  <td>{order.customerName}</td>
                  <td>{formatCurrency(order.totalBill)}</td>
                  <td style={styles[(\`status-\${order.status.toLowerCase()}\`)]}>{order.status}</td>
                  <td>{formatDate(order.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div style={styles.refreshContainer}>
        <button onClick={fetchDashboardData} style={styles.buttonPrimary}>
          Refresh Dashboard
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '20px auto',
    padding: '20px',
    backgroundColor: '#f5f5f5',
  },
  center: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    color: '#666',
  },
  title: {
    textAlign: 'center',
    color: '#333',
    marginBottom: '30px',
    fontSize: '28px',
  },
  'alert-error': {
    backgroundColor: '#f8d7da',
    color: '#721c24',
    padding: '12px',
    borderRadius: '4px',
    border: '1px solid #f5c6cb',
    marginBottom: '15px',
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px',
    marginBottom: '30px',
  },
  metricCard: {
    backgroundColor: '#fff',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    textAlign: 'center',
  },
  metricLabel: {
    color: '#666',
    marginBottom: '10px',
    fontSize: '14px',
  },
  metricValue: {
    color: '#007bff',
    fontSize: '32px',
    fontWeight: 'bold',
    margin: 0,
  },
  sectionTitle: {
    color: '#333',
    marginBottom: '15px',
    fontSize: '18px',
  },
  statusBreakdownSection: {
    marginBottom: '30px',
  },
  statusGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '15px',
  },
  statusCard: {
    padding: '15px',
    borderRadius: '6px',
    textAlign: 'center',
    color: '#fff',
  },
  statusCount: {
    fontSize: '24px',
    fontWeight: 'bold',
    margin: 0,
  },
  'status-received': {
    backgroundColor: '#0c5460',
  },
  'status-processing': {
    backgroundColor: '#856404',
  },
  'status-ready': {
    backgroundColor: '#155724',
  },
  'status-delivered': {
    backgroundColor: '#383d41',
  },
  recentOrdersSection: {
    backgroundColor: '#fff',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    marginBottom: '20px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  tableHeader: {
    backgroundColor: '#f0f0f0',
    fontWeight: 'bold',
    borderBottom: '2px solid #ddd',
  },
  tableRow: {
    borderBottom: '1px solid #ddd',
  },
  noDataText: {
    textAlign: 'center',
    padding: '20px',
    color: '#999',
  },
  refreshContainer: {
    textAlign: 'center',
  },
  buttonPrimary: {
    backgroundColor: '#007bff',
    color: '#fff',
    padding: '10px 20px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '16px',
  },
};
`;

// Write files
const files = [
  { path: path.join(componentsDir, 'OrderForm.jsx'), content: orderFormContent },
  { path: path.join(componentsDir, 'OrdersList.jsx'), content: ordersListContent },
  { path: path.join(componentsDir, 'Dashboard.jsx'), content: dashboardContent },
];

files.forEach((file) => {
  fs.writeFileSync(file.path, file.content, 'utf-8');
  console.log(\`✓ Created file: \${file.path}\`);
});

console.log('\n✅ All components created successfully!');
console.log(\`\nComponents created in: \${componentsDir}\`);
console.log('Files:');
files.forEach((file) => {
  console.log(\`  - \${path.basename(file.path)}\`);
});
