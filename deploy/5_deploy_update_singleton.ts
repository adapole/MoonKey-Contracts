import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

const deployUpdateSingleton: DeployFunction = async function (
  hre: HardhatRuntimeEnvironment
) {
  const from = await hre.ethers.provider.getSigner().getAddress();

  const updateSingleton = await hre.deployments.deploy('UpdateSingleton', {
    from,
    args: [],
    deterministicDeployment: true,
  });

  console.log('==update singleton addr=', updateSingleton.address);
};

export default deployUpdateSingleton;
