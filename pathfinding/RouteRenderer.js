let { RenderUtils, Vec3, MathUtils, MovementHelper, Rotations, Client } = global.export;
let { ModuleToggle, ModuleManager } = global.settingSelection;

class RouteRenderer {
  constructor(routeWalker) {
    this.routeWalker = routeWalker;
  }

  render() {
    if (this.routeWalker.path.length > 0) {
      RenderUtils.renderCordsWithNumbers(this.routeWalker.path, [0.2, 0.47, 1], 0.2, true);
      RenderUtils.renderLines(this.routeWalker.path, [0.2, 0.47, 1], [0.5, 1.0, 0.5]);
    }

    if (this.routeWalker.Enabled) {
      if (this.routeWalker.state === this.routeWalker.WalkerStates.WALKING) { // Use routeWalker.WalkerStates.WALKING
        if (this.routeWalker.path.length > 0) {
          if (this.routeWalker.currentIndexLook >= this.routeWalker.path.length) {
            this.routeWalker.currentIndexLook = this.routeWalker.path.length - 1;
          }
          let currentWalk = this.routeWalker.path[this.routeWalker.currentIndexWalk];
          let currentLook = this.routeWalker.path[this.routeWalker.currentIndexLook];
          let distancePoint = MathUtils.distanceToPlayer([currentWalk[0] + 0.5, currentWalk[1] + 1.52, currentWalk[2] + 0.5]);
          if (distancePoint.distance < 6.0 && distancePoint.distanceFlat < 0.8) {
            this.routeWalker.currentIndexWalk += 1;
            this.routeWalker.currentIndexLook += 1;
            if (this.routeWalker.currentIndexWalk === this.routeWalker.path.length) {
              this.routeWalker.currentIndexWalk = 0;
              if (ModuleToggle.UseRouteWalkerV2Module) this.routeWalker.currentIndexLook = 2;
              else this.routeWalker.currentIndexLook = 0;
              this.routeWalker.triggerEnd();
              if (this.routeWalker.stopOnEnd) {
                this.routeWalker.toggle();
                return;
              }
            }
            if (this.routeWalker.currentIndexLook >= this.routeWalker.path.length) {
              this.routeWalker.currentIndexLook = this.routeWalker.path.length - 1;
            }
            currentWalk = this.routeWalker.path[this.routeWalker.currentIndexWalk];
            currentLook = this.routeWalker.path[this.routeWalker.currentIndexLook];
          }

          try {
            let vec3PointLook = new Vec3(currentLook[0] + 0.5, currentLook[1] + 1.52, currentLook[2] + 0.5);
            let vec3PointWalk = new Vec3(currentWalk[0] + 0.5, currentWalk[1] + 1.0, currentWalk[2] + 0.5);
            MovementHelper.setKeysBasedOnYaw(MathUtils.calculateAngles(vec3PointWalk).yaw);
            if (this.routeWalker.rotations) {
              if (ModuleManager.getSetting(this.routeWalker.ModuleName, "Lock Pitch")) {
                let lockedPitch = ModuleManager.getSetting(this.routeWalker.ModuleName, "Pitch");
                Rotations.rotateTo(vec3PointLook, 1.0, true, lockedPitch);
              } else {
                Rotations.rotateTo(vec3PointLook);
              }
            }

            if (ModuleManager.getSetting(this.routeWalker.ModuleName, "Left Click")) {
              MovementHelper.setKey("leftclick", true);
            }
          } catch (error) {}
        }
      }
    }
  }
}

export default RouteRenderer;
