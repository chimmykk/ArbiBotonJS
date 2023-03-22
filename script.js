const Web3 = require('web3');
const { default: axios } = require('axios');

const { ethers } = require('ethers');
require('dotenv').config();
const RPC = process.env.RPC;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const SAFE_ADDRESS = process.env.SAFE_ADDRESS;

const web3 = new Web3(RPC);
let abi;
try {
  abi = require('./abi.json');
} catch (error) {
  console.error('Error loading ABI:', error);
  process.exit(1);
}
async function send(key, receiver) {
  const acct = new ethers.Wallet(key);
  const contractAddress = '0x912CE59144191C1204E64559FE8253a0e49E6548'; // Arbitrum Contract Address
  const tokenContract = new web3.eth.Contract(abi, contractAddress);
  const tokenBalance = await tokenContract.methods.balanceOf(acct.address).call();
  console.log(tokenBalance);
  if (tokenBalance > 0) {
    const nonce = await web3.eth.getTransactionCount(acct.address);
    const data = '0xa9059cbb' + receiver.slice(2).padStart(64, '0') + ethers.utils.hexZeroPad(tokenBalance.toString(16), 64).slice(2);
    const tx = {
      from: acct.address,
      chainId: 42161,
      nonce: nonce,
      to: contractAddress,
      data: data,
      gas: 1000000,
      value: 0,
      gasPrice: web3.utils.toWei('0.1', 'gwei')
    };
    const signedTx = await acct.signTransaction(tx);
    await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
  }
}

(async () => {
  while (true) {
    try {
      await send(PRIVATE_KEY, SAFE_ADDRESS);
    } catch (err) {
      console.error('Error Transfer I will try again...');
      console.error(err);
    }
    await new Promise(resolve => setTimeout(resolve, 60000)); // Wait for 1 minute before trying again
  }
})();
