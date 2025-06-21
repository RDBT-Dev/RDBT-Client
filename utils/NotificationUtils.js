let { ModuleManager } = global.settingSelection

// Add PopupMenu eventually?
class NotificationUtils {
  constructor() {
    this.SystemTray = Java.type("java.awt.SystemTray")
    this.trayIcon = null

    try {
      // Attempt to fetch tray icon
      this.trayIcon = this.SystemTray.getSystemTray()
        .getTrayIcons()
        .find(t => t.getToolTip() === "Rdbt Alerts")
      if (this.trayIcon) return

      this.trayIcon = new java.awt.TrayIcon(javax.imageio.ImageIO.read(new java.io.File("./config/ChatTriggers/modules/RdbtClient/assets/icon.png")), "Rdbt")
      this.trayIcon.setToolTip("Rdbt Alerts")
      this.trayIcon.setImageAutoSize(true)

      // Add tray icon and remove on jvm close
      this.SystemTray.getSystemTray().add(this.trayIcon)
      java.lang.Runtime.getRuntime().addShutdownHook(new Thread(() => this.SystemTray.getSystemTray().remove(this.trayIcon)))
    } catch (e) {}
  }

  sendAlert(msg) {
    if (!ModuleManager.getSetting("Failsafes", "Desktop Notifications")) return

    const os = java.lang.System.getProperty("os.name")
    if (os.startsWith("Windows")) this.windowsAlert(msg)
    else if (os.startsWith("Mac")) this.macAlert(msg)
    else if (os.startsWith("Linux")) this.linuxAlert(msg)
  }

  windowsAlert = msg => this.trayIcon.displayMessage("Rdbt Alerts", msg, java.awt.TrayIcon.MessageType.WARNING)
  macAlert = msg => this.executeCommand(`osascript -e 'display notification "${msg}" with title "Rdbt Alerts"'`)
  linuxAlert = msg => this.executeCommand(`notify-send -u critical -a "Rdbt Alerts" ${msg}`)

  executeCommand(cmd) {
    const p = new java.lang.ProcessBuilder()
    p.command(cmd)
    p.start()
  }
}

global.export.NotificationUtils = new NotificationUtils()
