import { Expo } from "expo-server-sdk";
import config from "../../database/config.js";
import { makeDb, withTransaction } from "../../database/middleware.js";

let expo = new Expo();

/* SEND NOTIFICATION */
const sendExpoNotification = async (
  receiver_id,
  cdl_id,
  curriculum_id,
  subject_id,
  title,
  body,
  notification_type
) => {
  // Create a new Expo SDK client
  // optionally providing an access token if you have enabled push security
  // const expo = new Expo({ accessToken: process.env.EXPO_ACCESS_TOKEN });
  // const expo = new Expo();

  let targetExpoPushTokens = [];

  // Retrieve token of the receiver_id from db
  try {
    const db = await makeDb(config);

    await withTransaction(db, async () => {
      let sql = "SELECT push_token FROM S3User WHERE uid = ? "; // get all the push tokens

      targetExpoPushTokens = await db.query(sql, [receiver_id]).catch((err) => {
        throw err;
      });
    });

    targetExpoPushTokens = targetExpoPushTokens?.map((el) => el.push_token);

    let notifications = [];

    if (targetExpoPushTokens?.length > 0) {
      targetExpoPushTokens?.forEach((pushToken) => {
        // Check that the push token appears to be a valid Expo push token (formatted like : ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx])
        if (Expo.isExpoPushToken(pushToken)) {
          // Construct the notification with api required structure
          notifications.push({
            to: pushToken,
            title: title,
            //subtitle: "", it could be useful
            sound: "default",
            body: body == null ? "" : body,
            data: {
              notification_type: notification_type,
            },
          });
        }
      });

      // The Expo push notification service accepts batches of notifications so
      // that you don't need to send 1000 requests to send 1000 notifications. We
      // recommend you batch your notifications to reduce the number of requests
      // and to compress them (notifications with similar content will get
      // compressed).
      let chunks = expo.chunkPushNotifications(notifications);
      let tickets = [];

      await (async () => {
        // Send the chunks to the Expo push notification service. There are
        // different strategies you could use. A simple one is to send one chunk at a
        // time, which nicely spreads the load out over time:
        for (let chunk of chunks) {
          try {
            let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
            tickets.push(...ticketChunk);
            // NOTE: If a ticket contains an error code in ticket.details.error, you
            // must handle it appropriately. The error codes are listed in the Expo
            // documentation:
            // https://docs.expo.io/push-notifications/sending-notifications/#individual-errors
          } catch (err) {
            throw err;
          }
        }
      })();

      // Later, after the Expo push notification service has delivered the
      // notifications to Apple or Google (usually quickly, but allow the the service
      // up to 30 minutes when under load), a "receipt" for each notification is
      // created. The receipts will be available for at least a day; stale receipts
      // are deleted.
      //
      // The ID of each receipt is sent back in the response "ticket" for each
      // notification. In summary, sending a notification produces a ticket, which
      // contains a receipt ID you later use to get the receipt.
      //
      // The receipts may contain error codes to which you must respond. In
      // particular, Apple or Google may block apps that continue to send
      // notifications to devices that have blocked notifications or have uninstalled
      // your app. Expo does not control this policy and sends back the feedback from
      // Apple and Google so you can handle it appropriately.

      let receiptIds = [];
      for (let ticket of tickets) {
        // NOTE: Not all tickets have IDs; for example, tickets for notifications
        // that could not be enqueued will have error information and no receipt ID.
        if (ticket.id) {
          receiptIds.push(ticket.id);
        }
      }

      let receiptIdChunks = expo.chunkPushNotificationReceiptIds(receiptIds);
      (async () => {
        // Like sending notifications, there are different strategies you could use
        // to retrieve batches of receipts from the Expo service.
        for (let chunk of receiptIdChunks) {
          try {
            let receipts = await expo.getPushNotificationReceiptsAsync(chunk);

            // The receipts specify whether Apple or Google successfully received the
            // notification and information about an error, if one occurred.
            for (let receiptId in receipts) {
              let { status, message, details } = receipts[receiptId];
              if (status === "ok") {
                continue;
              } else if (status === "error") {
                console.error(
                  `There was an error sending a notification: ${message}`
                );
                if (details && details.error) {
                  // The error codes are listed in the Expo documentation:
                  // https://docs.expo.io/push-notifications/sending-notifications/#individual-errors
                  // You must handle the errors appropriately.
                  console.error(`The error code is ${details.error}`);
                }
              }
            }
          } catch (err) {
            console.log(err);
          }
        }
      })();
    }
  } catch (err) {
    console.log(err);
  }
};

export const sendNotification = async (
  sender_id,
  receiver_id,
  cdl_id,
  curriculum_id,
  subject_id,
  title,
  body,
  notification_type
) => {
  try {
    const db = await makeDb(config);
    await withTransaction(db, async () => {
      let sql =
        "INSERT INTO Notification VALUES( UUID(), ?, ?, ?, ?, ?, ?, ?, 'broadcast', UTC_TIMESTAMP() ) ; ";
      let values = [
        sender_id,
        receiver_id,
        cdl_id,
        curriculum_id,
        subject_id,
        title,
        body,
      ];
      await db
        .query(sql, values)
        .then(async () => {
          await sendExpoNotification(
            receiver_id,
            cdl_id,
            curriculum_id,
            subject_id,
            title,
            body,
            notification_type
          );
        })
        .catch((err) => {
          throw err;
        });
    });
  } catch (err) {
    throw err;
  }
};
