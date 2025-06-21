let { SettingSelector, SettingSlider, SettingToggle, ConfigModuleClass, ModuleToggle, getKeyBind, ModuleManager } = global.settingSelection

let { GuiUtils } = global.export

global.modules.push(
  new ConfigModuleClass("Spin", "Render", [new SettingToggle("Enabled", false), new SettingSlider("Speed", 10, 0, 20), new SettingSelector("Mode", 0, ["Left", "Right", "Pitch", "Seizure"])], ["Spins the player client side"]),
)

class Spin {
  constructor() {
    let ModuleName = "Spin"

    let speed = ModuleManager.getSetting(ModuleName, "Speed")
    let enabled = ModuleManager.getSetting(ModuleName, "Enabled")
    let mode = ModuleManager.getSetting(ModuleName, "Mode")
    register("step", () => {
      speed = ModuleManager.getSetting(ModuleName, "Speed")
      enabled = ModuleManager.getSetting(ModuleName, "Enabled")
      mode = ModuleManager.getSetting(ModuleName, "Mode")
    }).setFps(1)

    let rot = 0
    register("step", i => {
      rot = 180 - ((i * speed) % 360)
    }).setFps(50)

    register("renderEntity", (entity, pos, pt) => {
      if (!enabled) return
      if (entity.getName() != Player.getName()) {
        return
      }
      Tessellator.pushMatrix()

      if (mode == "Left") {
        Tessellator.rotate(-rot, 0, 1, 0)
      } else if (mode == "Right") {
        Tessellator.rotate(rot, 0, 1, 0)
      } else if (mode == "Seizure") {
        Tessellator.rotate(Date.now() % 360, Date.now() % 2, 1, Date.now() % 2)
      } else {
        Tessellator.rotate(rot, 1, 0, 0)
      }
    })

    register("postRenderEntity", entity => {
      if (!enabled) return
      if (entity.getName() != Player.getName()) {
        return
      }
      Tessellator.popMatrix()
    })
  }
}

new Spin()
