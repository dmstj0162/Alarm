import * as zlib from "zlib"
import { IncomingWebhook } from "@slack/webhook";
// * 채널 : test2's webhook URL
let webhookUrl = "webhookurl 입력";

export const handler = async(event) => {
  console.log("Received event:", JSON.stringify(event));
  const EncodingEvent = Buffer.from(event.awslogs.data, "base64");
  const result = JSON.parse(zlib.gunzipSync(EncodingEvent).toString());
  
  const owner = result.owner;
  const logGroup = result.logGroup;
  const logStream = result.logStream;
  const timestamp = result.logEvents[0].timestamp;
  let title;
  let description;
  
  const filter = result.subscriptionFilters.toString();
  console.log(filter);
  switch(filter) {
    //* RuntimeExitError
    case "error":
      title = "Execution error for Lambda";
      description = result.logEvents[1].message.slice(75, 92);
      break;
    case "tasktimedout":
      title = "Execution error for Lambda";
      description = result.logEvents[0].message.slice(62, 95);
      break;
    //* Request Too Long
    case "api":
      title = "Execution error for APIGW";
      description = result.logEvents[2].message.slice(57, 132);
      break;
    default:
      title = "Unexpected error: Requires confirmation of applicable cloudwatch logs" 
      description = result.logEvents[0].message;
      break;
  }

  const payload = {
    attachments: [
      {
        author_name: "AETL",
        title: title,
        color: "#FF0000",
        fields: [
          {
            title: "Timestamp (KST)",
            value: new Date(parseInt(timestamp) + 9 * 60 * 60 * 1000),
            short: true,
          },
          {
            title: "AWS Account ID",
            value: owner,
            short: true,
          },
          {
            title: "Log Group",
            value: logGroup,
          },
          {
            title: "Log Stream",
            value: logStream,
          },
          {
            title: "Description",
            value: description,
          },
        ],
      },
    ],
  };

  const sendSlackWebhook = async (webhookUrl, payload) => {
    const webhook = new IncomingWebhook(webhookUrl);
    try {
      await webhook.send(payload);
    } catch (e) {
      console.log(e);
    }
  };

  await sendSlackWebhook(webhookUrl, payload);
};
