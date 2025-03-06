import { get } from "lodash";

import inject from "./contentScript/injectToDom";
import { IEventMessage } from "./interface/message";
import { IDynamicURLMap, ILog } from "./interface/mock";
import messageService from "./services/message";
import { getStore } from "./panel/App/service/storeActions";

const init = () => {
  let store, urlMap, dynamicUrlMap: IDynamicURLMap;
  
  try {
    getStore().then((a) => {
      store = a.store;
      urlMap = a.urlMap;
      dynamicUrlMap = a.dynamicUrlMap;
    }).catch(error => {
      console.warn("MOKKU: Error getting store", error);
    });

    const getMockPath = (url: string, method: string) => {
      try {
        // this will moved to store.ts
        if (urlMap[url]) {
          if (urlMap[url][method]) {
            return urlMap[url][method];
          }
        }

        const url1 = url.replace("://", "-");
        const key = url1.split("/").length;
        // match all dynamics route
        const stack = dynamicUrlMap[key];
        if (!stack) return [];

        let i = 0;
        while (i < stack.length) {
          // there is more to it will be used when
          // action are introduced
          const s = stack[i];
          if (s.method === method && !!s.match(url1)) {
            return [s.getterKey];
          }
          i++;
        }

        return [];
      } catch (error) {
        console.warn("MOKKU: Error in getMockPath", error);
        return [];
      }
    };

    const updateStore = () => {
      try {
        getStore().then((x) => {
          store = x.store;
          urlMap = x.urlMap;
          dynamicUrlMap = x.dynamicUrlMap;
        }).catch(error => {
          console.warn("MOKKU: Error updating store", error);
        });
      } catch (error) {
        console.warn("MOKKU: Error in updateStore", error);
      }
    };

    const getActiveMockWithPath = (paths: string[]) => {
      try {
        let mock = null;
        let path = null;
        paths.some((tempPath) => {
          const tempMock = get(store, tempPath, null);
          if (tempMock && tempMock.active) {
            mock = tempMock;
            path = tempPath;
            return true;
          }
          return false;
        });

        if (mock) {
          return { mock, path };
        }
        return { mock: null, path: null };
      } catch (error) {
        console.warn("MOKKU: Error in getActiveMockWithPath", error);
        return { mock: null, path: null };
      }
    };

    messageService.listen("CONTENT", (data: IEventMessage) => {
      try {
        if (data.type === "LOG") {
          const message = data.message as ILog;
          const mockPaths = getMockPath(
            message.request.url,
            message.request.method,
          );
          const { mock, path } = getActiveMockWithPath(mockPaths);

          if (mock) {
            message.isMocked = mock.active;
            message.mockPath = path;
          }

          messageService.send({
            message,
            type: "LOG",
            from: "CONTENT",
            to: "PANEL",
          });
          return;
        }

        if (data.type === "NOTIFICATION" && data.message === "UPDATE_STORE") {
          updateStore();
          return;
        }

        const response: Omit<IEventMessage, "type"> = {
          id: data.id,
          from: "CONTENT",
          to: "HOOK",
          extensionName: "MOKKU",
          message: {},
        };

        const request = (data.message as ILog).request;
        const mockPaths = getMockPath(request.url, request.method);
        const { mock } = getActiveMockWithPath(mockPaths);

        if (mock && mock.active) {
          (response.message as ILog).mockResponse = mock;
        }

        messageService.send(response);
      } catch (error) {
        console.warn("MOKKU: Error handling message in content script", error);
      }
    });
  } catch (error) {
    console.warn("MOKKU: Error initializing content script", error);
  }
};

try {
  const host = location.host;
  const isLocalhost = location.href.includes("http://localhost");

  chrome.storage.local.get([`mokku.extension.active.${host}`], function (result) {
    try {
      let active = result[`mokku.extension.active.${host}`];
      if (isLocalhost && active === undefined) {
        active = true;
      }
      if (active) {
        // injects script to page's DOM
        inject();
        init();
      }
      // tell the panel about the new injection (host might have changed)
      messageService.send({
        message: host,
        type: "INIT",
        from: "CONTENT",
        to: "PANEL",
      });
    } catch (error) {
      console.warn("MOKKU: Error in storage callback", error);
    }
  });
} catch (error) {
  console.warn("MOKKU: Error in content script initialization", error);
}
