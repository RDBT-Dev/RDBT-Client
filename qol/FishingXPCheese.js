let { SettingSelector, SettingSlider, SettingToggle, ConfigModuleClass, ModuleToggle, getKeyBind, ModuleManager } = global.settingSelection
let { TimeHelper, GuiUtils,  chat, ItemUtils, Utils, overlayManager, InventoryUtils, GuiInventory } = global.export

global.modules.push(
  new ConfigModuleClass(
    "Fishing XP Cheese",
    "Misc",
    [new SettingToggle("Overlay", true), new SettingSlider("Action Delay (ms)", 250, 100, 1000), new SettingToggle("Can of worms mode (default: chum)", false)],
    ["Automatically fills chum buckets", "Stops when out of empty buckets or chum", "or opens can of worms for xp", "Use chum if you're broke, can of worms if rich", "Can of worms is better"],
  ),
)

class FishingXPCheese {
  constructor() {
    this.ModuleName = "Fishing XP Cheese"
    this.enabled = false

    // States for the macro

    this.MACRO_STATES = {
      OFF: 0,
      FINDING_ITEMS: 1,
      SELECTING_EMPTY_BUCKET: 2,
      PLACING_BUCKET: 3,
      SELECTING_CHUM: 4,
      PLACING_CHUM: 5,
      COLLECTING_FILLED_BUCKET: 6,
      OPEN_INV: 7,
      MOVE_BUCKET: 8,
      MOVE_CHUM: 9,
      CLOSE_INV: 10,
      IDLE: 11,
      FINDING_WORMS: 12,
      USING_WORMS: 13,
      MOVE_WORMS: 14,
      SELL_WORMS_START: 15,
      SELL_WORMS_OPEN_BZ: 16,
      SELL_WORMS_CLICK_ITEM: 17,
      SELL_WORMS_CONFIRM: 18,
    }

    this.state = this.MACRO_STATES.OFF

    // Timers
    this.actionTimer = new TimeHelper()
    this.startTime = new TimeHelper() // Timer for elapsed time
    this.actionDelay = ModuleManager.getSetting(this.ModuleName, "Action Delay (ms)")

    // Item slots
    this.emptyBucketSlot = -1
    this.chumSlot = -1
    this.wormsSlot = -1

    // Counters
    this.filledBuckets = 0

    // Mode setting
    this.canOfWormsMode = ModuleManager.getSetting(this.ModuleName, "Can of worms mode (default: chum)")

    // Overlay setup
    this.OVERLAY_ID = "FISHING_XP"
    overlayManager.AddOverlay(this.ModuleName, this.OVERLAY_ID)
    overlayManager.AddOverlayText(this.OVERLAY_ID, "Status: " + (this.enabled ? "&aEnabled" : "&cDisabled"))
    overlayManager.AddOverlayText(this.OVERLAY_ID, "Elapsed Time: 0s")

    // Register keybind
    this.key = getKeyBind("Fishing XP Cheese", "Rdbt Client v4 - Misc", this)

    register("step", this.mainLoop.bind(this)).setFps(10)
  }

  // Main loop for the macro
  mainLoop() {
    if (!this.enabled) return

    // Update overlay
    this.updateOverlay()

    // Check if we need to wait for the action delay
    if (!this.actionTimer.hasReached(this.actionDelay)) return

    // State machine for the macro
    if (this.canOfWormsMode) {
      // Can of worms mode state machine
      switch (this.state) {
        case this.MACRO_STATES.FINDING_ITEMS:
        case this.MACRO_STATES.FINDING_WORMS:
          this.findWorms()
          break
        case this.MACRO_STATES.USING_WORMS:
          this.useWorms()
          break
        case this.MACRO_STATES.OPEN_INV:
          this.openInv()
          break
        case this.MACRO_STATES.MOVE_WORMS:
          this.moveWorms()
          break
        case this.MACRO_STATES.CLOSE_INV:
          this.closeInv()
          break
        case this.MACRO_STATES.IDLE:
          break
        case this.MACRO_STATES.SELL_WORMS_START:
          this.sellWormsStart()
          break
        case this.MACRO_STATES.SELL_WORMS_OPEN_BZ:
          this.sellWormsOpenBZ()
          break
        case this.MACRO_STATES.SELL_WORMS_CLICK_ITEM:
          this.sellWormsClickItem()
          break
        case this.MACRO_STATES.SELL_WORMS_CONFIRM:
          this.sellWormsConfirm()
          break
      }
    } else {
      // Chum bucket mode state machine
      switch (this.state) {
        case this.MACRO_STATES.FINDING_ITEMS:
          this.findItems()
          break
        case this.MACRO_STATES.SELECTING_EMPTY_BUCKET:
          this.selectEmptyBucket()
          break
        case this.MACRO_STATES.PLACING_BUCKET:
          this.placeBucket()
          break
        case this.MACRO_STATES.SELECTING_CHUM:
          this.selectChum()
          break
        case this.MACRO_STATES.PLACING_CHUM:
          this.placeChum()
          break
        case this.MACRO_STATES.COLLECTING_FILLED_BUCKET:
          this.collectFilledBucket()
          break
        case this.MACRO_STATES.OPEN_INV:
          this.openInv()
          break
        case this.MACRO_STATES.MOVE_BUCKET:
          this.moveBucket()
          break
        case this.MACRO_STATES.MOVE_CHUM:
          this.moveChum()
          break
        case this.MACRO_STATES.CLOSE_INV:
          this.closeInv()
          break
        case this.MACRO_STATES.IDLE:
          break
      }
    }
  }

