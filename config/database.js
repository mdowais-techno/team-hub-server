import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const connectDB = async () => {
  try {
    console.log('🔄 Attempting to connect to MongoDB...');
    
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI not found in environment variables');
    }

    console.log('📍 MongoDB URI found, connecting...');
    
    // Disconnect any existing connections first
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      console.log('🔌 Disconnected existing MongoDB connection');
    }

    // Drop existing database to clear any duplicate indexes
    try {
      if (mongoose.connection.readyState === 1) {
        await mongoose.connection.db.dropDatabase();
        console.log('🗑️ Dropped existing database to clear duplicate indexes');
      }
    } catch (dropError) {
      console.log('ℹ️ No existing database to drop');
    }

    // Connect with minimal, stable options
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      minPoolSize: 5,
      maxIdleTimeMS: 30000,
      bufferCommands: false,
    });

    console.log(`✅ MongoDB Connected Successfully!`);
    console.log(`📊 Database: ${conn.connection.name}`);
    console.log(`🌐 Host: ${conn.connection.host}`);
    console.log(`🔗 Connection state: ${conn.connection.readyState}`);
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('🔄 MongoDB reconnected');
    });

    // Test the connection with a simple operation
    try {
      const admin = mongoose.connection.db.admin();
      const result = await admin.ping();
      console.log('🏓 MongoDB ping successful:', result);
    } catch (pingError) {
      console.warn('⚠️ MongoDB ping failed:', pingError.message);
    }

    return conn;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    
    // Provide helpful error messages based on error type
    if (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo')) {
      console.error('💡 Network Error: Cannot reach MongoDB server');
      console.error('   - Check your internet connection');
      console.error('   - Verify MongoDB Atlas cluster is running');
      console.error('   - Check if your IP is whitelisted in MongoDB Atlas');
    } else if (error.message.includes('authentication failed') || error.message.includes('auth')) {
      console.error('💡 Authentication Error: Invalid credentials');
      console.error('   - Check your MongoDB username and password');
      console.error('   - Verify the database name in the connection string');
    } else if (error.message.includes('timeout')) {
      console.error('💡 Timeout Error: Connection took too long');
      console.error('   - MongoDB server might be slow or unreachable');
      console.error('   - Try increasing timeout values');
    }
    
    // Don't exit the process, let the application handle the error
    throw error;
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed through app termination');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during MongoDB disconnection:', error);
    process.exit(1);
  }
});

export default connectDB;