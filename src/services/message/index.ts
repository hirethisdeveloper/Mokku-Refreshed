import { IEventMessage } from "../../interface/message";
/**
 *
 * Inject
 *     -> Content Script
 *
 * Content script is bridge between panel and inject for communication
 * as it has both windows event listern and chrome runtime message listner
 * Content Script
 *     -> Panel
 *     -> Hook
 *
 * Panel
 *     -> Content Script
 */

const tunnelMap = {
  "HOOK:CONTENT": "window",
  "CONTENT:HOOK": "window",
  "CONTENT:PANEL": "tab",
  "PANEL:CONTENT": "runtime",
};

type ISendProps = Omit<IEventMessage, "extensionName">;

const send = (props: ISendProps, tabId?: number) => {
  const path = tunnelMap[`${props.to}:${props.from}`];
  const service = {
    window: () => {
      try {
        window.postMessage(
          {
            ...props,
            extensionName: "MOKKU",
          },
          "*"
        );
      } catch (error) {
        console.warn("MOKKU: Error posting message to window", error);
        // If the extension context is invalidated, we can't do much but prevent crashing
        if (error.message && error.message.includes("Extension context invalidated")) {
          console.warn("MOKKU: Extension context invalidated. The extension may need to be reloaded.");
        }
      }
    },
    runtime: () => {
      try {
        chrome.runtime.sendMessage({
          ...props,
          extensionName: "MOKKU",
        });
      } catch (error) {
        console.warn("MOKKU: Error sending runtime message", error);
        // Handle extension context invalidated error
        if (error.message && error.message.includes("Extension context invalidated")) {
          console.warn("MOKKU: Extension context invalidated. The extension may need to be reloaded.");
        }
      }
    },
    tab: () => {
      try {
        chrome.tabs.sendMessage(tabId, props);
      } catch (error) {
        console.warn("MOKKU: Error sending tab message", error);
        // Handle extension context invalidated error
        if (error.message && error.message.includes("Extension context invalidated")) {
          console.warn("MOKKU: Extension context invalidated. The extension may need to be reloaded.");
        }
      }
    },
  };

  try {
    service[path](props);
  } catch (error) {
    console.warn(`MOKKU: Error in message service for path ${path}`, error);
  }
};

const listen = (
  entity: IEventMessage["from"],
  callback: (props: IEventMessage, sender?: any, sendResponse?: any) => void,
) => {
  const service = {
    runtime: () => {
      chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
        try {
          if (message.to !== entity) return;
          callback(message, _sender, sendResponse);
        } catch (error) {
          console.warn("MOKKU: Error handling runtime message", error);
        }
      });
    },
    window: () => {
      window.addEventListener("message", (event) => {
        try {
          // We only accept messages from ourselves
          if (event.source !== window) return;
          const data: IEventMessage = event.data;
          if (data.to !== entity) return;

          callback(data);
        } catch (error) {
          console.warn("MOKKU: Error handling window message", error);
        }
      });
    },
  };

  try {
    switch (entity) {
      case "HOOK": {
        service["window"]();
        return;
      }
      case "CONTENT": {
        service["window"]();
        service["runtime"]();
        return;
      }
      case "PANEL": {
        service["runtime"]();
        return;
      }
    }
  } catch (error) {
    console.warn(`MOKKU: Error setting up listeners for entity ${entity}`, error);
  }
};

export default { send, listen };
