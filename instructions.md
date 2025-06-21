# Rdbt Client Instructions
> ⚠️ **UAYOR**  

## Mining Macros

### Ore Macro
Automatically mines ores in Skyblock using AOTV teleportation.

**Setup:**

1. Configure your route using the settings menu (Custom 1-10)
2. Select which ore types to mine (quartz, emerald, diamond, etc.)
3. Adjust mining settings:
   - Route Color: Visual preference for route display
   - Overlay: Toggle information display
   - Ticks settings: Adjust mining speed
   - Fast AOTV: Faster teleportation using packet
   - Rod Swap Ability: Use fishing rod for ability

**Usage:**

- Press the keybind to start/stop the macro
- The macro will follow your custom route and mine ores
- It will automatically handle teleportation between waypoints

**Commands:**

- `/oreadd`: Add a point to your route
- `/oreremove`: Remove a point
- `/oreclear`: Clear your route

### Gemstone Macro
Automatically mines gemstones in the Crystal Hollows.

**Setup:**

1. Configure your route using the settings menu (Custom 1-10)
2. Select which gemstone types to mine (Ruby, Amethyst, etc.)
3. Configure additional settings:
   - Mob Killer: Automatically attack nearby mobs
   - Weapon Slot: Slot number for your weapon
   - Big Platforms: For larger mining areas
   - Low ping strategy: Optimization for low-latency connections

**Usage:**

- Press the keybind to start/stop the macro
- The macro will follow your route and mine selected gemstones
- It will handle mob encounters if enabled

**Commands:**

- `/gemstoneadd`: Add a point to your route
- `/gemstoneremove`: Remove a point
- `/gemstoneclear`: Clear your route

### Commission Macro
Automatically completes Dwarven Mines commissions.

**Setup:**

1. Configure Weapon Slot for Goblin commissions
2. Toggle Pigeonless mode

**Usage:**

- Press the keybind to start/stop the macro
- The macro will automatically:
  - Talk to NPCs to get commissions
  - Navigate to commission locations
  - Mine required ores or kill required mobs
  - Return to claim completed commissions

### MiningBot
Core mining functionality used by other macros.

**Setup:**

1. Configure mining settings:
   - Use preset ticks: Toggle for custom mining speed
   - Ticks without/with MSB: Adjust mining speed
   - Rod Swap Ability: Use fishing rod for ability
   - Mining Target: Select what to mine (Gold, Mithril, Gemstone, Ore)

**Usage:**

- This is primarily used by other macros but can be used independently
- Press the keybind to start/stop the bot

### Etherwarper
Automatically follows a route using etherwarp teleportation.

**Setup:**

1. Configure your route (Custom 1-10)
2. Adjust settings:
   - Etherwarp Delay: Time between teleports
   - Start Delay: Delay before starting
   - Fast AOTV: Faster teleportation
   - Warp Location: Where to warp after completion
   - Start Macro After Route: Automatically start another macro when done

**Commands:**

- `/etherwarperadd`: Add a point to your route
- `/etherwarperremove`: Remove a point
- `/etherwarperclear`: Clear your route

**Usage:**

- Press the keybind to start/stop the macro
- The macro will follow your etherwarp route

### Hoppity Macro
Automates the Chocolate Factory event.

**Setup:**

1. Configure settings:
   - Overlay: Toggle information display
   - Auto Click: Automatically click
   - Clicker CPS: Clicks per second
   - Auto Upgrade/Tower/Prestige: Automatic progression
   - Auto Event: Handle special events like egg hunts

**Usage:**

- Press the keybind to start/stop the macro
- The macro will automatically interact with the Chocolate Factory

### ScathaMacro (VIP)
VIP ONLY

## QOL Features

### GhostBlocks
Creates temporary air blocks

**Setup:**

1. Configure settings:
   - Not removable: Make ghost blocks persistent
   - Ghost block type: On press, On hold, On right click with stonk, or God mode

**Usage:**

- Press the keybind to create ghost blocks at your crosshair
- Useful for dungeons

### ESP
Highlights entities through walls.

**Setup:**

1. Configure settings:
   - Corpses: Highlight corpses in Glacite Mineshafts
   - Players: Highlight other players
   - Player Nametags: Show player names
   - Player Range: Distance for ESP to work

**Usage:**

- Toggle the feature in settings
- Entities will be highlighted through walls

### PowderTracker
Tracks Mithril powder gains.

**Usage:**

- Use `/powdertracker` to toggle tracking
- Shows powder gained and hourly rate in chat

### AutoBeg
Automatically sends begging messages in chat to get rank.

**Setup:**

1. Configure Message Interval: Time between messages (in seconds)

**Usage:**

- Toggle with `/autobeg` command
- Automatically sends randomized begging messages in chat

### AutoEnchanting
Completes autopairs and addons automatically.

**Setup:**

1. Configure settings:
   - Auto Pairs: Automatically match pairs
   - Click Delay: Time between clicks
   - Serums: Number of serums to use

**Usage:**

- Toggle in settings menu
- Open experiment table

### AutoHarp
Automatically plays the melody harp.

**Setup:**

1. Configure Tick Delay: Adjust timing for note clicks

**Usage:**

- Toggle in settings menu
- Open the harp and it will play automatically

### FastPlace
Increases block placement speed.

**Usage:**

- Toggle in settings menu
- Allows for extremely fast block placement
- Use with caution as it may be detectable

### FishingXPCheese
Automates fishing XP gain methods.

**Setup:**

1. Configure settings:
   - Overlay: Toggle information display
   - Action Delay: Time between actions
   - Can of worms mode: Toggle between chum and worms

**Usage:**

- Toggle in settings menu
- Automatically fills chum buckets or opens cans of worms

### GrottoFinder (VIP) (BROKEN)
Highlights fairy grottos in the Crystal Hollows.

### LobbyHopper
Automatically hops between lobbies to find one with a specific day.

**Setup:**

1. Configure settings:
   - Max Lobby Day: Maximum acceptable day number
   - Route Scanner: Automatically check routes in new lobbies

**Usage:**

- Use keybind to start/stop lobby hopping
- Will notify when a suitable lobby is found

### MobHider
Hides specific mobs from being rendered.

**Setup:**

1. Configure which mobs to hide:
   - Thysts (Endermites)
   - Sven Pups
   - Jerrys
   - Kalhukis

**Usage:**

- Toggle in settings menu
- Selected mobs will not be rendered, improving performance

### ProfileHider
Hides player and lobby indicators for privacy.

**Setup:**

1. Configure what to hide:
   - Scoreboard
   - Player Stats
   - Boss Bar

**Usage:**

- Toggle in settings menu
- Hides selected UI elements for screenshots or videos

### Spin
Makes your player model spin client-side.

**Setup:**

1. Configure settings:
   - Speed: How fast to spin
   - Mode: Left, Right, Pitch, or Seizure

**Usage:**

- Toggle in settings menu
- Visual effect only visible to you

- Use keybind to toggle
- Move camera independently from player position
- Useful for finding things
