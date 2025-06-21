let { SettingToggle, ConfigModuleClass, ModuleManager, SettingSlider } = global.settingSelection
import { registerWhen } from "BloomCore/utils/Utils"

global.modules.push(
  new ConfigModuleClass(
    "Client Hud",
    "Render",
    [
      new SettingToggle("Enabled", false),
      new SettingToggle("FPS", false),
      new SettingToggle("PING", false),
      new SettingToggle("TPS", false),
      new SettingToggle("Lobby Day", false),
      new SettingSlider("x", 5, 0, 1920),
      new SettingSlider("y", 5, 0, 1080),
    ],
    ["Renders fps, ping, tps, and lobby day on screen"],
  ),
)

class clientHUD {
  constructor() {
    this.ModuleName = "Client Hud"
    this.Enabled = false
    this.x = 5
    this.y = 5

    register("step", () => {
      this.Enabled = ModuleManager.getSetting(this.ModuleName, "Enabled")
      this.ShowFPS = ModuleManager.getSetting(this.ModuleName, "FPS")
      this.ShowPING = ModuleManager.getSetting(this.ModuleName, "PING")
      this.ShowTPS = ModuleManager.getSetting(this.ModuleName, "TPS")
      this.ShowLobbyDay = ModuleManager.getSetting(this.ModuleName, "Lobby Day")
      this.x = ModuleManager.getSetting(this.ModuleName, "x")
      this.y = ModuleManager.getSetting(this.ModuleName, "y")
    }).setFps(1)

    const S37PacketStatistics = Java.type("net.minecraft.network.play.server.S37PacketStatistics")
    const C16PacketClientStatus = Java.type("net.minecraft.network.play.client.C16PacketClientStatus")
    const S03_PACKET_TIME_UPDATE = Java.type("net.minecraft.network.play.server.S03PacketTimeUpdate")

    let prevTime = null
    let averageTps = 20
    const tpsWindow = 5
    let averagePing = 0
    const pingWindow = 5

    const S01PacketJoinGame = Java.type("net.minecraft.network.play.server.S01PacketJoinGame")
    const System = Java.type("java.lang.System")

    let isPinging = false
    let pingCache = -1
    let lastPingAt = -1

    function sendPing() {
      if (!isPinging) {
        Client.sendPacket(new C16PacketClientStatus(C16PacketClientStatus.EnumState.REQUEST_STATS))
        lastPingAt = System.nanoTime()
        isPinging = true
      }
    }

    register("step", () => {
      if (this.Enabled) sendPing()
    }).setDelay(1)

    register("worldLoad", () => {
      prevTime = null
      averageTps = 20
      pingCache = -1
      isPinging = false
      averagePing = 0
    })

    registerWhen(
      register("packetReceived", () => {
        if (lastPingAt > 0) {
          lastPingAt = -1
          isPinging = false
        }
      }).setFilteredClass(S01PacketJoinGame),
      () => this.Enabled,
    )

    registerWhen(
      register("packetReceived", () => {
        if (lastPingAt > 0) {
          let diff = Math.abs((System.nanoTime() - lastPingAt) / 1_000_000)
          lastPingAt *= -1
          pingCache = diff
          let alpha = 2 / (pingWindow + 1)
          averagePing = diff * alpha + (averagePing > 0 ? averagePing * (1 - alpha) : diff)

          isPinging = false
        }
      }).setFilteredClass(S37PacketStatistics),
      () => this.Enabled,
    )

    registerWhen(
      register("packetReceived", () => {
        if (prevTime !== null) {
          let time = Date.now() - prevTime
          let instantTps = MathLib.clampFloat(20000 / time, 0, 20)
          let alpha = 2 / (tpsWindow + 1)
          averageTps = instantTps * alpha + averageTps * (1 - alpha)
        }
        prevTime = Date.now()
      }).setFilteredClass(S03_PACKET_TIME_UPDATE),
      () => this.Enabled,
    )

    function calculateLuminance(r, g, b) {
      return 0.2126 * r + 0.7152 * g + 0.0722 * b
    }

    let colors = [
      Renderer.color(255, 0, 0), // Red
      Renderer.color(0, 255, 0), // Green
      Renderer.color(0, 125, 255), // Blue
      Renderer.color(255, 255, 0), // Yellow
      Renderer.color(255, 125, 0), // Orange
      Renderer.color(255, 0, 125), // Pink
      Renderer.color(125, 0, 255), // Purple
    ]

    let currentColorIndex = 0
    let nextColorIndex = 1
    let lastChangeTime = new Date().getTime()
    let fadeDuration = 3500
    let minLuminanceThreshold = 40

    function findNextColorIndex(currentIndex) {
      let index = (currentIndex + 1) % colors.length
      let tries = 0

      while (tries < colors.length) {
        let color = colors[index]
        let r = (color >> 16) & 0xff
        let g = (color >> 8) & 0xff
        let b = color & 0xff

        let luminance = calculateLuminance(r, g, b)

        if (luminance >= minLuminanceThreshold) {
          return index
        }

        index = (index + 1) % colors.length
        tries++
      }

      return currentIndex
    }

    let lobbyDay = ""

    register("step", () => {
      if (this.Enabled && this.ShowLobbyDay) {
        let time = World.getTime()
        if (time !== 0) {
          lobbyDay = `DAY: ${(time / 20 / 60 / 20).toFixed(1)}`
        }
      }
    }).setDelay(1)

    register("renderOverlay", () => {
      if (!this.Enabled) return

      let currentTime = new Date().getTime()
      let elapsed = currentTime - lastChangeTime

      if (elapsed >= fadeDuration) {
        lastChangeTime = currentTime
        currentColorIndex = nextColorIndex
        nextColorIndex = findNextColorIndex(currentColorIndex)
        elapsed = 0
      }

      let progress = elapsed / fadeDuration
      let currentColor = colors[currentColorIndex]
      let nextColor = colors[nextColorIndex]

      let currentR = (currentColor >> 16) & 0xff
      let currentG = (currentColor >> 8) & 0xff
      let currentB = currentColor & 0xff

      let nextR = (nextColor >> 16) & 0xff
      let nextG = (nextColor >> 8) & 0xff
      let nextB = nextColor & 0xff

      let r = Math.floor((1 - progress) * currentR + progress * nextR)
      let g = Math.floor((1 - progress) * currentG + progress * nextG)
      let b = Math.floor((1 - progress) * currentB + progress * nextB)

      let interpolatedColor = Renderer.color(r, g, b)

      let hudText = ""
      if (this.ShowFPS) hudText += `FPS: ${Client.getFPS()}  `
      if (this.ShowPING) hudText += `PING: ${Math.round(averagePing)}  `
      if (this.ShowTPS) hudText += `TPS: ${averageTps.toFixed(1)}  `
      if (this.ShowLobbyDay) hudText += `${lobbyDay}  `

      if (hudText.trim()) {
        // Shadow for the text
        const shadowText = new Text(`§l${hudText}`, this.x + 1, this.y + 1).setAlign("LEFT").setColor(Renderer.color(0, 0, 0))
        shadowText.draw()

        // Colored text
        const coloredText = new Text(`§l${hudText}`, this.x, this.y).setAlign("LEFT").setColor(interpolatedColor)
        coloredText.draw()
      }
    })
  }
}

new clientHUD()
