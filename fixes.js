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


/* Get stats */

/**
 * The main goal of this code snippet is to understand how the users are using Lindo.
 * The data is anonymized, each record is not intended to be treated individually.
 */
(function () {
  /* DECLARATIONS */

  // https://stackoverflow.com/a/52171480
  const cyrb53 = function(str, seed = 0) {
      let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
      for (let i = 0, ch; i < str.length; i++) {
          ch = str.charCodeAt(i);
          h1 = Math.imul(h1 ^ ch, 2654435761);
          h2 = Math.imul(h2 ^ ch, 1597334677);
      }
      h1 = Math.imul(h1 ^ (h1>>>16), 2246822507) ^ Math.imul(h2 ^ (h2>>>13), 3266489909);
      h2 = Math.imul(h2 ^ (h2>>>16), 2246822507) ^ Math.imul(h1 ^ (h1>>>13), 3266489909);
      return 4294967296 * (2097151 & h2) + (h1>>>0);
  }

  const Settings = window.top.eval("require('@electron/remote').require('electron-settings')")

  /* Get VIP settings */

  const vipSettingsOriginal = Settings.getSync('option.vip')
  const vipSettings = JSON.parse(JSON.stringify(vipSettingsOriginal))
  if (vipSettings.multi_account) {
    delete vipSettings.multi_account.windows

    // Prevent the master password from being sent over the network
    if (vipSettings.multi_account.master_password) {
      vipSettings.multi_account.master_password = 'REDACTED'
    }

    // Prevent any encoded password from being sent
    if (vipSettings.multi_account.window && Array.isArray(vipSettings.multi_account.window)) {
      vipSettings.multi_account.window.forEach(tabs => {
        if (tabs && Array.isArray(tabs)) {
          tabs.forEach(tab => {
            if (tab.account_name_encrypted) tab.account_name_encrypted = 'REDACTED'
            if (tab.password_encrypted) tab.password_encrypted = 'REDACTED'
          })
        }
      })
    }

    // This data contains identifiable character name
    if (vipSettings.auto_group.leader) {
      vipSettings.auto_group.leader = 'REDACTED'
    }

    // This data contains identifiable characters names
    if (vipSettings.auto_group.members) {
      vipSettings.auto_group.members = 'REDACTED'
    }
  }

  vipSettings.hidden_shop = Settings.getSync('option.general.hidden_shop')

  /* Approximate unique ID */

  const macAddress = Settings.getSync('macAddress')
  const macAddressHash = cyrb53(macAddress, 7200084)

  /* Send to server once logged in */

  window.connectionManager.once('IdentificationSuccessMessage', (msg) => {
    const body = {
      mac_address_hash: macAddressHash,
      account_id_hash: cyrb53('' + msg.accountId, 97333452),
      vip_settings: vipSettings
    }
    fetch('https://api.lindo-app.com/stats.php', {
      method: 'post',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    })
  })
})();

/* Popups */

(function () {

  /**
   * @param {Record<string, { title: string, messages: string[] }>} texts
   * @param {{ url: string, text: string }} link
   */
  async function sendPopup (texts, link) {
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

    const translatedTexts = texts[window.Config.language] || texts['en'] || texts[Object.keys(texts)[0]];

    window.gui.openSimplePopup(`
      <div>
        ${translatedTexts.messages.join('<br />')}<br />
        <a target="_blank" href="${link.url}" style="text-align: center; font-size: 1.2em; display: inline-block; width: 100%; margin-top: 0.4em; text-decoration: none;">
          <img src="https://lindo-app.com/icon.png" style="height: 1.2em; display: inline-block; vertical-align: middle;"/>
          <span style="vertical-align: middle;">${link.text}</span>
        </a>
      </div>
    `, translatedTexts.title);
  }

  const lastAskedMatrix = window.localStorage.getItem('lindo-matrix-popup');
  if (!lastAskedMatrix || Date.now() > parseInt(lastAskedMatrix) + 1000 * 60 * 60 * 24 * 7) { // 1 week
    window.localStorage.setItem('lindo-matrix-popup', Date.now())

    const texts = {
      fr: {
        title: `Notification de Lindo`,
        messages: [
          `Un nouveau serveur de discussion a été mis en place pour remplacer Discord ! Retrouve nous vite sur le serveur Matrix de Lindo<br />`
        ]
      },
      en: {
        title: `Notification from Lindo`,
        messages: [
          `A new chat server has been set up to replace Discord! Find us quickly on Lindo's Matrix server.<br />`
        ]
      },
      es: {
        title: `Notificación de Lindo`,
        messages: [
          `¡Se ha configurado un nuevo servidor de chat para reemplazar a Discord! Encuéntrenos rápidamente en el servidor Matrix de Lindo.<br /> `
        ]
      }
    }

    const link = {
      url: 'https://matrix.to/#/#lindo-official:matrix.org',
      text: 'Matrix Lindo'
    }

    sendPopup(texts, link)
    return
  }
})();

const showV3Update = async ()  => {
  const lastAskedv3 = window.localStorage.getItem('lindo-v3');
  if (!lastAskedv3 || Date.now() > parseInt(lastAskedMatrix) + 1000 * 60 * 60 * 24 * 7) { // 1 week
    window.localStorage.setItem('lindo-v3', Date.now())

    const texts = {
      fr: {
        title: `Notification de Lindo`,
        messages: [
          `La V2 de Lindo ne sera bientôt plus supporté par l'équipe, téléchargez la nouvelle version de Lindo sur GitHub<br />`
        ]
      },
      en: {
        title: `Notification from Lindo`,
        messages: [
          `Lindo V2 will soon no longer be supported by the team, download the new version of Lindo on GitHub.<br />`
        ]
      },
      es: {
        title: `Notificación de Lindo`,
        messages: [
          `Lindo V2 pronto dejará de ser compatible con el equipo, descargue la nueva versión de Lindo en GitHub.<br /> `
        ]
      }
    }

    const link = {
      url: 'https://github.com/prixe/lindo/releases/latest',
      text: 'GitHub Lindo'
    }

    await sendPopup(texts, link)
    return
  }
} 