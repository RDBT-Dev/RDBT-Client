let { TimeHelper, MovementHelper, Rotations, chat, Utils, overlayManager, InventoryUtils } = global.export

// TODO

// fixes:
// prevent jumping randomly or walking off (store blocks previously on and check if about to go off and cancel movements)
// check for jump boost and apply fix?
// attempt to exit inventories if they are opened (maybe warn to press escape key in a time)

// add response validation before running, use backup otherwise
// fine tune score algorithm so it always picks good responses (blocks to jump on etc)
// add animation for typing chat messages
// make crouching more smart (prevent quick presses) so it isn't always crouching

class ResponseBot {
  constructor() {
    this.actions = []
    this.currentAction = null
    this.backupResponse = null
    this.playingSpecialAction = false

    this.duration = 12000
    this.timeHelper = new TimeHelper()

    this.OFFSETS = {
      pos: [0, 0, 0],
      forward: [0, 0, -1],
      back: [0, 0, 1],
      left: [-1, 0, 0],
      right: [1, 0, 0],
    }

    this.OPEN_SURROUNDINGS = {
      down: {
        pos: 1,
        forward: 1,
        back: 1,
        left: 1,
        right: 1,
      },

      up: {
        pos: 1,
        forward: 1,
        back: 1,
        left: 1,
        right: 1,
      },
    }

    this.MOVEMENT_KEYS = {
      forward: state => MovementHelper.setKey("w", state),
      backward: state => MovementHelper.setKey("s", state),
      left: state => MovementHelper.setKey("a", state),
      right: state => MovementHelper.setKey("d", state),
      jump: state => MovementHelper.setKey("space", state),
      sneak: state => MovementHelper.setKey("shift", state),
    }

    this.MESSAGES = []
    register("step", () => {
      // Load response messages
      this.MESSAGES = []
      if (!FileLib.exists("RdbtConfigV4", "responseMessages.txt")) FileLib.append("RdbtConfigV4", "responseMessages.txt", "")
      else
        FileLib.read("RdbtConfigV4", "responseMessages.txt")
          ?.replaceAll('"', "")
          ?.split("\n")
          ?.filter(msg => msg)
          ?.forEach(msg => this.MESSAGES.push(msg))

      // Load backup response
      if (!this.backupResponse) new Thread(() => (this.backupResponse = this.fetchResponse(this.OPEN_SURROUNDINGS))).start()
    }).setDelay(60)

    this.ACTIONS = {
      item: () => {
        const items = Player.getInventory()
          .getItems()
          .map((value, slot) => {
            return { value, slot }
          })
          .splice(0, 9)
          .filter(n => n.value)
        if (!items.length) return this.ACTIONS[this.getRandomAction()]() // Backup action

        const item = items[Math.floor(Math.random() * items.length)]
        if (!item) return this.ACTIONS[this.getRandomAction()]() // Backup action

        const previousSlot = Player.getHeldItemIndex()

        // Swap to random slot
        Client.scheduleTask(0, () => this.pause(false))
        Client.scheduleTask(Math.round(Utils.getRandomInRange(500, 700) / 50), () => Player.setHeldItemIndex(item.slot))
        Client.scheduleTask(Math.round(Utils.getRandomInRange(750, 900) / 50), () => this.unpause())

        // Swap back
        const swapBackTime = Math.round(Utils.getRandomInRange(1100, 2500) / 50)
        Client.scheduleTask(swapBackTime, () => this.pause(false))
        Client.scheduleTask(swapBackTime + Math.round(Utils.getRandomInRange(500, 700) / 50), () => Player.setHeldItemIndex(previousSlot))
        Client.scheduleTask(swapBackTime + Math.round(Utils.getRandomInRange(750, 900) / 50), () => {
          this.playingSpecialAction = false
          this.unpause()
        })
      },

/*       inventory: () => {
        chat.debugMessage("invent")
        Client.scheduleTask(0, () => this.pause())
        Client.scheduleTask(Math.round(Utils.getRandomInRange(500, 700) / 50), () => Client.getMinecraft().func_147108_a(new net.minecraft.client.gui.inventory.GuiInventory(Player.getPlayer())))
        Client.scheduleTask(Math.round(Utils.getRandomInRange(1600, 1750) / 50), () => InventoryUtils.closeInv())
        Client.scheduleTask(Math.round(Utils.getRandomInRange(1800, 2000) / 50), () => this.unpause())
      }, */

      swing: () => {
        if (!Client.isInGui() && !Client.isInChat()) Player.getPlayer().func_71038_i()

        if (Math.random() >= 0.6)
          Client.scheduleTask(Math.round(Utils.getRandomInRange(200, 1000) / 50), () => {
            if (!Client.isInGui() && !Client.isInChat()) Player.getPlayer().func_71038_i()
          })
      },

      chat: () => {
        if (!this.MESSAGES?.length) {
          chat.debugMessage("No response messages found!")
          return this.ACTIONS[this.getRandomAction()]() // Backup action
        }

        const selectedMessage = this.MESSAGES[Math.floor(Math.random() * this.MESSAGES.length)]

        // Calculate time to type message
        const wpm = Utils.getRandomInRange(50, 115)
        const typeTime = (selectedMessage.length / wpm) * 1000 + Utils.getRandomInRange(700, 1000) // Add time for opening chat etc

        // "Type" message
        Client.scheduleTask(0, () => this.pause())
        Client.scheduleTask(Math.round(typeTime / 50), () => ChatLib.command(`ac ${selectedMessage}`))
        Client.scheduleTask(Math.round(typeTime / 50) + Math.round(Utils.getRandomInRange(300, 500) / 50), () => this.unpause())
      },
    }

    register("packetSent", () => {
      if (!this.isPlayback) return

      if (this.timeHelper.isPaused && !Client.isInGui() && !this.playingSpecialAction) this.unpause()
      if ((Client.isInGui() && !Client.isInChat()) || this.timeHelper.isPaused) return this.pause()

      if (!this.currentAction || this.timeHelper.hasReached(this.currentAction?.time ?? 0)) this.currentAction = this.actions.shift()

      // Set rotations with sensitivity fix and slight randomness
      Rotations.rotateToAngles(/* yaw:  */ Player.getRawYaw() + net.minecraft.util.MathHelper.func_76142_g(this.currentAction.yaw + Math.random() / 10 - Player.getYaw()), /* pitch:  */ this.currentAction.pitch + Math.random() / 20)

      // Finished playback
      if (!this.actions.length) this.end()

      // Set movement keys
      Object.entries(this.MOVEMENT_KEYS).forEach(([key, value]) => {
        if (this.currentAction.keys?.[key]) value(true)
        else value(false)
      })
    }).setFilteredClass(net.minecraft.network.play.client.C03PacketPlayer)
  }