  // Find the can of worms in the inventory
  findWorms() {
    chat.debugMessage("Finding can of worms...")

    let inventory = Player.getInventory()
    if (!inventory) {
      this.sendMacroMessage("&cNo inventory found!")
      return
    }

    this.wormsList = InventoryUtils.findAll(inventory, "Can of Worms")
    this.wormsSlot = InventoryUtils.findFirst(inventory, "Can of Worms")
    chat.debugMessage("Can of worms slot: " + this.wormsSlot)
    if (this.wormsSlot === -1) {
      this.sendMacroMessage("&cNo can of worms found!")
      this.stopMacro()
      return
    } else if (this.wormsSlot >= 8) {
      this.sendMacroMessage("&cRefilling can of worms from inventory!")
      this.state = this.MACRO_STATES.OPEN_INV
      return
    }

    if (this.state !== this.MACRO_STATES.FINDING_WORMS && this.state !== this.MACRO_STATES.FINDING_ITEMS) return
    chat.debugMessage(`Found can of worms in slot ${this.wormsSlot}`)
    this.state = this.MACRO_STATES.USING_WORMS
    this.actionTimer.reset()
  }

  // Use the can of worms (hold right click)
  useWorms() {
    chat.debugMessage("Using can of worms...")
    ItemUtils.setItemSlot(this.wormsSlot)

    // Hold right click continuously
    ItemUtils.rightClick()

    // Check if we need to refill from inventory periodically
    if (this.actionTimer.hasReached(5000)) {
      // Check every 5 seconds
      let inventory = Player.getInventory()
      if (inventory) {
        let currentWormsSlot = InventoryUtils.findFirst(inventory, "Can of Worms")
        if (currentWormsSlot === -1 || currentWormsSlot !== this.wormsSlot) {
          // No more worms in inventory, trigger sell state
          this.sendMacroMessage("&cNo more worms in inventory! Selling bait...")
          this.state = this.MACRO_STATES.SELL_WORMS_START
        }
      }
      this.actionTimer.reset()
    }
  }

  // Move worms from inventory to hotbar
  moveWorms() {
    chat.debugMessage("Moving can of worms...")

    if (!this.currentWormsIndex) {
      this.currentWormsIndex = 0
    }

    if (this.currentWormsIndex >= this.wormsList.length) {
      this.currentWormsIndex = 0
      this.state = this.MACRO_STATES.CLOSE_INV
      return
    }

    let slot = this.wormsList[this.currentWormsIndex]
    Player.getContainer().click(slot, true, "LEFT")
    this.currentWormsIndex++

    this.actionTimer.reset()
  }

