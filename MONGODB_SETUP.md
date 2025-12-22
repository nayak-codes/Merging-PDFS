# MongoDB Setup Guide - Quick Start

## Option 1: MongoDB Atlas (Cloud - Easiest, No Installation Needed!) ✅ RECOMMENDED

### Step 1: Create Free Account
1. Visit: https://www.mongodb.com/cloud/atlas/register
2. Sign up with email or Google
3. Choose "FREE" tier (M0 Sandbox)

### Step 2: Create Cluster
1. Select cloud provider (AWS recommended)
2. Choose region closest to you (e.g., Mumbai for India)
3. Click "Create Cluster" (takes 3-5 minutes)

### Step 3: Create Database User
1. Click "Database Access" in left menu
2. Click "Add New Database User"
3. Username: `pdfuser`
4. Password: `pdf123456` (or your own)
5. Select "Read and write to any database"
6. Click "Add User"

### Step 4: Whitelist IP Address
1. Click "Network Access" in left menu
2. Click "Add IP Address"
3. Click "Allow Access from Anywhere" (for development)
4. Click "Confirm"

### Step 5: Get Connection String
1. Go back to "Database" (left menu)
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Copy the connection string (looks like):
   ```
   mongodb+srv://pdfuser:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
5. Replace `<password>` with your actual password (e.g., `pdf123456`)

### Step 6: Update Backend .env File
Open: `p:\Merging PDFS\backend\.env`

Replace this line:
```env
MONGODB_URI=mongodb://localhost:27017/pdf-merger
```

With your Atlas connection string:
```env
MONGODB_URI=mongodb+srv://pdfuser:pdf123456@cluster0.xxxxx.mongodb.net/pdf-merger?retryWrites=true&w=majority
```

### Step 7: Restart Backend Server
```bash
# Stop the current backend server (Ctrl+C in backend terminal)
# Then restart:
npm run dev
```

✅ **DONE! Your app is now connected to MongoDB Atlas!**

---

## Option 2: Local MongoDB Installation (Advanced)

### For Windows:

#### Step 1: Download MongoDB
1. Visit: https://www.mongodb.com/try/download/community
2. Select: Windows, MSI package
3. Download and run installer

#### Step 2: Install MongoDB
1. Choose "Complete" installation
2. Install as a Windows Service (recommended)
3. Click "Install MongoDB Compass" (optional GUI tool)
4. Complete installation

#### Step 3: Verify Installation
Open Command Prompt and type:
```bash
mongod --version
```

If you see version info, it's installed!

#### Step 4: Start MongoDB
MongoDB should start automatically as a Windows service.

To start manually:
```bash
# Create data directory first (one time only)
mkdir p:\Merging PDFS\data

# Start MongoDB
mongod --dbpath "p:\Merging PDFS\data"
```

Keep this terminal running!

#### Step 5: Backend .env is Already Correct
The default setting works for local MongoDB:
```env
MONGODB_URI=mongodb://localhost:27017/pdf-merger
```

#### Step 6: Restart Backend
```bash
npm run dev
```

---

## How to Know if MongoDB is Connected?

When you start the backend (`npm run dev`), you should see:
```
✅ MongoDB connected successfully
🚀 Server running on port 5000
```

If you see this, you're ready to use the app!

---

## Common Errors and Fixes

### Error: "MongoServerError: Authentication failed"
**Fix**: Check your username/password in the connection string

### Error: "MongooseServerSelectionError"
**Fix**: 
- For Atlas: Check IP whitelist and internet connection
- For Local: Make sure `mongod` is running

### Error: "mongod is not recognized"
**Fix**: MongoDB not installed or not in PATH. Use Atlas instead (easier!)

---

## Recommended: Use MongoDB Atlas

✅ No installation needed  
✅ Free forever (512MB storage)  
✅ Automatic backups  
✅ Works from anywhere  
✅ Better for deployment later  

It takes only 5 minutes to setup!

---

## Testing Your Connection

Once backend is running with MongoDB connected:

1. Open browser: http://localhost:5173
2. Register a new account
3. If registration works → MongoDB is connected! ✅

---

## Need Help?

**MongoDB Atlas official guide:**  
https://www.mongodb.com/docs/atlas/getting-started/

**Video Tutorial (Hindi):**  
Search YouTube: "MongoDB Atlas Setup Hindi"