  pause(unsneak = true) {
    if (this.timeHelper.isPaused) return // Already paused

    this.timeHelper.pause()
    unsneak ? MovementHelper.unpressKeys() : MovementHelper.stopMovement()
  }

  unpause() {
    this.timeHelper.unpause()
  }

  end(cb = true) {
    this.isPlayback = false

    // Stop all movement
    Client.scheduleTask(5, () => {
      chat.message("AutoVegetable " + "&2Response finished!")
      overlayManager.DisableOverlay("FAILSAFES")

      MovementHelper.unpressKeys()
      if (cb) this.cb?.()
    })
  }

  scanSurroundings() {
    const playerPos = [Player.getX(), Player.getY(), Player.getZ()].map(x => Math.round(x))

    const surroundings = this.OPEN_SURROUNDINGS

    Object.entries(this.OFFSETS).forEach(([key, offset]) => {
      for (let y = 0; y <= 1; y++) {
        let block = World.getBlockAt(playerPos[0] + offset[0], playerPos[1] + offset[1], playerPos[2] + offset[2])

        surroundings[y === 0 ? "down" : "up"][key] = this.isBlockSolid(block) ? 0 : 1
      }
    })

    return surroundings
  }

  isBlockSolid(block) {
    // Random blocks I could think of causing issues (should add crops eventually)
    return !["minecraft:air", "minecraft:snow_layer", "minecraft:carpet", "minecraft:sapling", "minecraft:ladder"].includes(block.type.getRegistryName())
  }

