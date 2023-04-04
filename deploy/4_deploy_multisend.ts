import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

const deployMultisend: DeployFunction = async function (
  hre: HardhatRuntimeEnvironment
) {
  const from = await hre.ethers.provider.getSigner().getAddress();

  const multisend = await hre.deployments.deploy('MultiSend', {
    from,
    args: [],
    deterministicDeployment: true,
  });

  console.log('==multisend addr=', multisend.address);
};

export default deployMultisend;
