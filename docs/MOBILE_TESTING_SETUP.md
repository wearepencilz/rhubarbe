# Mobile Testing Setup

## Your Mobile Development Server is Running!

The mobile server is already running and accessible on your local network.

## Access URLs

### On Your Computer
- Desktop: http://localhost:3001
- Admin CMS: http://localhost:3001/admin/login

### On Your Mobile Device (Same WiFi Network)
- Mobile Store: http://192.168.1.25:3001
- Admin CMS: http://192.168.1.25:3001/admin/login

## Quick Setup Steps

### 1. Connect Your Mobile Device
Make sure your phone/tablet is on the SAME WiFi network as your computer.

### 2. Open Browser on Mobile
Open Safari (iOS) or Chrome (Android) and navigate to:
```
http://192.168.1.25:3001
```

### 3. Test the Store
- Browse products
- Add to cart
- Test checkout flow
- Test responsive design

### 4. Test Admin Panel (Optional)
Navigate to:
```
http://192.168.1.25:3001/admin/login
```
Login: `admin` / `admin123`

## Commands

### Start Mobile Server
```bash
npm run dev:mobile
```

### Start Regular Server
```bash
npm run dev
```

### Both are currently running!

## Troubleshooting

### Can't Connect from Mobile?

1. **Check WiFi**: Ensure both devices are on the same network
2. **Check Firewall**: macOS Firewall might be blocking connections
   - Go to System Preferences → Security & Privacy → Firewall
   - Click "Firewall Options"
   - Make sure Node is allowed

3. **Find Your IP Again**:
   ```bash
   ifconfig | grep "inet " | grep -v 127.0.0.1
   ```

4. **Test Connection**:
   From your mobile browser, try:
   ```
   http://192.168.1.25:3001
   ```

### Server Not Responding?

Check if the server is running:
```bash
# See running processes
lsof -i :3001

# Restart mobile server
npm run dev:mobile
```

## PWA Testing

The app has PWA support! On mobile:

1. Visit http://192.168.1.25:3001
2. On iOS: Tap Share → Add to Home Screen
3. On Android: Tap Menu → Install App

## QR Code for Easy Access

You can generate a QR code for easy mobile access:

1. Go to: https://www.qr-code-generator.com/
2. Enter: `http://192.168.1.25:3001`
3. Scan with your phone's camera

## Features to Test on Mobile

- [ ] Homepage loads correctly
- [ ] Product images display properly
- [ ] Navigation menu works
- [ ] Cart functionality
- [ ] Checkout flow
- [ ] Touch interactions
- [ ] Scroll performance
- [ ] Form inputs (keyboard behavior)
- [ ] Image uploads (camera access)
- [ ] PWA installation
- [ ] Offline functionality (if implemented)

## Network Debugging

### View Mobile Console Logs

Use Safari Web Inspector (iOS) or Chrome DevTools (Android):

**iOS:**
1. Enable Web Inspector on iPhone: Settings → Safari → Advanced → Web Inspector
2. Connect iPhone to Mac via USB
3. Open Safari on Mac → Develop → [Your iPhone] → [Your Page]

**Android:**
1. Enable USB Debugging on Android
2. Connect to computer via USB
3. Open Chrome on computer → chrome://inspect
4. Click "Inspect" on your device

## Current Server Status

✅ Mobile server running on: http://192.168.1.25:3001
✅ Desktop server running on: http://localhost:3001
✅ Shopify API connected
✅ CMS admin accessible

## Notes

- The mobile server uses `-H 0.0.0.0` flag to bind to all network interfaces
- Your IP address may change if you reconnect to WiFi
- For production testing, deploy to Vercel and use the production URL
