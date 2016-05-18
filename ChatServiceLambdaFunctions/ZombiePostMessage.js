// Processes incoming messages for Zombie chat service
var aws = require('aws-sdk');
var ddb = new aws.DynamoDB(
    {region: "us-west-2",
    params: {TableName: "messages"}}
);
var querystring = require('querystring');
var https = require('https');
var theContext;
var message;
var from;
var numMedia;
var mediaURL;
var timestamp;
var channel = 'default';


exports.handler = function(event, context) {
    theContext = context;

    if(event.message == null || event.message == 'null' || event.name == null || event.name == 'null') {
        return context.fail("Message and Name cannot be null");
    } else {
        message = event.message;
        from = event.name;
    }

    if (event.timestamp == null || event.timestamp == 'null') {
        event.timestamp = "" + new Date().getTime();
        timestamp = event.timestamp;
    }

    /**
     * For Debubugging input params to the lambda function
    console.log('Message: ' + message);
    console.log('Sender: ' + from);
    console.log('Channel: ' + channel);
    */

    var DDBparams = {
        "Item": {
            "channel":{"S":channel},
            "message":{"S":message},
            "timestamp":{"N":timestamp},
            "name":{"S":from}
        }
    };

    dynamoPut(DDBparams);
    sendToSlack(message, context);
};

function dynamoPut(params){
    console.log("Putting item into DynamoDB");
    ddb.putItem(params, dynamoCallback);
}

function sendToSlack(message, context){
  var post_data = JSON.stringify({"text": message});

  var post_options = {
      host: 'hooks.slack.com',
      port: '443',
      path: '/services/XXX/XXX/XXX', // your webhook info here
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
          'Content-Length': post_data.length
      }
  };

  var req = https.request(post_options, function(res) {
      console.log('Status:', res.statusCode);
      console.log('Headers:', JSON.stringify(res.headers));
      res.setEncoding('utf8');
      res.on('data', function(chunk) {});
      req.on('error' , function (err) {
        console.log( 'Problem with request to Slack: ' + err.message );
        context.fail();
      });
      res.on('end', function() {
          console.log('Successfully sent message to Slack');
          context.succeed("Your Slack message was sent. Message sent was: " + message);
      });
  });

  req.write(post_data);
  req.end();
}

function dynamoCallback(err, response) {
  if (err) {
      console.log('error' + err, err.stack); // an error occurred
      return theContext.fail("There was an error.");
  } else {
      console.log('Success: ' + '{Sender: ' + from + ', ' + 'Message: ' + message + '}');
      return theContext.succeed();
  }
}
