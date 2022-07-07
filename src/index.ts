import {
  createElement,
  Fragment,
  ReactPortal,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

function useIsFirstRender(): boolean {
  const isFirst = useRef(true);

  if (isFirst.current) {
    isFirst.current = false;

    return true;
  }

  return isFirst.current;
}

export default function hfcToReact(HFC: typeof HyperFunctionComponent) {
  const attrNames = new Set(HFC.propNames.attrs);
  const eventNames = new Set(HFC.propNames.events);
  const slotNames = new Set(HFC.propNames.slots);

  return function (props: any) {
    const isFirst = useIsFirstRender();
    const attrs: Record<string, any> = {};
    const events: Record<string, any> = {};
    const slots: Record<string, any> = {};
    const others: Record<string, any> = {};

    const container = useRef<HTMLElement | null>(null);
    const [portals, setPortals] = useState<ReactPortal[]>([]);

    const hfc = useRef<HyperFunctionComponent | null>(null);

    useLayoutEffect(() => {
      hfc.current = new HFC(container.current!, {
        attrs,
        events,
        slots,
        others,
      });

      return () => hfc.current!.disconnected();
    }, [container]);

    useLayoutEffect(() => {
      if (!isFirst) {
        hfc.current!.changed({ attrs, events, slots, others });
      }
    }, [props]);

    const propKeys = Object.keys(props);
    for (let i = 0; i < propKeys.length; i++) {
      const key = propKeys[i];
      if (attrNames.has(key)) {
        attrs[key] = props[key];
        continue;
      }

      if (eventNames.has(key)) {
        events[key] = props[key];
        continue;
      }

      if (slotNames.has(key)) {
        slots[key] = (container: HTMLElement, ps: any) => {
          const node = props[key](ps);
          const portal = createPortal(node, container);
          portal.key = key;

          setPortals((portals) => {
            const index = portals.findIndex((item) => item.key === key);
            index === -1 ? portals.push(portal) : (portals[index] = portal);

            return [...portals];
          });
        };

        continue;
      }

      others[key] = props[key];
    }

    return createElement(Fragment, {}, [
      createElement(HFC.tag, { ref: container }),
      ...portals,
    ]);
  };
}
