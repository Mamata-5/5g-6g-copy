const hre = require("hardhat");

async function main() {
    const AuthManager = await hre.ethers.getContractFactory("AuthManager");
    const authManager = await AuthManager.deploy();

    await authManager.waitForDeployment();

    console.log(
        `AuthManager deployed to ${await authManager.getAddress()}`
    );
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
