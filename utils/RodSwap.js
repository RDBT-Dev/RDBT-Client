let {  chat, Utils, ItemUtils } = global.export; // idk which one imports item utils

class RodSwap {
    constructor() {
        this.rodSlot = -1;
    }

    rodswapability() {
        this.rodSlot = ItemUtils.findItemInHotbar("Rod");  

        if (this.rodSlot !== -1) {
            Player.setHeldItemIndex(this.rodSlot);
            Client.scheduleTask(7,  () => {
                ItemUtils.rightClickPacket();
            })
            Client.scheduleTask(12, () => {
                ItemUtils.rightClickPacket();
            })
        } else {
            this.sendMacroMessage("No rod found in the hotbar");
        }
    }

    sendMacroMessage(msg) {
        chat.message("RodSwap: " + msg);
    }
}

register("command", () => {
    global.export.RodSwap.rodswapability();  
}).setName("rodswap");

global.export.RodSwap = new RodSwap();
