let { mc, TimeHelper, chat } = global.export

class InventoryUtilsClass {
  constructor() {
    this.cooldown = new TimeHelper()
  }

  /**
   * Strips Minecraft formatting codes from a string
   * @param {String} str - The string to strip formatting from
   * @returns {String} The string without formatting codes
   */
  stripFormatting(str) {
    return typeof str === "string" ? str.replace(/\u00A7[0-9A-FK-ORa-fk-or]/g, "") : str
  }

  /**
   * Gets the player's inventory
   * @returns {Object} The player's inventory or null if not available
   */
  getInventory() {
    return Player.getInventory()
  }

  findFirst(inv, itemn) {
    let inventory = inv
    for (let i = 0; i < inventory.getSize(); i++) {
      let item = inventory.getStackInSlot(i)
      if (item && item.getName && item.getName().removeFormatting() === itemn) {
        return i // Returns the slot index where it's found
      }
    }
    return -1 // Not found
  }

  findAll(inv, itemn) {
    let inventory = inv
    let result = []
    for (let i = 0; i < inventory.getSize(); i++) {
      let item = inventory.getStackInSlot(i)
      if (item && item.getName && item.getName().removeFormatting() === itemn) {
        result.push(i)
      }
    }
    return result // Returns an array of all matching slot indices
  }

  /**
   * A strange bug occurs when you click while tabbed out then it no longer is able to mine.
   * This function fixes that.
   */
  closeInv() {
    Client.currentGui?.close()
    if (!mc.field_71415_G) {
      // if (!mc.inGameHasFocus)
      mc.field_71415_G = true // mc.inGameHasFocus = true;
      mc.field_71417_B.func_74372_a() // mc.mouseHelper.grabMouseCursor();
    }
  }
}

// Export the class instance
global.export.InventoryUtils = new InventoryUtilsClass()
