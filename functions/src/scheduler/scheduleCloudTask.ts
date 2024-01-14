import * as Firestore from "firebase-admin/firestore";
const { CloudTasksClient } = require('@google-cloud/tasks');

export async function scheduleCloudTask(contact_phone: string) {
    const db = Firestore.getFirestore();

    const project = "dondeelchebot-dev";
    const location = 'us-central1';
    const queue = "reboot-status-queue";
    const taskClient = new CloudTasksClient();
    //Cola de tasks
    const queuePath = taskClient.queuePath(project, location, queue);
    //se hace el query del contacto
    let contact = await db.collection("contacts").doc(contact_phone).get();
    let contactDate: Firestore.Timestamp = contact.get("cloudtask_date") ?? Firestore.Timestamp.fromDate(new Date());
    let newDate = contactDate.toDate();
    newDate.setHours(newDate.getHours() + 3);

    const task = getTask(contact_phone, newDate.getTime() / 1000);
    await taskClient.createTask({ parent: queuePath, task: task });
}

function getPayload(phone_number: string): string {
    const body = {
        phone_number: phone_number,
    }
    return Buffer.from(JSON.stringify(body)).toString('base64');
}

function getTask(contact_phone: string, seconds: number): any {
    const url = "https://9r7d18fz-5001.brs.devtunnels.ms/dondeelche-bot-stage/us-central1/whatsappbot/reboot-chat-status";
    return {
        httpRequest: {
            httpMethod: 'POST',
            url,
            body: getPayload(contact_phone),
            headers: {
                'Content-Type': 'application/json',
            },
        },
        scheduleTime: {
            seconds: seconds
        }
    };
}