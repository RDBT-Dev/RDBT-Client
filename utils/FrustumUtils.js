class frustumUtils {
  constructor() {
    this.frustum = null

    register("renderWorld", () => {
      if (!this.frustum) this.frustum = new net.minecraft.client.renderer.culling.Frustum()

      const view = Client.getMinecraft().func_175606_aa()
      this.frustum.func_78547_a(view.field_70165_t, view.field_70163_u, view.field_70161_v)
    })
  }

  // CT BlockPos, CT Block
  isInView(pos, block = null) {
    if (!block) block = World.getBlockAt(pos)
    return this.frustum?.func_78546_a(block?.type?.mcBlock?.func_180646_a(World.getWorld(), pos.toMCBlock()))
  }
}

global.export.FrustumUtils = new frustumUtils()
