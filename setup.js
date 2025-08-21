#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 WhatsApp Clone Setup Script');
console.log('===============================\n');

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(colors[color] + message + colors.reset);
}

function execCommand(command, cwd = process.cwd()) {
  try {
    execSync(command, { stdio: 'inherit', cwd });
    return true;
  } catch (error) {
    log(`❌ Failed to execute: ${command}`, 'red');
    return false;
  }
}

// Step 1: Check Node.js version
log('1️⃣  Checking Node.js version...', 'blue');
try {
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
  
  if (majorVersion >= 18) {
    log(`✅ Node.js ${nodeVersion} (OK)`, 'green');
  } else {
    log(`❌ Node.js ${nodeVersion} - Please upgrade to v18 or higher`, 'red');
    process.exit(1);
  }
} catch (error) {
  log('❌ Could not check Node.js version', 'red');
  process.exit(1);
}

// Step 2: Install dependencies
log('\n2️⃣  Installing dependencies...', 'blue');

log('Installing root dependencies...', 'yellow');
if (!execCommand('npm install')) {
  log('❌ Failed to install root dependencies', 'red');
  process.exit(1);
}

log('Installing backend dependencies...', 'yellow');
if (!execCommand('npm install', './backend')) {
  log('❌ Failed to install backend dependencies', 'red');
  process.exit(1);
}

log('Installing frontend dependencies...', 'yellow');
if (!execCommand('npm install', './frontend')) {
  log('❌ Failed to install frontend dependencies', 'red');
  process.exit(1);
}

log('✅ All dependencies installed successfully!', 'green');

// Step 3: Create environment files
log('\n3️⃣  Setting up environment files...', 'blue');

// Backend .env
const backendEnvPath = path.join(__dirname, 'backend', '.env');
if (!fs.existsSync(backendEnvPath)) {
  const backendEnvContent = `# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=whatsapp_clone
DB_USERNAME=postgres
DB_PASSWORD=password

# JWT Configuration
JWT_SECRET=whatsapp_clone_jwt_secret_${Math.random().toString(36).substring(7)}
JWT_EXPIRES_IN=7d

# Server Configuration
PORT=5000
NODE_ENV=development

# CORS Configuration
CLIENT_URL=http://localhost:3000
`;
  
  fs.writeFileSync(backendEnvPath, backendEnvContent);
  log('✅ Created backend/.env file', 'green');
} else {
  log('⚠️  Backend .env file already exists, skipping...', 'yellow');
}

// Frontend .env
const frontendEnvPath = path.join(__dirname, 'frontend', '.env');
if (!fs.existsSync(frontendEnvPath)) {
  const frontendEnvContent = `VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
`;
  
  fs.writeFileSync(frontendEnvPath, frontendEnvContent);
  log('✅ Created frontend/.env file', 'green');
} else {
  log('⚠️  Frontend .env file already exists, skipping...', 'yellow');
}

// Step 4: Database setup instructions
log('\n4️⃣  Database Setup Required', 'blue');
log('Before running the application, please:', 'yellow');
log('1. Install PostgreSQL if not already installed', 'yellow');
log('2. Create a database called "whatsapp_clone"', 'yellow');
log('3. Update the database credentials in backend/.env', 'yellow');
log('4. Run database migrations with: cd backend && npm run db:setup', 'yellow');

// Step 5: Final instructions
log('\n🎉 Setup Complete!', 'green');
log('\nNext steps:', 'blue');
log('1. Set up your PostgreSQL database (see step 4 above)', 'yellow');
log('2. Run migrations: cd backend && npm run db:setup', 'yellow');
log('3. Start the application: npm run dev', 'yellow');
log('4. Open http://localhost:3000 in your browser', 'yellow');

log('\nDemo accounts:', 'blue');
log('Email: john@example.com | Password: password123', 'yellow');
log('Email: jane@example.com | Password: password123', 'yellow');

log('\n📖 Check README.md for detailed documentation', 'blue');
log('🐛 Report issues at: https://github.com/your-repo/issues', 'blue');

log('\n✨ Happy coding!', 'green');

