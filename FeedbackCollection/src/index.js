const { ethers } = require("ethers");

const rollup_server = process.env.ROLLUP_HTTP_SERVER_URL;
console.log("HTTP rollup_server url is " + rollup_server);

let feedbacks = [];

// Handle submitting feedback
async function handle_submit_feedback(data) {
  console.log("Received feedback submission data " + JSON.stringify(data));
  
  const feedback = {
    id: feedbacks.length,
    message: data.message,
    timestamp: Date.now(),
  };

  feedbacks.push(feedback);
  console.log(`Feedback submitted: ${feedback.message}`);
  return "accept";
}

// Handle retrieving all feedbacks
async function handle_get_feedback(data) {
  console.log("Received feedback retrieval request data " + JSON.stringify(data));
  
  return JSON.stringify(feedbacks);
}

var handlers = {
  submit_feedback: handle_submit_feedback,
  get_feedback: handle_get_feedback,
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
