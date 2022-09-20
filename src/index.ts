import {
  useRef,
  useState,
  ReactNode,
  useEffect,
  createElement,
  FunctionComponent,
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

export default function hfcToReact(HFC: HyperFunctionComponent) {
  const attrNames = new Set(HFC.names[0]);
  const eventNames = new Set(HFC.names[1]);
  const slotNames = new Set(HFC.names[2]);

  return function (props: any) {
    const isFirst = useIsFirstRender();
    const attrs: Record<string, any> = {};
    const events: Record<string, any> = {};
    const slots: Record<string, any> = {};
    const others: Record<string, any> = {};

    const container = useRef<HTMLElement | null>(null);
    const [portals, setPortals] = useState<
      {
        container: Element;
        args: Record<string, any>;
        propKey: string;
        key: string;
        nodes: ReactNode | FunctionComponent;
        isCompoent: boolean;
      }[]
    >([]);

    const hfc = useRef<ReturnType<HyperFunctionComponent> | null>(null);

    useEffect(() => {
      if (hfc.current) return;
      hfc.current = HFC(container.current!, {
        attrs,
        events,
        slots,
        others,
      });

      return () => hfc.current!.disconnected();
    }, [container]);

    useEffect(() => {
      if (!isFirst) {
        hfc.current!.changed({ attrs, events, slots, others });
      }
    }, [props]);

    for (let key in props) {
      if (attrNames.has(key)) {
        attrs[key] = props[key];
        continue;
      }

      if (eventNames.has(key)) {
        events[key] = props[key];
        continue;
      }

      if (slotNames.has(key) || key === "children") {
        let nodes = props[key];

        if (key === "children") key = "default";

        const isCompoent = typeof nodes === "function";

        for (let i = 0; i < portals.length; i++) {
          if (portals[i].propKey === key) {
            portals[i].nodes = nodes;
          }
        }

        slots[key] = (container: Element, args: any) => {
          args = args || {};

          const portal = {
            container,
            args,
            propKey: key,
            key: args.key || key,
            nodes,
            isCompoent,
          };

          setPortals((portals) => {
            const index = portals.findIndex((item) => item.key === key);
            index === -1 ? portals.push(portal) : (portals[index] = portal);

            return [...portals];
          });
        };

        continue;
      }

      others[key] = props[key];
      if (key === "className") others["class"] = props[key];
    }

    return createElement(
      HFC.tag,
      { ref: container },
      portals.map((item) =>
        createPortal(
          item.isCompoent
            ? createElement(item.nodes as FunctionComponent, item.args)
            : (item.nodes as ReactNode),

          item.container,
          item.key
        )
      )
    );
  };
}
