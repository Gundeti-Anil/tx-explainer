const express = require('express');
const axios = require('axios');
const cors = require('cors');
const Groq = require('groq-sdk');
require('dotenv').config();

const { lookupSelector, containsMaxApproval } = require('./selectors');
const { buildPrompt } = require('./prompt');

const app = express();
app.use(cors());
app.use(express.json());

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const ETHERSCAN_BASE = 'https://api.etherscan.io/v2/api';

// ---------- Step 1: fetch + lightly decode tx data from Etherscan ----------
async function getTxData(txHash) {
  const key = process.env.ETHERSCAN_API_KEY;

  const txRes = await axios.get(ETHERSCAN_BASE, {
  params: {
    chainid: 1,
    module: 'proxy',
    action: 'eth_getTransactionByHash',
    txhash: txHash,
    apikey: key,
  },
  });
  const tx = txRes.data.result;

  if (!tx || !tx.hash || !tx.from) {
    throw new Error('Transaction not found. Check the hash and make sure it is an Ethereum mainnet tx.');
  }

  // Try to identify the contract being called
  let contractName = 'Unknown / not a verified contract';
  let verified = false;
  if (tx.to) {
    try {
      const contractRes = await axios.get(ETHERSCAN_BASE, {
      params: {
        chainid: 1,
        module: 'contract',
        action: 'getsourcecode',
        address: tx.to,
        apikey: key,
      },
    });
      const info = contractRes.data.result && contractRes.data.result[0];
      if (info && info.ContractName) {
        contractName = info.ContractName || contractName;
        verified = info.SourceCode !== '';
      }
    } catch (e) {
      // non-fatal: contract lookup failed, continue with Unknown
      console.warn('Contract lookup failed:', e.message);
    }
  }

  const { selector, signature } = lookupSelector(tx.input);
  const maxApproval = containsMaxApproval(tx.input);

  return {
    chain: 'ethereum-mainnet',
    tx_hash: txHash,
    from: tx.from,
    to: tx.to,
    value_eth: parseInt(tx.value, 16) / 1e18,
    function_selector: selector,
    function_signature_guess: signature,
    contract_name: contractName,
    contract_verified: verified,
    contains_unlimited_approval_pattern: maxApproval,
    raw_input_data_length_bytes: tx.input ? (tx.input.length - 2) / 2 : 0,
  };
}

// ---------- Step 2: ask Claude to explain it ----------
async function explainTx(txData) {
  const prompt = buildPrompt(txData);

  const completion = await groq.chat.completions.create({
  model: 'openai/gpt-oss-120b',
  messages: [{ role: 'user', content: prompt }],
  response_format: { type: 'json_object' },
});

  const rawText = completion.choices[0].message.content.trim();

  try {
    return JSON.parse(rawText);
  } catch (e) {
    console.error('Failed to parse LLM response as JSON:', rawText);
    throw new Error('Could not parse AI response. Please try again.');
  }
}

// ---------- Routes ----------
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.post('/api/explain', async (req, res) => {
  try {
    const { txHash } = req.body;

    if (!txHash || typeof txHash !== 'string' || !/^0x[a-fA-F0-9]{64}$/.test(txHash)) {
      return res.status(400).json({ error: 'Invalid transaction hash format. Expected 0x followed by 64 hex characters.' });
    }

    const txData = await getTxData(txHash);
    const explanation = await explainTx(txData);

    res.json({ txData, explanation });
  } catch (err) {
    console.error('Error in /api/explain:', err.message);
    res.status(500).json({ error: err.message || 'Something went wrong.' });
  }
});

if (require.main === module) {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`);
    if (!process.env.GROQ_API_KEY) console.warn('  GROQ_API_KEY not set in .env');
    if (!process.env.ETHERSCAN_API_KEY) console.warn(' ETHERSCAN_API_KEY not set in .env');
  });
}

module.exports = app;
