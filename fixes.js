window.gui.playerData.once("characterSelectedSuccess", function() {

  /* Zoom fix */

  let worldZoom = function(worldMap, e) {
    let zoom = - e.deltaY / 600;
    let previousZ = worldMap._scene.camera.zoomTarget;
    worldMap._scene.camera.zoomTo(worldMap._scene.camera.zoom * (1 + zoom));
    let newZ = worldMap._scene.camera.zoomTarget;
    let deltaZ = newZ / previousZ;
    worldMap._scene.move(0, 0, e.layerX * (deltaZ - 1), e.layerY * (deltaZ - 1), 1);
    worldMap._loadChunksInView();
  };

  let mapZoom = function(mapScene, e) {
    let zoom = - e.deltaY / 600;
    let previousZ = mapScene.camera.zoomTarget;
    mapScene.camera.zoomTo(mapScene.camera.zoom * (1 + zoom));
    let newZ = mapScene.camera.zoomTarget;
    let deltaZ = newZ / previousZ;
  };

  window.gui.windowsContainer.getChildren().forEach(function(child) {
    if (child.id == "worldMap") {
      child.on('open', function() {
        child._worldMap.rootElement.addEventListener('mousewheel', function(e) {
          worldZoom.call(this, child._worldMap, e);
        });
      });
    }
  });

  window.foreground.rootElement.addEventListener('mousewheel', function(e) {
    mapZoom.call(this, window.isoEngine.mapScene, e);
  });

});



/* Touches fix */

var events = {
  "mousedown": "touchstart",
  "mouseup": "touchend",
  "mousemove": "touchmove"
};

var mouseDown = false;

var handleEvents = function(e) {
  try {
    if (e.type === "mousedown") mouseDown = true;
    else if (e.type === "mouseup") mouseDown = false;

    if (!mouseDown && e.type === "mousemove") return;

    const touchObj = new Touch({
      identifier: 0,
      target: e.target,
      clientX: e.clientX,
      clientY: e.clientY,
      pageX: e.pageX,
      pageY: e.pageY,
      screenX: e.screenX,
      screenY: e.screenY,
      radiusX: 11.5,
      radiusY: 11.5,
      rotationAngle: 0,
      force: e.type === "mouseup" ? 0 : 1,
    });

    const touchEvent = new TouchEvent(events[e.type], {
      cancelable: true,
      bubbles: true,
      touches: e.type === "mouseup" ? [] : [touchObj],
      targetTouches: e.type === "mouseup" ? [] : [touchObj],
      changedTouches: [touchObj],
      shiftKey: false,
      composed: true,
      isTrusted: true,
      sourceCapabilities: new InputDeviceCapabilities({ firesTouchEvents: true }),
      view: window
    });

    e.target.dispatchEvent(touchEvent);
  } catch (e) {
    top.console.log(e);
  }

  e.stopPropagation();
  // e.preventDefault();
  return false;
};

try {
  for (var id in events) {
    document.body.addEventListener(id, handleEvents, true);
  }
} catch (e) {
  top.console.log(e);
}

window.top.eval('electron').remote.BrowserWindow.getAllWindows().forEach(browserWindow => {
  let options = { urls: ['https://haapi.ankama.com/json/Ankama/v2/Api/CreateApiKey'] }

  browserWindow.webContents.session.webRequest.onBeforeRequest(options, (details, callback) => {
    callback({
      cancel: false
    });
  });

  browserWindow.webContents.session.webRequest.onBeforeSendHeaders(options, (details, callback) => {
    callback({
      cancel: false
    });
  });
});
