import QRCode from 'qrcode';

/**
 * Generate QR code for reward claim
 * Returns data URL that can be displayed directly in img src
 */
export async function generateQRCode(claimCode: string, campaignId: string): Promise<string> {
  try {
    // Create claim URL that can be scanned
    const claimUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001'}/admin/games/${campaignId}/claim/${claimCode}`;
    
    // Generate QR code as data URL
    const qrDataUrl = await QRCode.toDataURL(claimUrl, {
      errorCorrectionLevel: 'H', // High error correction
      type: 'image/png',
      margin: 2,
      width: 300,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });
    
    return qrDataUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
}

/**
 * Generate simple 6-character claim code
 * Format: ABC123 (3 letters + 3 numbers)
 */
export function generateSimpleClaimCode(): string {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // Removed I, O to avoid confusion
  const numbers = '23456789'; // Removed 0, 1 to avoid confusion
  
  let code = '';
  
  // 3 random letters
  for (let i = 0; i < 3; i++) {
    code += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  
  // 3 random numbers
  for (let i = 0; i < 3; i++) {
    code += numbers.charAt(Math.floor(Math.random() * numbers.length));
  }
  
  return code;
}
