let { SettingSelector, SettingSlider, SettingToggle, ConfigModuleClass, ModuleToggle, getKeyBind, ModuleManager, MovementHelper } = global.settingSelection

global.modules.push(new ConfigModuleClass("Fast Place", "Extras", [new SettingToggle("Enabled", false)], ["Makes you place blocks extra fast! By @brennendev", "Use at your own risk, this feature could be detected!"]))

class FastPlace {
  constructor() {
    this.ModuleName = "Fast Place"
    this.Enabled = false

    register("step", () => {
      this.Enabled = ModuleManager.getSetting(this.ModuleName, "Enabled")
    }).setFps(1)

    register("step", () => {
      if (!this.Enabled) return

      net.minecraftforge.fml.common.ObfuscationReflectionHelper.setPrivateValue(net.minecraft.client.Minecraft.class, Client.getMinecraft(), new java.lang.Integer(0), new java.lang.Integer(53))
    })
  }
}

new FastPlace()
