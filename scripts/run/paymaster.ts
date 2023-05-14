import { ethers } from 'hardhat';
import { fillAndSign } from '../../test/UserOp';
import { EntryPoint__factory } from './typechains/EntryPoint__factory';
import * as dotenv from 'dotenv';
import { getHttpRpcClient } from './utils/getHttpRpcClient';
import { getUserOpReceipt } from './utils/getUserOpReceipt';
import { arrayify, defaultAbiCoder, hexConcat } from 'ethers/lib/utils';
import { VerifyingPaymaster__factory } from './typechains/VerifyingPaymaster__factory';
dotenv.config();

const entrypointAddress = '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789'; //EntryPoint
const accountAddress = '0x0E1c853Cc60f5f1bB4D6e830C8257b75672919d1'; //MoonKeyGnosisAccountFactory
const paymasterAddress = '0x2A8Fd15a36826809fD1b5d95DBaeb3a10B30E1fd'; //VerifyingPaymaster
const VALID_UNTIL = 1777068462;
const VALID_AFTER = 0;

async function main() {
  // getting argument: for executing transaction
  const args = process.argv.slice(2);
  const [to, value] = args;

  // setup provider and signer
  const provider = new ethers.providers.JsonRpcProvider(
    `https://bsc-testnet.nodereal.io/v1/${process.env.NODEREAL_API}`
  );
  const owner = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);
  const offchainSigner = new ethers.Wallet(
    process.env.PAYMASTER_OWNER_PRIVATE_KEY!,
    provider
  );

  // Get contracts to interacte with
  const entryPoint = new EntryPoint__factory(owner).attach(entrypointAddress);

  const paymaster = new VerifyingPaymaster__factory(owner).attach(
    paymasterAddress
  );

  /* Use this simplified paymaster instead of Paymaster_factory
  const paymaster = new ethers.Contract(
    paymasterAddress,
    [
      'function getHash(UserOperation calldata userOp, uint48 validUntil, uint48 validAfter) public view returns (bytes32)',
    ],
    provider
  );
  */

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

  // Build the execute field calldata
  const safe_execTxCallData = safeSingleton.interface.encodeFunctionData(
    'executeAndRevert',
    [to, value, '0x', 0]
  );

  // Fetch the ERC-4337 safe wallet address
  const counterfactualAddress = await accountFactory.callStatic.getAddress(
    owner.address,
    123
  );

  // Paymaster data
  const userOp = await fillAndSign(
    {
      sender: counterfactualAddress, //The account
      callData: safe_execTxCallData,
      paymasterAndData: hexConcat([
        paymasterAddress,
        defaultAbiCoder.encode(
          ['uint48', 'uint48'],
          [VALID_UNTIL, VALID_AFTER]
        ),
        '0x' + '00'.repeat(65),
      ]),
    },
    owner,
    entryPoint
  );

  // Sign OffChain to verify as paymaster
  const hash = await paymaster.callStatic.getHash(
    userOp,
    VALID_UNTIL,
    VALID_AFTER
  );
  const sig = await offchainSigner.signMessage(arrayify(hash));

  // Build userOperation
  const op = await fillAndSign(
    {
      ...userOp,
      paymasterAndData: hexConcat([
        paymasterAddress,
        defaultAbiCoder.encode(
          ['uint48', 'uint48'],
          [VALID_UNTIL, VALID_AFTER]
        ),
        sig,
      ]),
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
