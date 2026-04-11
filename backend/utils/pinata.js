// backend/utils/pinata.js
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_API_SECRET = process.env.PINATA_API_SECRET;

const uploadFileToPinata = async (fileSource, fileName, mimeType) => {
  try {
    console.log('🔼 Pinata upload starting:', { fileName, mimeType, type: Buffer.isBuffer(fileSource) ? 'buffer' : 'path' });
    
    const data = new FormData();

    if (Buffer.isBuffer(fileSource)) {
      data.append('file', fileSource, {
        filename: fileName || 'upload',
        contentType: mimeType || 'application/octet-stream',
        knownLength: fileSource.length,
      });
    } else {
      data.append('file', fs.createReadStream(fileSource), {
        filename: fileName || path.basename(fileSource),
        contentType: mimeType || 'application/octet-stream',
      });
    }

    const res = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', data, {
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
      headers: {
        ...data.getHeaders(),
        pinata_api_key: PINATA_API_KEY,
        pinata_secret_api_key: PINATA_API_SECRET,
      },
    });

    console.log(`✅ Pinata CID for "${fileName}":`, res.data.IpfsHash);
    return res.data.IpfsHash;
  } catch (err) {
    console.error('❌ Pinata upload FAILED');
    console.error('   Status:', err.response?.status);
    console.error('   Pinata response:', JSON.stringify(err.response?.data, null, 2));
    throw new Error(err.response?.data?.error || err.message || 'Pinata upload failed');
  }
};

module.exports = { uploadFileToPinata };