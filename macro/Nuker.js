import Skyblock from "BloomCore/Skyblock"
import RenderLib from "RenderLib";
let { SettingSelector, SettingSlider, SettingToggle, ConfigModuleClass, ModuleToggle, getKeyBind, ModuleManager } = global.settingSelection
let { chat, MiningUtils, Rotations, Vec3, overlayManager, RaytraceUtils, ItemUtils, NumberUtils, MiningBot, registerEventSB, MouseUtils, MovementHelper, RenderUtils, TimeHelper, MathUtils, Utils } = global.export

//implemented by real (yo daddy)
global.modules.push(
  new ConfigModuleClass(
    "Nuker",
    "Mining",
    [
      new SettingToggle("Don't Nuke Below", false),
      new SettingToggle("Auto Chest", false),
      new SettingSelector("Block Type", 0, ["Crystal Hollows"/*, "Sand/Mycelium"*/]), //currently only works with crystal hollows
    ],
    ["Block Nuker"],
  ),
)


class Nuker {
    constructor() {
        this.ModuleName = "Nuker"
        this.Enabled = false;

        getKeyBind("Nuker", "Rdbt Client v4 - Mining", this)

        this.lastClick = null;
        this.lastTime = 0;
        this.lastChestClick = {};
        this.minedBlocks = new Map();
        this.storedChests = new Set();
        this.lootedChests = new Set();
        this.clickQueue = new Set();
        this.foundChests = new Set();
        this.chestClickedThisTick = false;
        this.breaking = false
        
        this.BLOCK_COOLDOWN = 1000;
        this.REQUIRED_ITEMS = ["Drill", "Gauntlet", "Pick"];
        this.blockType = null;
        this.nukeBelow = null;
        this.autoChest = null;

        this.lastNukeTime = Date.now()

/*         register("command", (ticks = 1) => {
            let block = Player.lookingAt()

            if (block.getClass() === Block) {
                  let pos = [block.getX(), block.getY(), block.getZ()]
                  chat.debugMessage("Nuking " + block.type.getRegistryName() + " at " + pos)
                  this.nuke(pos, ticks);
              }
        }).setCommandName("nukeit") */

        register("worldUnload", () => {
            if (!this.Enabled) return;

            this.toggle()
            chat.debugMessage(this.ModuleName + ": &cDisabled due to world change");
        });

        register("tick", () => { // 1 chest per tick
            this.chestClickedThisTick = false;
        });

        register("step", () => {
            this.blockType = ModuleManager.getSetting(this.ModuleName, "Block Type");
            this.nukeBelow = ModuleManager.getSetting(this.ModuleName, "Don't Nuke Below")
            this.autoChest = ModuleManager.getSetting(this.ModuleName, "Auto Chest");
        }).setFps(1)

        register("tick", () => {
            if (!this.Enabled) return;
            if (Skyblock.area != "Crystal Hollows") {
                this.stopMacro("Not in Crystal Hollows")
                return
            }
            if (this.blockType == "Crystal Hollows") {
                this.REQUIRED_ITEMS = ["Drill", "Gauntlet", "Pick"];
            } else if (this.blockType == "Sand/Mycelium") {
                this.REQUIRED_ITEMS = ["Shovel"];
            }
        
            if (!this.isHoldingRequiredItem()) return;
            if (Client.isInGui() && !Client.isInChat()) return;
            if (Client.getKeyBindFromDescription("key.attack").isKeyDown()) return;
            if (!this.onGround()) return;
            if (Date.now() - this.lastTime < 0 * 50) return; // delay (0)
        
            this.lastTime = Date.now();
        
            for (const [pos, time] of this.minedBlocks) {
                if (Date.now() - time > this.BLOCK_COOLDOWN) {
                    this.minedBlocks.delete(pos);
                }
            }
        
            let playerX = Math.floor(Player.getX());
            let playerY = Math.floor(Player.getY());
            let playerZ = Math.floor(Player.getZ());
        
            let validBlocks = [];
        
            for (let x = playerX - 5; x <= playerX + 5; x++) {
                for (let y = playerY - (this.nukeBelow ? 0 : 5); y <= playerY + 5; y++) {
                    for (let z = playerZ - 5; z <= playerZ + 5; z++) {
                        let pos = new BlockPos(x, y, z);
                        if (this.nukeBelow && y < playerY) continue;
                        if (this.minedBlocks.has(pos.toString())) continue;
                        if (this.distance(this.cords(), [x, y, z]).distance > 5) continue;
        
                        let block = World.getBlockStateAt(new BlockPos(x, y, z)).func_177230_c();
                        let isValidBlock = false;
                        if (this.blockType == "Crystal Hollows") {
                            isValidBlock = block instanceof net.minecraft.block.BlockStone || block instanceof net.minecraft.block.BlockOre;
                        } else if (this.blockType == "Sand/Mycelium") {  
                            isValidBlock = block instanceof net.minecraft.block.BlockSand || block instanceof net.minecraft.block.BlockMycelium;
                        }
        
                        if (isValidBlock) {
                            validBlocks.push(pos);
                        } 
                    }
                }
            }
        
            if (validBlocks.length > 0) {
                let targetPos = validBlocks[Math.floor(Math.random() * validBlocks.length)];
                
                this.nuke([targetPos.x, targetPos.y, targetPos.z]);
        
                this.lastClick = targetPos;
                this.minedBlocks.set(targetPos.toString(), Date.now());
            } 
        });


        register("renderWorld", () => {
            if (!this.Enabled) return;
            if (Skyblock.area != "Crystal Hollows") return;
            if (!this.isHoldingRequiredItem()) return;
            if (Client.isInGui() && !Client.isInChat()) return;
        
            if (this.lastClick) {
                this.renderRGB([this.lastClick.getX(), this.lastClick.getY(), this.lastClick.getZ()], [255, 255, 255])
            }
        });

    register("renderTileEntity", (entity) => {
            if (!this.Enabled || !this.autoChest || Skyblock.area != "Crystal Hollows" || (Client.isInGui() && !Client.isInChat())) return;

            if (!this.isHoldingRequiredItem()) return;

            if (entity.getBlockType() && entity.getBlockType().getID() === 54) {
                const chest = entity.getBlock().pos;
                const pos = `${chest.x},${chest.y},${chest.z}`;

                if (this.lootedChests.has(pos)) { chat.debugMessage("Nuker: Chest already looted"); return; }
                if (this.clickQueue.has(pos)) { chat.debugMessage("Nuker: Chest already in click queue"); return; } // Skip if already queued
                if (this.distance(this.cords(), [chest.x, chest.y, chest.z]).distance > 6) { chat.debugMessage("Nuker: Chest too far"); return; }

                if (!this.storedChests.has(pos)) {
                    this.storedChests.add(pos);
                }

                if (!this.chestClickedThisTick && (!this.lastChestClick[pos] || Date.now() - this.lastChestClick[pos] > Math.floor(Math.random() * 50) + 50)) {
                    this.clickQueue.add(pos);
                    this.rightClickBlock([chest.x, chest.y, chest.z]);
                    Client.sendPacket(new net.minecraft.network.play.client.C0APacketAnimation());
                    this.lastChestClick[pos] = Date.now();
                    this.chestClickedThisTick = true;
                }
            }
        });



    register("chat", (event) => {
        const text = ChatLib.removeFormatting(event).toLowerCase();
        if (text.includes("you uncovered a treasure chest")) {
            this.foundChests.add(this.lastClickedChest);
        } else if (text.includes("chest lockpicked") || text.includes("this chest has already been looted")) {
            if (this.lastClickedChest) {
                const pos = `${this.lastClickedChest.x},${this.lastClickedChest.y},${this.lastClickedChest.z}`;
                this.lootedChests.add(pos);
                this.storedChests.delete(pos);
                this.clickQueue.delete(pos);
            }
        }
    });
    }

