import React, {
  useRef,
  useState,
  ReactNode,
  useEffect,
  createElement,
  FunctionComponent,
  ReactPortal,
  MutableRefObject,
} from "react";
import { createPortal } from "react-dom";

function useIsFirstRender(): boolean {
  const isFirst = useRef(true);

  if (isFirst.current) {
    isFirst.current = false;

    return true;
  }
  return false;
}

export default function hfcToReact(HFC: HyperFunctionComponent) {
  const attrNames = new Set(HFC.names[0]);
  const eventNames = new Set(HFC.names[1]);
  const slotNames = new Set(HFC.names[2]);

  return React.forwardRef<Element, any>(function (props, _ref) {
    const __ref = useRef(null);
    const ref = (_ref ?? __ref) as MutableRefObject<HTMLElement | null>;

    const isFirst = useIsFirstRender();
    const attrs: Record<string, any> = {};
    const events: Record<string, any> = {};
    const slots: Record<string, any> = {};
    const _: Record<string, any> = {};

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

    const hfc = useRef<ReturnType<HyperFunctionComponent> | undefined>();
    useEffect(() => {
      const container = ref.current!;

      hfc.current = HFC(container, {
        attrs,
        events,
        slots,
        _,
      });

      container!.setAttribute("hfc", HFC.hfc);
      (container as any).hfc = hfc.current;
      (container as any).HFC = HFC;

      return () => hfc.current!.disconnected();
    }, []);

    useEffect(() => {
      if (isFirst) return;

      hfc.current!.changed({ attrs, events, slots, _ });
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

      _[key] = props[key];
    }

    const portalNodes: ReactPortal[] = [];
    for (let i = 0; i < portals.length; i++) {
      const item = portals[i];
      portalNodes.push(
        createPortal(
          item.isCompoent
            ? createElement(item.nodes as FunctionComponent, item.args)
            : (item.nodes as ReactNode),

          item.container,
          item.key
        )
      );
    }

    return createElement(HFC.tag, { ref, ..._ }, portalNodes);
  });
}
