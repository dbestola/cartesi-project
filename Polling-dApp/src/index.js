const { ethers } = require("ethers");

const rollup_server = process.env.ROLLUP_HTTP_SERVER_URL;
console.log("HTTP rollup_server url is " + rollup_server);

let poll = {
  question: "What is your favorite programming language?",
  choices: {
    "JavaScript": 0,
    "Python": 0,
    "Rust": 0,
  }
};

// Handle voting on a poll choice
async function handle_vote(data) {
  console.log("Received vote request data " + JSON.stringify(data));
  
  const choice = data.choice;

  if (poll.choices[choice] !== undefined) {
    poll.choices[choice] += 1;
    console.log(`Vote recorded for ${choice}: ${poll.choices[choice]} votes`);
    return "accept";
  } else {
    console.log(`Invalid choice: ${choice}`);
    return "reject";
  }
}

// Handle poll results request
async function handle_results(data) {
  console.log("Received results request data " + JSON.stringify(data));
  
  return JSON.stringify(poll);
}

var handlers = {
  vote: handle_vote,
  results: handle_results,
};

var finish = { status: "accept" };

(async () => {
  while (true) {
    const finish_req = await fetch(rollup_server + "/finish", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(finish),
    });

    console.log("Received finish status " + finish_req.status);

    if (finish_req.status == 202) {
      console.log("No pending rollup request, trying again");
    } else {
      const rollup_req = await finish_req.json();
      var handler = handlers[rollup_req["request_type"]];
      finish["status"] = await handler(rollup_req["data"]);
    }
  }
})();
