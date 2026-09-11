# 🔍 Explain This Transaction

An AI bot that takes any Ethereum transaction hash and explains, in plain
English, what it actually does — flagging risky patterns like unlimited
token approvals before you sign something bad.

No smart contract required. This is a read-only tool:

```
Frontend (React)  →  Backend (Node/Express)  →  Etherscan API (tx data)
                                              →  Groq API (explanation)
```

---

## 1. Prerequisites

- Node.js 18+ and npm installed (`node -v` to check)
- A **Groq API key** — https://console.groq.com/keys
- A free **Etherscan API key** — https://etherscan.io/apis (sign up, create an API key, free tier is enough)

---

## 2. Project structure

```
tx-explainer/
├── backend/
│   ├── server.js        # Express API server
│   ├── selectors.js      # Common function-selector lookup table
│   ├── prompt.js          # LLM prompt template
│   ├── package.json
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── App.js         # Main UI
    │   └── index.js
    ├── public/index.html
    ├── package.json
    └── .env.example
```

---

## 3. Backend setup

```bash
cd backend
npm install
cp .env.example .env
```

Open `.env` and fill in your keys:

```
GROQ_API_KEY=your_groq_api_key_here
ETHERSCAN_API_KEY=your_etherscan_key
PORT=3001
```

Run it:

```bash
npm start
```

You should see:

```
✅ Backend running on http://localhost:3001
```

Sanity check in a browser or with curl:

```bash
curl http://localhost:3001/api/health
# {"status":"ok"}
```

---

## 4. Frontend setup

Open a **second terminal**:

```bash
cd frontend
npm install
cp .env.example .env
npm start
```

This opens `http://localhost:3000` automatically in your browser.
(`.env` already points to `http://localhost:3001`, matching the backend —
no change needed unless you changed the backend port.)

---

## 5. Using it / demoing it

1. Go to https://etherscan.io/txs and copy any recent transaction hash
   (looks like `0x` followed by 64 hex characters), OR use one of these
   known interesting examples:

   - **A token approval tx** — search Etherscan for a recent `approve`
     transaction on the USDC or USDT contract page (Etherscan shows a
     "Method" column — pick one labeled `Approve`). These are great demo
     material because unlimited approvals trigger a MEDIUM/HIGH risk flag.
   - **A simple ETH transfer** — any plain transaction with no contract
     interaction, "Method" column blank/"Transfer".
   - **A Uniswap swap** — search a Uniswap V2/V3 router address on
     Etherscan and grab one of its recent transactions.

2. Paste the hash into the input box on `localhost:3000` and click **Explain**.

3. The app will show:
   - A **risk badge** (LOW / MEDIUM / HIGH)
   - A **plain-English summary** of what the transaction does
   - **Key actions** (e.g. "Approves USDC spending", "Sends 0.5 ETH")
   - **Risk reasons** if any (e.g. "Grants unlimited spending approval")
   - Collapsible **raw transaction data** for the technically curious

### Good demo flow
Show 2 contrasting transactions back to back:
1. A plain ETH transfer → LOW risk, clean summary.
2. An `approve` call with max uint256 amount → MEDIUM/HIGH risk, with the
   tool explicitly flagging "unlimited approval" — this is the "wow" moment
   since it's the exact pattern behind most wallet-drainer scams.

---

## 6. Troubleshooting

| Problem | Fix |
|---|---|
| `GROQ_API_KEY not set` warning on backend start | Check `.env` exists in `backend/` and the key has no quotes/spaces |
| `Transaction not found` error | Make sure you're using an **Ethereum mainnet** tx hash, not testnet, and it's a full 66-character hash (0x + 64 hex chars) |
| CORS error in browser console | Confirm backend is running on port 3001 and frontend `.env` `REACT_APP_API_URL` matches it |
| Etherscan rate limit error | Free tier is 5 calls/sec — wait a few seconds between tries |
| `Could not parse AI response` error | Rare — just retry; the prompt forces strict JSON but occasionally needs a retry |

---

