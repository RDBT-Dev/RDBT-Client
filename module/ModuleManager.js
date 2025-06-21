class SettingSliderClass {
  constructor(Name, Value, Min, Max) {
    this.Name = Name
    this.Value = Value
    this.Min = Min
    this.Max = Max
  }
}
class SettingToggleClass {
  constructor(Name, Value) {
    this.Name = Name
    this.Value = Value
  }
}
class SettingSelectorClass {
  constructor(Name, Value, Options, isCollapsed = false) {
    this.Name = Name
    this.Value = Value
    this.Options = Options
    this.IsCollapsed = isCollapsed
  }
}
class ConfigModuleClassClass {
  constructor(Name, Catecory, settings, description = ["No description provided"], isCollapsed = false, isEnabled = false) {
    this.Name = Name
    this.Catecory = Catecory
    this.settings = settings
    this.description = description
    this.x = null
    this.y = null
    this.width = null
    this.height = null
    this.isCollapsed = isCollapsed
    this.isEnabled = isEnabled
  }
}
global.settingSelection.SettingSlider = SettingSliderClass
global.settingSelection.SettingToggle = SettingToggleClass
global.settingSelection.SettingSelector = SettingSelectorClass
global.settingSelection.ConfigModuleClass = ConfigModuleClassClass

class ModuleManagerClass {
  constructor() {
    this.objectArray = []
  }

  makeObject() {
    const file = FileLib.read("RdbtConfigV4", "rdbtconfig.json")
    const json = JSON.parse(file)
    const modules = global.modules
    let newJson = json
    for (let i = 0; i < modules.length; i++) {
      let found = false
      for (let y = 0; y < json.length; y++) {
        if (json[y].Name === modules[i].Name) {
          found = true
          for (let t = 0; t < modules[i].settings.length; t++) {
            let found = false
            for (let j = 0; j < json[y].Settings.length; j++) {
              if (modules[i].settings[t] === json[y].Settings[j]) {
                found = true
              }
            }

            if (!found) {
              for (let d = 0; d < newJson.length; d++) {
                if (newJson[d].Name == modules[i].Name) {
                  for (let w = 0; w < modules[i].settings.length; w++) {
                    let found = false
                    for (let g = 0; g < newJson[d].Settings.length; g++) {
                      if (newJson[d].Settings[g].Name === modules[i].settings[w].Name) {
                        try {
                          if (modules[i].settings[w].Options.toString() === newJson[d].Settings[g].Options.toString()) found = true
                        } catch (error) {
                          found = true
                        }
                      }
                    }

                    if (!found) {
                      newJson[d].Settings.push(modules[i].settings[w])
                    }
                  }
                }
              }
            }
          }
        }
      }

      if (!found) {
        let object = {
          Name: modules[i].Name,
          Settings: [],
        }

        for (let j = 0; j < modules[i].settings.length; j++) {
          object.Settings.push(modules[i].settings[j])
        }

        newJson.push(object)
      }
    }

    var stringJSON = JSON.stringify(newJson, null, 2)
    FileLib.write("RdbtConfigV4", "rdbtconfig.json", stringJSON)

    for (let i = 0; i < newJson.length; i++) {
      for (let t = 0; t < modules.length; t++) {
        if (newJson[i].Name === modules[t].Name) {
          for (let f = 0; f < modules[t].settings.length; f++) {
            for (let r = 0; r < newJson[i].Settings.length; r++) {
              if (modules[t].settings[f].Name === newJson[i].Settings[r].Name) {
                modules[t].settings[f].Value = newJson[i].Settings[r].Value
              }
            }
          }
        }
      }
    }

    this.objectArray = newJson
    FileLib.write("RdbtConfigV4", "rdbtconfig.json", JSON.stringify(newJson, null, 2))
  }

  saveSettings() {
    let file = FileLib.read("RdbtConfigV4", "rdbtconfig.json")
    let json = JSON.parse(file)
    let modules = global.modules
    let newJson = json
    for (let i = 0; i < newJson.length; i++) {
      for (let t = 0; t < modules.length; t++) {
        if (newJson[i].Name === modules[t].Name) {
          for (let f = 0; f < modules[t].settings.length; f++) {
            for (let r = 0; r < newJson[i].Settings.length; r++) {
              if (modules[t].settings[f].Name === newJson[i].Settings[r].Name) {
                newJson[i].Settings[r].Value = modules[t].settings[f].Value
              }
            }
          }
        }
      }
    }
    this.objectArray = newJson
    FileLib.write("RdbtConfigV4", "rdbtconfig.json", JSON.stringify(newJson, null, 2))
  }

  getSetting(ModuleName, SettingName) {
    const modules = global.modules
    for (let i = 0; i < modules.length; i++) {
      if (modules[i].Name === ModuleName) {
        for (let y = 0; y < modules[i].settings.length; y++) {
          if (modules[i].settings[y].Name === SettingName) {
            try {
              return modules[i].settings[y].Options[modules[i].settings[y].Value]
            } catch (e) {
              let value = modules[i].settings[y].Value
              if (value === true || value === false) {
                return value
              }
              return Math.floor(value)
            }
          }
        }
      }
    }
    return null
  }
}

global.settingSelection.ModuleManager = new ModuleManagerClass()
