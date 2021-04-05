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



/* New website notification */

(async function () {

  // Lindo <= 2.5.2 does not have lindoVersion
  if (!window.top.lindoVersion) {
    const lastAsked = window.localStorage.getItem('lindo-update-popup');
    if (!lastAsked || Date.now() > parseInt(lastAsked) + 1000 * 60 * 60 * 24 * 7) { // 1 week
      window.localStorage.setItem('lindo-update-popup', Date.now())
      const texts = {
        fr: {
          title: `Notification de Lindo`,
          message1: `Salut ! Désolé pour l'intrusion.`,
          message2: `Le site officiel de Lindo a changé d'adresse. On ne pourra plus te prévenir en cas de nouvelle mise à jour avec la version sur laquelle tu joues. Tu peux corriger ça en téléchargeant la dernière version depuis notre nouvelle adresse :`
        },
        en: {
          title: `Notification from Lindo`,
          message1: `Hi! Sorry for the intrusion.`,
          message2: `Lindo official website address has changed. We will no longer be able to notify you about upcoming releases of Lindo with the version you're currently playing. You can fix this by downloading the latest version from our new address:`
        },
        es: {
          title: `Notificación de Lindo`,
          message1: `¡Hola! Perdón por la intrusión.`,
          message2: `La dirección del sitio web oficial de Lindo ha cambiado. Ya no podremos notificarle sobre los próximos lanzamientos de Lindo con la versión en la que está jugando actualmente. Puede solucionar este problema descargando la última versión desde nuestra nueva dirección:`
        }
      }

      const languagesInitialized = new Promise(resolve => {
        const interval = setInterval(() => {
          if (window.Config && window.Config.language) {
            clearInterval(interval);
            resolve();
          }
        }, 1000);
      });

      const lindoLogoLoaded = new Promise(resolve => {
        const lindoLogo = new Image();
        lindoLogo.addEventListener('load', resolve);
        lindoLogo.src = "https://lindo-app.com/icon.png";
      });

      await Promise.all([
        languagesInitialized,
        lindoLogoLoaded
      ]);

      const translatedTexts = texts[window.Config.language] || texts['en'];

      window.gui.openSimplePopup(`
        <div>
          ${translatedTexts['message1']}<br />
          ${translatedTexts['message2']}<br />
          <a target="_blank" href="https://lindo-app.com" style="text-align: center; font-size: 1.2em; display: inline-block; width: 100%; margin-top: 0.4em; text-decoration: none;">
            <img src="https://lindo-app.com/icon.png" style="height: 1.2em; display: inline-block; vertical-align: middle;"/>
            <span style="vertical-align: middle;">lindo-app.com</span>
          </a>
        </div>
      `, translatedTexts['title']);
    }
  }
})();
