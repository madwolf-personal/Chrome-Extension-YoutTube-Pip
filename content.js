(async function () {
  if (window.__YT_PIP_WINDOW__) {
    window.__YT_PIP_WINDOW__.close();
    return;
  }

  if (!("documentPictureInPicture" in window)) {
    alert("Document PiP is not supported in this browser.");
    return;
  }

  // --- GATEKEEPER CHECK ---
  // Ensure we are actually on a video page before grabbing the player
  if (!window.location.pathname.includes("/watch") && !window.location.pathname.includes("/shorts")) {
    console.log("Not on a video page. PiP aborted.");
    return; // Stops the script completely
  }
  // ----------------------------

  const player = document.querySelector(".html5-video-player");
  if (!player) {
    alert("YouTube player not found");
    return;
  }

  const originalParent = player.parentElement;

  // Attempt to open the PiP window and move the player. 
  // Catch and log any browser security or permission errors if the request fails.

  try {
    const pipWindow = await window.documentPictureInPicture.requestWindow({
      width: 480,
      height: 270,
    });

    window.__YT_PIP_WINDOW__ = pipWindow;

    // --- Custom Title Overlay ---
    const titleOverlay = document.createElement("div");
    titleOverlay.style.position = "absolute";
    titleOverlay.style.top = "0";
    titleOverlay.style.left = "0";
    titleOverlay.style.width = "100%";
    titleOverlay.style.padding = "15px 20px";
    titleOverlay.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
    titleOverlay.style.color = "white";
    titleOverlay.style.fontFamily = '"YouTube Noto", Roboto, Arial, sans-serif';
    titleOverlay.style.fontSize = "14px";
    titleOverlay.style.fontWeight = "500";
    titleOverlay.style.zIndex = "9999";
    titleOverlay.style.pointerEvents = "none";
    titleOverlay.style.whiteSpace = "nowrap";
    titleOverlay.style.overflow = "hidden";
    titleOverlay.style.textOverflow = "ellipsis";
    titleOverlay.style.boxSizing = "border-box";
    titleOverlay.style.transition = "opacity 0.3s ease-in-out";
    
    // Start completely hidden
    titleOverlay.style.opacity = "0"; 

    // --- Idle Timer Logic ---
    let idleTimer;

    const showTitleAndStartTimer = () => {
      titleOverlay.style.opacity = "1"; 
      
      clearTimeout(idleTimer); 
      
      idleTimer = setTimeout(() => {
        titleOverlay.style.opacity = "0";
      }, 3000); 
    };
    // ------------------------

    // Function to update title
    const updateTitle = () => {
      titleOverlay.innerText = document.title.replace(" - YouTube", "");
      showTitleAndStartTimer(); // Triggers the 3-second fade when video changes
    };

    const titleObserver = new MutationObserver(updateTitle);
    const titleElement = document.querySelector('title');
    if (titleElement) {
      titleObserver.observe(titleElement, { childList: true });
    }

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
    pipWindow.document.body.style.position = "relative"; 

    pipWindow.document.body.appendChild(player);
    pipWindow.document.body.appendChild(titleOverlay); 

    updateTitle(); // Initial title setup

    // Trigger whenever the mouse moves inside the window
    pipWindow.document.body.addEventListener("mousemove", showTitleAndStartTimer);

    // Hide immediately if the cursor leaves the window entirely
    pipWindow.document.body.addEventListener("mouseleave", () => {
      clearTimeout(idleTimer);
      titleOverlay.style.opacity = "0";
    });

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

// --- Navigation & Cleanup Logic ---

    // 1. Define the function to close the PiP window
    const onNavigate = (event) => {
      // YouTube passes the destination path inside the event details
      const destinationUrl = event.detail?.url || "";

      // Only kill the PiP if the destination is NOT another video
      if (!destinationUrl.includes("/watch") && !destinationUrl.includes("/shorts")) {
        pipWindow.close(); // Closing the window automatically triggers the 'pagehide' event below
      }
    };

    // 2. Listen for YouTube's internal navigation event
    window.addEventListener("yt-navigate-start", onNavigate);

    // 3. The master cleanup event (triggers when PiP is closed manually OR via navigation)
    pipWindow.addEventListener("pagehide", () => {
      // Remove the navigation listener so it doesn't stack up
      window.removeEventListener("yt-navigate-start", onNavigate);
      
      // Safely put the player back before YouTube destroys the original parent
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