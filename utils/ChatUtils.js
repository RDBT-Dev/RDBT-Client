let { ModuleManager } = global.settingSelection

const ClientName = "Rdbt V4"
const Muted = false
class ChatUtilsClass {
  /**
   * Sends a message with the client prefix
   * @param {string} text 
   */
  sendModMessage(text) {
    if (Muted) return
    ChatLib.chat("&8[&b" + ClientName + "&8] &r" + (text ?? null))
  }

  /**
   * Sends a message with a custom prefix
   * @param {string} prefix 
   * @param {string} text 
   */
  sendCustomMessage(prefix, text) {
    if (Muted) return
    ChatLib.chat("&8[&b" + prefix + "&8] &r" + (text ?? null))
  }

  /**
   * Sends a debug message with the client prefix
   * @param {string} text 
   */

  sendDebugMessage(text) {
    if (Muted) return
    if (!global.settingSelection?.ModuleManager?.getSetting("Other", "Debug Messages")) return
    ChatLib.chat("&8[&b" + ClientName + "&8] &r" + (text ?? null))
  }
}

global.export.ChatUtils = new ChatUtilsClass()