    isHoldingRequiredItem() {
        let heldItem = Player.getHeldItem();
        if (!heldItem) return false;
        return this.REQUIRED_ITEMS.some((item) => heldItem.getName().toLowerCase().includes(item.toLowerCase()));
    }

    distance(from, to) {
        const diffX = from[0] - to[0];
        const diffY = from[1] - to[1];
        const diffZ = from[2] - to[2];
        const distanceFlat = Math.sqrt((diffX * diffX) + (diffZ * diffZ));
        const distance = Math.sqrt((distanceFlat * distanceFlat) + (diffY * diffY));
        return { distance, distanceFlat, distanceY: Math.abs(diffY) };
    }

    onGround() {
        return Player.asPlayerMP().isOnGround();
    }

     cords() {
        return [Player.x, Player.y, Player.z];
    }

    nuke(blockPos, ticks=1) {
        if ((Date.now() - this.lastNukeTime > 50+(ticks*50)) || ticks === 1 || this.delay > 100) {
            this.delay = 0;
        }
        this.lastNukeTime = Date.now();

        var C0A = Java.type("net.minecraft.network.play.client.C0APacketAnimation");
        var C07 = Java.type("net.minecraft.network.play.client.C07PacketPlayerDigging");
        var bp = Java.type("net.minecraft.util.BlockPos");
        var EnumFacing = Java.type("net.minecraft.util.EnumFacing");

        setTimeout(() => {
            Client.sendPacket(new C07(C07.Action.START_DESTROY_BLOCK, new bp(blockPos[0], blockPos[1], blockPos[2]), EnumFacing.UP));
            this.currentBreakingBlockPos = blockPos;
        }, this.delay)

        this.delay += 4;

        for (let i = 0; i < ticks; i++) {
            setTimeout(() => {
                Player.getPlayer().func_71038_i() //Client.sendPacket(new C0A) & animation
              }, (i*50))
        }
    }

