class ModuleToggleClass {
  constructor() {
    // List of toggled modules
    this.UseNukerModule = false
    this.UseRouteWalkerModule = false
    this.UseRouteWalkerV2Module = false
    this.MiningBot = false
  }
}

global.settingSelection.ModuleToggle = new ModuleToggleClass()
