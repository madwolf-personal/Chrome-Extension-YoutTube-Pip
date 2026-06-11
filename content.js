(async function () {
  if (window.__YT_PIP_WINDOW__) {
    window.__YT_PIP_WINDOW__.close();
    return;
  }

  if (!("documentPictureInPicture" in window)) {
    alert("Document PiP is not supported in this browser.");
    return;
  }

  const player = document.querySelector(".html5-video-player");
  if (!player) {
    alert("YouTube player not found");
    return;
  }

  const originalParent = player.parentElement;

  try {
    const pipWindow = await window.documentPictureInPicture.requestWindow({
      width: 480,
      height: 270,
    });

    window.__YT_PIP_WINDOW__ = pipWindow;

    [...document.styleSheets].forEach((styleSheet) => {
      try {
        const cssRules = [...styleSheet.cssRules].map((rule) => rule.cssText).join('');
        const style = document.createElement('style');
        style.textContent = cssRules;
        pipWindow.document.head.appendChild(style);
      } catch (e) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = styleSheet.href;
        pipWindow.document.head.appendChild(link);
      }
    });

    pipWindow.document.body.style.margin = "0";
    pipWindow.document.body.style.overflow = "hidden";
    pipWindow.document.body.style.backgroundColor = "black";

    pipWindow.document.body.appendChild(player);

    player.style.width = "100vw";
    player.style.height = "100vh";
    window.dispatchEvent(new Event("resize"));

    pipWindow.addEventListener("resize", () => {
      player.style.width = pipWindow.innerWidth + "px";
      player.style.height = pipWindow.innerHeight + "px";
      window.dispatchEvent(new Event("resize"));
    });

    const forwardMouseEvent = (e) => {
      document.dispatchEvent(new MouseEvent(e.type, e));
    };
    pipWindow.document.addEventListener("mousedown", forwardMouseEvent);
    pipWindow.document.addEventListener("mousemove", forwardMouseEvent);
    pipWindow.document.addEventListener("mouseup", forwardMouseEvent);

    pipWindow.addEventListener("pagehide", () => {
      originalParent.appendChild(player);
      player.style.width = "100%";
      player.style.height = "100%";
      window.__YT_PIP_WINDOW__ = null;
      window.dispatchEvent(new Event("resize"));
    });

  } catch (err) {
    console.error("PiP Error:", err);
  }
})();