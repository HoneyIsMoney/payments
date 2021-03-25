/* eslint no-use-before-define: "warn" */
const hre = require("hardhat");
const fs = require('fs')
const { encodeCallScript } = require("@aragon/test-helpers/evmScript");
const { encodeActCall } = require("@aragon/toolkit");
const { agvePayments1 } = require("./agvePayments1.json");
const { agvePayments2 } = require("./agvePayments2.json");
const { hnyPayments } = require("./hnyPayments.json");

// https://aragon.1hive.org/#/agavetest
const agent = "0x65795247433b5e22f9bec64878774d8b06ad4b42";
const voting = "0x9df0d277b3db4010c1b2a9aba5f9be8a270e0e29"; //0xd4856cd82cb507b2691bcc3f02d8939671a800c0
const agve = "0x265b0085e154effb1696352eb70130a2f3ec7eef"; // https://aragon.1hive.org/#/agvefaucet/0xacbb7a072f489c9a84dc549514036c854d1e25ab/
const hny = "0xd8d62872f6a7446e4f7880220bd83a69440a1543"; //https://aragon.1hive.org/#/hnyfaucet/0x880cacdd53875f52686be2f3be775e6aa16c9bc1/
const abi = ["function newVote(bytes,string,bool,bool)"];


const saveCallData = (calldata) => {
  fs.appendFile(`calldata.txt`, `\n\n--------- calldata ---------\n\n`, err => {
    if (err) {
      console.error(err)
      return
    }
  })
  fs.appendFile(`calldata.txt`, calldata, err => {
    if (err) {
      console.error(err)
      return
    }
  })
}


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
  )

  saveCallData(script)

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
