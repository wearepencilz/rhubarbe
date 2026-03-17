import { NextResponse } from 'next/server';
import os from 'os';

export async function GET() {
  const ip = getLocalNetworkIP();
  return NextResponse.json({ ip });
}

function getLocalNetworkIP(): string | null {
  const interfaces = os.networkInterfaces();
  
  for (const name of Object.keys(interfaces)) {
    const addresses = interfaces[name];
    if (!addresses) continue;
    
    for (const addr of addresses) {
      if (addr.family === 'IPv4' && !addr.internal && !addr.address.startsWith('127.')) {
        if (/^(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/.test(addr.address)) {
          return addr.address;
        }
      }
    }
  }
  
  return null;
}
