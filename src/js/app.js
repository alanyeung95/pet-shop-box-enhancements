App = {
  web3Provider: null,
  contracts: {},

  init: async function () {
    // Load pets.
    $.getJSON("../pets.json", function (data) {
      var petsRow = $("#petsRow");
      var petTemplate = $("#petTemplate");

      for (i = 0; i < data.length; i++) {
        petTemplate.find(".panel-title").text(data[i].name);
        petTemplate.find("img").attr("src", data[i].picture);
        petTemplate.find(".pet-breed").text(data[i].breed);
        petTemplate.find(".pet-age").text(data[i].age);
        petTemplate.find(".pet-location").text(data[i].location);
        petTemplate.find(".btn-adopt").attr("data-id", data[i].id);
        petTemplate.find(".btn-return").attr("data-id", data[i].id);
        petTemplate.find(".btn-history").attr("data-id", data[i].id);

        petsRow.append(petTemplate.html());
      }
    });

    return await App.initWeb3();
  },

  initWeb3: async function () {
    // Modern dapp browsers...
    if (window.ethereum) {
      App.web3Provider = window.ethereum;
      try {
        // Request account access
        await window.ethereum.enable();
      } catch (error) {
        // User denied account access...
        console.error("User denied account access");
      }
    }
    // Legacy dapp browsers...
    else if (window.web3) {
      App.web3Provider = window.web3.currentProvider;
    }
    // If no injected web3 instance is detected, fall back to Ganache
    else {
      App.web3Provider = new Web3.providers.HttpProvider(
        "http://localhost:7545"
      );
    }
    web3 = new Web3(App.web3Provider);

    return App.initContract();
  },

  initContract: function () {
    $.getJSON("Adoption.json", function (data) {
      // Get the necessary contract artifact file and instantiate it with @truffle/contract
      var AdoptionArtifact = data;
      App.contracts.Adoption = TruffleContract(AdoptionArtifact);

      // Set the provider for our contract
      App.contracts.Adoption.setProvider(App.web3Provider);

      // Use our contract to retrieve and mark the adopted pets
      return App.markAdopted();
    });

    return App.bindEvents();
  },

  bindEvents: function () {
    $(document).on("click", ".btn-adopt", App.handleAdopt);
    $(document).on("click", ".btn-return", App.handleReturn);
    $(document).on("click", ".btn-history", App.handleGetAdoptionHistory);
    $(document).on("click", ".btn-close-history", App.handleHistoryPanelClose);
  },

  markAdopted: function () {
    var adoptionInstance;

    App.contracts.Adoption.deployed()
      .then(function (instance) {
        adoptionInstance = instance;

        return adoptionInstance.getAdopters.call();
      })
      .then(function (adopters) {
        for (i = 0; i < adopters.length; i++) {
          if (adopters[i] !== "0x0000000000000000000000000000000000000000") {
            $(".panel-pet")
              .eq(i)
              .find(".btn-adopt")
              .text("Success")
              .attr("disabled", true);

            $(".panel-pet")
              .eq(i)
              .find(".btn-return")
              .css("display", "inline-block");
          } else {
            $(".panel-pet")
              .eq(i)
              .find(".btn-adopt")
              .text("Adopt")
              .attr("disabled", false);

            $(".panel-pet").eq(i).find(".btn-return").css("display", "none");
          }
        }
      })
      .catch(function (err) {
        console.log(err.message);
      });
  },
  handleAdopt: function (event) {
    event.preventDefault();

    var petId = parseInt($(event.target).data("id"));
    var adoptionInstance;

    web3.eth.getAccounts(function (error, accounts) {
      if (error) {
        console.log(error);
      }

      var account = accounts[0];

      App.contracts.Adoption.deployed()
        .then(function (instance) {
          adoptionInstance = instance;

          // Execute adopt as a transaction by sending account
          return adoptionInstance.adopt(petId, { from: account });
        })
        .then(function (result) {
          return App.markAdopted();
        })
        .catch(function (err) {
          console.log(err.message);
        });
    });
  },
  handleReturn: function (event) {
    event.preventDefault();

    var petId = parseInt($(event.target).data("id"));
    var adoptionInstance;
    web3.eth.getAccounts(function (error, accounts) {
      if (error) {
        console.log(error);
      }

      var account = accounts[0];

      App.contracts.Adoption.deployed()
        .then(function (instance) {
          adoptionInstance = instance;
          // Execute adopt as a transaction by sending account
          return adoptionInstance.returnPet(petId, { from: account });
        })
        .then(function (result) {
          return App.markAdopted();
        })
        .catch(function (err) {
          console.log(err.message);
        });
    });
  },
  handleGetAdoptionHistory: function (event) {
    event.preventDefault();

    var petId = parseInt($(event.target).data("id"));
    var adoptionInstance;
    web3.eth.getAccounts(function (error, accounts) {
      if (error) {
        console.log(error);
      }

      var account = accounts[0];

      App.contracts.Adoption.deployed()
        .then(function (instance) {
          adoptionInstance = instance;

          // Call getPetAdoptionHistory from the contract
          return adoptionInstance.getPetAdoptionHistory(petId, {
            from: account,
          });
        })
        .then(function (result) {
          //console.log("Adoption History for petId " + petId + ":", result);

          var historyContent = $("#historyContent");
          historyContent.empty(); // Clear previous content

          // Loop through each entry in the history
          for (var i = 0; i < result[0].length; i++) {
            var user = result[0][i];
            // According to the BigNumber repo, S stands for sign, E for exponent and C for coefficient (or significand)
            var timestamp = new Date(result[1][i].c[0] * 1000).toLocaleString();
            var transactionOrigin = result[2][i];
            var action = result[3][i].c[0] === 0 ? "Adopted" : "Returned";

            // Format the history entry string
            var entryString =
              "Action: " +
              action +
              ", Timestamp: " +
              timestamp +
              // ", Transaction Origin: " +
              // transactionOrigin +
              "\nUser: " + // Newline character added before "User:"
              user;

            // Append to the modal content
            historyContent.append(
              $("<p>").html(entryString.replace(/\n/g, "<br>"))
            );
          }

          // Show the modal
          $("#adoptionHistoryModal").show();
        })
        .catch(function (err) {
          console.log(err.message);
        });
    });
  },
  handleHistoryPanelClose: function (event) {
    $("#adoptionHistoryModal").hide();
  },
};

$(function () {
  $(window).load(function () {
    App.init();
  });
});
