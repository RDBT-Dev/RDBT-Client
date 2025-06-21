let { SettingSelector, SettingSlider, SettingToggle, ConfigModuleClass, ModuleToggle, getKeyBind, ModuleManager } = global.settingSelection

global.modules.push(
  new ConfigModuleClass(
    "Mob Hider",
    "Extras",
    [new SettingToggle("Hide Thysts", true), new SettingToggle("Hide Sven Pups", false), new SettingToggle("Hide Jerrys", false), new SettingToggle("Hide Kalhukis", false)],
    ["Hides chosen mobs from being rendered", "Use at your own risk, this feature could be detected in the future!"],
  ),
)

//implemented by real 

class MobHider {
  constructor() {
    this.ModuleName = "Mob Hider"
    this.hideThysts = false
    this.hideSvenPups = false
    this.hideJerrys = false
    this.hideKalhukis = false

    register("step", () => {
      this.hideThysts = ModuleManager.getSetting(this.ModuleName, "Hide Thysts")
      this.hideSvenPups = ModuleManager.getSetting(this.ModuleName, "Hide Sven Pups")
      this.hideJerrys = ModuleManager.getSetting(this.ModuleName, "Hide Jerrys")
      this.hideKalhukis = ModuleManager.getSetting(this.ModuleName, "Hide Kalhukis")
    }).setFps(1)

    this.jerryNames = ["Green Jerry", "Blue Jerry", "Purple Jerry", "Golden Jerry"]

     register("spawnParticle", (particle, type, event) => {
      if (!this.hideThysts) return;

      // Cancel portal particles for Thysts
      if (particle.toString().includes("PORTAL") || type.toString().includes("PORTAL")) {
        cancel(event);
      }
    });

    register("attackEntity", (entity, event) => {
      // Prevent attacking Thysts
      if (this.hideThysts && 
          (entity.entity instanceof net.minecraft.entity.monster.EntityEndermite || 
           entity.getName().includes("Thyst"))) {
        cancel(event);
      }

      // Prevent attacking Sven Pups during boss fight
      if (this.hideSvenPups && 
          (entity.entity instanceof net.minecraft.entity.passive.EntityWolf || 
           entity.getName().includes("Sven Pup")) && 
          Scoreboard.getLineByIndex(3).getName().includes("Slay the boss!")) {
        cancel(event);
      }

      // Prevent attacking any Jerry variant
      if (this.hideJerrys && 
          this.jerryNames.some(name => entity.getName().includes(name))) {
        cancel(event);
      }

      // Prevent attacking Kalhukis
      if (this.hideKalhukis && entity.getName().includes("Kalhuiki")) {
        cancel(event);
      }
    });


      register("renderEntity", (ent, pos, pt, event) => {
      if (this.hideThysts){
        if (ent.entity instanceof net.minecraft.entity.monster.EntityEndermite || 
            (ent.entity instanceof net.minecraft.entity.item.EntityArmorStand && 
             ent.getName().includes("Thyst"))) {
          cancel(event)
        }
      }

      if (this.hideSvenPups) {
        if ((ent.entity instanceof net.minecraft.entity.passive.EntityWolf || ent.getName().includes("Sven Pup")) && Scoreboard.getLineByIndex(3).getName().includes("Slay the boss!")) {
          cancel(event)
        }
      }

      if (this.hideJerrys) {
        if ((!(ent.entity instanceof net.minecraft.entity.passive.EntityVillager) || !ent.getName().includes("Jerry")) && !this.jerryNames.some(name => ent.getName().includes(name))) return
        cancel(event)
      }

      if (this.hideKalhukis) {
        if (ent.getName().includes("Kalhuiki")) {
            cancel(event)
        }
      }
      
    })
  }
}

new MobHider()
