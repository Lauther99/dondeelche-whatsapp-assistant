import * as Firestore from "firebase-admin/firestore";
const { CloudTasksClient } = require('@google-cloud/tasks');

export async function scheduleCloudTask(contact_phone: string, contact_data : any) {
    // const db = Firestore.getFirestore();

    const project = "dondeelche-bot-stage";
    const location = 'us-central1';
    const queue = "reboot-status-queue";
    const taskClient = new CloudTasksClient();
    //Cola de tasks
    const queuePath = taskClient.queuePath(project, location, queue);
    //se hace el query del contacto
    // let contact = await db.collection("contacts").doc(contact_phone).get();
    let contactDate: Firestore.Timestamp = contact_data.get("cloudtask_date") ?? Firestore.Timestamp.fromDate(new Date());

    const task = getTask(contact_phone, contactDate.toDate().getTime() / 1000);
    await taskClient.createTask({ parent: queuePath, task: task });
}

function getPayload(contact_phone: string): string {
    const body = {
        contact_phone: contact_phone,
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