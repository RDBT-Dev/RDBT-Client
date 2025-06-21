class mouseUtils {
  constructor() {
    this.Mouse = Java.type("org.lwjgl.input.Mouse")
    this.MouseHelper = Java.type("net.minecraft.util.MouseHelper")
    this.JavaObject = Java.type("java.lang.Object")

    this.isUnGrabbed = false
    this.oldMouseHelper = null
    this.doesGameWantUngrabbed

    register("gameUnload", () => this.reGrabMouse())

    register("command", () => {
      this.unGrabMouse()
    }).setName("ungrabmouse")

    register("command", () => {
      this.reGrabMouse()
    }).setName("regrabmouse")
  }

  unGrabMouse() {
    if (this.isUnGrabbed) return
    let mc = Client.getMinecraft()
    mc.field_71474_y.field_82881_y = false
    if (!this.oldMouseHelper) this.oldMouseHelper = mc.field_71417_B
    this.oldMouseHelper.func_74373_b()
    mc.field_71415_G = true
    mc.field_71417_B = new JavaAdapter(net.minecraft.util.MouseHelper, {
      func_74374_c: function () {},
      func_74372_a: function () {},
      func_74373_b: function () {},
    })
    this.isUnGrabbed = true
  }

  reGrabMouse() {
    if (!this.isUnGrabbed) return
    if (!this.oldMouseHelper) return
    let mc = Client.getMinecraft()
    mc.field_71417_B = this.oldMouseHelper
    mc.field_71417_B.func_74372_a()
    this.oldMouseHelper = null
    this.isUnGrabbed = false
  }
}

global.export.MouseUtils = new mouseUtils()
