import Font from "FontLib"

let { ImageButton, GuiUtils } = global.export

class editLocation {
  constructor() {
    this.GUI = new Gui()

    this.config = {}

    this.items = []

    this.font = new Font("RdbtClient/assets/SF-Pro-Display-Medium.ttf", 17)
    this.font_colour = new java.awt.Color(1, 1, 1)

    this.accent_colour = GuiUtils.GetThemeColour("accent")

    this.ASSETS = "config/ChatTriggers/modules/RdbtClient/assets"

    this.reset_icon = Image.fromFile(`${this.ASSETS}/reset.png`)

    this.reset_button = new ImageButton(this.reset_icon, () => {
      this.items.forEach((item, i) => {
        item.config.y = 0.45
        item.config.x = 0.025 + (75 / Renderer.screen.getWidth()) * (i + 1)
      })
      this.SaveConfig()
    })
    this.reset_button.colours.accent = this.accent_colour

    // Registers

    this.GUI.registerDraw((mx, my) => {
      this.DrawItems(mx, my)

      this.reset_button.Draw(20, Renderer.screen.getHeight() - 40, 20, mx, my)
    })

    this.GUI.registerClicked((mx, my) => {
      this.reset_button.Click()
      this.items.forEach(item => {
        item.Click(mx, my)
      })
    })

    this.GUI.registerMouseReleased(() => {
      this.items.forEach(item => {
        item.MouseUp()
      })
    })
  }

  EditConfig = () => {
    this.config = JSON.parse(FileLib.read("RdbtConfigV4", "guiconfig.json")).hud
    this.accent_colour = GuiUtils.GetThemeColour("accent")
    this.reset_button.colours.accent = this.accent_colour
    this.items = Object.keys(this.config).map(key => {
      return new Item(key, this.config[key])
    })

    this.GUI.open()
  }

  SaveConfig = () => {
    let c = JSON.parse(FileLib.read("RdbtConfigV4", "guiconfig.json"))
    c.hud = this.config

    FileLib.write("RdbtConfigV4", "guiconfig.json", JSON.stringify(c))
  }

  HollowRect = (x, y, w, h, clr) => {
    let c = Renderer.color(clr.getRed(), clr.getGreen(), clr.getBlue())
    Renderer.drawRect(c, x, y, w, 1)
    Renderer.drawRect(c, x, y, 1, h)
    Renderer.drawRect(c, x, y + h - 1, w, 1)
    Renderer.drawRect(c, x + w - 1, y, 1, h)
  }

  DrawItems = (mx, my) => {
    this.items.forEach(item => {
      item.Draw(mx, my)
    })
  }
}

const EditLocation = new editLocation()
global.export.EditLocation = EditLocation

class Item {
  constructor(key, config) {
    this.key = key
    this.config = config

    this.mouseOver = false

    this.dragging = false

    this.prevX = 0
    this.prevY = 0
  }

  Draw(mx, my) {
    let left = true
    let top = true

    if (!EditLocation.GUI.isOpen()) this.dragging = false
    let x = this.config.x * Renderer.screen.getWidth()
    let y = this.config.y * Renderer.screen.getHeight()

    if (x > Renderer.screen.getWidth() / 2) left = false
    if (y > Renderer.screen.getHeight() / 2) top = false

    let clr = Renderer.color(EditLocation.accent_colour.getRed(), EditLocation.accent_colour.getGreen(), EditLocation.accent_colour.getBlue())

    if (left) {
      EditLocation.font.drawString(this.key, x + 3, y + 3, EditLocation.font_colour)

      Renderer.drawRect(clr, x - 2.5, y + 10, 0.5, 40)
    } else {
      EditLocation.font.drawString(this.key, x + 97 - EditLocation.font.getWidth(this.key), y + 3, EditLocation.font_colour)

      Renderer.drawRect(clr, x + 102.5, y + 10, 0.5, 40)
    }

    if (top) {
      Renderer.drawRect(clr, x + 10, y - 2.5, 80, 0.5)
    } else {
      Renderer.drawRect(clr, x + 10, y + 62.5, 80, 0.5)
    }

    this.MouseOver(x, y, mx, my)
    if (this.dragging) this.CalcMove(x, y, mx, my)

    EditLocation.HollowRect(x, y, 100, 60, EditLocation.accent_colour)
  }

  MouseOver(x, y, mx, my) {
    this.mouseOver = mx > x && mx < x + 100 && my > y && my < y + 60
  }

  CalcMove(x, y, mx, my) {
    let ox = this.prevX - x
    let oy = this.prevY - y

    let SW,
      SH = Renderer.screen.getHeight()
    SW = Renderer.screen.getWidth()

    this.config.x = Math.min(Math.max(0, mx - ox), SW - 100)
    this.config.y = Math.min(Math.max(0, my - oy), SH - 60)

    this.config.x /= SW
    this.config.y /= SH

    this.prevX = mx
    this.prevY = my
  }

  Click(mx, my) {
    if (this.mouseOver) {
      this.dragging = true

      this.prevX = mx
      this.prevY = my
    }
  }

  MouseUp() {
    if (this.dragging && EditLocation.GUI.isOpen()) {
      EditLocation.SaveConfig()
      this.dragging = false
    }
  }
}
