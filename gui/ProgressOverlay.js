import Font from "FontLib"

let { GuiUtils } = global.export

class ProgressOverlay {
  constructor(name, id) {
    this.name = name
    this.id = id

    this.font = new Font("RdbtClient/assets/SF-Pro-Display-Medium.ttf", 16)

    this.x = 0
    this.y = 0

    this.width = 0
    this.height = 0

    this.progressBars = []
    this.textLines = []

    this.colours = {
      text: GuiUtils.GetThemeColour("text"),
      accent: GuiUtils.GetThemeColour("accent"),
      background: GuiUtils.GetThemeColour("background"),
      buttonBackground: GuiUtils.GetThemeColour("buttonBackground"),
    }

    register("step", () => {
      this.colours = {
        text: GuiUtils.GetThemeColour("text"),
        accent: GuiUtils.GetThemeColour("accent"),
        background: GuiUtils.GetThemeColour("background"),
        buttonBackground: GuiUtils.GetThemeColour("buttonBackground"),
      }

      this.GetConfigLocation()
      this.UpdateScaling()
    }).setDelay(1)
  }

  Draw() {
    let offsetX = 0
    if (this.x > Renderer.screen.getWidth() / 2) offsetX = -(this.width - 100)

    let offsetY = 0
    if (this.y > Renderer.screen.getHeight() / 2) offsetY = -(this.height - 60)

    GuiUtils.DropShadow(20, this.x + offsetX, this.y + offsetY, this.width, this.height, 0.5, 7, this.colours.accent)
    GuiUtils.DrawRoundedRect(this.colours.background, this.x + offsetX, this.y + offsetY, this.width, this.height, 5)
    this.font.drawString(this.name, this.x + 3 + offsetX, this.y + 3 + offsetY, this.colours.text)

    let o = 15

    this.progressBars.forEach(bar => {
      this.font.drawString(bar.name, this.x + 5 + offsetX, this.y + o + offsetY, this.colours.text)
      GuiUtils.DrawRoundedRect(this.colours.buttonBackground, this.x + 5 + offsetX, this.y + o + 1 + this.font.getHeight(bar.name) + offsetY, this.width - 10, 2, 2)
      GuiUtils.DrawRoundedRect(this.colours.accent, this.x + 5 + offsetX, this.y + o + 1 + this.font.getHeight(bar.name) + offsetY, (this.width - 10) * bar.value, 2, 2)
      o += 15
    })

    o += 5

    this.textLines.forEach(line => {
      this.font.drawString(line.string, this.x + 5 + offsetX, this.y + o + offsetY, this.colours.text)
      o += 10
    })
  }

  AddLine(id, string) {
    const line = this.textLines.find(line => line.id === id)
    if (line) {
      line.string = string
    } else this.textLines.push({ id: id, string: string })

    this.UpdateScaling()
  }

  SetLine(id, string) {
    this.textLines.forEach(line => {
      if (line.id === id) line.string = string
    })
    this.UpdateScaling()
  }

  AddBar(id, name, value) {
    const bar = this.progressBars.find(bar => bar.id === id)
    if (bar) {
      bar.value = value
      bar.name = name
    } else this.progressBars.push({ id: id, name: name, value: value })

    this.UpdateScaling()
  }

  SetBar(id, value, name) {
    this.progressBars.forEach(bar => {
      if (bar.id === id) {
        bar.value = value
        bar.name = name
      }
    })

    this.UpdateScaling()
  }

  UpdateScaling() {
    let mw = this.font.getWidth(this.name) + 6

    this.textLines.forEach(line => {
      let w = this.font.getWidth(line.string) + 10

      if (w > mw) mw = w
    })

    this.width = mw

    this.height = 25 + this.textLines.length * 10 + this.progressBars.length * 15
  }

  UpdateColours(newClrs) {
    this.colours = newClrs
  }

  GetConfigLocation() {
    let c = GuiUtils.GetHudConfig(this.name)
    this.x = c.x * Renderer.screen.getWidth()
    this.y = c.y * Renderer.screen.getHeight()
  }
}

global.export.Overlays = class {
  constructor() {
    this.overlays = []

    register("step", () =>
      this.UpdateColours({
        text: GuiUtils.GetThemeColour("text"),
        accent: GuiUtils.GetThemeColour("accent"),
        background: GuiUtils.GetThemeColour("background"),
        buttonBackground: GuiUtils.GetThemeColour("buttonBackground"),
      }),
    ).setDelay(1)
  }

  Init() {
    register("renderOverlay", () => {
      this.overlays.forEach(overlay => {
        if (Client.isInGui() && !Client.isInChat()) return

        if (overlay.enabled) overlay.overlay.Draw()
      })
    })

    register("guiRender", () => {
      this.overlays.forEach(overlay => {
        if (Client.isInChat()) return

        if (overlay.enabled) overlay.overlay.Draw()
      })
    })
  }

  /**
   * Create new overlay
   * @param {string} name - Overlay title
   * @param {string} id - Overlay ID
   */
  AddOverlay = (name, id) => {
    this.overlays.push({ overlay: new ProgressOverlay(name, id), enabled: false })
  }

  /**
   * Enable existing overlay
   * @param {string} id - Overlay ID
   */
  EnableOverlay = id => {
    this.overlays.forEach(overlay => {
      if (overlay.overlay.id === id) overlay.enabled = true
    })
  }

  /**
   * Disable existing overlay
   * @param {string} id - Overlay ID
   */
  DisableOverlay = id => {
    this.overlays.forEach(overlay => {
      if (overlay.overlay.id === id) overlay.enabled = false
    })
  }

  UpdateColours = colours => {
    this.overlays.forEach(ov => {
      ov.overlay.UpdateColours(colours)
    })
  }

  /**
   * Update line of existing overlay
   * @param {string} id - Overlay ID
   * @param {string} lineid - ID of Line
   * @param {string} newline - New text to be displayed
   */
  UpdateOverlayLine = (id, lineid, newline) => {
    this.overlays.forEach(overlay => {
      if (overlay.overlay.id === id) {
        overlay.overlay.SetLine(lineid, newline)
      }
    })
  }

  /**
   * Update progress bar of existing overlay
   * @param {string} id - Overlay ID
   * @param {string} barid - ID of Bar
   * @param {number} newbar - New value of bar (0-1)
   * @param {string} newname - Optional, new name of bar
   */
  UpdateOverlayBar = (id, barid, newbar, newname) => {
    this.overlays.forEach(overlay => {
      if (overlay.overlay.id === id) {
        overlay.overlay.SetBar(barid, newbar, newname)
      }
    })
  }

  /**
   * Add progress bar to exisiting overlay
   * @param {string} id - Overlay ID
   * @param {string} barid - ID of Bar
   * @param {number} value - Value of bar (0-1)
   * @param {string} name - Mame of bar
   */
  AddOverlayBar = (id, barid, value, name) => {
    this.overlays.forEach(overlay => {
      if (overlay.overlay.id === id) {
        overlay.overlay.AddBar(barid, name, value)
      }
    })
  }

  /**
   * Add text to exisiting overlay
   * @param {string} id - Overlay ID
   * @param {string} textid - ID of text line
   * @param {string} value - Value of string
   */
  AddOverlayText = (id, textid, value) => {
    this.overlays.forEach(overlay => {
      if (overlay.overlay.id === id) {
        overlay.overlay.AddLine(textid, value)
      }
    })
  }
}

global.export.overlayManager = new global.export.Overlays()
global.export.overlayManager.Init()