  fetchResponse(surroundings) {
    try {
      // Generate a response that mimics real player behavior
      const response = {
        actions: [],
        duration: Utils.getRandomInRange(10000, 15000),
        start: {
          x: Utils.getRandomInRange(-0.5, 0.5),
          z: Utils.getRandomInRange(-0.5, 0.5),
          yaw: Math.max(-180, Math.min(180, Player.getYaw() + Utils.getRandomInRange(-30, 30))),
          pitch: Math.max(-90, Math.min(90, Utils.getRandomInRange(-30, 15))),
        },
      }

      // Generate a sequence of random actions
      const numActions = Utils.getRandomInRange(10, 15)
      let currentTime = 0
      let currentYaw = response.start.yaw
      let currentPitch = response.start.pitch

      for (let i = 0; i < numActions; i++) {
        // Add random delay between actions
        currentTime += Utils.getRandomInRange(500, 1500)

        // Calculate new yaw and pitch with limits
        const yawChange = Utils.getRandomInRange(-90, 90)
        currentYaw += yawChange

        // Keep yaw in -180 to 180 range
        while (currentYaw > 180) currentYaw -= 360
        while (currentYaw < -180) currentYaw += 360

        // Calculate new yaw and pitch with limits
        const pitchChange = Utils.getRandomInRange(-30, 30)
        currentPitch += pitchChange

        if (currentPitch > 75) currentPitch += -20
        if (currentPitch < -75) currentPitch += 20

        // Keep pitch in -90 to 90 range
        if (currentPitch > 90) currentPitch = 90
        if (currentPitch < -90) currentPitch = -90

        const action = {
          time: currentTime,
          yaw: currentYaw,
          pitch: currentPitch,
          keys: {},
        }

        // Randomly add movement keys
        if (Math.random() > 0.6) {
          const possibleKeys = ["forward", "backward", "left", "right", "jump", "sneak"]
          const numKeys = Utils.getRandomInRange(1, 3)

          for (let j = 0; j < numKeys; j++) {
            const key = possibleKeys[Math.floor(Math.random() * possibleKeys.length)]
            action.keys[key] = true
          }
        }

        response.actions.push(action)
      }

      return response
    } catch (e) {
      chat.message("AutoVegetable " + `Error occurred during response generation: ${e}`)
      return null
    }
  }

  findOptimalResponse(cb = () => {}) {
    const target = this.scanSurroundings()
    const selectedResponse = this.fetchResponse(target)
    if (!selectedResponse) return chat.message("AutoVegetable " + `Error occured during response generation. No backup response available!`) // TODO add validation

    // Set variables
    this.actions = selectedResponse.actions
    this.duration = selectedResponse.duration ?? 12000

    // Wait for response timer
    const remainingTime = global.export.FailsafeManager.responseWaitTime - global.export.FailsafeManager.startTimer.getTimePassed()
    if (remainingTime > 0) Thread.sleep(remainingTime)

    // Align with start position (roughly)
    const startPos = new net.minecraft.util.Vec3(Math.floor(Player.getX()) + selectedResponse.start.x, Player.getY(), Math.floor(Player.getZ()) + selectedResponse.start.z)
    const angles = Rotations.getAngles(startPos)

    // Set keys to go vaguely to start pos
    Client.scheduleTask(0, () => {
      MovementHelper.setKey("sneak", true)
      MovementHelper.setKeysForStraightLine(net.minecraft.util.MathHelper.func_76142_g(angles.yaw), false)
    })

    // Stop alignment but don't unsneak
    Client.scheduleTask(3, () => {
      MovementHelper.stopMovement()
    })

    // Align with start angles
    Rotations.rotateToAngles(selectedResponse.start.yaw, selectedResponse.start.pitch)

    // Start playback
    Rotations.onEndRotation(() => {
      this.currentAction = this.actions.shift()
      this.timeHelper.reset()
      this.isPlayback = true

      // Schedule actions at strategic times throughout response
      this.scheduleRandomActions()
    })

    this.cb = cb
  }

  scheduleRandomActions() {
    const minStart = this.duration / 25

    const actionTimes = []
    const numActions = Utils.getRandomInRange(3, 6); // Generate between 3 and 6 actions
    for (let i = 0; i < numActions; i++) {
      actionTimes.push(Utils.getRandomInRange(minStart, this.duration - this.duration / 5));
    }

    actionTimes.sort((a, b) => a - b);
    chat.debugMessage(actionTimes)

    actionTimes.forEach(time => {
      const selectedAction = this.getRandomAction()

      // Schedule action
      setTimeout(() => {
        // GUI Check
        if (Client.isInGui() && !Client.isInChat()) return

        if (!this.playingSpecialAction) {
          this.playingSpecialAction = true
          try {
            this.ACTIONS[selectedAction]()
          } finally {
            this.playingSpecialAction = false
          }
        }
      }, time)
    })
  }

  getRandomAction() {
    const actions = Object.keys(this.ACTIONS)
    return actions[Math.floor(Math.random() * actions.length)]
  }
}

global.export.ResponseBot = new ResponseBot()
