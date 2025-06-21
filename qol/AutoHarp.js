let { SettingSelector, SettingSlider, SettingToggle, ConfigModuleClass, ModuleToggle, getKeyBind, ModuleManager } = global.settingSelection

global.modules.push(new ConfigModuleClass("Auto Harp", "Extras", [new SettingToggle("Enabled", false), new SettingSlider("Tick Delay", 5, 0, 10)], ["Does the melody harp for you"]))

// Harp module from QOL Hub

class AutoHarp {
  constructor() {
    let ModuleName = "Auto Harp"

    let toggled = false
    let delay = 7

    class Note {
      constructor(slot) {
        this.slot = slot
        this.clicked = false
        this.delay = 0
      }
    }

    const notes = [new Note(37), new Note(38), new Note(39), new Note(40), new Note(41), new Note(42), new Note(43)]

    register("tick", () => {
      if (!toggled) return
      let inv = Player.getContainer()
      if (inv === undefined) return
      if (inv.getName().indexOf("Harp") !== 0) return
      notes.forEach(note => {
        // Lowers the click delay
        if (note.delay > 0) {
          note.delay--
        }

        const item = inv.getStackInSlot(note.slot)
        if (item?.getID() === 159 || item?.getID() === 0) {
          note.clicked = false
          note.delay = 0
        }

        if (item?.getID() === 155 || item?.getID() === 0) {
          if (note.clicked || note.delay !== 0) return
          if (inv.getStackInSlot(note.slot - 9).getID() === 35) note.delay = delay
          else note.clicked = true
          inv.click(note.slot, false, "MIDDLE")
        }
      })
    })

    // Auto updates settings each second
    register("step", () => {
      toggled = ModuleManager.getSetting(ModuleName, "Enabled")
      delay = ModuleManager.getSetting(ModuleName, "Tick Delay")
    }).setFps(1)
  }
}

new AutoHarp()
