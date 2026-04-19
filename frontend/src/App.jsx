import { useState } from 'react';
import OrderForm from './components/OrderForm';
import OrdersList from './components/OrdersList';
import Dashboard from './components/Dashboard';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="app">
      <header className="header">
        <h1>🧺 Laundry Order Management</h1>
        <p>Simple • Fast • Efficient</p>
      </header>

      <nav className="nav">
        <button
          className={`nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          📊 Dashboard
        </button>

        <button
          className={`nav-btn ${activeTab === 'create' ? 'active' : ''}`}
          onClick={() => setActiveTab('create')}
        >
          ➕ Create Order
        </button>

        <button
          className={`nav-btn ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          📋 Orders
        </button>
      </nav>

      <main className="main">
        <div className="container">
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'create' && (
            <OrderForm onOrderCreated={() => setActiveTab('orders')} />
          )}
          {activeTab === 'orders' && <OrdersList />}
        </div>
      </main>

      <footer className="footer">
        <h3>🧺 Laundry Manager</h3>
        <p>Making laundry simple and reliable</p>
        <p className="footer-copy">
          © {new Date().getFullYear()} • Built with React + Node.js
        </p>
      </footer>
    </div>
  );
}

export default App;