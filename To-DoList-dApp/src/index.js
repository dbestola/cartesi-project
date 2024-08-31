const { ethers } = require("ethers");

const rollup_server = process.env.ROLLUP_HTTP_SERVER_URL;
console.log("HTTP rollup_server url is " + rollup_server);

let tasks = [];

// Handle adding a new task
async function handle_add_task(data) {
  console.log("Received add task request data " + JSON.stringify(data));
  
  const task = {
    id: tasks.length,
    title: data.title,
    completed: false,
  };

  tasks.push(task);
  console.log(`Task added: ${task.title}`);
  return "accept";
}

// Handle marking a task as completed
async function handle_complete_task(data) {
  console.log("Received complete task request data " + JSON.stringify(data));
  
  const taskId = data.taskId;

  if (tasks[taskId] !== undefined) {
    tasks[taskId].completed = true;
    console.log(`Task completed: ${tasks[taskId].title}`);
    return "accept";
  } else {
    console.log(`Invalid task ID: ${taskId}`);
    return "reject";
  }
}

// Handle retrieving the list of tasks
async function handle_list_tasks(data) {
  console.log("Received list tasks request data " + JSON.stringify(data));
  
  return JSON.stringify(tasks);
}

var handlers = {
  add_task: handle_add_task,
  complete_task: handle_complete_task,
  list_tasks: handle_list_tasks,
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
