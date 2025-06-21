let { SettingSelector, SettingSlider, SettingToggle, ConfigModuleClass, ModuleToggle, getKeyBind, ModuleManager } = global.settingSelection
let { ChatUtils } = global.export
import Async from "../../Async"
import Skyblock from "BloomCore/Skyblock"

global.modules.push(new ConfigModuleClass("Grotto Finder", "Render", [new SettingToggle("Enabled", false)], ["Highlights fairy grottos in the Crystal Hollows (not working)"]))

class grottoFinder {
  constructor() {
    this.ModuleName = "Grotto Finder"
    this.Enabled = false

    register("step", () => {
      this.Enabled = ModuleManager.getSetting(this.ModuleName, "Enabled")
      if (!this.Enabled) return
      if (Skyblock.area !== "Crystal Hollows") return

      ChatUtils.sendDebugMessage("done")
    }).setFps(1)

    //register("renderWorld", event => {})
  }
}

new grottoFinder()