  // Find the empty bucket and chum in the inventory
  findItems() {
    chat.debugMessage("Finding items...")

    let inventory = Player.getInventory()
    if (!inventory) {
      this.sendMacroMessage("&cNo inventory found!")
      return
    }

    this.emptyBucketList = InventoryUtils.findAll(inventory, "Empty Chum Bucket")
    this.emptyBucketSlot = InventoryUtils.findFirst(inventory, "Empty Chum Bucket")
    chat.debugMessage("Empty bucket slot: " + this.emptyBucketSlot)
    if (this.emptyBucketSlot === -1) {
      this.sendMacroMessage("&cNo empty bucket found!")
      this.stopMacro()
      return
    } else if (this.emptyBucketSlot >= 8) {
      this.sendMacroMessage("&cRefilling empty buckets from inventory!")
      this.state = this.MACRO_STATES.OPEN_INV
      return
    }

    this.chumList = InventoryUtils.findAll(inventory, "Chum")
    this.chumSlot = InventoryUtils.findFirst(inventory, "Chum")
    chat.debugMessage("Chum slot: " + this.chumSlot)
    if (this.chumSlot === -1) {
      this.sendMacroMessage("&cNo chum found!")
      this.stopMacro()
      return
    } else if (this.chumSlot >= 8) {
      this.sendMacroMessage("&cRefilling chum from inventory!")
      this.state = this.MACRO_STATES.OPEN_INV
      return
    }

    if (this.state !== this.MACRO_STATES.FINDING_ITEMS) return
    chat.debugMessage(`Found empty bucket in slot ${this.emptyBucketSlot} and chum in slot ${this.chumSlot}`)
    this.state = this.MACRO_STATES.SELECTING_EMPTY_BUCKET
    this.actionTimer.reset()
  }

  openInv() {
    chat.message("Opening inventory...")
    Client.getMinecraft().func_147108_a(new GuiInventory(Player.getPlayer()))
    if (this.canOfWormsMode) {
      this.state = this.MACRO_STATES.MOVE_WORMS
    } else {
      this.state = this.MACRO_STATES.MOVE_BUCKET
    }
  }

  moveBucket() {
    chat.debugMessage("Moving buckets...")

    // If we're just starting this state, reset the counter
    if (!this.currentBucketIndex) {
      this.currentBucketIndex = 0
    }

    // Check if we've processed all buckets
    if (this.currentBucketIndex >= this.emptyBucketList.length) {
      // Reset for next time
      this.currentBucketIndex = 0
      this.state = this.MACRO_STATES.MOVE_CHUM
      return
    }

    // Process one bucket at a time with delay
    let slot = this.emptyBucketList[this.currentBucketIndex]
    Player.getContainer().click(slot, true, "LEFT")
    this.currentBucketIndex++

    // Reset the timer for the next action
    this.actionTimer.reset()
  }

  moveChum() {
    chat.debugMessage("Moving chum...")

    // If we're just starting this state, reset the counter
    if (!this.currentChumIndex) {
      this.currentChumIndex = 0
    }

    // Check if we've processed all chum
    if (this.currentChumIndex >= this.chumList.length) {
      // Reset for next time
      this.currentChumIndex = 0
      this.state = this.MACRO_STATES.CLOSE_INV
      return
    }

    // Process one chum at a time with delay
    let slot = this.chumList[this.currentChumIndex]
    Player.getContainer().click(slot, true, "LEFT")
    this.currentChumIndex++

    // Reset the timer for the next action
    this.actionTimer.reset()
  }

  closeInv() {
    chat.debugMessage("Closing inventory...")
    InventoryUtils.closeInv()
    if (this.canOfWormsMode) {
      this.state = this.MACRO_STATES.FINDING_WORMS
    } else {
      this.state = this.MACRO_STATES.FINDING_ITEMS
    }
  }

  // Select the empty bucket
  selectEmptyBucket() {
    chat.debugMessage("Selecting empty bucket...")
    ItemUtils.setItemSlot(this.emptyBucketSlot)
    this.state = this.MACRO_STATES.PLACING_BUCKET
    this.actionTimer.reset()
  }

  // Place the empty bucket
  placeBucket() {
    chat.debugMessage("Placing empty bucket...")
    ItemUtils.rightClick()
    this.state = this.MACRO_STATES.SELECTING_CHUM
    this.actionTimer.reset()
  }

  // Select the chum
  selectChum() {
    chat.debugMessage("Selecting chum...")
    ItemUtils.setItemSlot(this.chumSlot)
    this.state = this.MACRO_STATES.PLACING_CHUM
    this.actionTimer.reset()
  }

  // Place the chum
  placeChum() {
    chat.debugMessage("Placing chum...")
    ItemUtils.rightClick()
    this.state = this.MACRO_STATES.COLLECTING_FILLED_BUCKET
    this.actionTimer.reset()
  }

  // Collect the filled bucket
  collectFilledBucket() {
    chat.debugMessage("Collecting filled bucket...")
    ItemUtils.rightClick()
    this.filledBuckets++
    this.state = this.MACRO_STATES.FINDING_ITEMS
    this.actionTimer.reset()
  }

