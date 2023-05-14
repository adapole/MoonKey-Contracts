import { hexConcat, parseEther } from 'ethers/lib/utils';
import { ethers } from 'ethers';
import { fillAndSign } from '../../test/UserOp';
import { EntryPoint__factory } from './typechains/EntryPoint__factory';
import { getHttpRpcClient } from './utils/getHttpRpcClient';
import { getUserOpReceipt } from './utils/getUserOpReceipt';

const entrypointAddress = '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789'; //EntryPoint
const accountAddress = '0x0E1c853Cc60f5f1bB4D6e830C8257b75672919d1'; //MoonKeyGnosisAccountFactory

async function main() {
  // setup provider and signer
  const provider = new ethers.providers.JsonRpcProvider(
    `https://bsc-testnet.nodereal.io/v1/${process.env.NODEREAL_API}`
  );
  const owner = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);
  const funder = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY!, provider);

  // Get contracts to interacte with
  const entryPoint = new EntryPoint__factory(owner).attach(entrypointAddress);

  const accountFactory = new ethers.Contract(
    accountAddress,
    [
      'function createAccount(address owner, uint256 salt) public returns (address account)',
      'function getAddress(address owner, uint256 salt) public returns (address account)',
    ],
    provider
  );
  // Use a proxy to interact with the base MoonKey wallet
  // const proxy = accountFactory.connect(accountAddress, provider.getSigner());

  // Fetch the ERC-4337 safe wallet address
  const counterfactualAddress = await accountFactory.callStatic.getAddress(
    owner.address,
    123
  );
  console.log('Your ER4337 address', counterfactualAddress);

  // Funding the deterministic address
  await funder.sendTransaction({
    to: counterfactualAddress,
    value: parseEther('0.1'),
  });

  // Initalizing code to deploy to the deterministic address of ERC-4337
  const initCode = hexConcat([
    accountFactory.address,
    accountFactory.interface.encodeFunctionData('createAccount', [
      owner.address,
      123,
    ]),
  ]);
  console.log('initCode', initCode);

  const op = await fillAndSign(
    {
      sender: counterfactualAddress,
      initCode,
      verificationGasLimit: 1000000,
    },
    owner,
    entryPoint
  );
  console.log('userOp', op);

  // Send userOperation to bundler
  const client = await getHttpRpcClient(
    provider,
    process.env.BUNDLER_URL!,
    entrypointAddress
  );
  const uoHash = await client.sendUserOpToBundler(op);
  console.log(`UserOpHash: ${uoHash}`);

  console.log('Waiting for transaction...');
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
