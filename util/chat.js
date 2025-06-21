let { ModuleManager } = global.settingSelection

const Prefix = "&6Rdbt V4 &7» &r"
const Muted = false
const Debug = true

class ChatClass {
  /**
   * Sends a message with the client prefix.
   * @param {string} msg 
   */
  message(msg) {
    if (Muted) return
    if (!msg) return
    ChatLib.chat(Prefix + (msg ?? null))
  }

  /**
   * Sends a debug message with the client prefix.
   * @param {string} msg 
   */
  debugMessage(msg) {
    if (Muted) return
    if (!msg) return
    if (!global.settingSelection?.ModuleManager?.getSetting("Other", "Debug Messages")) return
    ChatLib.chat(Prefix + (msg ?? null))
  }
}

global.export.chat = new ChatClass()
