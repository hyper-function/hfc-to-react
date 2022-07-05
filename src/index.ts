import {
  createElement,
  Fragment,
  ReactPortal,
  useEffect,
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
  const propTypes = HFC.propTypes || {};
  const attrTypes = propTypes.attrs || {};
  const eventTypes = propTypes.events || {};
  const slotTypes = propTypes.slots || {};

  return function (props: any) {
    const isFirst = useIsFirstRender();
    const attrs = useRef<Record<string, any>>({});
    const events = useRef<Record<string, any>>({});
    const slots = useRef<Record<string, any>>({});
    const originalSlots = useRef<Record<string, any>>({});
    const others = useRef<Record<string, any>>({});

    const container = useRef<HTMLElement | null>(null);
    const [portals, setPortals] = useState<ReactPortal[]>([]);

    const hfc = useRef<HyperFunctionComponent | null>(null);

    useEffect(() => {
      hfc.current!.connected(container.current!);
      return () => hfc.current!.disconnected?.();
    }, [container]);

    const propKeys = Object.keys(props);
    for (let i = 0; i < propKeys.length; i++) {
      const key = propKeys[i];
      if (attrTypes[key]) {
        if (isFirst) {
          attrs.current[key] = props[key];
        } else {
          if (attrs.current[key] !== props[key]) {
            hfc.current!.changed?.("attr", key, attrs.current[key], props[key]);
            attrs.current[key] = props[key];
          }
        }
        continue;
      }

      if (eventTypes[key]) {
        if (isFirst) {
          events.current[key] = props[key];
        } else {
          if (events.current[key] !== props[key]) {
            hfc.current!.changed?.(
              "event",
              key,
              events.current[key],
              props[key]
            );
            events.current[key] = props[key];
          }
        }
        continue;
      }

      if (slotTypes[key]) {
        const hasChanged = originalSlots.current[key] !== props[key];
        if (isFirst || hasChanged) {
          const slotFn = (container: HTMLElement, ps: any) => {
            const instance = props[key](ps);
            const portal = createPortal(instance, container);
            portal.key = key;

            setPortals((portals) => {
              const index = portals.findIndex((item) => item.key === key);
              if (index === -1) {
                portals.push(portal);
              } else {
                portals[index] = portal;
              }

              return [...portals];
            });
          };

          if (isFirst) {
            slots.current[key] = slotFn;
            originalSlots.current[key] = props[key];
          } else {
            hfc.current!.changed?.("slot", key, slots.current[key], slotFn);
            originalSlots.current[key] = props[key];
            slots.current[key] = slotFn;
          }
        }
        continue;
      }

      // others
      if (isFirst) {
        others.current[key] = props[key];
      } else {
        if (others.current[key] !== props[key]) {
          hfc.current!.changed?.("other", key, others.current[key], props[key]);
          others.current[key] = props[key];
        }
      }
    }

    if (isFirst) {
      hfc.current = new HFC({
        attrs: attrs.current,
        events: events.current,
        slots: slots.current,
        others: others.current,
      });
    }

    return createElement(Fragment, {}, [
      createElement(HFC.tag || "div", { ref: container }),
      ...portals,
    ]);
  };
}
