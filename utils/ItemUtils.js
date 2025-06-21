let { mc, BP, C08PacketPlayerBlockPlacement, Utils, TimeHelper } = global.export

const clickMouse = mc.getClass().getDeclaredMethod("func_147116_af")
clickMouse.setAccessible(true)
const rightClickMouse = mc.getClass().getDeclaredMethod("func_147121_ag")
rightClickMouse.setAccessible(true)

class ItemUtilsClass {
  constructor() {
    this.cooldown = new TimeHelper()
  }

  /**
   * Left clicks
   */
  leftClick() {
    clickMouse.invoke(mc)
  }

  /**
   * Right clicks with a specified amount of ticks
   * @param {*} ticks 
   */
  rightClickZPH(ticks = 0) {
    if (ticks === 0) {
      rightClickMouse.invoke(mc)
    } else {
      Client.scheduleTask(ticks, () => {
        rightClickMouse.invoke(mc)
      })
    }
  }

  /**
   * Sends a right click packet
   * @param {*} ticks 
   */
  rightClickPacket(ticks = 0) {
    if (ticks === 0 && Player.getInventory().getStackInSlot(Player.getHeldItemIndex())) {
      Utils.sendPacket(new C08PacketPlayerBlockPlacement(new BP(-1, -1, -1), 255, Player.getInventory().getStackInSlot(Player.getHeldItemIndex()).getItemStack(), 0, 0, 0))
    } else {
      Client.scheduleTask(ticks, () => {
        Utils.sendPacket(new C08PacketPlayerBlockPlacement(new BP(-1, -1, -1), 255, Player.getInventory().getStackInSlot(Player.getHeldItemIndex()).getItemStack(), 0, 0, 0))
      })
    }
  }


  /**
   * Right clicks
   * @param {*} Tick 
   */
  rightClick(Tick = 0) {
    Client.scheduleTask(Tick, () => {
      rightClickMouse.invoke(mc)
    })
  }

  setItemSlot(slot) {
    if (!global.export.ItemFailsafe.triggered && this.cooldown.hasReached(100)) {
      Player.setHeldItemIndex(slot)
      this.cooldown.reset()
    }
  }

  getHeldItemStackSize() {
    let item = Player.getHeldItem()
    if (item && item.getStackSize) {
      return item.getStackSize()
    }
    return 0
  }

  /**
   * Finds an item in the hotbar and returns its slot
   * @param {string} itemName - The name of the item to find
   * @returns {number} - The slot of the item, or -1 if not found
   */
  findItemInHotbar(itemName) {
    for (let slot = 0; slot < 8; slot++) {
      let item = Player.getInventory()?.getStackInSlot(slot)
      if (item && item.getName().includes(itemName)) {
        return slot
      }
    }
    return -1
  }
}

global.export.ItemUtils = new ItemUtilsClass()
