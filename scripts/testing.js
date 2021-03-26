/* eslint no-use-before-define: "warn" */
const hre = require("hardhat");
const fs = require("fs");
//const { encodeCallScript, encodeActCall } = require("./helpers/dao");
const ethers = require("ethers")

const { encodeCallScript } = require("@aragon/test-helpers/evmScript");
const { encodeActCall } = require("@aragon/toolkit");

const { agvePayments1 } = require("./agvePayments1.json");
const { agvePayments2 } = require("./agvePayments2.json");
const { hnyPayments } = require("./hnyPayments.json");



const main = async () => {
	const e = ethers.utils.parseUnits("1.1", "18").div
	const eAsInt = parseInt(e)
	console.log(e, "\n", eAsInt)
	// ethers.BigNumber.from(parseFloat(user.amount) * 1000).mul(1e15),
};




main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
