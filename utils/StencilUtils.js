global.export.StencilUtils = class {
  static InitStencil = () => {
    const FrameBuffer = Client.getMinecraft().func_147110_a() // getFramebuffer()

    FrameBuffer.func_147610_a(false) // bindFrameBuffer(false)
    global.export.StencilUtils.CheckSetupFB(FrameBuffer)
    GL11.glClear(GL11.GL_STENCIL_BUFFER_BIT)
    GL11.glEnable(GL11.GL_STENCIL_TEST)
  }

  static Recreate = FrameBuffer => {
    GL30.glDeleteRenderbuffers(FrameBuffer.field_147624_h)
    const depthBuffer = GL30.glGenRenderbuffers()
    GL30.glBindRenderbuffer(GL30.GL_RENDERBUFFER, depthBuffer)
    GL30.glRenderbufferStorage(GL30.GL_RENDERBUFFER, GL30.GL_DEPTH_STENCIL, Client.getMinecraft().field_71443_c, Client.getMinecraft().field_71440_d)
    GL30.glFramebufferRenderbuffer(GL30.GL_FRAMEBUFFER, GL30.GL_STENCIL_ATTACHMENT, GL30.GL_RENDERBUFFER, depthBuffer)
    GL30.glFramebufferRenderbuffer(GL30.GL_FRAMEBUFFER, GL30.GL_DEPTH_ATTACHMENT, GL30.GL_RENDERBUFFER, depthBuffer)
  }

  static CheckSetupFB = FrameBuffer => {
    if (FrameBuffer != null) {
      if (FrameBuffer.field_147624_h > -1) {
        // depthBuffer
        global.export.StencilUtils.Recreate(FrameBuffer)
        FrameBuffer.field_147624_h = -1
      }
    }
  }

  static BindWriteStencilBuffer = () => {
    GL11.glStencilFunc(GL11.GL_ALWAYS, 1, 1)
    GL11.glStencilOp(GL11.GL_REPLACE, GL11.GL_REPLACE, GL11.GL_REPLACE)
    GL11.glColorMask(false, false, false, false)
  }

  static BindReadStencilBuffer = ref => {
    GL11.glColorMask(true, true, true, true)
    GL11.glStencilFunc(GL11.GL_EQUAL, ref, 1)
    GL11.glStencilOp(GL11.GL_KEEP, GL11.GL_KEEP, GL11.GL_KEEP)
  }

  static UninitStencilBuffer = () => {
    GL11.glDisable(GL11.GL_STENCIL_TEST)
  }
}
