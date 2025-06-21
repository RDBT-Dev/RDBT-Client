import Font from "FontLib"

let { chat, GuiUtils, EditableString, ImageButton, StencilUtils, NotificationHandler } = global.export
let { DrawRoundedRect, GetThemeColour, SetTheme, DropShadow, CreateNewTheme } = GuiUtils

global.export.ThemeEditor = () => {
  const File = Java.type("java.io.File")
  const Color = Java.type("java.awt.Color")
  const ASSETS = "config/ChatTriggers/modules/RdbtClient/assets"
  const Directory = "config/ChatTriggers/modules/RdbtConfigV4/themes"

  let config = JSON.parse(FileLib.read("RdbtConfigV4", "guiconfig.json"))

  const listFiles = target => {
    const f = new File(target)

    if (!f.isDirectory()) return false
    const r = []
    f.listFiles().forEach(file => {
      if (file.isFile()) {
        r.push(file.getName())
      }
    })
    return r
  }

  const font_20 = new Font("RdbtClient/assets/SF-Pro-Display-Medium.ttf", 20)
  const font_17 = new Font("RdbtClient/assets/SF-Pro-Display-Medium.ttf", 17)
  const font_15 = new Font("RdbtClient/assets/SF-Pro-Display-Medium.ttf", 14)

  let GuiConfig = {
    colours: {
      accent: new Color(1, 1, 1),
      panel: new Color(2 / 255, 1 / 255, 3 / 255),
      box: new Color(16 / 255, 18 / 255, 19 / 255),
      background: new Color(6 / 255, 7 / 255, 7 / 255),
      selection: new Color(31 / 255, 35 / 255, 41 / 255),
      logo: new Color(249 / 255, 236 / 255, 217 / 255),
      text: new Color(1, 1, 1),
    },
    main: {
      width: 100,
      height: 100,
      x: 100,
      y: 100,
      borderRadius: 11,
    },
    mouseOverPanel: false,
    canScroll: true,
    maxScroll: 0,
    scrollVelocity: 0,
    scroll: 0,
    themes: [],
    editor: {
      open: false,
      width: 100,
      height: 100,
      x: 100,
      y: 100,
      borderRadius: 11,
    },
  }

  const UpdateColours = () => {
    GuiConfig.colours.accent = GetThemeColour("accent")
    GuiConfig.colours.panel = GetThemeColour("panel")
    GuiConfig.colours.box = GetThemeColour("box")
    GuiConfig.colours.background = GetThemeColour("background")
    GuiConfig.colours.selection = GetThemeColour("selection")
    GuiConfig.colours.logo = GetThemeColour("logo")
    GuiConfig.colours.text = GetThemeColour("text")

    exit_button.colours.accent = GetThemeColour("accent")
    directory_button.colours.accent = GetThemeColour("accent")
    exit_editor_button.colours.accent = GetThemeColour("accent")
    save_theme_button.colours.accent = GetThemeColour("accent")
    new_theme_button.colours.accent = GetThemeColour("accent")
    delete_theme_button.colours.accent = GetThemeColour("accent")
    duplicate_theme_button.colours.accent = GetThemeColour("accent")
    if (editor) {
      if (editor.loaded) {
        editor.theme_name.colours.text = GetThemeColour("text")
        editor.theme_name.colours.box = GetThemeColour("box")

        editor.colours.forEach(clr => {
          Object.keys(clr.sliders).forEach(s => {
            clr.sliders[s].value_text.colours.box = editor.theme_name.colours.box
            clr.sliders[s].value_text.colours.text = editor.theme_name.colours.text
          })
        })
      }
    }
  }

  let logo
  try {
    logo = Image.fromFile(`${ASSETS}/rdbt.png`)
  } catch (e) {}
  let exit_icon
  try {
    exit_icon = Image.fromFile(`${ASSETS}/cross.png`)
  } catch (e) {}

  let save_icon
  try {
    save_icon = Image.fromFile(`${ASSETS}/save.png`)
  } catch (e) {}

  let delete_icon
  try {
    delete_icon = Image.fromFile(`${ASSETS}/bin.png`)
  } catch (e) {}
  let copy_icon
  try {
    copy_icon = Image.fromFile(`${ASSETS}/duplicate.png`)
  } catch (e) {}

  let plus_icon
  try {
    plus_icon = Image.fromFile(`${ASSETS}/plus.png`)
  } catch (e) {}
  let directory_icon
  try {
    directory_icon = Image.fromFile(`${ASSETS}/folder.png`)
  } catch (e) {}

  let exit_editor_button = new ImageButton(exit_icon, () => {
    GuiConfig.editor.open = false
    editor = undefined
    ResizeGui()
  })
  exit_editor_button.colours.accent = new Color(1, 0.3, 0.3)

  let exit_button = new ImageButton(exit_icon, () => {
    GUI.close()
  })
  exit_button.colours.accent = new Color(1, 0.3, 0.3)

  let new_theme_button = new ImageButton(plus_icon, () => {
    CreateNewTheme()
  })
  new_theme_button.colours.accent = new Color(1, 0.3, 0.3)

  let directory_button = new ImageButton(directory_icon, () => {
    NotificationHandler.SendNotification("Opened Folder", "Themes", 3000)
    const Desktop = Java.type("java.awt.Desktop")
    Desktop.getDesktop().open(new File(Directory))
  })
  directory_button.colours.accent = new Color(249 / 255, 236 / 255, 217 / 255)

  class Theme {
    constructor(filename) {
      this.filename = filename

      this.theme = JSON.parse(FileLib.read("RdbtConfigV4/themes", filename))

      this.name = this.theme.name
      this.author = this.theme.author

      this.colours = {
        accent: new Color(1, 1, 1),
        background: new Color(0, 0, 0),
        panel: new Color(0, 0, 0),
        logo: new Color(1, 1, 1),
        box: new Color(0, 0, 0),
        text: new Color(1, 0, 0),
        selection: new Color(0.5, 0.5, 0.5),
      }

      this.x = 100
      this.y = 100
      this.width = (GuiConfig.main.width - 20) / 2 - 20
      this.height = 25

      this.mouseOver = false
    }

    Draw(x, y, MouseX, MouseY) {
      this.x = x
      this.y = y

      if (GuiConfig.mouseOverPanel) this.CheckMouseOver(MouseX, MouseY)
      this.width = (GuiConfig.main.width - 20) / 2 - 20

      if (this.mouseOver) {
        DropShadow(15, this.x, this.y + 1, this.width, this.height, 0.5, 5)
        this.y -= 1
      }
      DrawRoundedRect(this.colours.background, this.x, this.y, this.width, this.height, 5)

      StencilUtils.InitStencil()
      StencilUtils.BindWriteStencilBuffer()

      DrawRoundedRect(new Color(1, 1, 1), this.x + 1, this.y + 1, this.width - 2, this.height - 2, 5)

      StencilUtils.BindReadStencilBuffer(1)

      DrawRoundedRect(this.colours.panel, this.x, this.y, this.width, this.height, 0)
      DrawRoundedRect(this.colours.box, this.x + (this.width - 6) / 2, this.y, this.width, this.height, 0)
      DrawRoundedRect(this.colours.accent, this.x, this.y + this.height - 3, this.width, 2, 0)

      let c = this.colours.logo

      let r, g, b
      r = c.getRed() / 255
      g = c.getGreen() / 255
      b = c.getBlue() / 255

      Renderer.colorize(r, g, b)

      logo.draw(this.x + this.width - (this.height - 12) - 5.5, this.y + 5.5, this.height - 12, this.height - 12)

      font_17.drawString(this.name, this.x + 4, this.y + 4, this.colours.text)
      font_15.drawString(`${this.author}`, this.x + 4, this.y + 5 + font_17.getHeight(this.name), this.colours.text)
      StencilUtils.UninitStencilBuffer()
    }

    Click(btn) {
      if (this.mouseOver && GuiConfig.mouseOverPanel) {
        if (btn === 0) {
          SetTheme(this.filename)
          UpdateColours()
        } else {
          editor = new Editor(this.theme, this.filename)
        }
      }
    }

    CheckMouseOver(MouseX, MouseY) {
      this.mouseOver = MouseX > this.x && MouseX < this.x + this.width && MouseY > this.y && MouseY < this.y + this.height
    }

    UpdateColours() {
      this.colours = {
        accent: new Color(this.theme.colours.accent),
        background: new Color(this.theme.colours.background),
        panel: new Color(this.theme.colours.panel),
        box: new Color(this.theme.colours.box),
        logo: new Color(this.theme.colours.logo),
        text: new Color(this.theme.colours.text),
        selection: new Color(this.theme.colours.selection),
      }
    }
  }

  const KeyNames = {
    panel: "Main Panel",
    box: "Settings Box",
    background: "Border",
    selection: "Hover Colour",
    logo: "Logo",
    text: "Text",
    accent: "Accent",
    buttonBackground: "Button Background",
  }

  class Slider {
    constructor(name, value, parent) {
      this.name = name
      this.value = value
      this.parent = parent
      this.width = 100
      this.height = 10

      this.x = 0
      this.y = 0

      this.value_text = new EditableString(this.value.toString(), 3, new RegExp(/[0-9]/), font_15, false)

      this.percent = 0.5

      this.mouseOver = false

      this.dragging = false
    }

    Draw(x, y, width, MouseX, MouseY) {
      this.x = x
      this.y = y
      this.width = width

      let o = 5 + font_15.getWidth("Green")
      let w = this.width - 45 - o

      this.CheckMouseOver(MouseX, MouseY)

      if (this.dragging) this.CalculateValue(MouseX)

      this.percent = this.value / 255

      if (this.mouseOver) DropShadow(10, x + o, y + font_15.getHeight(this.name) / 2 - 1, w, 2, 0.5, 4)

      DrawRoundedRect(GuiConfig.colours.selection, x + o, y + font_15.getHeight(this.name) / 2 - 1, w, 2, 2)
      DrawRoundedRect(GuiConfig.colours.accent, x + o, y + font_15.getHeight(this.name) / 2 - 1, w * this.percent, 2, 2)

      font_15.drawString(this.name, this.x, this.y, GuiConfig.colours.text)

      this.value_text.Draw(this.x + o + w + 5, this.y - 2, MouseX, MouseY)
    }

    CheckMouseOver(MouseX, MouseY) {
      let o = 5 + font_15.getWidth("Green")
      let w = this.width - 45 - o
      this.mouseOver = MouseX > this.x + o && MouseX < this.x + o + w && MouseY > this.y && MouseY < this.y + this.height
    }

    CalculateValue(MouseX) {
      let barLeft = this.x + 5 + font_15.getWidth("Green")
      let barRight = this.x + this.width - 45
      let w = barRight - barLeft

      let x = MouseX - barLeft
      x = Math.max(0, x)
      x = Math.min(x, w)

      let v = x / w

      this.value = Math.ceil(v * 255)

      this.value_text.value = this.value.toString()
      this.value_text.text = this.value.toString()
      this.value_text.charArray = this.value.toString().split("")
    }

    Click(btn) {
      if (this.mouseOver) this.dragging = true

      let s = this.value_text.editing
      this.value_text.Click(btn)

      if (s && !this.value.editing) {
        this.value = Math.max(0, Math.min(parseInt(this.value_text.value), 255))

        this.value_text.value = this.value.toString()
        this.value_text.text = this.value.toString()
        this.value_text.charArray = this.value.toString().split("")
      }
    }

    KeyPress(char, keycode) {
      this.value_text.KeyPress(char, keycode)

      if (keycode === 28) {
        this.value = Math.max(0, Math.min(parseInt(this.value_text.value), 255))
        if (this.value === NaN) this.value = 0
        this.value_text.value = this.value.toString()
        this.value_text.text = this.value.toString()
        this.value_text.charArray = this.value.toString().split("")
      }
    }

    MouseUp() {
      this.dragging = false
    }
  }

  class ColourPicker {
    constructor(name, colour, parent) {
      this.name = name
      this.colour = new Color(colour)
      this.parent = parent

      this.mouseOver = false

      this.height = 45
      this.width

      this.sliders = {
        red: new Slider("Red", this.colour.getRed(), this),
        green: new Slider("Green", this.colour.getGreen(), this),
        blue: new Slider("Blue", this.colour.getBlue(), this),
      }
    }

    Draw(x, y, width, MouseX, MouseY) {
      this.x = x
      this.y = y

      this.width = width

      this.CheckMouseOver(MouseX, MouseY)

      if (this.mouseOver) {
        this.y -= 1
        DropShadow(15, this.x, this.y + 1, this.width, this.height, 0.5, 7)
      } else {
        this.MouseUp()
      }
      DrawRoundedRect(GuiConfig.colours.box, this.x, this.y, this.width, this.height, 5)

      DropShadow(15, this.x + this.width - 20, this.y + 15, 10, this.height - 20, 0.5, 8)
      DrawRoundedRect(this.colour, this.x + this.width - 20, this.y + 15, 10, this.height - 20, 5)
      font_17.drawString(KeyNames[this.name], this.x + 3, this.y + 3, GuiConfig.colours.text)

      let o = 0
      Object.keys(this.sliders).forEach(s => {
        this.sliders[s].Draw(this.x + 3, this.y + 15 + o, this.width - 6, MouseX, MouseY)
        o += 10
      })

      this.UpdateColour()
    }

    CheckMouseOver(MouseX, MouseY) {
      this.mouseOver = MouseX > this.x && MouseX < this.x + this.width && MouseY > this.y && MouseY < this.y + this.height
    }

    Click(btn) {
      Object.keys(this.sliders).forEach(s => {
        this.sliders[s].Click(btn)
      })
    }

    MouseUp() {
      Object.keys(this.sliders).forEach(s => {
        this.sliders[s].MouseUp()
      })
    }

    KeyPress(char, keycode) {
      Object.keys(this.sliders).forEach(s => {
        this.sliders[s].KeyPress(char, keycode)
      })
    }

    UpdateColour() {
      this.colour = new Color(this.sliders.red.value / 255, this.sliders.green.value / 255, this.sliders.blue.value / 255)
      this.parent.theme.colours[this.name] = this.colour.getRGB()
    }
  }

  const System = Java.type("java.lang.System")
  const GetSystemTimeMicroseconds = () => {
    return System.nanoTime()
  }

  class Editor {
    constructor(theme, file) {
      new Thread(() => {
        this.theme = theme
        this.theme_file = file
        this.colours = []

        this.LoadColours()

        this.theme_name = new EditableString(this.theme.name, 15, new RegExp(/[a-zA-Z0-9_ -]/), font_17)
        this.loaded = true

        ResizeGui()
      }).start()

      GuiConfig.editor.open = true
      this.dragging = false
      this.lastX = 0
      this.lastY = 0
    }

    Draw(x, y, width, height, MouseX, MouseY) {
      let SW,
        SH = Renderer.screen.getHeight()
      SW = Renderer.screen.getWidth()

      if (this.dragging) {
        let offsetX = this.lastX - GuiConfig.editor.x
        let offsetY = this.lastY - GuiConfig.editor.y

        GuiConfig.editor.x = Math.min(Math.max(0, MouseX - offsetX), SW - GuiConfig.editor.width)
        GuiConfig.editor.y = Math.min(Math.max(0, MouseY - offsetY), SH - GuiConfig.editor.height)

        config.editor.editor.x = GuiConfig.editor.x / SW
        config.editor.editor.y = GuiConfig.editor.y / SH

        this.lastX = MouseX
        this.lastY = MouseY
      }

      DropShadow(20, x, y, width, height, 0.5, GuiConfig.editor.borderRadius + 3)
      DrawRoundedRect(GuiConfig.colours.background, x, y, width, height, GuiConfig.editor.borderRadius)

      font_20.drawString(`Theme Editor`, x + width / 2 - font_20.getWidth("Theme Editor") / 2, y + 5, GuiConfig.colours.text)

      DrawRoundedRect(GuiConfig.colours.panel, x + 5, y + 20, width - 10, height - 30, 5)

      if (this.loaded) {
        let ox = 0
        let oy = 0

        this.theme_name.Draw(x + 10, y + 25, MouseX, MouseY)

        this.colours.forEach((clr, i) => {
          clr.Draw(x + 10 + ox, y + 40 + oy, (width - 20) / 2 - 2.5, MouseX, MouseY)
          if (i % 2 === 0) {
            ox += clr.width + 5
          } else {
            ox -= clr.width + 5
            oy += clr.height + 5
          }
        })

        exit_editor_button.Draw(x + width - 13, y + 5, 8, MouseX, MouseY)
        save_theme_button.Draw(x + 13, y + 5, 10, MouseX, MouseY)
        delete_theme_button.Draw(x + 33, y + 5, 10, MouseX, MouseY)
        duplicate_theme_button.Draw(x + 53, y + 5, 10, MouseX, MouseY)
        this.theme.name = this.theme_name.value
      } else {
        Renderer.drawString("Loading...", x + 10, y + 30)
      }
    }

    Click(mx, my, btn) {
      if (!this.loaded) return
      if (mx > GuiConfig.editor.x + 50 && mx < GuiConfig.editor.x + GuiConfig.editor.width - 20 && my > GuiConfig.editor.y && my < GuiConfig.editor.y + 20) {
        this.lastX = mx
        this.lastY = my
        this.dragging = true
      }

      this.theme_name?.Click(btn)
      this.colours.forEach(c => {
        c.Click(btn)
      })
    }

    MouseUp() {
      if (!this.loaded) return

      if (this.dragging) SaveConfig()
      this.dragging = false
      this.colours.forEach(c => {
        c.MouseUp()
      })
    }

    LoadColours() {
      Object.keys(this.theme.colours).forEach(key => {
        this.colours.push(new ColourPicker(key, this.theme.colours[key], this))
      })
    }

    KeyPress(char, keycode) {
      if (!this.loaded) return
      this.theme_name.KeyPress(char, keycode)

      this.colours.forEach(c => {
        c.KeyPress(char, keycode)
      })
    }
  }

  let editor

  let save_theme_button = new ImageButton(save_icon, () => {
    let theme = editor.theme
    FileLib.write(`RdbtConfigV4/themes`, `${editor.theme_file}`, JSON.stringify(theme))
    NotificationHandler.SendNotification(`Saving: ${theme.name}`, editor.theme_file, 3000)
  })

  let delete_theme_button = new ImageButton(delete_icon, () => {
    let path = `RdbtConfigV4/themes`
    GuiConfig.editor.open = false
    new Thread(() => {
      FileLib.delete(path, editor.theme_file)
      NotificationHandler.SendNotification(`Deleted '${editor.theme.name}'`, editor.theme_file, 3000)
      chat.message(`Deleted ${editor.theme.name} &c(${editor.theme_file.toString()}&c)`)
    }).start()
  })

  let duplicate_theme_button = new ImageButton(copy_icon, () => {
    new Thread(() => {
      let theme_file = CreateNewTheme()

      let theme = editor.theme
      theme.name = `${editor.theme.name} - Copy`
      FileLib.write("RdbtConfigV4/themes", theme_file, JSON.stringify(theme))

      NotificationHandler.SendNotification(`Duplicated ${editor.theme.name}`, `${theme.name} - ${theme_file}`, 3000)
    }).start()
  })

  const GetThemes = () => {
    let thms = []

    listFiles(Directory).forEach(f => {
      thms.push(new Theme(f))
    })

    GuiConfig.canScroll = thms.length > 10

    return thms
  }

  register("step", () => {
    if (GUI.isOpen()) {
      GuiConfig.themes = GetThemes()
      GuiConfig.themes.forEach(theme => {
        theme.UpdateColours()
      })

      ResizeGui()
    }
  }).setDelay(1)

  register("step", () => {
    if (GUI.isOpen()) UpdateColours()
  }).setFps(5)

  const ResizeGui = () => {
    let screenWidth = Renderer.screen.getWidth()
    let screenHeight = Renderer.screen.getHeight()

    GuiConfig.main.width = screenWidth * 0.3

    if (config.editor.themes.customPos) GuiConfig.main.x = screenWidth * config.editor.themes.x
    else GuiConfig.main.x = screenWidth / 2 - (GuiConfig.editor.open ? -30 : GuiConfig.main.width / 2)

    let h
    if (GuiConfig.themes[0]) h = GuiConfig.themes[0].height + 5
    else h = 20

    let b = Math.ceil(GuiConfig.themes.length / 2)
    let c = Math.min(5, Math.ceil(GuiConfig.themes.length / 2))

    GuiConfig.maxScroll = -(b * h - c * h)

    GuiConfig.main.height = 50 + c * h
    if (config.editor.themes.customPos) GuiConfig.main.y = screenHeight * config.editor.themes.y
    else GuiConfig.main.y = screenHeight / 2 - GuiConfig.main.height / 2

    if (!GuiConfig.editor.open) return

    GuiConfig.editor.width = screenWidth * 0.4

    if (config.editor.editor.customPos) GuiConfig.editor.x = screenWidth * config.editor.editor.x
    else GuiConfig.editor.x = screenWidth / 2 - GuiConfig.editor.width

    GuiConfig.editor.height = screenHeight * 0.5
    if (config.editor.editor.customPos) GuiConfig.editor.y = screenHeight * config.editor.editor.y
    else GuiConfig.editor.y = screenHeight / 2 - GuiConfig.editor.height / 2
  }
  const GUI = new Gui()

  let LastX = 0
  let LastY = 0
  let DraggingMain = false

  const MouseOverPanel = (MouseX, MouseY) => {
    GuiConfig.mouseOverPanel = MouseX > GuiConfig.main.x + 10 && MouseX < GuiConfig.main.x + GuiConfig.main.width - 10 && MouseY > GuiConfig.main.y + 25 && MouseY < GuiConfig.main.y + GuiConfig.main.height - 10
  }

  GUI.registerDraw((MouseX, MouseY) => {
    let SW,
      SH = Renderer.screen.getHeight()
    SW = Renderer.screen.getWidth()

    if (DraggingMain) {
      let offsetX = LastX - GuiConfig.main.x
      let offsetY = LastY - GuiConfig.main.y

      GuiConfig.main.x = Math.min(Math.max(0, MouseX - offsetX), SW - GuiConfig.main.width)
      GuiConfig.main.y = Math.min(Math.max(0, MouseY - offsetY), SH - GuiConfig.main.height)

      config.editor.themes.x = GuiConfig.main.x / SW
      config.editor.themes.y = GuiConfig.main.y / SH

      LastX = MouseX
      LastY = MouseY
    }

    MouseOverPanel(MouseX, MouseY)

    DropShadow(20, GuiConfig.main.x, GuiConfig.main.y, GuiConfig.main.width, GuiConfig.main.height, 0.5, GuiConfig.main.borderRadius + 3)
    DrawRoundedRect(GuiConfig.colours.background, GuiConfig.main.x, GuiConfig.main.y, GuiConfig.main.width, GuiConfig.main.height, GuiConfig.main.borderRadius)
    font_20.drawString("Themes", GuiConfig.main.x + GuiConfig.main.width / 2 - font_20.getWidth("Themes") / 2, GuiConfig.main.y + 12.5 - font_20.getHeight("T") / 2, GuiConfig.colours.text)

    DrawRoundedRect(GuiConfig.colours.panel, GuiConfig.main.x + 10, GuiConfig.main.y + 25, GuiConfig.main.width - 20, GuiConfig.main.height - 35, 5)

    if (!GuiConfig.themes[0]) {
      font_17.drawString("No themes loaded. Click '+' to create new theme, or import existing", GuiConfig.main.x + 15, GuiConfig.main.y + 29, GuiConfig.colours.text)
    }
    exit_button.Draw(GuiConfig.main.x + GuiConfig.main.width - 16.5, GuiConfig.main.y + 8.5, 8, MouseX, MouseY)
    directory_button.Draw(GuiConfig.main.x + 8.5, GuiConfig.main.y + 7.5, 10, MouseX, MouseY)
    new_theme_button.Draw(GuiConfig.main.x + 28.5, GuiConfig.main.y + 7.5, 10, MouseX, MouseY)

    if (GuiConfig.canScroll) {
      if (Math.abs(GuiConfig.scrollVelocity) < 0.1) {
        GuiConfig.scrollVelocity = 0
      }

      if (GuiConfig.scrollVelocity > 0) {
        GuiConfig.scrollVelocity = GuiConfig.scrollVelocity - 0.1
        GuiConfig.scroll -= GuiConfig.scrollVelocity
      } else if (GuiConfig.scrollVelocity < 0) {
        GuiConfig.scrollVelocity = GuiConfig.scrollVelocity + 0.1
        GuiConfig.scroll -= GuiConfig.scrollVelocity
      }
    }

    GuiConfig.scroll -= GuiConfig.scrollVelocity

    GuiConfig.scroll = Math.max(Math.min(GuiConfig.scroll, 0), GuiConfig.maxScroll)

    let ox = 0
    let oy = GuiConfig.canScroll ? GuiConfig.scroll : 0

    let sr = new net.minecraft.client.gui.ScaledResolution(Client.getMinecraft())

    let scaleFactor = sr.func_78325_e()
    let scaleHeight = sr.func_78328_b()

    GL11.glEnable(GL11.GL_SCISSOR_TEST)
    GL11.glScissor((GuiConfig.main.x + 10) * scaleFactor, (scaleHeight - (GuiConfig.main.y - 10 + GuiConfig.main.height)) * scaleFactor, (GuiConfig.main.width - 20) * scaleFactor, (GuiConfig.main.height - 35) * scaleFactor)

    GuiConfig.themes.forEach((theme, i) => {
      theme.Draw(GuiConfig.main.x + 20 + ox, GuiConfig.main.y + 35 + oy, MouseX, MouseY)

      if (i % 2 === 0) {
        ox += theme.width + 20
      } else {
        ox -= theme.width + 20
        oy += theme.height + 5
      }
    })

    GL11.glDisable(GL11.GL_SCISSOR_TEST)

    if (!GuiConfig.editor.open) return

    editor.Draw(GuiConfig.editor.x, GuiConfig.editor.y, GuiConfig.editor.width, GuiConfig.editor.height, MouseX, MouseY)
  })

  const SaveConfig = () => {
    let c = JSON.parse(FileLib.read("RdbtConfigV4", "guiconfig.json"))
    c.editor.editor = config.editor.editor
    c.editor.themes = config.editor.themes
    FileLib.write("RdbtConfigV4", "guiconfig.json", JSON.stringify(c))
  }

  GUI.registerScrolled((mx, my, scroll) => {
    if (!GuiConfig.mouseOverPanel) return
    if (GuiConfig.canScroll) {
      GuiConfig.scrollVelocity = -scroll * 3
      GuiConfig.scrollVelocity = Math.min(GuiConfig.scrollVelocity, 7)
      GuiConfig.scrollVelocity = Math.max(GuiConfig.scrollVelocity, -7)
    } else GuiConfig.scrollVelocity = 0
  })

  GUI.registerClicked((mx, my, btn) => {
    if (mx > GuiConfig.main.x + 20 && mx < GuiConfig.main.x + GuiConfig.main.width - 20 && my > GuiConfig.main.y && my < GuiConfig.main.y + 25) {
      DraggingMain = true
      LastX = mx
      LastY = my
    }

    exit_button.Click()
    directory_button.Click()
    new_theme_button.Click()
    GuiConfig.themes.forEach(theme => {
      theme.Click(btn)
    })

    if (!GuiConfig.editor.open) return
    editor.Click(mx, my, btn)
    exit_editor_button.Click()
    save_theme_button.Click()
    delete_theme_button.Click()
    duplicate_theme_button.Click()
  })

  GUI.registerKeyTyped((key, keycode) => {
    if (!GuiConfig.editor.open) return
    editor.KeyPress(key, keycode)
  })

  GUI.registerMouseReleased(() => {
    if (DraggingMain) SaveConfig()

    DraggingMain = false

    if (!GuiConfig.editor.open) return
    editor.MouseUp()
  })

  register("command", () => {
    GuiConfig.themes = GetThemes()
    GuiConfig.editor.open = false
    GuiConfig.themes.forEach(theme => {
      theme.UpdateColours()
    })

    ResizeGui()
    GUI.open()
  }).setName("rdbttheme")
}