    renderCord(location, rgb = [1, 1, 1], alpha = 0.3, full = true) {
            if (!full) {
                RenderLib.drawEspBox(location[0] + 0.5, location[1], location[2] + 0.5, 1, 1, rgb[0], rgb[1], rgb[2], alpha, false);
            } else {
                RenderLib.drawInnerEspBox(location[0] + 0.5, location[1], location[2] + 0.5, 1, 1, rgb[0], rgb[1], rgb[2], alpha, true);
            }
        }

    renderRGB(location, rgb = [1, 1, 1], alpha = 0.3, full = true) {
        let time = Date.now() / 1000;
        let r = Math.sin(time) * 127 + 128;
        let g = Math.sin(time + 2) * 127 + 128;
        let b = Math.sin(time + 4) * 127 + 128;
        
        if (!full) {
            RenderLib.drawEspBox(location[0] + 0.5, location[1], location[2] + 0.5, 1, 1, r/255, g/255, b/255, alpha, false);
        } else {
            RenderLib.drawInnerEspBox(location[0] + 0.5, location[1], location[2] + 0.5, 1, 1, r/255, g/255, b/255, alpha, true);
        }
    }

    rightClickBlock(xyz) {
        var C08 = Java.type("net.minecraft.network.play.client.C08PacketPlayerBlockPlacement");
        var BlockPos = Java.type("net.minecraft.util.BlockPos");
        var blockPos = new BlockPos(xyz[0], xyz[1], xyz[2]);
        var heldItemStack = Player.getHeldItem()?.getItemStack() || null;
        Client.sendPacket(new C08(blockPos, 0, heldItemStack, 0, 0, 0));
    }
    
    init() {
        this.lastClick = null;
        this.lastTime = 0;
        this.lastChestClick = {};
        this.minedBlocks = new Map();
        this.storedChests = new Set();
        this.lootedChests = new Set();
        this.clickQueue = new Set();
        this.foundChests = new Set();
        this.chestClickedThisTick = false;
        this.lastClickedChest = null;
    }

    stopMacro(msg) {
        if (msg) {
            this.sendMacroMessage(this.ModuleName, msg)
            Utils.warnPlayer()
        }
        this.Enabled = false
        this.init();
    }

    toggle() {
        this.Enabled = !this.Enabled;
        if (this.Enabled) {
            if (Skyblock.area != "Crystal Hollows") {
                this.Enabled = false;
                chat.message(this.ModuleName + ": &cCannot enable outside Crystal Hollows");
                return;
            }
            this.init();
            chat.message(this.ModuleName + ": &aEnabled");
        } else {
            this.init();
            chat.message(this.ModuleName + ": &cDisabled");
        }
    }
}


global.export.Nuker = new Nuker()