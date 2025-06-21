import Font from "FontLib"

let { GuiUtils } = global.export
let { DrawRoundedRect, GetThemeColour } = GuiUtils

const Color = Java.type("java.awt.Color")

const font_19 = new Font("RdbtClient/assets/SF-Pro-Display-Medium.ttf", 19)
const font_17 = new Font("RdbtClient/assets/SF-Pro-Display-Medium.ttf", 17)
const ASSETS = "config/ChatTriggers/modules/RdbtClient/assets"
let warning_icon = Image.fromFile(`${ASSETS}/warn.png`)

class Button {
  constructor(label, onClick, colours) {
    this.label = label
    this.onClick = onClick
    this.colours = colours

    this.x = 0
    this.y = 0

    this.mouseOver = false
  }

  Draw(mx, my, x, y) {
    this.x = x
    this.y = y

    this.CheckHover(mx, my)

    DrawRoundedRect(new Color(0.04, 0.04, 0.04), this.x - 2, this.y - 2, font_19.getWidth(this.label) + 4, font_19.getHeight(this.label) + 4, 5)
    this.mouseOver ? DrawRoundedRect(this.colours.panel, this.x - 2, this.y - 2, font_17.getWidth(this.label) + 4, font_17.getHeight(this.label) + 4, 5) : DrawRoundedRect(this.colours.panel, this.x - 2, this.y - 2, font_19.getWidth(this.label) + 4, font_19.getHeight(this.label) + 4, 5)

    this.mouseOver ? font_17.drawString(this.label, this.x, this.y, this.colours.text) : font_19.drawString(this.label, this.x, this.y, this.colours.text)
  }

  CheckHover(mx, my) {
    this.mouseOver = mx > this.x && mx < this.x + font_19.getWidth(this.label) && my > this.y && my < this.y + font_19.getHeight(this.label)
  }

  Click() {
    if (this.mouseOver) this.onClick()
  }
}

class Warning {
  constructor(title, text, options) {
    this.title = title
    this.text = text
    this.options = options

    this.GUI = new Gui()

    this.GuiConfig = {
      x: 10,
      y: 10,
      width: 300,
      height: 200,
    }

    this.colours = {
      accent: GetThemeColour("accent"),
      panel: GetThemeColour("panel"),
      box: GetThemeColour("box"),
      background: GetThemeColour("background"),
      text: GetThemeColour("text"),
    }

    this.buttons = []

    this.options.forEach(opt => {
      Object.keys(opt).forEach(key => {
        this.buttons.push(new Button(key, opt[key], this.colours))
      })
    })
  }

  Show() {
    this.GuiConfig.height = 70 + (font_17.getHeight("!") + 1) * this.text.length

    this.GuiConfig.x = Renderer.screen.getWidth() / 2 - this.GuiConfig.width / 2
    this.GuiConfig.y = Renderer.screen.getHeight() / 2 - this.GuiConfig.height / 2

    this.GUI.registerDraw((mx, my) => {
      GuiUtils.DropShadow(20, this.GuiConfig.x, this.GuiConfig.y, this.GuiConfig.width, this.GuiConfig.height, 0.5, 7)
      GuiUtils.DrawRoundedRect(this.colours.background, this.GuiConfig.x, this.GuiConfig.y, this.GuiConfig.width, this.GuiConfig.height, 5)

      Renderer.colorize(1, 0.2, 0.2)
      warning_icon.draw(this.GuiConfig.x + 5, this.GuiConfig.y + 5, 15, 15)
      Renderer.colorize(1, 0.2, 0.2)
      warning_icon.draw(this.GuiConfig.x + this.GuiConfig.width - 20, this.GuiConfig.y + 5, 15, 15)

      font_19.drawString(this.title, this.GuiConfig.x + this.GuiConfig.width / 2 - font_19.getWidth(this.title) / 2, this.GuiConfig.y + 5, this.colours.text)

      let o = 0
      this.text.forEach(line => {
        font_17.drawString(line, this.GuiConfig.x + this.GuiConfig.width / 2 - font_17.getWidth(line) / 2, this.GuiConfig.y + 30 + o, this.colours.text)
        o += font_17.getHeight(line) + 1
      })

      // get evenly spaced points

      let w = this.GuiConfig.width - 30

      let spacing = w / this.buttons.length

      this.buttons.forEach((btn, i) => {
        btn.Draw(mx, my, spacing * 0.5 + this.GuiConfig.x + 15 + i * spacing - font_19.getWidth(btn.label) / 2, this.GuiConfig.y + this.GuiConfig.height - 10 - font_19.getHeight(btn.label))
      })
    })

    this.GUI.registerClicked(() => {
      this.buttons.forEach(btn => {
        btn.Click()
      })
    })

    this.GUI.open()
  }
}

register("command", module => {
  let w = new Warning(
    "Warning!", // title
    [`Module '${module}' flagged as unsafe.`, "Proceed with caution"], // text lines to show
    [
      // Buttons to show. Headless function called on click.
      {
        Continue: () => {
          ChatLib.chat("yes")
        },
      },
      {
        Exit: () => {
          ChatLib.chat("no")
        },
      },
    ],
  )

  w.Show()
}).setName("testwarn")

global.export.Warning = Warning
