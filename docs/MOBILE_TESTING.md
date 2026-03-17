# Testing on Mobile Phone (Local Network)

## Setup

1. **Find your computer's local IP address:**

   **On Mac:**
   ```bash
   ifconfig | grep "inet " | grep -v 127.0.0.1
   ```
   Look for something like `192.168.1.x` or `10.0.0.x`

   **On Windows:**
   ```bash
   ipconfig
   ```
   Look for "IPv4 Address" under your WiFi adapter

2. **Start the dev server for mobile access:**
   ```bash
   npm run dev:mobile
   ```
   
   This will start Next.js on `0.0.0.0:3001` (accessible from other devices)

3. **On your phone (must be on same WiFi):**
   
   Open your browser and go to:
   ```
   http://YOUR_IP_ADDRESS:3001
   ```
   
   For example:
   ```
   http://192.168.1.100:3001
   ```

4. **To test the game:**
   ```
   http://YOUR_IP_ADDRESS:3001/game/[campaign-id]
   ```

## Features to Test

✅ Player details persist across game attempts (localStorage)
✅ Game works in portrait mode
✅ Touch controls work properly
✅ No need to re-enter name/phone after timeout or death
✅ PWA install prompt (Add to Home Screen)

## Troubleshooting

- **Can't connect?** Make sure both devices are on the same WiFi network
- **Firewall blocking?** You may need to allow port 3001 in your firewall
- **Still not working?** Try using your computer's hostname instead of IP:
  ```
  http://YOUR-COMPUTER-NAME.local:3001
  ```
