let {  chat, NotificationHandler } = global.export

class GuiUtils {
  constructor() {
    this.defaultTheme = {
      name: "Default",
      author: "Farlow",
      colours: {
        panel: -15526631,
        box: -15724013,
        background: -15987185,
        selection: -14736599,
        logo: 15073261,
        text: -1,
        accent: 4382965,
        buttonBackground: -15066080,
      },
    }
    this.theme = JSON.parse(FileLib.read("RdbtConfigV4", "theme.json") ?? {})

    this.DropShadowColour = new java.awt.Color(this.theme.colours["accent"])
  }

  /**
   * Draws a rounded rectangle using Essential's UIRoundedRectangle
   * @param {java.awt.Color} colour - The color to fill the rectangle with
   * @param {number} x - The x coordinate of the top-left corner
   * @param {number} y - The y coordinate of the top-left corner
   * @param {number} width - The width of the rectangle
   * @param {number} height - The height of the rectangle
   * @param {number} radius - The corner radius of the rectangle
   */
  DrawRoundedRect = (colour, x, y, width, height, radius) => {
    const matrix = Java.type("gg.essential.universal.UMatrixStack").Compat.INSTANCE

    matrix.runLegacyMethod(matrix.get(), () => {
      Java.type("gg.essential.elementa.components.UIRoundedRectangle").Companion.drawRoundedRectangle(matrix.get(), x, y, x + width, y + height, radius, colour)
    })
  }

  GetThemeColour = key => {
    return new java.awt.Color(this.theme.colours[key])
  }

  /**
   * Draws a drop shadow effect using rounded rectangles
   * @param {number} loops - Number of shadow layers to draw
   * @param {number} x - The x coordinate of the shadow
   * @param {number} y - The y coordinate of the shadow
   * @param {number} width - The width of the shadow
   * @param {number} height - The height of the shadow
   * @param {number} opacity - The base opacity of the shadow
   * @param {number} edgeRadius - The corner radius of the shadow
   * @param {java.awt.Color} [clr=this.DropShadowColour] - The color of the shadow
   */
  DropShadow = (loops, x, y, width, height, opacity, edgeRadius, clr = this.DropShadowColour) => {
    let r = clr.getRed() / 255
    let g = clr.getGreen() / 255
    let b = clr.getBlue() / 255

    GlStateManager.func_179092_a(GL11.GL_GREATER, 0.003921569) // alphaFunc
    GlStateManager.func_179147_l() // enableBlend
    GlStateManager.func_179141_d() // enableAlpha

    for (let margin = 0; margin <= loops / 2; margin += 0.5) {
      this.DrawRoundedRect(new java.awt.Color(r, g, b, Math.min(0.2, Math.max(0.007, (opacity - margin) * 1.3))), x - margin / 2, y - margin / 2, width + margin, height + margin, edgeRadius)
    }
  }

  CreateNewTheme = () => {
    // find valid name
    let x = 1
    let name = `newtheme-${x}.json`
    while (FileLib.exists(`RdbtConfigV4/themes`, `${name}`)) {
      x++
      name = `newtheme-${x}.json`
    }

    // Load default theme and update name
    this.defaultTheme.name = `New Theme ${x}`

    // Create new file
    const f = new java.io.File(`config/ChatTriggers/modules/RdbtConfigV4/themes/${name}`)
    f.getParentFile().mkdirs()
    f.createNewFile()

    // Write to file
    FileLib.write("RdbtConfigV4/themes", name, JSON.stringify(this.defaultTheme))

    global.export.NotificationHandler.SendNotification(`Theme Created!`, `${name}`, 3000)

    return name
  }

  SetTheme = name => {
    if (FileLib.exists(`RdbtConfigV4/themes`, `${name}`)) {
      let json = FileLib.read("RdbtConfigV4/themes", `${name}`)
      FileLib.write("RdbtConfigV4", "theme.json", json)

      Client.scheduleTask(5, () => {
        this.theme = JSON.parse(FileLib.read("RdbtConfigV4", "theme.json"))
        this.DropShadowColour = new java.awt.Color(this.theme.colours.accent)
        global.export.NotificationHandler.SendNotification("Theme Updated", `${this.theme.name} - ${this.theme.author}`, 3000)
      })
    } else chat.message(`Theme ${name} does not exist..`)
  }

  GetHudConfig = name => {
    let config = JSON.parse(FileLib.read("RdbtConfigV4", "guiconfig.json"))
    if (!config.hud[name]) {
      global.export.NotificationHandler.SendNotification(`${name} config`, "none found. creating", 3000)

      config.hud[name] = {
        x: 0.05 + Object.keys(config.hud).length * 0.125,
        y: 0.1,
      }

      FileLib.write("RdbtConfigV4", "guiconfig.json", JSON.stringify(config))
    }

    return config.hud[name]
  }
}

global.export.GuiUtils = new GuiUtils()
