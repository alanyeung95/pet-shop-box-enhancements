var Adoption = artifacts.require("Adoption");
var Election = artifacts.require("Election");
const SendMeEther = artifacts.require("SendMeEther");

module.exports = function(deployer) {
  deployer.deploy(Adoption);
  deployer.deploy(Election);
  deployer.deploy(SendMeEther);
};