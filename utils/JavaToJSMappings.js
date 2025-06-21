// MC Classes
global.export.Vec3 = Java.type("net.minecraft.util.Vec3")
global.export.BP = Java.type("net.minecraft.util.BlockPos")
global.export.EnumFacing = Java.type("net.minecraft.util.EnumFacing")
global.export.Blocks = Java.type("net.minecraft.init.Blocks")
global.export.BlockStainedGlass = Java.type("net.minecraft.block.BlockStainedGlass")
global.export.BlockStainedGlassPane = Java.type("net.minecraft.block.BlockStainedGlassPane")
global.export.BlockPane = Java.type("net.minecraft.block.BlockPane")
global.export.AxisAlignedBB = Java.type("net.minecraft.util.AxisAlignedBB")
global.export.WalkNodeProcessor = Java.type("net.minecraft.world.pathfinder.WalkNodeProcessor")
global.export.KeyBinding = Java.type("net.minecraft.client.settings.KeyBinding")
global.export.GuiInventory = Java.type("net.minecraft.client.gui.inventory.GuiInventory")
global.export.GameSettings = Java.type("net.minecraft.client.settings.GameSettings")

// MC Mobs

global.export.mcMobs = {
  EntityIronGolem: Java.type("net.minecraft.entity.monster.EntityIronGolem"),
  EntitySilverfish: Java.type("net.minecraft.entity.monster.EntitySilverfish"),
  EntityZombie: Java.type("net.minecraft.entity.monster.EntityZombie"),
  EntitySkeleton: Java.type("net.minecraft.entity.monster.EntitySkeleton"),
  EntityGuardian: Java.type("net.minecraft.entity.monster.EntityGuardian"),
  EntityWitch: Java.type("net.minecraft.entity.monster.EntityWitch"),
  EntityMagmeCube: Java.type("net.minecraft.entity.monster.EntityMagmaCube"),
  EntitySlime: Java.type("net.minecraft.entity.monster.EntitySlime"),
  EntityCreeper: Java.type("net.minecraft.entity.monster.EntityCreeper"),
  EntityBlaze: Java.type("net.minecraft.entity.monster.EntityBlaze"),
  EntityEndermite: Java.type("net.minecraft.entity.monster.EntityEndermite"),
  EntityOcelot: Java.type("net.minecraft.entity.passive.EntityOcelot"),
  EntitySquid: Java.type("net.minecraft.entity.passive.EntitySquid"),
  EntityChicken: Java.type("net.minecraft.entity.passive.EntityChicken"),
  EntityRabbit: Java.type("net.minecraft.entity.passive.EntityRabbit"),
}

global.export.mcTileEntities = {
  TileEntityChest: Java.type("net.minecraft.tileentity.TileEntityChest"),
}

global.export.EntityIronGolem = Java.type("net.minecraft.entity.monster.EntityIronGolem")
global.export.EntitySilverfish = Java.type("net.minecraft.entity.monster.EntitySilverfish")
global.export.EntityZombie = Java.type("net.minecraft.entity.monster.EntityZombie")
global.export.EntitySkeleton = Java.type("net.minecraft.entity.monster.EntitySkeleton")
global.export.EntityGuardian = Java.type("net.minecraft.entity.monster.EntityGuardian")
global.export.EntityWitch = Java.type("net.minecraft.entity.monster.EntityWitch")
global.export.EntityMagmeCube = Java.type("net.minecraft.entity.monster.EntityMagmaCube")
global.export.EntitySlime = Java.type("net.minecraft.entity.monster.EntitySlime")
global.export.EntityCreeper = Java.type("net.minecraft.entity.monster.EntityCreeper")
global.export.EntityBlaze = Java.type("net.minecraft.entity.monster.EntityBlaze")
global.export.EntityOcelot = Java.type("net.minecraft.entity.passive.EntityOcelot")
global.export.EntitySquid = Java.type("net.minecraft.entity.passive.EntitySquid")
global.export.EntityChicken = Java.type("net.minecraft.entity.passive.EntityChicken")
global.export.EntityRabbit = Java.type("net.minecraft.entity.passive.EntityRabbit")

