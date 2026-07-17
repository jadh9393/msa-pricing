const express = require('express');
const multer = require('multer');
const axios = require('axios');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

const AI_ENDPOINT = 'https://sage.paastry.sysco.net/api/sysco-gen-ai-platform/agents/v1/content/generic/answer';

app.post('/extract', upload.single('file'), async (req, res) => {
    console.log('Received file:', req.file ? req.file.originalname : 'No file');
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded. Use field name "file".' });
  }

  const encodedMedia = req.file.buffer.toString('base64');
  console.log('Encoded media length:', encodedMedia.length);

  console.log('File mimetype:', req.file.mimetype);

  console.log('encodedMedia (first 100 chars):', encodedMedia.substring(0, 100));

  const mediaType = req.file.mimetype || 'application/pdf';

  const payload = {
    ai_agent_id: '6a44b7fe948c44d89e9b74f3',
    // user_query: 'extract the data as mentioned in the prompt',extract msa pricing contract
    user_query: 'extract msa pricing contract',
    configuration_environment: 'STAGING',
    media_data: [
      {
        encoded_media: encodedMedia,
        media_type: mediaType,
      },
    ],
  };

  console.log("sending request to AI endpoint");
  const response = await axios.post(AI_ENDPOINT, payload, {
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'insomnium/1.3.0',
    },
    timeout: 300000,
  });

  console.log('AI endpoint response status:', response.status);
  console.log('AI endpoint response data:', JSON.stringify(response.data));
  return res.status(response.status).json(response.data);
});

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

server.timeout = 360000;        // 360s socket timeout
server.keepAliveTimeout = 360000;
server.headersTimeout = 360000;
