let { ChatUtils, TimeHelper } = global.export

class RestUtils {
    constructor() {
        this.currentServer = null
        this.isResting = false
        
        // Register rest command
        register("command", (duration) => {
            if (!duration) {
                ChatUtils.sendCustomMessage("Rest", "&cUsage: /rest <seconds>")
                return
            }
            this.performRest(parseInt(duration))
        }).setName("rest")
    }

    performRest(duration) {
        if (this.isResting) {
            ChatUtils.sendCustomMessage("Rest", "&cAlready performing rest!")
            return
        }

        this.isResting = true
        this.currentServer = Server.getIP()
        
        ChatUtils.sendCustomMessage("Rest", `&aDisconnecting for ${duration} seconds...`)
        Client.disconnect()

        // Reconnect after duration
        new Thread(() => {
            Thread.sleep(duration * 1000)
            Client.connect(this.currentServer)
            this.isResting = false
            ChatUtils.sendCustomMessage("Rest", "&aReconnected successfully!")
        }).start() // might be able to set timeout here as well
    }
}

global.export.RestManager = new RestManager()
