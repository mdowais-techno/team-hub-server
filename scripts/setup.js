import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure .env file exists
const envPath = path.join(__dirname, '../.env');
const envExamplePath = path.join(__dirname, '../.env.example');

if (!fs.existsSync(envPath) && fs.existsSync(envExamplePath)) {
  fs.copyFileSync(envExamplePath, envPath);
  console.log('✅ Created .env file from .env.example');
} else if (fs.existsSync(envPath)) {
  console.log('✅ .env file already exists');
} else {
  console.log('⚠️  No .env or .env.example file found');
}

// Check if node_modules exists
const nodeModulesPath = path.join(__dirname, '../node_modules');
if (!fs.existsSync(nodeModulesPath)) {
  console.log('⚠️  node_modules not found. Please run: npm install');
} else {
  console.log('✅ node_modules found');
}

console.log('🚀 Backend setup complete!');