import { SNSClient, PublishCommand} from "@aws-sdk/client-sns";
const snsClient = new SNSClient({region: "ap-northeast-1"});

//* event 값
const event = {
    "text" : "helloworld",
    "number" : "전화번호 입력"
}

export const handler = async(event) => {
    console.log(JSON.stringify(event));

    const params = {
        Message: event.text,
        PhoneNumber: event.number
    }

    await snsClient.send(new PublishCommand(params));

}
