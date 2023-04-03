import { hexConcat, parseEther } from 'ethers/lib/utils';
import { ethers } from 'ethers';
import { fillAndSign } from '../../test/UserOp';
import { EntryPoint__factory } from '../../typechain';
import { getHttpRpcClient } from './getHttpRpcClient';
import { getUserOpReceipt } from './getUserOpReceipt';
const entrypointAddress = '0x0576a174D229E3cFA37253523E645A78A0C91B57'; //EntryPoint
const accountAddress = '0x92B0C7DA4719E9f784a663dC0DB1931221143739'; //MoonKeyGonosisAccountFactory

async function main() {
  // setup provider and signer
  if (!process.env.PRIVATE_KEY)
    throw new Error('Missing environment: Private key');
  const provider = new ethers.providers.JsonRpcProvider(
    `https://polygon-mumbai.g.alchemy.com/v2/${process.env.ALCHEMY_ID}`
  );
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY);
  const owner = wallet.connect(provider);
  const ownerAddress = await owner.getAddress();

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

  // Fetch the ERC-4337 safe wallet address
  const counterfactualAddress = await accountFactory.callStatic.getAddress(
    ownerAddress,
    123
  );
  console.log('Your ER4337 address', counterfactualAddress);

  // Funding the deterministic address
  await owner.sendTransaction({
    to: counterfactualAddress,
    value: parseEther('0.1'),
  });

  // Initalizing code to deploy to the deterministic address of ERC-4337
  const initCode = hexConcat([
    accountFactory.address,
    accountFactory.interface.encodeFunctionData('createAccount', [
      ownerAddress,
      123,
    ]),
  ]);
  console.log('initCode', initCode);

  const op = await fillAndSign(
    {
      sender: counterfactualAddress,
      initCode,
      verificationGasLimit: 400000,
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
    owner,
    uoHash
  );
  console.log(`Transaction hash: ${txHash}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
