let { SettingSelector, SettingSlider, SettingToggle, ConfigModuleClass, ModuleToggle, getKeyBind, ModuleManager } = global.settingSelection

global.modules.push(
  new ConfigModuleClass(
    "Profile Hider",
    "Render",
    [new SettingToggle("Enabled", false), new SettingToggle("Remove Scoreboard", true), new SettingToggle("Remove Player Stats", true), new SettingToggle("Remove Boss Bar", true)],
    ["Hides all player and lobby indicators (No nick hider yet)"],
  ),
)

class profileHider {
  constructor() {
    this.ModuleName = "Profile Hider"

    this.Enabled = false
    this.scoreboard = false
    this.playerStats = false
    this.bossBar = false

    register("step", () => {
      this.Enabled = ModuleManager.getSetting(this.ModuleName, "Enabled")
      this.scoreboard = ModuleManager.getSetting(this.ModuleName, "Remove Scoreboard")
      this.playerStats = ModuleManager.getSetting(this.ModuleName, "Remove Player Stats")
      this.bossBar = ModuleManager.getSetting(this.ModuleName, "Remove Boss Bar")
    }).setFps(1)

    register("renderScoreboard", event => {
      if (!this.Enabled) return
      if (this.scoreboard) cancel(event)
    })

    register("actionBar", event => {
      if (!this.Enabled) return
      if (this.playerStats) cancel(event)
    })

    register("renderBossHealth", event => {
      if (!this.Enabled) return
      if (this.bossBar) cancel(event)
    })
  }
}

new profileHider()
