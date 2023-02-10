/// <reference types="vitest/globals" />
import React, { createElement, ReactNode, useCallback, useRef } from "react";
import { act, render } from "@testing-library/react";
import type {
  HfcSlotOptions,
  HyperFunctionComponent,
} from "hyper-function-component";
import hfcToReact from "../src";

test("should render node slots", async () => {
  const DemoHFC: HyperFunctionComponent = function (initProps) {
    let target: Element;
    let defaultContainer = document.createElement("h2");
    let nodeSlotContainer = document.createElement("h3");

    let p = initProps;

    let defaultSlot: HfcSlotOptions;
    let nodeSlot: HfcSlotOptions;

    return {
      methods: {},
      connected(container) {
        target = container;
        target.appendChild(document.createTextNode("hello world"));

        target.append(defaultContainer);
        target.append(nodeSlotContainer);

        defaultSlot = {
          target: defaultContainer,
          args: {},
        };

        nodeSlot = {
          target: nodeSlotContainer,
          args: {},
        };

        p.slots!.default(defaultSlot);
        p.slots!.nodeSlot(nodeSlot);
      },
      changed(props) {
        p = props;

        defaultSlot.removed?.();
        defaultSlot = {
          target: defaultContainer,
          args: {},
        };
        props.slots!.default(defaultSlot);

        nodeSlot.removed?.();
        nodeSlot = {
          target: nodeSlotContainer,
          args: {},
        };

        props.slots!.nodeSlot(nodeSlot);
        // defaultSlot.changed?.();
        // nodeSlot.changed?.();
      },
      disconnected() {},
    };
  };

  DemoHFC.hfc = "demo-hfc";
  DemoHFC.ver = "1.0.0";
  DemoHFC.tag = "strong";
  DemoHFC.names = [[], [], ["nodeSlot", "c"], []];

  let updateText = () => {};

  const HFC = hfcToReact(DemoHFC);
  const ret = render(
    createElement(function () {
      const [text, setText] = React.useState("aa");
      updateText = () => setText("bb");

      // const c = useCallback(() => {
      //   return <h1>cc</h1>;
      // }, []);

      const c = useRef<ReactNode | null>(null);
      if (c.current === null) {
        c.current = <h1>cc</h1>;
      }

      return (
        <HFC nodeSlot={() => <p>node slot {text}</p>} c={c}>
          default {text}
          <span>span {text}</span>
        </HFC>
      );
    })
  );

  ret.getByText("node slot aa");
  ret.getByText("default aa");
  ret.getByText("span aa");

  act(() => {
    updateText();
  });

  ret.getByText("node slot bb");
  ret.getByText("default bb");
  ret.getByText("span bb");
});

test("should render comp slot with props", () => {
  const DemoHFC: HyperFunctionComponent = function (initProps) {
    let target: Element;
    let compSlotContainer = document.createElement("h3");

    let p = initProps;

    let count = 0;
    let compSlot: HfcSlotOptions;

    return {
      methods: {},
      connected(container) {
        target = container;
        target.append(compSlotContainer);

        compSlot = {
          target: compSlotContainer,
          args: { count: ++count },
        };

        p.slots!.compSlot(compSlot);
      },
      changed(props) {
        p = props;
        compSlot.removed?.();
        compSlot = {
          target: compSlotContainer,
          args: { count: ++count },
        };
        props.slots!.compSlot(compSlot);
      },
      disconnected() {},
    };
  };

  DemoHFC.hfc = "demo-hfc";
  DemoHFC.ver = "1.0.0";
  DemoHFC.tag = "strong";
  DemoHFC.names = [[], [], ["compSlot"], []];

  const HFC = hfcToReact(DemoHFC);
  const { getByText, rerender } = render(
    <HFC compSlot={(args) => <p>comp slot {args.count}</p>}></HFC>
  );
  getByText("comp slot 1");

  rerender(
    <HFC compSlot={(args) => <p>rerendered comp slot {args.count}</p>}></HFC>
  );
  getByText("rerendered comp slot 2");

  // update slot with different props
  rerender(
    <HFC compSlot={(args) => <p>rerendered comp slot {args.count}</p>}></HFC>
  );
  getByText("rerendered comp slot 3");
});

test("should not rerender slot when slot not change", () => {
  const DemoHFC: HyperFunctionComponent = function (initProps) {
    return {
      methods: {},
      connected(container) {},
      changed(props) {
        expect(props.slots!.compSlot).toBe(initProps.slots!.compSlot);
        expect(props.slots!.nodeSlot).toBe(initProps.slots!.nodeSlot);
      },
      disconnected() {},
    };
  };

  DemoHFC.hfc = "demo-hfc";
  DemoHFC.ver = "1.0.0";
  DemoHFC.tag = "strong";
  DemoHFC.names = [[], [], ["compSlot", "nodeSlot"], []];

  function CompSlot() {
    return <p>comp slot</p>;
  }

  const NodeSlot = <h1>node slot</h1>;

  const HFC = hfcToReact(DemoHFC);
  const { rerender } = render(
    <HFC compSlot={CompSlot} nodeSlot={NodeSlot}></HFC>
  );
  rerender(<HFC compSlot={CompSlot} nodeSlot={NodeSlot}></HFC>);
});
