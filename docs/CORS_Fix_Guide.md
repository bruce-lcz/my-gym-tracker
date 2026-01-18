# 🔧 CORS Error Fix Guide

## Problem

Your application is experiencing CORS (Cross-Origin Resource Sharing) errors when trying to access the Google Apps Script API from `http://localhost:5173`. This is because the browser blocks requests to different origins unless the server explicitly allows it.

## Solution

I've updated your Google Apps Script code (`AppScript_v2.gs`) with the necessary CORS headers.

## What Changed

### 1. Updated `response()` function

Added CORS headers to all API responses:

```javascript
function response(data) {
  const output = ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
  
  // Add CORS headers
  output.setHeader('Access-Control-Allow-Origin', '*');
  output.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  output.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  return output;
}
```

### 2. Added `doOptions()` handler

Handles CORS preflight requests (OPTIONS):

```javascript
function doOptions(e) {
  const output = ContentService.createTextOutput('');
  output.setHeader('Access-Control-Allow-Origin', '*');
  output.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  output.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  return output;
}
```

## 📋 Steps to Deploy the Fix

### Step 1: Update Your Google Apps Script

1. Go to your Google Apps Script project: <https://script.google.com>
2. Open your Gym Tracker project
3. **Copy the entire updated code** from `docs/AppScript_v2.gs` and paste it into your Apps Script editor, replacing all existing code
4. Click **Save** (💾 icon)

### Step 2: Deploy the New Version

1. Click **Deploy** → **Manage deployments**
2. Click the **✏️ Edit** icon (pencil) next to your active deployment
3. Under "Version", change from "Latest" to **New version**
4. Add a description (optional): "Added CORS support"
5. Click **Deploy**
6. Close the deployment dialog

### Step 3: Test

1. Go back to your application at `http://localhost:5173`
2. Refresh the page
3. The CORS errors should be gone and your workout packages should load successfully! ✅

## 🔒 Security Note

The current fix uses `Access-Control-Allow-Origin: '*'` which allows requests from **any origin**. This is fine for development, but if you want to restrict it to specific domains in production, you can modify the `response()` and `doOptions()` functions to use:

```javascript
output.setHeader('Access-Control-Allow-Origin', 'https://your-actual-domain.github.io');
```

## ✅ Expected Result

After deploying, you should see:

- ✅ No CORS errors in the browser console
- ✅ Workout packages loading successfully
- ✅ Successful sync with Google Sheets
- ✅ Console message: "Successfully synced X packages to Google Sheets"

## 🆘 Still Getting Errors?

If you're still seeing CORS errors after deployment:

1. **Hard refresh** your browser: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
2. **Clear cache** and reload
3. Verify you deployed a **new version** (not just saved)
4. Check that the Apps Script deployment URL hasn't changed (compare with your `.env.local` file)
