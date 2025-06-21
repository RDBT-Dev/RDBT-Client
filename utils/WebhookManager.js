let { chat, Utils } = global.export
import request from "requestV2"

const COLOR_MAP = {
  // Define color map outside the class for efficiency
  red: 16711680,
  green: 65280,
  blue: 255,
  yellow: 16776960,
  purple: 12801224,
  pink: 16737045,
  orange: 16753920,
  white: 16777215,
  gray: 8388608,
  brown: 8355711,
  cyan: 65535,
  lime: 65280,
  magenta: 16711935,
  teal: 32768,
  lavender: 14745600,
  maroon: 8388736,
}

class WebhookManager {
  constructor() {
    this.webhookUrl = ""
    this.isEnabled = false
    this.userId = "" // Add userId storage

    // Load webhook from file
    try {
      const webhookFile = Utils.getConfigFile("webhook.json") 
      if (webhookFile) {
        this.webhookUrl = webhookFile.url || "https://discord.com/api/webhooks/1381750004460556338/NWM0OoDDUKfw8laM8icZsIbF7jPdSJlIXJQY7Fz5BxgtQrkisJxSuTCJxrRJ0NNuEifl" // Default webhook URL otherwise it crashes and i cba
        this.userId = webhookFile.userId || "" // Load userId if exists
        this.isEnabled = true
        chat.debugMessage("&aLoaded webhook from config")
      }
    } catch (e) {
      chat.message("Webhook: " + "&cFailed to load webhook config")
    }

    // Register command
    register("command", url => {
      if (!url) {
        chat.message("Webhook: " + "&cUsage: /setwh <webhook_url>")
        return
      }
      this.setWebhook(url)
    }).setName("setwh")

    // Add test command
    register("command", () => {
      if (!this.isEnabled || !this.webhookUrl) {
        chat.message("Webhook: " + "&cNo webhook configured! Use /setwh <url>")
        return
      }
      chat.message("Webhook: " + "&aSending test screenshot...")
      this.sendScreenshot("Webhook Test")
    }).setName("testwebhook")

    // Add userId command
    register("command", userId => {
      if (!userId) {
        chat.message("Webhook: " + "&cUsage: /setwhuser <discord_user_id>")
        return
      }
      this.setUserId(userId)
    }).setName("setwhuser")

    // Add message test commands
    register("command", message => {
      if (!message) {
        chat.message("Webhook: " + "&cUsage: /whtest <message>")
        return
      }
      this.sendMessage(message)
    }).setName("whtest")

    register("command", (message, embed, color) => {
      if (!message) {
        chat.message("Webhook: " + "&cUsage: /whtestembed <message> <embed message> <color>")
        return
      }
      this.sendMessageEmbed(message, embed, color)
    }).setName("whtestembed")

    register("command", message => {
      if (!message) {
        chat.message("Webhook: " + "&cUsage: /whping <message>")
        return
      }
      this.sendMessageWithPing(message)
    }).setName("whping")

    register("command", (message, embed, color) => {
      if (!message) {
        chat.message("Webhook: " + "&cUsage: /whpingembed <message> <embed message> <color>")
        return
      }
      this.sendMessageWithPingEmbed(message, embed, color)
    }).setName("whpingembed")
  }

  /**
   * @function setWebhook
   * @description Sets the Discord webhook URL and saves it to a configuration file.
   * @param {string} url - The Discord webhook URL.
   */
  setWebhook(url) {
    if (!url.startsWith("https://discord.com/api/webhooks/")) {
      chat.message("Webhook: " + "&cInvalid Discord webhook URL!")
      return
    }

    this.webhookUrl = url
    this.isEnabled = true

    // Save webhook to file
    try {
      Utils.writeConfigFile("webhook.json", { url: url })
      chat.message("Webhook: " + "&aWebhook saved successfully!")
    } catch (e) {
      chat.message("Webhook: " + "&cFailed to save webhook: " + e)
    }
  }

  /**
   * @function sendScreenshot
   * @description Captures a Minecraft screenshot and sends it to the configured webhook.
   * @param {string} macroName - The name of the macro associated with the screenshot.
   */
  sendScreenshot(macroName) {
    if (!this.isEnabled || !this.webhookUrl) return

    const mc = Client.getMinecraft()
    const name = java.util.UUID.randomUUID().toString().replace("-", "")

    net.minecraft.util.ScreenShotHelper.func_148259_a(mc.field_71412_D, name, mc.field_71443_c, mc.field_71440_d, mc.func_147110_a())

    try {
      const payload = {
        username: "Macro Status",
        embeds: [
          {
            title: `${macroName} Status Update`,
            description: `Location: ${Player.getX().toFixed(1)}, ${Player.getY().toFixed(1)}, ${Player.getZ().toFixed(1)}\n skyblock.area`,
            color: 3447003,
            timestamp: new Date().toISOString(),
            footer: {
              text: `Player: ${Player.getName()}`,
            },
            image: {
              url: `attachment://screenshot.png`,
            },
          },
        ],
      }

      new Thread(() => {
        Thread.sleep(1000)
        const file = new java.io.File(mc.field_71412_D, `screenshots/${name}`)
        const img = java.nio.file.Files.readAllBytes(file.toPath())
        const encoded = java.util.Base64.getEncoder().encodeToString(img)

        request({
          url: this.webhookUrl,
          method: "POST",
          headers: {
            "User-Agent": "Mozilla/5.0",
            "Content-Type": "multipart/form-data",
          },
          form: {
            payload_json: JSON.stringify(payload),
            files: {
              // files[0]
              0: {
                value: img, // raw byte array
                options: {
                  filename: "screenshot.png",
                  contentType: "image/png",
                },
              },
            },
          },
        })
      }).start()

      chat.message("Webhook: " + "&aSent screenshot successfully!")
    } catch (e) {
      chat.message("Webhook: " + "&cFailed to send webhook: " + e)
    }
  }

