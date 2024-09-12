const fetch = require("node-fetch");
const { hexToString, stringToHex } = require("viem");

let tasks = [];
let taskCount = 0;

const rollup_server = process.env.ROLLUP_HTTP_SERVER_URL;
console.log("HTTP rollup_server url is " + rollup_server);

async function handle_advance(data) {
    console.log("Received advance request data " + JSON.stringify(data));

    try {
        const payloadString = hexToString(data.payload);
        console.log("Converted payload: " + payloadString);
        const payload = JSON.parse(payloadString);

        switch (payload.method) {
            case "addTask":
                taskCount++;
                const newTask = {
                    id: taskCount,
                    content: payload.content,
                    completed: false,
                };
                tasks.push(newTask);
                const outputStr = stringToHex("Task added successfully");
                await fetch(rollup_server + "/notice", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ payload: outputStr }),
                });
                break;

            case "toggleTask":
                const task = tasks.find((t) => t.id === parseInt(payload.id));
                if (task) {
                    task.completed = !task.completed;
                    const taskOutputStr = stringToHex("Task toggled successfully");
                    await fetch(rollup_server + "/notice", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({ payload: taskOutputStr }),
                    });
                } else {
                    throw new Error("Task not found");
                }
                break;

            default:
                throw new Error("Invalid method");
        }

    } catch (error) {
        console.error("Error processing request:", error);
    }

    return "accept";
}

async function handle_inspect(data) {
    console.log("Received inspect request data " + JSON.stringify(data));

    try {
        const payloadString = hexToString(data.payload);
        console.log("Converted payload: " + payloadString);
        const payload = JSON.parse(payloadString);

        let responseObject;

        switch (payload.route) {
            case "all_tasks":
                responseObject = JSON.stringify(tasks);
                break;
            case "task_ids":
                responseObject = JSON.stringify(tasks.map(task => task.id));
                break;
            default:
                responseObject = "route not implemented";
        }

        const reportReq = await fetch(rollup_server + "/report", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ payload: stringToHex(responseObject) }),
        });

    } catch (error) {
        console.error("Error processing request:", error);
    }

    return "accept";
}

const handlers = {
    advance_state: handle_advance,
    inspect_state: handle_inspect,
};

(async () => {
    while (true) {
        const finish_req = await fetch(rollup_server + "/finish", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ status: "accept" }),
        });

        console.log("Received finish status " + finish_req.status);

        if (finish_req.status == 202) {
            console.log("No pending rollup request, trying again");
        } else {
            const rollup_req = await finish_req.json();
            const handler = handlers[rollup_req["request_type"]];
            
            if (handler) {
                await handler(rollup_req["data"]);
            } else {
                console.error("Unknown request type:", rollup_req["request_type"]);
            }
        }
    }
})();