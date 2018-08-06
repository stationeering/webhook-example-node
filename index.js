var express = require('express');
var axios = require('axios');
var bodyParser = require('body-parser')

var app = express();
app.use(bodyParser.text());

function handleNotification(notification) {
    switch(notification["operation"]) {
        case "create":
        case "update":
            // Handle notification content here!
            console.log(JSON.stringify(notification));
            break;
        case "ping":
            console.log("Received ping from webhook.");
            break;
    }

    // Only return false if you failed to process this notification and you want the webhook to retry.
    return true;
}

app.post('/webhook', function(req, res) {
    var request;

    try {
        request = JSON.parse(req.body);
    } catch (err) {
        res.status(400).send("Could not parse JSON!");
        return;
    }

    switch(request["Type"]) {
        case "SubscriptionConfirmation":
            console.log("SubscriptionConfirmation received, need to make web request onwards to: " + request["SubscribeURL"]);

            axios.get(request["SubscribeURL"])
                .then(function (response) {
                    console.log("Subscription confirmed!");
                    res.status(200).send("Subscribed!");
                })
                .catch(function (error) {
                    res.status(500).send("Error making webhook call! " + error);
                });
            break;
        case "Notification":
            console.log("Notification received!");

            var body;

            try {
                body = JSON.parse(request['Message'])
            } catch (err) {
                res.status(400).send("Could not parse internal JSON!");
                return;
            }
        
            if (handleNotification(body)) {
                res.status(200).send("Processed!");
            } else {
                res.status(500).send("Unknown error! Something went wrong, retry if you want to!");
            }            
            break;
        default:
            console.log("Unknown type received: " + request["Type"]);
            res.status(200).send("Unknown type, ignored!");
    }
});

app.listen(3000);

console.log("Server running...");