  // Start the sell worms process
  sellWormsStart() {
    chat.debugMessage("Starting to sell worms...")
    this.sendMacroMessage("&aSelling filled buckets at Bazaar")
    this.state = this.MACRO_STATES.SELL_WORMS_OPEN_BZ
    this.actionTimer.reset()
  }

  // Open the Bazaar by typing /bz command
  sellWormsOpenBZ() {
    chat.debugMessage("Opening Bazaar...")
    ChatLib.command("bz")
    this.state = this.MACRO_STATES.SELL_WORMS_CLICK_ITEM
    this.actionTimer.reset()

    // Add a delay to ensure the Bazaar UI opens
    Client.scheduleTask(20, () => {
      if (this.state === this.MACRO_STATES.SELL_WORMS_CLICK_ITEM) {
        this.sellWormsClickItem()
      }
    })
  }

  // Click the 47th slot in the Bazaar UI (sell all inv)
  sellWormsClickItem() {
    chat.debugMessage("Clicking item in Bazaar...")

    // Check if the Bazaar UI is open
    let container = Player.getContainer()
    if (!container || !container.getName().includes("Bazaar")) {
      chat.debugMessage("Bazaar UI not found, retrying...")
      this.state = this.MACRO_STATES.SELL_WORMS_OPEN_BZ
      this.actionTimer.reset()
      return
    }

    // Click the 47th slot (sell)
    Player.getContainer().click(47, false, "LEFT")
    this.state = this.MACRO_STATES.SELL_WORMS_CONFIRM
    this.actionTimer.reset()

    // Add a delay to ensure the confirmation UI opens
    Client.scheduleTask(10, () => {
      if (this.state === this.MACRO_STATES.SELL_WORMS_CONFIRM) {
        this.sellWormsConfirm()
      }
    })
  }

  // Click the 11th slot in the confirmation UI (confirm sell) THIS CLICKS TWICE, PROBABLY DUE TO FUNCTION BEING CALLED 2X, BUT KEEPING BECAUSE IT WILL WORK EVEN WITH LAG ISSUES
  sellWormsConfirm() {
    chat.debugMessage("Confirming sale...")

    // Check if the confirmation UI is open
    let container = Player.getContainer()
    if (!container || !container.getName().includes("Are you sure?")) {
      chat.debugMessage("Confirmation UI not found, retrying...")
      this.state = this.MACRO_STATES.SELL_WORMS_CLICK_ITEM
      this.actionTimer.reset()
      return
    }

    // Click the 11th slot confirm
    Player.getContainer().click(11, false, "LEFT")

    // Close the inventory and go back to finding worms
    Client.scheduleTask(10, () => {
      InventoryUtils.closeInv()
      this.state = this.MACRO_STATES.FINDING_WORMS
      this.actionTimer.reset()
    })
  }

  // Update the overlay with current status
  updateOverlay() {
    overlayManager.UpdateOverlayLine(this.OVERLAY_ID, 0, "Status: " + (this.enabled ? "&aEnabled" : "&cDisabled"))

    // Calculate elapsed time in seconds
    let elapsedSeconds = Math.floor(this.startTime.getTimePassed() / 1000)
    let minutes = Math.floor(elapsedSeconds / 60)
    let seconds = elapsedSeconds % 60
    let timeString = `${minutes}m ${seconds}s`

    overlayManager.UpdateOverlayLine(this.OVERLAY_ID, 1, `Elapsed Time: ${timeString}`)
  }

  // Toggle the macro on/off
  toggle() {
    this.enabled = !this.enabled

    if (this.enabled) {
      // Update mode setting when toggling on
      this.canOfWormsMode = ModuleManager.getSetting(this.ModuleName, "Can of worms mode (default: chum)")
      this.startTime.reset() // Reset elapsed time counter

      if (this.canOfWormsMode) {
        this.state = this.MACRO_STATES.FINDING_WORMS
        this.sendMacroMessage("&aEnabled (Can of worms mode)")
      } else {
        this.state = this.MACRO_STATES.FINDING_ITEMS
        this.sendMacroMessage("&aEnabled (Chum bucket mode)")
      }

      this.actionTimer.reset()
    } else {
      this.stopMacro()
    }
  }

  // Stop the macro
  stopMacro() {
    this.enabled = false
    this.state = this.MACRO_STATES.OFF
    this.sendMacroMessage("&cDisabled")
    this.updateOverlay()
  }

  // Send a message to the chat with the macro prefix
  sendMacroMessage(msg) {
    chat.message(this.ModuleName + ": " + msg)
  }
}

// Export the macro
global.export.FishingXPCheese = new FishingXPCheese()
