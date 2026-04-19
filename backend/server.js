import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const DATA_FILE = path.join(__dirname, 'data', 'orders.json');

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// CORS configuration for deployment
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://laundry-order-system-frontend.vercel.app',
  'https://laundry-frontend.onrender.com',
  'http://localhost:5000'
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl requests)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all during development/deployment
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Pricing configuration with categories
const PRICING = {
  'Men': {
    'Shirt': 100,
    'Pants': 150,
    'Jacket': 250,
    'T-Shirt': 80,
    'Blazer': 300,
    'Underwear': 50
  },
  'Women': {
    'Saree': 200,
    'Suit': 180,
    'Dupatta': 80,
    'Kurta': 120,
    'Palazzo': 130,
    'Bra': 70
  },
  'Kids': {
    'Shirt': 70,
    'Pants': 90,
    'Frock': 100,
    'T-Shirt': 60,
    'Shorts': 80,
    'Dress': 110
  },
  'General': {
    'Bedsheet': 120,
    'Towel': 50,
    'Curtains': 150,
    'Blanket': 180
  }
};

// Helper functions
function loadOrders() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading orders:', error);
  }
  return [];
}

function saveOrders(orders) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(orders, null, 2));
  } catch (error) {
    console.error('Error saving orders:', error);
  }
}

// API Routes

// 1. Create Order
app.post('/api/orders', (req, res) => {
  try {
    const { customerName, phoneNumber, garments } = req.body;

    if (!customerName || !phoneNumber || !garments || garments.length === 0) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Calculate total bill
    let totalBill = 0;
    garments.forEach(garment => {
      // Find price from categorized PRICING object
      let price = 0;
      for (const category in PRICING) {
        if (PRICING[category][garment.name]) {
          price = PRICING[category][garment.name];
          break;
        }
      }
      totalBill += price * garment.quantity;
    });

    const order = {
      id: uuidv4(),
      customerName,
      phoneNumber,
      garments,
      totalBill,
      status: 'RECEIVED',
      createdAt: new Date().toISOString(),
      deliveryDate: calculateDeliveryDate()
    };

    const orders = loadOrders();
    orders.push(order);
    saveOrders(orders);

    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Get All Orders (with filtering)
app.get('/api/orders', (req, res) => {
  try {
    const { status, customerName, phoneNumber } = req.query;
    let orders = loadOrders();

    if (status) {
      orders = orders.filter(o => o.status === status);
    }
    if (customerName) {
      orders = orders.filter(o => 
        o.customerName.toLowerCase().includes(customerName.toLowerCase())
      );
    }
    if (phoneNumber) {
      orders = orders.filter(o => o.phoneNumber === phoneNumber);
    }

    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Get Single Order
app.get('/api/orders/:id', (req, res) => {
  try {
    const orders = loadOrders();
    const order = orders.find(o => o.id === req.params.id);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Update Order Status
app.put('/api/orders/:id/status', (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['RECEIVED', 'PROCESSING', 'READY', 'DELIVERED'];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const orders = loadOrders();
    const orderIndex = orders.findIndex(o => o.id === req.params.id);

    if (orderIndex === -1) {
      return res.status(404).json({ error: 'Order not found' });
    }

    orders[orderIndex].status = status;
    saveOrders(orders);

    res.json(orders[orderIndex]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 5. Dashboard - Get metrics
app.get('/api/dashboard', (req, res) => {
  try {
    const orders = loadOrders();

    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, o) => sum + o.totalBill, 0);
    const ordersByStatus = {
      RECEIVED: orders.filter(o => o.status === 'RECEIVED').length,
      PROCESSING: orders.filter(o => o.status === 'PROCESSING').length,
      READY: orders.filter(o => o.status === 'READY').length,
      DELIVERED: orders.filter(o => o.status === 'DELIVERED').length
    };

    res.json({
      totalOrders,
      totalRevenue,
      ordersByStatus,
      recentOrders: orders.slice(-5).reverse()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 6. Get available garments and pricing
app.get('/api/pricing', (req, res) => {
  res.json(PRICING);
});

// 7. Delete Order (utility)
app.delete('/api/orders/:id', (req, res) => {
  try {
    let orders = loadOrders();
    const orderIndex = orders.findIndex(o => o.id === req.params.id);

    if (orderIndex === -1) {
      return res.status(404).json({ error: 'Order not found' });
    }

    orders = orders.filter(o => o.id !== req.params.id);
    saveOrders(orders);

    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper function to calculate delivery date (3 days from now)
function calculateDeliveryDate() {
  const date = new Date();
  date.setDate(date.getDate() + 3);
  return date.toISOString().split('T')[0];
}

// Start server
app.listen(PORT, () => {
  console.log(`🎉 Laundry Order Management API running on http://localhost:${PORT}`);
  console.log(`📚 Available endpoints:`);
  console.log(`   POST   /api/orders              - Create new order`);
  console.log(`   GET    /api/orders              - List orders (with filters)`);
  console.log(`   GET    /api/orders/:id          - Get single order`);
  console.log(`   PUT    /api/orders/:id/status   - Update order status`);
  console.log(`   GET    /api/dashboard           - Get dashboard metrics`);
  console.log(`   GET    /api/pricing             - Get pricing info`);
  console.log(`   DELETE /api/orders/:id          - Delete order`);
});
