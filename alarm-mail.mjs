import zlib from "zlib";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

const client = new SESClient({});

export const handler = async(event) => {
    // console.log(JSON.stringify(event));

  const payload = Buffer.from(event.awslogs.data, "base64");
  const result = JSON.parse(zlib.gunzipSync(payload).toString());
  const str_result = JSON.stringify(result);

  const owner = result.owner;
  const loggroup = result.logGroup;
  const logstream = result.logStream;
  const timestamp = result.logEvents[0].timestamp;
  const utc2kst = new Date(parseInt(timestamp));

  let title;
  let sub;
  let message;
  let description;

  try {
    const filter = result.subscriptionFilters.toString();
    console.log(filter);
    switch (filter) {
      //* RuntimeExitError(+Syntax)
      case "error":
        title = "[AETL] Execution error for Lambda";
        sub = "Lambda error summary ";
        description = result.logEvents[1].message.slice(75, 92);
        break;
      case "tasktimedout":
        title = "[AETL] Execution error for Lambda";
        sub = "Lambda error summary";
        description = result.logEvents[0].message.slice(62, 95);
        break;
      //* Request Too Long
      case "err":
        title = "[AETL] Execution error for APIGW";
        sub = "APIGW error summary";
        description = result.logEvents[2].message.slice(57, 132);
        break;
      default:
        title = "[AETL] Unexpected error";
        sub = "Requires confirmation of applicable cloudwatch logs";
        description = str_result;
        break;
    }

    message = "";
    message += sub + "\n\n";
    message += "##########################################################\n";
    message += "# AWS Account ID: " + owner + "\n";
    message += "# Timestamp: " + utc2kst + "\n";
    message += "# LogGroup: " + loggroup + "\n";
    message += "# LogStream: " + logstream + "\n";
    message += "# Description: " + description + "\n";
    message += "##########################################################\n";

    const input = {
      Destination: {
        ToAddresses: ["이메일 입력"],
      },
      Message: {
        Body: {
          Text: {
            Charset: "UTF-8",
            Data: message,
          },
        },
        Subject: {
          Charset: "UTF-8",
          Data: title,
        },
      },
      Source: "이메일 입력 필요",
      ReplyToAddresses: ["이메일 입력 필요"],
    };
    await client.send(new SendEmailCommand(input));
  } catch (error) {
    console.log(error);

    let body = error.stack || JSON.stringify(error, null, 2);
    return {
      statusCode: 400,
      headers: {},
      body: JSON.stringify(body),
    };
  }
}
