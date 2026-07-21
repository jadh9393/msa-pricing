const express = require('express');
const multer = require('multer');
const axios = require('axios');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

const AI_ENDPOINT = 'https://sage.paastry.sysco.net/api/sysco-gen-ai-platform/agents/v1/content/generic/answer';

app.post('/extract', upload.single('file'), async (req, res) => {
  try {
    console.log('Received file:', req.file ? req.file.originalname : 'No file');
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded. Use field name "file".' });
    }

    // For multipart/form-data, multer puts text fields on req.body.
    const rawBatchSize = req.body.batchSize ?? req.body.batchsize;
    const batchSizeString = rawBatchSize == null ? '1' : String(rawBatchSize).trim();

    if (!/^\d+$/.test(batchSizeString) || Number(batchSizeString) <= 0) {
      return res.status(400).json({
        error: 'batchSize must be a positive integer form-data field (example: batchSize=3).',
      });
    }

    const batchSize = Number(batchSizeString);

    const encodedMedia = req.file.buffer.toString('base64');
    console.log('Encoded media length:', encodedMedia.length);

    console.log('File mimetype:', req.file.mimetype);

    console.log('encodedMedia (first 100 chars):', encodedMedia.substring(0, 100));

    const mediaType = req.file.mimetype || 'application/pdf';

    const payload = {
      ai_agent_id: '6a44b7fe948c44d89e9b74f3',
      user_query: 'extract msa pricing contract',
      configuration_environment: 'DEV',
      media_data: [
        {
          encoded_media: encodedMedia,
          media_type: mediaType,
        },
      ],
    };

    console.log(`Sending ${batchSize} request(s) to AI endpoint`);

    const requestPromises = Array.from({ length: batchSize }, (_, index) => {
      console.log(`Starting request ${index + 1}/${batchSize}`);
      return axios.post(AI_ENDPOINT, payload, {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'insomnium/1.3.0',
        },
        timeout: 300000,
      });
    });

    const settledResults = await Promise.allSettled(requestPromises);

    const responses = settledResults.map((result, index) => {
      if (result.status === 'fulfilled') {
        return {
          requestNumber: index + 1,
          status: result.value.status,
          data: result.value.data,
        };
      }

      const errorStatus = result.reason?.response?.status || 500;
      const errorData = result.reason?.response?.data || { error: result.reason?.message || 'Request failed' };

      return {
        requestNumber: index + 1,
        status: errorStatus,
        error: errorData,
      };
    });

    console.log('Batch completed');
    return res.status(200).json(responses);
  } catch (error) {
    console.error('Unhandled /extract error:', error.message);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

server.timeout = 360000;        // 360s socket timeout
server.keepAliveTimeout = 360000;
server.headersTimeout = 360000;
