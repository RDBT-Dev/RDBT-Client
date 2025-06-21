global.export.CheckboxDropdown = class {
  constructor(name, value, options, collapsed, parent) {
    this.name = name
    this.value = value
    this.options = options
    this.collapsed = collapsed
    this.parent = parent

    this.colours = {
      text: new java.awt.Color(0.95, 0.95, 0.95),
      disabled: new java.awt.Color(26 / 255, 28 / 255, 32 / 255),
      mouseOver: new java.awt.Color(31 / 255, 35 / 255, 41 / 255, 0.5),
    }

    this.x = 100
    this.y = 100
    this.width = 100
    this.height = 30
  }

  Draw(x, y, MouseX, MouseY) {
    this.x = x
    this.y = y
    Renderer.drawString(this.name, this.x, this.y)
    Renderer.drawRect(Renderer.BLACK, this.x, this.y + 10, this.width, 10)
    Renderer.drawString(this.options.join(", "), this.x + 1, this.y + 11)
  }

  KeyPress(char, keycode) {}
  MouseUp() {}
  Click() {}
}