// MC Packets
global.export.C09PacketHeldItemChange = Java.type("net.minecraft.network.play.client.C09PacketHeldItemChange")
global.export.C0BPacketEntityAction = Java.type("net.minecraft.network.play.client.C0BPacketEntityAction")
global.export.C07PacketPlayerDigging = Java.type("net.minecraft.network.play.client.C07PacketPlayerDigging")
global.export.C0APacketAnimation = Java.type("net.minecraft.network.play.client.C0APacketAnimation")
global.export.C08PacketPlayerBlockPlacement = Java.type("net.minecraft.network.play.client.C08PacketPlayerBlockPlacement")
global.export.S00PacketKeepAlive = Java.type("net.minecraft.network.play.server.S00PacketKeepAlive")
global.export.S08PacketPlayerPosLook = Java.type("net.minecraft.network.play.server.S08PacketPlayerPosLook")
global.export.S23PacketBlockChange = Java.type("net.minecraft.network.play.server.S23PacketBlockChange")
global.export.S22PacketMultiBlockChange = Java.type("net.minecraft.network.play.server.S22PacketMultiBlockChange")
global.export.S09PacketHeldItemChange = Java.type("net.minecraft.network.play.server.S09PacketHeldItemChange")
global.export.S2APacketParticles = Java.type("net.minecraft.network.play.server.S2APacketParticles")
global.export.S0FPacketSpawnMob = Java.type("net.minecraft.network.play.server.S0FPacketSpawnMob")
global.export.C03PacketPlayer$C04PacketPlayerPosition = Java.type("net.minecraft.network.play.client.C03PacketPlayer$C04PacketPlayerPosition")
global.export.C03PacketPlayer$C05PacketPlayerLook = Java.type("net.minecraft.network.play.client.C03PacketPlayer$C05PacketPlayerLook")
global.export.C03PacketPlayer$C06PacketPlayerPosLook = Java.type("net.minecraft.network.play.client.C03PacketPlayer$C06PacketPlayerPosLook")
global.export.S2FPacketSetSlot = Java.type("net.minecraft.network.play.server.S2FPacketSetSlot")
global.export.S30PacketWindowItems = Java.type("net.minecraft.network.play.server.S30PacketWindowItems")
global.export.S2DPacketOpenWindow = Java.type("net.minecraft.network.play.server.S2DPacketOpenWindow")
global.export.S30PacketWindowItems = Java.type("net.minecraft.network.play.server.S30PacketWindowItems")
global.export.C0DPacketCloseWindow = Java.type("net.minecraft.network.play.client.C0DPacketCloseWindow")
global.export.C0EPacketClickWindow = Java.type("net.minecraft.network.play.client.C0EPacketClickWindow")
global.export.S12PacketEntityVelocity = Java.type("net.minecraft.network.play.server.S12PacketEntityVelocity")
global.export.S18PacketEntityTeleport = Java.type("net.minecraft.network.play.server.S18PacketEntityTeleport")
global.export.S19PacketEntityHeadLook = Java.type("net.minecraft.network.play.server.S19PacketEntityHeadLook")
global.export.S1BPacketEntityAttach = Java.type("net.minecraft.network.play.server.S1BPacketEntityAttach")
global.export.S21PacketChunkData = Java.type("net.minecraft.network.play.server.S21PacketChunkData")
global.export.S42PacketCombatEvent = Java.type("net.minecraft.network.play.server.S42PacketCombatEvent")
global.export.S06PacketUpdateHealth = Java.type("net.minecraft.network.play.server.S06PacketUpdateHealth")
global.export.S43PacketCamera = Java.type("net.minecraft.network.play.server.S43PacketCamera")
global.export.S29PacketSoundEffect = Java.type("net.minecraft.network.play.server.S29PacketSoundEffect")
global.export.S0BPacketAnimation = Java.type("net.minecraft.network.play.server.S0BPacketAnimation")

// Java Libs
global.export.ArrayLists = Java.type("java.util.ArrayList")
global.export.List = Java.type("java.util.List")
global.export.File = Java.type("java.io.File")
global.export.Mouse = Java.type("org.lwjgl.input.Mouse")
global.export.MinecraftForge = Java.type("net.minecraftforge.common.MinecraftForge")
global.export.Executors = Java.type("java.util.concurrent.Executors")
global.export.Event = Java.type("net.minecraftforge.fml.common.eventhandler.Event")
global.export.Reference = Java.type("com.chattriggers.ctjs.Reference")
global.export.Keyboard = Java.type("org.lwjgl.input.Keyboard")
global.export.JavaMath = Java.type("java.lang.Math")
