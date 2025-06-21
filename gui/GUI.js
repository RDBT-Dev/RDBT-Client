import Font from "FontLib"
let { chat, GuiUtils, StencilUtils, CategoryTitle, ModuleButton, ValueSlider, SelectionDropdown, ToggleButton, ImageButton } = global.export
let { SendNotification, GetThemeColour } = GuiUtils

const GUI = () => {
  global.export.ThemeEditor()

  const GLOBAL_MODULES = ["Failsafes", "Rotations", "Other", "Backend Connection"]

  const Color = Java.type("java.awt.Color")
  const File = Java.type("java.io.File")

  const font_bold = new Font("RdbtClient/assets/Bold.ttf", 36)
  const font_17 = new Font("RdbtClient/assets/SF-Pro-Display-Medium.ttf", 17)
  const font_15 = new Font("RdbtClient/assets/SF-Pro-Display-Medium.ttf", 15)
  const font_15_5 = new Font("RdbtClient/assets/SF-Pro-Display-Medium.ttf", 15.5)
  const font_19 = new Font("RdbtClient/assets/SF-Pro-Display-Medium.ttf", 19)
  const font_19_5 = new Font("RdbtClient/assets/SF-Pro-Display-Medium.ttf", 19.5)
  const font_20 = new Font("RdbtClient/assets/SF-Pro-Display-Medium.ttf", 20)
  const font_20_5 = new Font("RdbtClient/assets/SF-Pro-Display-Medium.ttf", 20.5)

  const FolderName = "RdbtConfigV4"

  const banning_module_url = "https://gist.githubusercontent.com/rdbtCVS/abea81fae691ce5a07924d2bb3e85ff9/raw"

  const ASSETS = "config/ChatTriggers/modules/RdbtClient/assets"

  let logo = Image.fromFile(`${ASSETS}/rdbt.png`)

  let DraggingWindow = false

  let windowconfig = JSON.parse(FileLib.read("RdbtConfigV4", "guiconfig.json"))

  let theme_icon = Image.fromFile(`${ASSETS}/theme.png`)

  let move_icon = Image.fromFile(`${ASSETS}/move.png`)

  let move_button = new ImageButton(move_icon, () => {
    global.export.EditLocation.EditConfig()

    let cl = false
    let ro = register("renderOverlay", () => {
      if (!cl) GuiUtils.DrawRoundedRect(new Color(0, 0, 0, 0.4), 0, 0, Renderer.screen.getWidth(), Renderer.screen.getHeight(), 0)
    })
    Client.scheduleTask(5, () => {
      let reg = register("guiClosed", () => {
        reg.unregister()
        cl = true
        Client.scheduleTask(5, () => {
          ro.unregister()
        })
        gui.open()
      })
    })
  })

  let theme_button = new ImageButton(theme_icon, () => {
    ChatLib.command("rdbttheme", true)

    let ro = register("renderOverlay", () => {
      DrawGui(0, 0)
      GuiUtils.DrawRoundedRect(new Color(0, 0, 0, 0.4), GuiConfig.main.x, GuiConfig.main.y, GuiConfig.main.width, GuiConfig.main.height, GuiConfig.main.borderRadius)
    })
    Client.scheduleTask(5, () => {
      let reg = register("guiClosed", () => {
        reg.unregister()

        LoadTheme()

        Client.scheduleTask(5, () => {
          ro.unregister()
        })
        gui.open()
      })
    })
  })

  let exit_icon = Image.fromFile(`${ASSETS}/cross.png`)

  let exit_button = new ImageButton(exit_icon, () => {
    gui.close()
  })
  exit_button.colours.accent = new Color(1, 0.3, 0.3)

  let warning_icon = Image.fromFile(`${ASSETS}/warn.png`)

  let directory_icon = Image.fromFile(`${ASSETS}/folder.png`)

  let directory_button = new ImageButton(directory_icon, () => {
    const Desktop = Java.type("java.awt.Desktop")
    Desktop.getDesktop().open(new File("config/ChatTriggers/modules/RdbtConfigV4/"))
  })

  const GuiConfig = {
    colours: {
      panel: new Color(19 / 255, 21 / 255, 25 / 255),
      box: new Color(16 / 255, 18 / 255, 19 / 255),
      background: new Color(12 / 255, 14 / 255, 15 / 255),
      selection: new Color(31 / 255, 35 / 255, 41 / 255),
      logo: new Color(249 / 255, 236 / 255, 217 / 255),
      text: new Color(200 / 255, 200 / 255, 180 / 255),
      accent: new Color(1, 1, 1),
    },
    main: {
      width: 100,
      height: 100,
      x: 100,
      y: 100,
      borderRadius: 11,
    },
    panel: {
      width: 100,
      height: 100,
      x: 100,
      y: 100,
      borderRadius: 7,
    },
    configbox: {
      width: 100,
      height: 100,
      x: 100,
      y: 100,
    },
    globalbox: {
      width: 100,
      height: 100,
      x: 100,
      y: 100,
    },
    currentCategory: "MINING",
  }

  const LoadTheme = () => {
    let colours = {
      panel: GetThemeColour("panel"),
      background: GetThemeColour("background"),
      box: GetThemeColour("box"),
      selection: GetThemeColour("selection"),
      logo: GetThemeColour("logo"),
      text: GetThemeColour("text"),
      accent: GetThemeColour("accent"),
      buttonBackground: GetThemeColour("buttonBackground"),
    }

    GuiConfig.colours.panel = colours.panel
    GuiConfig.colours.background = colours.background
    GuiConfig.colours.box = colours.box
    GuiConfig.colours.selection = colours.selection
    GuiConfig.colours.logo = colours.logo
    GuiConfig.colours.text = colours.text
    GuiConfig.colours.accent = colours.accent

    categories.forEach(cat => {
      cat.button.colours.text = colours.text
      cat.button.colours.accent = colours.accent

      cat?.modules.forEach(mod => {
        mod.button.colours.text = colours.text
        mod.button.colours.accent = colours.accent

        mod.keys.forEach(key => {
          key.colours.text = colours.text
          key.colours.background = colours.background
          key.colours.accent = colours.accent
          key.colours.box = colours.box
          key.colours.buttonBackground = colours.buttonBackground
          key.colours.panel = colours.panel
        })
      })
    })

    globalModules.forEach(mod => {
      mod.keys.forEach(key => {
        key.colours.text = colours.text
        key.colours.background = colours.background
        key.colours.accent = colours.accent
        key.colours.panel = colours.panel
        key.colours.box = colours.box
        key.colours.buttonBackground = colours.buttonBackground
      })
    })

    theme_button.colours.accent = colours.accent
    exit_button.colours.accent = colours.accent
    directory_button.colours.accent = colours.accent
    move_button.colours.accent = colours.accent
  }

  // register("step", () => {
  //   LoadTheme()
  // }).setFps(5)

  class Category {
    constructor(ID, index) {
      this.ID = ID
      this.index = index
      this.modules = []
      this.selected = false

      this.button = new CategoryTitle(
        this.ID,
        () => {
          GuiConfig.currentCategory = this.ID
        },
        font_20,
        font_20_5,
      )
    }

    Draw(x, y, MouseX, MouseY) {
      // Draw Button
      this.selected = this.ID == GuiConfig.currentCategory
      if (this.button.selected != this.selected) {
        this.button.interractTimestamp = Date.now()

        // Deselect all modules
        if (this.selected) {
          categories.forEach(cat => {
            cat.modules?.forEach(m => {
              m.selected = false
              m.button.selected = false
            })
          })
        }

        // Select first module in category
        if (this.modules[0]) {
          // fix breaking with empty category
          this.modules[0].selected = true
          this.modules[0].button.selected = true
          this.modules[0].button.interractTimestamp = Date.now()
        }
      }

      this.button.selected = this.selected
      const categoryColumnWidth = GuiConfig.panel.x - GuiConfig.main.x
      this.button.Draw(x, y, categoryColumnWidth, MouseX, MouseY)

      // Draw modules
      if (this.selected) {
        let o = 0
        this.modules.forEach((module, i) => {
          module.Draw(GuiConfig.main.x + 7.5, GuiConfig.panel.y + 150 + o, MouseX, MouseY)
          o += 20
        })

        if (!this.modules[0]) {
          font_17.drawString("Nothing here yet ;)", GuiConfig.configbox.x + 10, GuiConfig.configbox.y + 10, GuiConfig.colours.text) // wish someone told me this was an issue sooner..
        }
      }
    }

    KeyPress(char, keycode) {
      this.modules.forEach(m => {
        m.KeyPress(char, keycode)
      })
    }

    MouseUp() {
      this.modules.forEach(m => {
        m.MouseUp()
      })
    }

    Click(btn) {
      this.button.Click(btn)
      this.modules.forEach(m => {
        m.Click(btn)
      })
    }

    AddModule(module) {
      this.modules.push(module)
    }
  }

  function fakeBan(reason) {
    const ChatComponentText = Java.type("net.minecraft.util.ChatComponentText")

    function makeid() {
      var result = ""
      var characters = "ABCDEF"
      var charactersLength = characters.length
      for (var i = 0; i < 8; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength))
      }
      return result
    }

    Client.getMinecraft()
      .func_147114_u()
      .func_147298_b()
      .func_150718_a(
        new ChatComponentText(
          "§cYou are temporarily banned for §f359d 23h 59m 59s§c from this server!\n\n" +
            `§7Reason: §r${reason}\n` +
            "§7Find out more: §b§nhttps://www.hypixel.net/appeal\n\n§7Ban ID: §r#" +
            makeid() +
            "\n§7Sharing your Ban ID may affect the processing of your appeal!",
        ),
      )
  }

  class Module {
    constructor(name, keys, description) {
      this.name = name
      this.keys = keys
      this.description = description
      this.selected = false

      this.open = false

      this.button = new ModuleButton(
        this.name,
        () => {
          // Deselect all modules
          categories.forEach(cat => {
            cat.modules?.forEach(m => {
              if (m.selected) m.button.interractTimestamp = Date.now()
              m.selected = false
              m.button.selected = false
            })
          })
          // Select this module
          this.selected = true
          this.button.selected = true
        },
        font_15,
        font_15_5,
        font_19,
        font_19_5,
      )
    }

    Draw(x, y, MouseX, MouseY) {
      let BarWidth = GuiConfig.main.width - GuiConfig.panel.width

      if (!safe_modules.Modules[this.name]) {
        //Renderer.drawRect(Renderer.RED, x + (BarWidth / 2) - (font_19.getWidth(this.name) / 2),  y + font_19.getHeight(this.name) + 5, font_19.getWidth(this.name), 0.5)

        Renderer.colorize(1, 0.2, 0.2)
        warning_icon.draw(x + BarWidth - 20, y + 5.5, 9, 9)
        this.button.Draw(x, y, BarWidth, MouseX, MouseY)
      } else {
        this.button.Draw(x, y, BarWidth, MouseX, MouseY)
      }

      if (this.selected) {
        font_17.drawString(this.name, GuiConfig.configbox.x + 5, GuiConfig.configbox.y + 3, GuiConfig.colours.accent)

        if (!safe_modules.Modules[this.name]) {
          font_19.drawString(
            "[!]   Warning! Module flagged as unsafe.   [!]",
            GuiConfig.configbox.x + GuiConfig.configbox.width / 2 - font_19.getWidth("[!]   Warning! Module flagged as unsafe.   [!]") / 2,
            GuiConfig.configbox.y + GuiConfig.configbox.height - 5 - font_19.getHeight("!"),
            new java.awt.Color(1, 0.2, 0.2),
          )
        }

        let o = 0

        this.description.forEach(line => {
          font_15.drawString(`${line}`, GuiConfig.configbox.x + 5, GuiConfig.configbox.y + 13 + o, GuiConfig.colours.text)
          o += font_15.getHeight(line) + 2
        })

        this.keys.forEach(setting => {
          setting.width = GuiConfig.configbox.width - 20
          setting.Draw(GuiConfig.configbox.x + 5, GuiConfig.configbox.y + 20 + o, MouseX, MouseY)

          o += setting.height
        })
      }
    }

    KeyPress(char, keycode) {
      this.keys.forEach(key => {
        key.KeyPress(char, keycode)
      })
    }

    MouseUp() {
      this.keys.forEach(key => {
        key.MouseUp()
      })
    }

    Click(btn) {
      this.button.Click(btn)

      if (this.selected) {
        this.keys.forEach(key => {
          key.Click(btn)
        })
      }
    }
  }

  class GlobalModule {
    constructor(name, keys, description) {
      this.name = name
      this.keys = keys
      this.description = description

      this.height = 0
    }

    Draw(x, y, MouseX, MouseY) {
      font_17.drawString(this.name, x, y, GuiConfig.colours.text)
      let o = 0

      this.description.forEach(line => {
        font_15.drawString(`${line}`, x, y + 13 + o, GuiConfig.colours.text)
        o += font_15.getHeight(line) + 2
      })

      this.keys.forEach(setting => {
        ;(setting.width = GuiConfig.globalbox.width - 10), setting.Draw(x, y + 20 + o, MouseX, MouseY)

        o += setting.height
      })

      this.height = o + 35
      GuiUtils.DrawRoundedRect(GuiConfig.colours.selection, GuiConfig.globalbox.x + 10, y + 30 + o, GuiConfig.globalbox.width - 20, 1, 0)
    }

    Click(btn) {
      this.keys.forEach(key => {
        key.Click(btn)
      })
    }

    getHeight() {
      return this.height
    }

    KeyPress(char, keycode) {
      this.keys.forEach(key => {
        key.KeyPress(char, keycode)
      })
    }

    MouseUp() {
      this.keys.forEach(key => {
        key.MouseUp()
      })
    }
  }

  const UpdateGuiScale = () => {
    let ScreenHeight,
      ScreenWidth = Renderer.screen.getWidth()
    ScreenHeight = Renderer.screen.getHeight()

    // Update scale and positions

    // Main
    GuiConfig.main.height = 400
    GuiConfig.main.width = 700

    if (windowconfig.main.customPos) {
      GuiConfig.main.x = ScreenWidth * windowconfig.main.x
      GuiConfig.main.y = ScreenHeight * windowconfig.main.y
    } else {
      GuiConfig.main.x = ScreenWidth / 2 - GuiConfig.main.width / 2
      GuiConfig.main.y = ScreenHeight / 2 - GuiConfig.main.height / 2
    }

    // Panel
    GuiConfig.panel.width = GuiConfig.main.width * 0.8
    GuiConfig.panel.height = GuiConfig.main.height * 0.915
    GuiConfig.panel.x = GuiConfig.main.x + GuiConfig.main.width - GuiConfig.panel.width
    GuiConfig.panel.y = GuiConfig.main.y + GuiConfig.main.height - GuiConfig.panel.height

    // Settings Box
    GuiConfig.configbox.width = (GuiConfig.panel.width - 20) * 0.6
    GuiConfig.configbox.height = GuiConfig.panel.height - 20
    GuiConfig.configbox.x = GuiConfig.panel.x + 10
    GuiConfig.configbox.y = GuiConfig.panel.y + 10

    // Global Settings Box
    GuiConfig.globalbox.width = (GuiConfig.panel.width - 20) * 0.4 - 5
    GuiConfig.globalbox.height = GuiConfig.panel.height - 20
    GuiConfig.globalbox.x = GuiConfig.panel.x + GuiConfig.configbox.width + 15
    GuiConfig.globalbox.y = GuiConfig.panel.y + 10
  }

  let guiScale // Store GUI scale setting value to reset on GUI close

  const gui = new Gui()

  // REGISTERS

  register("command", () => {
    LoadTheme()
    gui.open()
  })
    .setName("rdbt")
    .setAliases(["polar", "polinex"])

  register("command", () => {
    windowconfig.main.x = (Renderer.screen.getWidth() / 2 - GuiConfig.main.width / 2) / Renderer.screen.getWidth()
    windowconfig.main.y = (Renderer.screen.getHeight() / 2 - GuiConfig.main.height / 2) / Renderer.screen.getHeight()

    windowconfig.editor.themes.x = 0.16145833333333334
    windowconfig.editor.themes.y = 0.347029702970297

    windowconfig.editor.editor.x = 0.5020833333333333
    windowconfig.editor.editor.y = 0.296039603960396

    SaveConfig()
  })
    .setName("defuck")
    .setAliases(["unfuck", "helpmyguiisfucked", "whereguigone", "guigopoof"])

  DraggingWindow = false
  let LastX = 0
  let LastY = 0

  gui.registerClicked((mx, my, btn) => {
    let w = 0
    categories.forEach(c => {
      w += c.button.GetWidth() + 10
    })
    DraggingWindow = mx > GuiConfig.main.x - GuiConfig.main.width && mx < GuiConfig.main.x + GuiConfig.main.width && my > GuiConfig.main.y && my < GuiConfig.main.y + (GuiConfig.panel.y - GuiConfig.main.y)
    if (DraggingWindow) {
      LastX = mx
      LastY = my
    }

    categories.forEach(category => {
      category.Click(btn)
    })
    theme_button.Click(btn)
    directory_button.Click(btn)
    exit_button.Click(btn)
    move_button.Click(btn)

    globalModules.forEach(mod => {
      mod.Click(btn)
    })
  })

  gui.registerMouseReleased(() => {
    if (DraggingWindow) SaveConfig()

    DraggingWindow = false

    categories.forEach(category => {
      category.MouseUp()
    })

    globalModules.forEach(mod => {
      mod.MouseUp()
    })
  })

  const SaveConfig = () => {
    let c = JSON.parse(FileLib.read("RdbtConfigV4", "guiconfig.json"))
    c.main = windowconfig.main
    FileLib.write("RdbtConfigV4", "guiconfig.json", JSON.stringify(c))
  }

  gui.registerKeyTyped((char, keycode) => {
    categories.forEach(category => {
      category.KeyPress(char, keycode)
    })

    globalModules.forEach(mod => {
      mod.KeyPress(char, keycode)
    })
  })

  gui.registerOpened(() => {
    guiScale = Client.getSettings().getSettings().field_74335_Z
    Client.getSettings().getSettings().field_74335_Z = 2 // Set GUI scale to 2 (Normal) (Jank fix, cba to dynamic scale)

    // Scale
    UpdateGuiScale()
  })

  gui.registerClosed(() => {
    Client.getSettings().getSettings().field_74335_Z = guiScale // Reset UI scale to user's preference on closing GUI

    if (DraggingWindow) SaveConfig()

    DraggingWindow = false
  })
  // Gui rendering fuckery
  gui.registerDraw((MouseX, MouseY) => {
    DrawGui(MouseX, MouseY)
  })

  const DrawCategories = (MouseX, MouseY) => {
    const categoryColumnStartX = GuiConfig.main.x

    const initialY = GuiConfig.main.y - 10 // Y for the first category

    let offsetY = 0
    categories.forEach(category => {
      category.Draw(categoryColumnStartX + 7.5, initialY + offsetY, MouseX, MouseY)
      offsetY += category.button.GetHeight() + 7
    })
  }

  let GlobalModuleScroll = 0
  let MouseOverGlobal = false
  let GlobalCanScroll = false
  let GlobalMouseScrollVelocity = 0
  let GlobalModuleMaxScroll = 0

  gui.registerScrolled((mx, my, scroll) => {
    if (!MouseOverGlobal) return
    if (GlobalCanScroll) {
      GlobalMouseScrollVelocity += scroll * 3
      GlobalMouseScrollVelocity = Math.min(GlobalMouseScrollVelocity, 5)
      GlobalMouseScrollVelocity = Math.max(GlobalMouseScrollVelocity, -5)
    } else GlobalMouseScrollVelocity = 0
  })

  const DrawGlobalModules = (MouseX, MouseY) => {
    MouseOverGlobal = MouseX > GuiConfig.globalbox.x && MouseX < GuiConfig.globalbox.x + GuiConfig.globalbox.width && MouseY > GuiConfig.globalbox.y && MouseY < GuiConfig.globalbox.y + GuiConfig.globalbox.height

    GlobalModuleMaxScroll = 0
    globalModules.forEach(m => {
      GlobalModuleMaxScroll += m.getHeight()
    })
    if (GlobalModuleMaxScroll > GuiConfig.globalbox.height) {
      GlobalModuleMaxScroll -= GuiConfig.globalbox.height - 20
      GlobalCanScroll = true
    } else {
      GlobalCanScroll = false
    }

    if (GlobalCanScroll) {
      if (Math.abs(GlobalMouseScrollVelocity) < 0.1) {
        GlobalMouseScrollVelocity = 0
      }

      if (GlobalMouseScrollVelocity > 0) {
        GlobalMouseScrollVelocity -= 0.1
        GlobalModuleScroll -= GlobalMouseScrollVelocity
      } else if (GlobalMouseScrollVelocity < 0) {
        GlobalMouseScrollVelocity += 0.1
        GlobalModuleScroll -= GlobalMouseScrollVelocity
      }

      GlobalModuleScroll = Math.max(0, GlobalModuleScroll)
      GlobalModuleScroll = Math.min(GlobalModuleMaxScroll, GlobalModuleScroll)
    } else {
      GlobalModuleScroll = 0
    }

    if (GlobalCanScroll && MouseOverGlobal) {
      let p = (GuiConfig.globalbox.height - 23) * (GuiConfig.globalbox.height / (GuiConfig.globalbox.height + GlobalModuleMaxScroll))

      let perc = GlobalModuleScroll / GlobalModuleMaxScroll

      let y = (GuiConfig.globalbox.height - 23 - p) * perc

      GuiUtils.DropShadow(10, GuiConfig.globalbox.x + GuiConfig.globalbox.width, GuiConfig.globalbox.y + 16 + y, 1, p, 0.5, 6)
      GuiUtils.DrawRoundedRect(GuiConfig.colours.accent, GuiConfig.globalbox.x + GuiConfig.globalbox.width, GuiConfig.globalbox.y + 16 + y, 1, p, 0.1)
    }

    let o = 0 - GlobalModuleScroll

    let sr = new net.minecraft.client.gui.ScaledResolution(Client.getMinecraft())

    let scaleFactor = sr.func_78325_e()
    let scaleHeight = sr.func_78328_b()

    GL11.glEnable(GL11.GL_SCISSOR_TEST)
    GL11.glScissor(GuiConfig.globalbox.x * scaleFactor, (scaleHeight - (GuiConfig.panel.y - 10 + GuiConfig.panel.height)) * scaleFactor, GuiConfig.globalbox.width * scaleFactor, (GuiConfig.globalbox.height - 16) * scaleFactor)

    globalModules.forEach(gm => {
      gm.Draw(GuiConfig.globalbox.x + 5, GuiConfig.globalbox.y + 20 + o, MouseX, MouseY)
      o += gm.getHeight()
    })

    GL11.glDisable(GL11.GL_SCISSOR_TEST)
  }

  let safe_modules = []

  const update_safe_modules = (callback = () => {}) => {
    try {
      safe_modules = JSON.parse(FileLib.getUrlContent(banning_module_url))
      callback()
    } catch (e) {
      console.warn(e)
      SendNotification("Warning", "Safe module list not loaded")
    }
  }

  update_safe_modules()

  register("step", () => {
    let prev = safe_modules

    update_safe_modules(() => {
      if (prev != safe_modules) {
        Object.keys(prev["Modules"]).forEach(key => {
          if (!safe_modules.Modules[key]) {
          }
        })
      }
    })
  }).setDelay(120)

  let userInfo = {
    channel: "RDBT Client V4.4.4",
    version: "Very good client",
    username: Player.getName(),
    avatar: {
      // image: logo,
      type: "fallback",
    },
  }

  const DrawUserInfo = (x, y, MouseX, MouseY) => {
    if (userInfo.avatar.type != "fallback" && userInfo.avatar.image) GuiUtils.DropShadow(20, x, y, 30, 30, 0.8, 14)
    StencilUtils.InitStencil()
    StencilUtils.BindWriteStencilBuffer()

    GuiUtils.DrawRoundedRect(new Color(1, 1, 1), x, y, 30, 30, 11)
    StencilUtils.BindReadStencilBuffer(1)

    if (userInfo.avatar.type == "fallback" && userInfo.avatar.image) {
      let c = GuiConfig.colours.logo

      let r, g, b
      r = c.getRed() / 255
      g = c.getGreen() / 255
      b = c.getBlue() / 255

      Renderer.colorize(r, g, b)
    }
    userInfo.avatar.image?.draw(x, y, 30, 30)

    StencilUtils.UninitStencilBuffer()

    font_17.drawString(`${userInfo.username}`, x + 475, y - 347, GuiConfig.colours.text)
    font_15.drawString(`${userInfo.channel}`, x + 475, y - 337, GuiConfig.colours.text)
  }

  const DrawGui = (MouseX, MouseY) => {
    // Drag Window
    if (DraggingWindow) {
      let SW,
        SH = Renderer.screen.getHeight()
      SW = Renderer.screen.getWidth()

      let offsetX = LastX - GuiConfig.main.x
      let offsetY = LastY - GuiConfig.main.y

      GuiConfig.main.x = Math.min(Math.max(0, MouseX - offsetX), SW - GuiConfig.main.width)
      GuiConfig.main.y = Math.min(Math.max(0, MouseY - offsetY), SH - GuiConfig.main.height)

      windowconfig.main.x = GuiConfig.main.x / SW
      windowconfig.main.y = GuiConfig.main.y / SH

      LastX = MouseX
      LastY = MouseY

      UpdateGuiScale()
    }

    // Draw background rect
    GuiUtils.DropShadow(20, GuiConfig.main.x, GuiConfig.main.y, GuiConfig.main.width, GuiConfig.main.height, 1, GuiConfig.main.borderRadius) // shadow around outside
    GuiUtils.DrawRoundedRect(GuiConfig.colours.background, GuiConfig.main.x, GuiConfig.main.y, GuiConfig.main.width, GuiConfig.main.height, GuiConfig.main.borderRadius) // main background

    // Draw Panel
    // GuiUtils.DrawRoundedRect(GuiConfig.colours.panel, GuiConfig.panel.x, GuiConfig.panel.y, GuiConfig.panel.width - 10, GuiConfig.panel.height, GuiConfig.panel.borderRadius)
    // GuiUtils.DrawRoundedRect(GuiConfig.colours.panel, GuiConfig.panel.x, GuiConfig.panel.y, GuiConfig.panel.width, GuiConfig.panel.height - 10, GuiConfig.panel.borderRadius)
    // GuiUtils.DrawRoundedRect(GuiConfig.colours.panel, GuiConfig.panel.x + GuiConfig.panel.width - 20, GuiConfig.panel.y + GuiConfig.panel.height - 20, 20, 20, GuiConfig.main.borderRadius) // GuiUtils.DrawRoundedRect(GuiConfig.colours.panel, GuiConfig.panel.x + GuiConfig.panel.width - 10, GuiConfig.panel.y, 10, 10, 0) // "Un-round" corners touching flat face of main  // TOP RIGHT // GuiUtils.DrawRoundedRect(GuiConfig.colours.panel, GuiConfig.panel.x, GuiConfig.panel.y + GuiConfig.panel.height - 10, 10, 10, 0) // ^ // BOTTOM LEFT // Draw Settings Panel

    GuiUtils.DrawRoundedRect(GuiConfig.colours.panel, GuiConfig.configbox.x - 135, GuiConfig.configbox.y, GuiConfig.configbox.width - 190, GuiConfig.configbox.height, GuiConfig.main.borderRadius)

    // Button box
    GuiUtils.DrawRoundedRect(GuiConfig.colours.panel, GuiConfig.globalbox.x, GuiConfig.globalbox.y, GuiConfig.globalbox.width, GuiConfig.globalbox.height, GuiConfig.main.borderRadius) // Draw Global Box

    GuiUtils.DrawRoundedRect(GuiConfig.colours.panel, GuiConfig.globalbox.x, GuiConfig.globalbox.y - 38, GuiConfig.globalbox.width, GuiConfig.globalbox.height - 315, GuiConfig.main.borderRadius)
    font_17.drawString("Global Settings", GuiConfig.globalbox.x + GuiConfig.globalbox.width / 2 - font_17.getWidth("Global Settings") / 2, GuiConfig.globalbox.y + 3, GuiConfig.colours.text)

    let c = GuiConfig.colours.logo

    let r, g, b
    r = c.getRed() / 255
    g = c.getGreen() / 255
    b = c.getBlue() / 255

    Renderer.colorize(r, g, b)

    // logo.draw(GuiConfig.main.x + 15, GuiConfig.main.y + 10, 30, 30)
    font_bold.drawString("RDBT V4", GuiConfig.main.x + 40, GuiConfig.main.y + 15, GuiConfig.colours.accent)
    //font_17.drawString(userInfo.version, GuiConfig.main.x + 30, GuiConfig.main.y + 11 + font_bold.getHeight("P"), GuiConfig.colours.text) // Seperator bar // here sep

    const BarWidth = GuiConfig.main.width - GuiConfig.panel.width
    GuiUtils.DrawRoundedRect(GuiConfig.colours.selection, GuiConfig.main.x + 20, GuiConfig.main.y + GuiConfig.main.height - 220, BarWidth - 20, 1, 0)

    GuiUtils.DrawRoundedRect(GuiConfig.colours.selection, GuiConfig.globalbox.x + 10, GuiConfig.globalbox.y + font_17.getHeight("P") + 6, GuiConfig.globalbox.width - 20, 1, 0)

    DrawUserInfo(GuiConfig.main.x + 10, GuiConfig.main.y + GuiConfig.main.height - 40, MouseX, MouseY) // Draw Image buttons //

    theme_button.Draw(GuiConfig.main.x + 540 + (BarWidth - 20) / 2, GuiConfig.main.y - 305 + GuiConfig.main.height - 84, 24, MouseX, MouseY)
    directory_button.Draw(GuiConfig.main.x + 570 + (BarWidth - 20) / 2, GuiConfig.main.y - 305 + GuiConfig.main.height - 84, 24, MouseX, MouseY)
    move_button.Draw(GuiConfig.main.x + 600 + (BarWidth - 20) / 2, GuiConfig.main.y - 305 + GuiConfig.main.height - 84, 24, MouseX, MouseY)

    let dist = (GuiConfig.panel.y - GuiConfig.main.y - 8) / 2 // exit_button.Draw(GuiConfig.main.x + GuiConfig.main.width - dist - 8, GuiConfig.main.y + dist, 8, MouseX, MouseY)
    // Fuck my life
    DrawCategories(MouseX, MouseY)

    DrawGlobalModules(MouseX, MouseY)
  }

  // RESIZE GUI WHEN WINDOW CHANGED
  function OnScreenResize() {
    if (gui.isOpen()) {
      UpdateGuiScale()
    }
  }

  let lastW = Renderer.screen.getWidth()
  let lastH = Renderer.screen.getHeight()
  register("step", () => {
    if (lastH != Renderer.screen.getHeight() || lastW != Renderer.screen.getWidth()) OnScreenResize()

    lastW = Renderer.screen.getWidth()
    lastH = Renderer.screen.getHeight()
  }).setFps(10)

  // FOR ANIMATIONS
  function ease(t) {
    return t * (((1 - t) * t) ** 2) + t ** 3;
  }

  // GET AND UPDATE LIST OF UNSAFE MODULES

  // LOAD MODULES AND ADD CATEGORIES

  let globalModules = []

  let config = JSON.parse(FileLib.read(FolderName, "rdbtconfig.json"))

  let categories = []
  let CategoryTypes = ["MINING", "MISC", "RENDER", "EXTRAS"]

  let CategoryNames = {
    MINING: "Mining",
    MISC: "Misc",
    RENDER: "World",
    EXTRAS: "QOL",
  }

  // I don't know what the fuck is going on here

  function Save(moduleName, setting, value) {
    let newConfig = config

    config.forEach(mod => {
      if (mod.Name == moduleName) {
        mod.Settings.forEach(set => {
          if (set.Name === "string") {
            // this should fix GUI bug
            if (set.Name.toLowerCase() == setting.toLowerCase()) {
              set.Value = value
            }
          }
        })
      }
    })

    global.modules.forEach(mod => {
      if (mod.Name == moduleName) {
        mod.settings.forEach(set => {
          if (set.Name == setting) {
            set.Value = value
          }
        })
      }
    })
    config = newConfig

    FileLib.write(FolderName, "rdbtconfig.json", JSON.stringify(config, null, 2))

    try {
      global.settingSelection.ModuleManager.saveSettings()
    } catch (error) {
      chat.message("Error saving settings!")
    }
  }

  function Init() {
    let catKeys = {}
    CategoryTypes.forEach((cat, i) => {
      categories.push(new Category(CategoryNames[cat], i))
      catKeys[cat.toLowerCase()] = i
    })

    let modules = global.modules

    modules.forEach(mod => {
      let settingsObj
      if (GLOBAL_MODULES.includes(mod.Name)) {
        settingsObj = new GlobalModule(mod.Name, [], mod.description)
      } else {
        settingsObj = new Module(mod.Name, [], mod.description)
      }
      for (set in mod.settings) {
        if (mod.settings[set].Min != undefined) {
          settingsObj.keys.push(
            new ValueSlider(
              mod.settings[set].Name,
              mod.settings[set].Min,
              mod.settings[set].Max,
              mod.settings[set].Value,
              (moduleName, settingName, value) => {
                Save(moduleName, settingName, value)
              },
              mod.Name,
              font_17,
              font_15,
            ),
          )
        } else if (mod.settings[set].Options != undefined) {
          settingsObj.keys.push(
            new SelectionDropdown(
              mod.settings[set].Name,
              mod.settings[set].Value,
              mod.settings[set].Options,
              mod.settings[set].IsCollapsed,
              (moduleName, settingName, value) => {
                Save(moduleName, settingName, value)
              },
              mod.Name,
              font_17,
            ),
          )
        } else {
          settingsObj.keys.push(
            new ToggleButton(
              mod.settings[set].Name,
              mod.settings[set].Value,
              (moduleName, settingName, value) => {
                Save(moduleName, settingName, value)
              },
              mod.Name,
              font_17,
            ),
          )
        }
      }

      settingsObj.keys.forEach(key => {
        config.forEach(setting => {
          if (setting.Name == mod.Name) {
            setting.Settings.forEach(set => {
              if (set.Name === "string") {
                if (set.Name.toLowerCase() == key.name.toLowerCase()) {
                  key.value = set.Value
                }
              }
            })
          }
        })
      })

      if (GLOBAL_MODULES.includes(mod.Name)) globalModules.push(settingsObj)
      else categories[catKeys[mod.Catecory.toLowerCase()]]?.AddModule(settingsObj)
    })
  }

  Init()
}

global.export.gui = GUI
