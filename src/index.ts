import React, {
  useRef,
  useState,
  Fragment,
  ReactNode,
  useEffect,
  createElement,
  FunctionComponent,
  MutableRefObject,
} from "react";
import { createPortal } from "react-dom";
import type { HyperFunctionComponent } from "hyper-function-component";

let uuid = 0;
type SlotPortals = Map<
  Element,
  {
    key: string;
    name: string;
    nodes: ReactNode;
  }
>;

function useIsFirstRender(): boolean {
  const isFirst = useRef(true);

  if (isFirst.current) {
    isFirst.current = false;

    return true;
  }
  return false;
}

function PortalRender(props: {
  forceUpdate: { current: () => void };
  portals: SlotPortals;
}) {
  const [, update] = useState(0);
  props.forceUpdate.current = () => update((n) => n + 1);

  return createElement(
    Fragment,
    null,
    Array.from(props.portals).map(([target, { nodes, key }]) =>
      createPortal(nodes, target, key)
    )
  );
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

    let forceUpdateSlots = useRef(() => {});
    const slotPortals = useRef<SlotPortals | null>(null);

    if (slotPortals.current === null) {
      slotPortals.current = new Map();
    }

    const slotCache = useRef<Record<string, any> | null>(null);
    if (slotCache.current === null) {
      slotCache.current = {};
    }

    for (let name in props) {
      if (attrNames.has(name)) {
        attrs[name] = props[name];
        continue;
      }

      if (eventNames.has(name)) {
        events[name] = props[name];
        continue;
      }

      if (slotNames.has(name) || name === "children") {
        let nodes = props[name];
        if (name === "children") name = "default";

        if (
          slotCache.current[name] &&
          slotCache.current[name].origin === nodes
        ) {
          slots[name] = slotCache.current[name].transformed;
          continue;
        }

        const isCompoent = typeof nodes === "function";

        slots[name] = (container: Element, args?: Record<string, any>) => {
          if (!args) {
            slotPortals.current!.delete(container);
          } else {
            slotPortals.current!.set(container, {
              name,
              key: "k" + uuid++,
              nodes: isCompoent
                ? createElement(nodes as FunctionComponent, args)
                : (nodes as ReactNode),
            });
          }

          forceUpdateSlots.current();
        };

        slotCache.current[name] = {
          origin: nodes,
          transformed: slots[name],
        };
        continue;
      }

      _[name] = props[name];
    }

    const hfc = useRef<ReturnType<HyperFunctionComponent> | null>(null);
    if (hfc.current === null) {
      hfc.current = HFC({
        attrs,
        events,
        slots,
        _,
      });
    }

    useEffect(() => {
      const container = ref.current!;

      container!.setAttribute("hfc", HFC.hfc);
      (container as any).hfc = hfc.current;
      (container as any).HFC = HFC;

      hfc.current!.connected(container!);
      return () => hfc.current!.disconnected();
    }, []);

    useEffect(() => {
      if (isFirst) return;

      hfc.current!.changed({ attrs, events, slots, _ });
    });

    return createElement(
      HFC.tag,
      { ref, ..._ },
      createElement(PortalRender, {
        forceUpdate: forceUpdateSlots,
        portals: slotPortals.current,
      })
    );
  });
}
