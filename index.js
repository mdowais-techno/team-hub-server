import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';
 
// Load environment variables
dotenv.config();

// Import database connection
import connectDB from './config/database.js';

// Import routes
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import departmentRoutes from './routes/departmentRoutes.js';
import jobProfileRoutes from './routes/jobProfileRoutes.js';
import employeeRoutes from './routes/employeeRoutes.js';
import documentRoutes from './routes/documentRoutes.js';
import onboardingRoutes from './routes/onboardingRoutes.js';
import onboardingTemplate from './routes/onBoardingTemplateRoutes.js';
import trainingRoutes from './routes/trainingRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import payrollRoutes from './routes/payrollRoutes.js';


const app = express();
const PORT = process.env.PORT || 5001;

console.log('🔧 Server Configuration:');
console.log('   - Port:', PORT);
console.log('   - Environment:', process.env.NODE_ENV || 'development');
console.log('   - MongoDB URI available:', !!process.env.MONGODB_URI);

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false
}));
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/', limiter);

// CORS configuration
// app.use(cors({
//   origin: process.env.NODE_ENV === 'production' 
//     ? ['https://your-domain.com'] 
//     : ['http://localhost:3000', 'http://localhost:5173', process.env.FRONTEND_URL],
//   credentials: true,
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
//   allowedHeaders: ['Content-Type', 'Authorization']
// }));

app.use(cors({
  origin: '*', // Allows all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Health check endpoint (before database connection)
app.get('/api/health', async (req, res) => {
  try {
    const mongoose = await import('mongoose');
    const dbStatus = mongoose.default.connection.readyState === 1 ? 'Connected' : 'Disconnected';
    
    res.json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      mongodb: dbStatus,
      environment: process.env.NODE_ENV || 'development',
      port: PORT,
      connectionState: mongoose.default.connection.readyState,
      server: 'Team Hub Backend'
    });
  } catch (error) {
    res.status(500).json({
      status: 'Error',
      mongodb: 'Error checking connection',
      error: error.message
    });
  }
});

// Test endpoint to check environment variables
app.get('/api/test-env', (req, res) => {
  res.json({
    hasMongoUri: !!process.env.MONGODB_URI,
    mongoUriStart: process.env.MONGODB_URI ? process.env.MONGODB_URI.substring(0, 30) + '...' : 'Not found',
    nodeEnv: process.env.NODE_ENV || 'development',
    port: PORT,
    jwtSecret: process.env.JWT_SECRET ? 'Set' : 'Not set'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/job-profiles', jobProfileRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/onboarding-template', onboardingTemplate);
app.use('/api/training', trainingRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/payroll', payrollRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Global error:', err);
  
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      error: 'Validation Error',
      details: errors
    });
  }
  
  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({
      error: 'Duplicate Error',
      message: `${field} already exists`
    });
  }
  
  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Invalid token'
    });
  }
  
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Token expired'
    });
  }
  
  // Default error
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// Create admin user function
const createAdminUser = async () => {
  try {
    const User = (await import('./models/User.js')).default;
    
    const adminExists = await User.findOne({ email: 'admin@teamhub.com' });
    if (!adminExists) {
      const adminUser = new User({
        name: 'Admin User',
        email: 'admin@teamhub.com',
        password: 'password',
        role: 'admin',
        status: 'active',
        isEmailVerified: true
      });
      
      await adminUser.save();
      console.log('👤 Admin user created successfully');
      console.log('📧 Email: admin@teamhub.com');
      console.log('🔑 Password: password');
    } else {
      console.log('👤 Admin user already exists');
    }
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
  }
};

// Start server function
const startServer = async () => {
  try {
    console.log('🚀 Starting Team Hub Backend Server...');
    console.log('📍 Environment:', process.env.NODE_ENV || 'development');
    console.log('🌐 Target Port:', PORT);
    
    // Start the server first
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`✅ Server successfully started on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
      console.log(`🧪 Test env: http://localhost:${PORT}/api/test-env`);
      console.log('🎉 Server is ready to accept connections!');
    });
    
    // Handle server startup errors
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use`);
        console.log('💡 Try using a different port or stop the process using this port');
        process.exit(1);
      } else {
        console.error('❌ Server error:', error);
        process.exit(1);
      }
    });
    
    // Then try to connect to database
    console.log('🔌 Attempting database connection...');
    try {
      await connectDB();
      console.log('✅ Database connection established successfully');
      
      // Create admin user after successful connection
      await createAdminUser();
    } catch (dbError) {
      console.error('❌ Database connection failed:', dbError.message);
      console.log('⚠️  Server will continue running without database');
      console.log('💡 You can still access the health check endpoint');
      console.log('🔧 Please check your MongoDB connection and try again');
    }
    
    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('🛑 SIGTERM received, shutting down gracefully');
      server.close(() => {
        console.log('💤 Process terminated');
      });
    });
    
    process.on('SIGINT', () => {
      console.log('🛑 SIGINT received, shutting down gracefully');
      server.close(() => {
        console.log('💤 Process terminated');
      });
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();