// A small lookup table of common 4-byte function selectors.
// This lets us give the LLM a human-readable function name even when
// we don't have the full ABI for a contract (fast path for MVP demo).
// Selector = first 4 bytes (8 hex chars) of keccak256(function signature)

const SELECTORS = {
  '0x095ea7b3': 'approve(address spender, uint256 amount)',
  '0xa9059cbb': 'transfer(address recipient, uint256 amount)',
  '0x23b872dd': 'transferFrom(address sender, address recipient, uint256 amount)',
  '0x38ed1739': 'swapExactTokensForTokens(uint256 amountIn, uint256 amountOutMin, address[] path, address to, uint256 deadline)',
  '0x7ff36ab5': 'swapExactETHForTokens(uint256 amountOutMin, address[] path, address to, uint256 deadline)',
  '0x18cbafe5': 'swapExactTokensForETH(uint256 amountIn, uint256 amountOutMin, address[] path, address to, uint256 deadline)',
  '0x8803dbee': 'swapTokensForExactTokens(uint256 amountOut, uint256 amountInMax, address[] path, address to, uint256 deadline)',
  '0xfb3bdb41': 'swapETHForExactTokens(uint256 amountOut, address[] path, address to, uint256 deadline)',
  '0x42842e0e': 'safeTransferFrom(address from, address to, uint256 tokenId) [NFT]',
  '0xa22cb465': 'setApprovalForAll(address operator, bool approved) [NFT - grants operator control over ALL your NFTs]',
  '0xb88d4fde': 'safeTransferFrom(address from, address to, uint256 tokenId, bytes data) [NFT]',
  '0x2e1a7d4d': 'withdraw(uint256 wad)',
  '0xd0e30db0': 'deposit()',
  '0x3593564c': 'execute(bytes commands, bytes[] inputs, uint256 deadline) [Uniswap Universal Router]',
  '0x5c11d795': 'swapExactTokensForTokensSupportingFeeOnTransferTokens(...)',
  '0x022c0d9f': 'swap(uint256 amount0Out, uint256 amount1Out, address to, bytes data) [raw pair swap]',
  '0x6a761202': 'execTransaction(...) [Gnosis Safe multisig transaction]',
  '0x': '(no calldata - plain ETH transfer)',
};

// Known "infinite approval" magic number: 2^256 - 1
const MAX_UINT256 = '115792089237316195423570985008687907853269984665640564039457584007913129639935';

function lookupSelector(inputData) {
  if (!inputData || inputData === '0x') {
    return { selector: '0x', signature: SELECTORS['0x'] };
  }
  const selector = inputData.slice(0, 10); // '0x' + 8 hex chars
  return {
    selector,
    signature: SELECTORS[selector] || 'Unknown function (not in lookup table)',
  };
}

function containsMaxApproval(inputData) {
  if (!inputData) return false;
  // crude check: does the calldata contain the max uint256 hex pattern (all f's, 64 hex chars)?
  return /f{64}/i.test(inputData);
}

module.exports = { lookupSelector, containsMaxApproval, MAX_UINT256, SELECTORS };
