/* eslint no-use-before-define: "warn" */
const hre = require("hardhat");
const { encodeCallScript } = require("@aragon/test-helpers/evmScript");
const { encodeActCall } = require("@aragon/toolkit");
const { agvePayments1 } = require("./agvePayments1.json");
const { agvePayments2 } = require("./agvePayments2.json");
const { hnyPayments } = require("./hnyPayments.json");

// https://rinkeby.client.aragon.org/#/paymenttest/
const agent = "0xa1eea15936ec80cfdbab319441d916b01cdc86b3";
const voting = "0xd3d974ec212d7c4bd06a1eee8744a86f74690c2f";
const agve = "0x550c6e72f243f2e506585ae3a8a8cbfbed8e0ec0";
const hny = "0x44ffef1a859e1272c58fdbd644e9e08b33cf66c9";
const abi = ["function newVote(bytes,string,bool,bool)"];


const main = async () => {
  const signers = await hre.ethers.getSigners();
  const votingContract = new ethers.Contract(voting, abi,  signers[0])
  console.log("\nusing: ", signers[0].address);
  console.log("creating AGVE payments...");

  console.log('\nAGVE payments 1')
  await payments(agve, agvePayments1, votingContract);

  console.log('AGVE payments 2')
  await payments(agve, agvePayments2, votingContract);

  console.log('HNY payments 1')
  await payments(hny, hnyPayments, votingContract);
};

const payments = async (token, payments, votingContract) => {
  const calldatum = await Promise.all(
    payments.map(async (user) => await encodeTransfer(token, user.receiverAddress, user.amount))
  );

  const script = encodeCallScript(
    calldatum.map((data) => {
      return {
        to: agent,
        calldata: data,
      };
    })
  );

  await votingContract.newVote(script, "payments", true, true);
};

const encodeTransfer = async (token, to, amount) => {
  const call = await encodeActCall("transfer(address,address,uint256)", [token, to, ethers.utils.parseEther(amount)]);
  return call;
};

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
