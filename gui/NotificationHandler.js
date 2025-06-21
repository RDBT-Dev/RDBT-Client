import Font from "FontLib"

class Notification {
  constructor(name, contents, duration) {
    this.name = name
    this.duration = duration

    this.font = new Font("RdbtClient/assets/SF-Pro-Display-Medium.ttf", 15)

    this.lines = contents.match(/.{1,50}/g)
    //this.lines = this.GetLineSplit(contents)

    this.StartTime = Date.now()
    this.timeup = false

    this.aliveMs = 0

    this.colours = {
      accent: ICBAToFixMyObfuscator.GetThemeColour("accent"),
      panel: ICBAToFixMyObfuscator.GetThemeColour("panel"),
      text: ICBAToFixMyObfuscator.GetThemeColour("text"),
    }
  }

  Draw(x, y) {
    let width = 100

    this.aliveMs = Date.now() - this.StartTime

    let perc = 1
    if (this.aliveMs < 200) {
      perc = this.aliveMs / 200
    } else if (this.duration - this.aliveMs < 200) {
      perc = (this.duration - this.aliveMs) / 200
    }

    ICBAToFixMyObfuscator.DropShadow(20, x - 0.5 + (width + 1 - (width + 1) * perc), y - 0.5, (width + 1) * perc, 31, 0.5, 8)
    ICBAToFixMyObfuscator.DrawRoundedRect(this.colours.accent, x - 0.5 + (width + 1 - (width + 1) * perc), y - 0.5, (width + 1) * perc, 31, 5)
    ICBAToFixMyObfuscator.DrawRoundedRect(this.colours.panel, x + width - width * perc, y, width * perc, 30, 5)

    let prog = (Date.now() - this.StartTime) / this.duration
    if (prog >= 1) this.timeup = true

    if (perc === 1) {
      this.font.drawString(this.name, x + 5, y + 3, this.colours.text)
      this.lines.forEach((line, i) => {
        this.font.drawString(line, x + 5, y + 13 + i * 9, this.colours.text)
      })

      ICBAToFixMyObfuscator.DrawRoundedRect(this.colours.accent, x + 5 + width - width * perc, y + 26, width - 10 - (width - 10) * prog, 2, 2)
    }
  }
}

class NotificationHandle {
  constructor() {
    this.notifications = []
    this.x = Renderer.screen.getWidth() - 225
    this.y = Renderer.screen.getHeight() - 60

    register("renderOverlay", () => {
      this.DrawNotifications()
    })
  }

  SendNotification(name, content, duration = 3000) {
    let noti = new Notification(name, content, duration)
    this.notifications.push(noti)
  }

  RemoveExpiredNotification(i) {
    this.notifications.splice(i, 1)
  }

  DrawNotifications() {
    this.x = Renderer.screen.getWidth() - 120
    this.y = Renderer.screen.getHeight() - 160

    this.notifications.forEach((n, i) => {
      if (n.timeup) {
        this.RemoveExpiredNotification(i)
      } else {
        n.Draw(this.x, this.y - 35 * i)
      }
    })
  }
}

const notificationHandler = new NotificationHandle()
global.export.NotificationHandler = notificationHandler

// The class name says it all
class ICBAToFixMyObfuscato {
  constructor() {
    this.defaultTheme = {
      name: "Classic",
      author: "Zurviq",
      colours: {
        panel: 3223857,
        box: 2302755,
        background: 2302755,
        selection: 986895,
        logo: 16379097,
        text: -1,
        accent: 7226282,
        buttonBackground: 986895,
      },
    }
    this.theme = JSON.parse(FileLib.read("RdbtConfigV4", "theme.json"))

    this.DropShadowColour = new java.awt.Color(this.theme.colours["accent"])
  }

  DrawRoundedRect = (colour, x, y, width, height, radius) => {
    const matrix = Java.type("gg.essential.universal.UMatrixStack").Compat.INSTANCE

    matrix.runLegacyMethod(matrix.get(), () => {
      Java.type("gg.essential.elementa.components.UIRoundedRectangle").Companion.drawRoundedRectangle(matrix.get(), x, y, x + width, y + height, radius, colour)
    })
  }

  GetThemeColour = key => {
    return new java.awt.Color(this.theme.colours[key])
  }

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
}

const ICBAToFixMyObfuscator = new ICBAToFixMyObfuscato()
