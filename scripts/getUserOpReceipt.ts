import { SimpleAccountAPI } from '@account-abstraction/sdk';
import { ethers, Signer } from 'ethers';

export async function getUserOpReceipt(
  provider: ethers.providers.Provider,
  entryPointAddress: string,
  owner: Signer,
  userOpHash: string,
  timeout = 30000,
  interval = 5000
) {
  const sw = new SimpleAccountAPI({
    provider,
    entryPointAddress,
    owner,
  });

  // Hack: default getUserOpReceipt does not include fromBlock which causes an error for some RPC providers.
  const endtime = Date.now() + timeout;
  const block = await provider.getBlock('latest');
  while (Date.now() < endtime) {
    // @ts-ignore
    const events = await sw.entryPointView.queryFilter(
      // @ts-ignore
      sw.entryPointView.filters.UserOperationEvent(userOpHash),
      Math.max(0, block.number - 100)
    );
    if (events.length > 0) {
      return events[0].transactionHash;
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }
  return null;
}
