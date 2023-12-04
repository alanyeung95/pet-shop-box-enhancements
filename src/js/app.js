App = {
  web3Provider: null,
  contracts: {},
  account: '0x0',
  hasVoted: false,


  init: async function () {
    // Load pets.
    $.getJSON("../pets.json", function (data) {
      var petsRow = $("#petsRow");
      var petTemplate = $("#petTemplate");
      App.petsinfo = data;


      var breeds = [...new Set(data.map(pet => pet.breed))];
      var ages = [...new Set(data.map(pet => pet.age))];
      var locations = [...new Set(data.map(pet => pet.location))]
      var breedFilter = $("#breedFilter");
      var ageFilter = $("#ageFilter");
      var locationFilter = $("#locationFilter");
      breeds.forEach(breed => breedFilter.append(`<option value="${breed}">${breed}</option>`));
      ages.forEach(age => ageFilter.append(`<option value="${age}">${age}</option>`));
      locations.forEach(location => locationFilter.append(`<option value="${location}">${location}</option>`));


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

    $.getJSON("Election.json", function (election) {
      // Instantiate a new truffle contract from the artifact
      App.contracts.Election = TruffleContract(election);
      // Connect provider to interact with contract
      App.contracts.Election.setProvider(App.web3Provider);
      App.listenForEvents();
      return App.render();
    });

    //new
    $.getJSON("SendMeEther.json", function (data) {
      // Get the contract artifact file and instantiate it with @truffle/contract
      var SendMeEtherArtifact = data;
      App.contracts.SendMeEther = TruffleContract(SendMeEtherArtifact);

      // Set the provider for the contract
      App.contracts.SendMeEther.setProvider(App.web3Provider);
    });

    return App.bindEvents();
  },

  bindEvents: function () {
    $(document).on("click", ".btn-adopt", App.handleAdopt);
    $(document).on("click", ".btn-return", App.handleReturn);
    $(document).on("click", ".btn-history", App.handleGetAdoptionHistory);
    $(document).on("click", ".btn-close-history", App.handleHistoryPanelClose);

    //new
    $(document).on("click", ".btn-donate", App.handleDonation);

    // filter
    $(document).on("click", '.btn-filter', App.updateFilteredPets);

    // $('#filterType').change(function () {
    //   var selectedFilterType = $(this).val();
    //   if (selectedFilterType === "age") {
    //     $("#breedFilter").prop('disabled', true);
    //     $("#ageFilter").prop('disabled', false);
    //   } else if (selectedFilterType === "breed") {
    //     $("#breedFilter").prop('disabled', false);
    //     $("#ageFilter").prop('disabled', true);
    //   }
    // });



  },

  //new
  handleDonation: function (event) {
    event.preventDefault();
    var amount = web3.toWei(0.1, "ether"); // Change the amount to your desired value
    var sendMeEtherInstance;

    web3.eth.getAccounts(function (error, accounts) {
      if (error) {
        console.log(error);
      }

      var account = accounts[0];

      App.contracts.SendMeEther.deployed().then(function (instance) {
        sendMeEtherInstance = instance;

        // Send Ether to the contract using the receiveEther function
        return sendMeEtherInstance.receiveEther({
          from: account,
          value: amount
        });
      }).then(function (result) {
        // Optionally, update UI or perform actions after donation
        console.log("Donation successful:", result);
      }).catch(function (err) {
        console.log(err.message);
      });
    });
  },
  //end new

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
          // Set the adopted property of the pet to true
          App.petsinfo[petId].adopted = true;
          console.log("adopted petId: " + petId);
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
          // Set the adopted property of the pet to false
          App.petsinfo[petId].adopted = false;
          console.log("returned petId: " + petId);
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

  listenForEvents: function () {
    App.contracts.Election.deployed().then(function (instance) {
      instance.votedEvent({}, {
        fromBlock: 0,
        toBlock: 'latest'
      }).watch(function (error, event) {
        console.log("event triggered", event)
        // Reload when a new vote is recorded
        App.render();
      });
    });
  },

  render: function () {
    var electionInstance;
    var loader = $("#loader");
    var content = $("#content");

    loader.show();
    content.hide();

    // Load account data
    web3.eth.getCoinbase(function (err, account) {
      if (err === null) {
        App.account = account;
        $("#accountAddress").html("Your Account: " + account);
      }
    });

    // Load contract data
    //the reason why Promise.all is necessary here is explained in ElectionMapping.txt
    App.contracts.Election.deployed().then(function (instance) {
      electionInstance = instance;
      return electionInstance.candidatesCount();
    }).then(function (candidatesCount) {
      var candArray = [];
      for (var i = 1; i <= candidatesCount; i++) {
        candArray.push(electionInstance.candidates(i));
      }
      Promise.all(candArray).then(function (values) {
        var candidatesResults = $("#candidatesResults");
        candidatesResults.empty();

        var candidatesSelect = $('#candidatesSelect');
        candidatesSelect.empty();
        for (var i = 0; i < candidatesCount; i++) {
          var id = values[i][0];
          var name = values[i][1];
          var voteCount = values[i][2];

          // Render candidate Result
          var candidateTemplate = "<tr><th>" + id + "</th><td>" + name + "</td><td>" + voteCount + "</td></tr>"
          candidatesResults.append(candidateTemplate);

          // Render candidate ballot option
          var candidateOption = "<option value='" + id + "' >" + name + "</ option>"
          candidatesSelect.append(candidateOption);
        }
      });
      return electionInstance.voters(App.account);
    }).then(function (hasVoted) {
      // Do not allow a user to vote
      if (hasVoted) {
        $('form').hide();
      }
      loader.hide();
      content.show();
    }).catch(function (error) {
      console.warn(error);
    });
  },


  // Function to update filtered pets based on selected criteria
  updateFilteredPets: function () {

    console.log("filterpets");
    var data = App.petsinfo;
    var selectedFilterType = $("#filterType").val();
    var selectedSortOption = $("#filterOptions").val();
    var selectedBreed = $("#breedFilter").val();
    var selectedAge = $("#ageFilter").val();
    var selectedLocation = $("#locationFilter").val();


    if (selectedFilterType == "all") {
      var filteredPets = data;
      App.renderPets(filteredPets);
    } else if (selectedFilterType == "available") {
      var filteredPets = data.filter(pet => pet.adopted == false);
      App.renderPets(filteredPets);
    } else if (selectedFilterType == "adopted") {
      var filteredPets = data.filter(pet => pet.adopted == true);

    }


    if (selectedSortOption === "all") {
      filteredPets = filteredPets;
    }
    else if (selectedSortOption === "age") {
      if (selectedAge === "all age") {
        filteredPets = filteredPets;
        App.renderPets(filteredPets);
      } else {
        filteredPets = filteredPets.filter(pet => pet.age == selectedAge);
        App.renderPets(filteredPets);
      }
    }
    else if (selectedSortOption === "breed") {
      if (selectedBreed === "all breed") {
        filteredPets = filteredPets;
        App.renderPets(filteredPets);
      } else {
        filteredPets = filteredPets.filter(pet => pet.breed === selectedBreed);
        App.renderPets(filteredPets);
      }
    }
    else if (selectedSortOption === "location") {
      if (selectedLocation === "all location") {
        filteredPets = filteredPets;
        App.renderPets(filteredPets);
      } else {
        filteredPets = filteredPets.filter(pet => pet.location === selectedLocation);
        App.renderPets(filteredPets);
      }
    }
  },



  // Function to render pets
  renderPets: function (pets) {

    var petsRow = $("#petsRow");
    var petTemplate = $("#petTemplate");


    // Clear existing pets
    petsRow.empty();

    for (var i = 0; i < pets.length; i++) {
      var pet = pets[i];

      // Clone the pet template
      var newPet = petTemplate.clone();

      // Update the content of the cloned template with pet information
      newPet.find(".panel-title").text(pet.name);
      newPet.find("img").attr("src", pet.picture);
      newPet.find(".pet-breed").text(pet.breed);
      newPet.find(".pet-age").text(pet.age);
      newPet.find(".pet-location").text(pet.location);
      if (pet.adopted == true) {
        newPet
          .find(".btn-adopt")
          .text("Success")
          .attr("disabled", true);

        newPet
          .find(".btn-return")
          .css("display", "inline-block");
      } else {
        newPet
          .find(".btn-adopt")
          .text("Adopt")
          .attr("disabled", false);

        newPet.find(".btn-return").css("display", "none");
      }
      newPet.find(".btn-adopt").attr("data-id", pet.id);
      newPet.find(".btn-return").attr("data-id", pet.id);
      newPet.find(".btn-history").attr("data-id", pet.id);


      // Append the updated template to the petsRow
      petsRow.append(newPet.html());
    }
  },


  castVote: function () {
    var candidateId = $('#candidatesSelect').val();
    App.contracts.Election.deployed().then(function (instance) {
      return instance.vote(candidateId, { from: App.account });
    }).then(function (result) {
      // Wait for votes to update
      $("#content").hide();
      $("#loader").show();
    }).catch(function (err) {
      console.error(err);
    });
  }

};



$(function () {
  $(window).load(function () {
    App.init();
  });
});