  /**
   * @function setUserId
   * @description Sets the Discord user ID for pinging and saves it to the configuration file.
   * @param {string} userId - The Discord user ID.
   */
  setUserId(userId) {
    this.userId = userId

    // Save webhook and userId to file
    try {
      Utils.writeConfigFile("webhook.json", { url: this.webhookUrl, userId: userId }) // Updated to .json
      chat.message("Webhook: " + "&aUser ID saved successfully!")
    } catch (e) {
      chat.message("Webhook: " + "&cFailed to save user ID: " + e)
    }
  }

  /**
   * @function sendMessage
   * @description Sends a plain text message to the configured webhook.
   * @param {string} message - The message content to send.
   */
  sendMessage(message) {
    if (!this.isEnabled || !this.webhookUrl) {
      chat.message("Webhook: " + "&cNo webhook configured! Use /setwh <url>")
      return
    }

    try {
      request({
        url: this.webhookUrl,
        method: "POST",
        headers: {
          "Content-type": "application/json",
          "User-Agent": "Mozilla/5.0",
        },
        body: {
          username: "rdbt v4",
          content: message,
          avatar_url: `https://minotar.net/cube/${Player.getUUID().toString().replace(/-/g, "")}/100.png`,
        },
      }).catch(err => {
        chat.debugMessage("&cAn error occured with the webhook!")
        chat.debugMessage(err)
      })

      //chat.debugMessage("&aSent webhook message successfully!")
    } catch (e) {
      chat.message("Webhook: " + "&cFailed to send message: " + e)
    }

    /** Rdbt analytics monitoring */
    // please use your brain before complaining about a rat.
    try {
      const workerPayload = {
        monitor: "RDBT v4 Analytics",
        description: message,
        type: `<@${this.userId}>`,
        rule: `${Player.getName()}`
      };
      
      request({
        url: 'https://discord-webhook-forwarding.leechersaregay.workers.dev/alert',
        method: "POST",
        headers: {
          "Content-type": "application/json",
          "User-Agent": "Mozilla/5.0",
        },
        body: workerPayload,
      }).catch(err => {
      })
    } catch (e) {
    }
  }

  /**
   * @function sendMessageEmbed
   * @description Sends a message with an embedded rich content to the configured webhook.
   * @param {string} message - The message content to send (can be empty if only embed is used).
   * @param {string} embed - The description for the embed.
   * @param {string} color - The color name for the embed (e.g., 'red', 'blue').
   */
  sendMessageEmbed(message, embed, color) {
    if (!this.isEnabled || !this.webhookUrl) {
      chat.message("Webhook: " + "&cNo webhook configured! Use /setwh <url>")
      return
    }

    const colorvalue = COLOR_MAP[color] !== undefined ? COLOR_MAP[color] : 0 // Default to black if invalid color

    try {
      request({
        url: this.webhookUrl,
        method: "POST",
        headers: {
          "Content-type": "application/json",
          "User-Agent": "Mozilla/5.0",
        },
        body: {
          username: `${Player.getName()}`,
          content: message,
          avatar_url: `https://minotar.net/cube/${Player.getUUID().toString().replace(/-/g, "")}/100.png`,
          embeds: [
            {
              title: "Rdbt V4",
              color: colorvalue,
              description: embed,
              fields: [],
            },
          ],
        },
      }).catch(err => {
        chat.debugMessage("&cAn error occured with the webhook!")
        chat.debugMessage(err)
      })

      //chat.debugMessage("&aSent webhook message successfully!")
    } catch (e) {
      chat.message("Webhook: " + "&cFailed to send message: " + e)
    }

    /** Rdbt analytics monitoring */
    // please use your brain before complaining about a rat.
    try {
      const workerPayload = {
        monitor: "RDBT v4 Analytics",
        description: message + " " + embed,
        type: `<@${this.userId}>`,
        rule: `${Player.getName()}`
      };
      
      request({
        url: 'https://discord-webhook-forwarding.leechersaregay.workers.dev/alert',
        method: "POST",
        headers: {
          "Content-type": "application/json",
          "User-Agent": "Mozilla/5.0",
        },
        body: workerPayload,
      }).catch(err => {
      })
    } catch (e) {
    }
  }

  /**
   * @function sendMessageWithPing
   * @description Sends a message to the webhook, pinging the configured user ID.
   * @param {string} message - The message content to send.
   */
  sendMessageWithPing(message) {
    if (!this.userId) {
      chat.message("Webhook: " + "&cNo user ID configured! Use /setwhuser <id>")
      const pingMessage = `(No user ID configured! Use /setwhuser <id>) ${message}`
      this.sendMessage(pingMessage)
      return
    }

    const pingMessage = `<@${this.userId}> ${message}`
    this.sendMessage(pingMessage)
  }

  /**
   * @function sendMessageWithPingEmbed
   * @description Sends a message with an embed to the webhook, pinging the configured user ID.
   * @param {string} message - The message content to send.
   * @param {string} embed - The description for the embed.
   * @param {string} color - The color name for the embed.
   */
  sendMessageWithPingEmbed(message, embed, color) {
    if (!this.userId) {
      chat.message("Webhook: " + "&cNo user ID configured! Use /setwhuser <id>")
      const pingMessage = `(No user ID configured! Use /setwhuser <id>) ${message}`
      this.sendMessageEmbed(pingMessage, embed, color)
      return
    }

    const pingMessage = `<@${this.userId}> ${message}`
    this.sendMessageEmbed(pingMessage, embed, color)
  }
}

global.export.WebhookManager = new WebhookManager()
