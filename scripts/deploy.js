/* eslint no-use-before-define: "warn" */
const hre = require("hardhat");
const { encodeCallScript, encodeActCall } = require("./helpers/dao");
const { agvePayments1 } = require("./agvePayments1.json");
const { agvePayments2 } = require("./agvePayments2.json");
const { hnyPayments } = require("./hnyPayments.json");

// https://aragon.1hive.org/#/agavetest
const agent = "0x65795247433b5e22f9bec64878774d8b06ad4b42";
const voting = "0x9df0d277b3db4010c1b2a9aba5f9be8a270e0e29"; //0xd4856cd82cb507b2691bcc3f02d8939671a800c0
const agve = "0x265b0085e154effb1696352eb70130a2f3ec7eef"; // https://aragon.1hive.org/#/agvefaucet/0xacbb7a072f489c9a84dc549514036c854d1e25ab/
const hny = "0xd8d62872f6a7446e4f7880220bd83a69440a1543"; //https://aragon.1hive.org/#/hnyfaucet/0x880cacdd53875f52686be2f3be775e6aa16c9bc1/
const tm = "0x83616df927e5c4c7d6c3c6e55331dfb1614bed38";

const main = async () => {
	const signers = await hre.ethers.getSigners();
	console.log("\nusing: ", signers[0].address);

	console.log("\nAGVE payments 1");
	await multiPayments(agve, agvePayments1, signers[0]);

 	console.log("AGVE payments 2");
	await multiPayments(agve, agvePayments2, signers[0]);

	console.log("HNY payments 1");
	await multiPayments(hny, hnyPayments, signers[0]);
};

const multiPayments = async (token, paymentsList, signer) => {
	
	// encode transfer actions for all address amount pairs in payment list
	const calldatum = await Promise.all(
		paymentsList.map(
			async (user) =>
				await encodeActCall("transfer(address,address,uint256)", [
					token,
					user.receiverAddress,
					ethers.BigNumber.from(parseInt(parseFloat(user.amount) * 1000)).mul(1e15),
				])
		)
	);

	// create a basket of encoded actions
	const encodedActions = [];
	calldatum.map((data) => {
		encodedActions.push({
			to: agent,
			calldata: data,
		});
	});

	// encode the script to be forwarded to the voting app
	const callscript = encodeCallScript(encodedActions);

	// the token manager has permission to call newVote() on the voting app
	// this creates the intent that must be forwarded
	const voteScript = encodeCallScript([
		{
			to: voting,
			calldata: encodeActCall("newVote(bytes,string,bool,bool)", [
				callscript,
				"",
				true,
				true
			]),
		},
	]);

	// pass the intent to the token manager
	const tokenManager = new ethers.Contract(
		tm,
		["function forward(bytes) external"],
		signer
	);

	// create the transaction
	await tokenManager.forward(voteScript).wait();
};


main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
