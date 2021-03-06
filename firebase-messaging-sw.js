// importScripts("https://infinity-public-js.500apps.com/push/listener.min.js");

if ("undefined" === typeof window) {
  importScripts("https://www.gstatic.com/firebasejs/6.6.2/firebase-app.js");
  importScripts("https://www.gstatic.com/firebasejs/6.6.2/firebase-messaging.js");
}

/**
 * @class PushlyFirebaseListener
 */
class PushlyFirebaseListener {
  /**
   * @constructor
   */
  constructor() {
    // Store messageApi of current executed message when user clicks on the message
    this.exeMessageApi = "";

    // Store jwt token which has domainId, flowId, messageId
    this.messageApi = "";

    // Fcm subscription object
    this.subscriptionObject = {};

    // Store event action url
    this.url = "";

    // Store current domain url
    this.launchUrl = "";

    // Store push object
    this.pushObj = "";

    // Store Message Id
    this.message_id = "";

    // Check event
    this.execute = false;
  }

  /**
   * Initialization method
   */
  init() {
    // To listen the messages pushed from service worker
    self.addEventListener("push", (event) => {
      this.execute = false;
      var message = event.data.json();
      console.log("message", message);
      if (message.data.hasOwnProperty("data")) {
        this.pushObj = JSON.parse(message.data.data);
        this.message_id = this.pushObj.message_id;
        this.launchUrl = this.pushObj.launch_url;
        var obj = JSON.parse(message.data.notification);
      } else if (!message.data.hasOwnProperty("data")) {
        var obj = JSON.parse(message.data.notification);
      }
      const title = obj.title;
      const options = {
        body: obj.body,
        icon: obj.icon,
      };
      if (message.data.action_button) {
        options["actions"] = JSON.parse(message.data.action_button);
      }
      event.waitUntil(self.registration.showNotification(title, options));
    });

    // To listen when user clicks on notification
    self.addEventListener("notificationclose", (event) => {
      console.log("notificationclose", event);
      const clickedNotification = event.notification;
      if (this.message_id && !this.execute) this.saveUserAction("close", "failure");
    });

    // To listen when user closes notification
    self.addEventListener("notificationclick", (event) => {
      this.execute = true;
      console.log("notificationclick", event);
      // Redirect to website which is given by subscriber
      if (this.launchUrl) clients.openWindow(this.launchUrl);
      const clickedNotification = event.notification;
      if (this.message_id) this.saveUserAction(event.action ? event.action : "executed", "success");
      // Reset variable
      this.exeMessageApi = "";
    });
  }

  /**
   * To make a network call and store messages in database
   */
  saveUserAction(actionText, result) {
    this.pushObj.action = result;
    this.pushObj.user_action = actionText;
    var messagelog = this.pushObj;
    fetch(
      `https://my.${this.pushObj.region}.500apps.com/pcors?url=https://push.${this.pushObj.region}.500apps.com/push/v1/message/log?app_name=push`,
      {
        method: "post",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "x-api-key": this.pushObj.api_key,
        },
        body: JSON.stringify(messagelog),
      }
    );
  }
}
(() => {
  var _pushlyFirebaseListener = new PushlyFirebaseListener();
  _pushlyFirebaseListener.init();
})();
