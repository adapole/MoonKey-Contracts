import { ethers } from 'hardhat';
import { fillAndSign } from '../../test/UserOp';
import { EntryPoint__factory } from './typechains/EntryPoint__factory';
import { getHttpRpcClient } from './utils/getHttpRpcClient';
import { getUserOpReceipt } from './utils/getUserOpReceipt';
import * as dotenv from 'dotenv';
dotenv.config();

const entrypointAddress = '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789'; //EntryPoint
const accountAddress = '0x0E1c853Cc60f5f1bB4D6e830C8257b75672919d1'; //MoonKeyGnosisAccountFactory

async function main() {
  // getting argument: for executing transaction
  const args = process.argv.slice(2);
  const [token, to, value] = args;

  // setup provider and signer
  const provider = new ethers.providers.JsonRpcProvider(
    `https://bsc-testnet.nodereal.io/v1/${process.env.NODEREAL_API}`
  );
  const owner = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);

  // Get contracts to interacte with
  const entryPoint = new EntryPoint__factory(owner).attach(entrypointAddress);

  const accountFactory = new ethers.Contract(
    accountAddress,
    [
      'function getAddress(address owner, uint256 salt) public returns (address account)',
      'function safeSingleton() returns (address)',
    ],
    provider
  );

  const safeSingleton = new ethers.Contract(
    await accountFactory.callStatic.safeSingleton(),
    [
      'function executeAndRevert(address to, uint256 value, bytes calldata data, uint8 operation) external',
    ],
    provider
  );

  const erc20 = new ethers.Contract(
    token,
    ['function transfer(address to, uint amount) returns (bool)'],
    provider
  );

  // Build the execute field calldata
  const erc20Call = erc20.interface.encodeFunctionData('transfer', [to, value]);

  const safe_execTxCallData = safeSingleton.interface.encodeFunctionData(
    'executeAndRevert',
    [token, 0, erc20Call, 0]
  );

  // Fetch the ERC-4337 safe wallet address
  const counterfactualAddress = await accountFactory.callStatic.getAddress(
    owner.address,
    123
  );

  const op = await fillAndSign(
    {
      sender: counterfactualAddress, //The account
      callData: safe_execTxCallData,
    },
    owner,
    entryPoint
  );
  console.log('UserOp', op);

  // Send UserOperation to Bundler
  const client = await getHttpRpcClient(
    provider,
    process.env.BUNDLER_URL!,
    entrypointAddress
  );
  const uoHash = await client.sendUserOpToBundler(op);
  console.log(`UserOpHash: ${uoHash}`);

  console.log('Waiting for transaction...');

  // Retrive transaciton hash on completion
  const txHash = await getUserOpReceipt(
    provider,
    entrypointAddress,
    provider.getSigner(),
    uoHash
  );
  console.log(`Transaction hash: ${txHash}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
