/// <reference types="vitest/globals" />
import React from "react";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import hfcToReact from "../src";

test("should render node slots", () => {
  const DemoHFC: HyperFunctionComponent = function (container, initProps) {
    let nodeSlotContainer: HTMLDivElement | undefined;

    function render({ slots }: HfcProps) {
      if (slots.nodeSlot) {
        if (!nodeSlotContainer) {
          nodeSlotContainer = document.createElement("div");
          container.append(nodeSlotContainer);
        }

        slots.nodeSlot(nodeSlotContainer);
      } else {
        if (nodeSlotContainer) {
          nodeSlotContainer.remove();
          nodeSlotContainer = undefined;
        }
      }
    }

    render(initProps);
    return {
      methods: {},
      changed(props) {
        render(props);
      },
      disconnected() {},
    };
  };

  DemoHFC.hfc = "demo-hfc";
  DemoHFC.ver = "1.0.0";
  DemoHFC.tag = "strong";
  DemoHFC.names = [[], [], ["nodeSlot"], []];

  const HFC = hfcToReact(DemoHFC);
  const { getByText, rerender } = render(
    <HFC nodeSlot={<p>node slot</p>}></HFC>
  );
  getByText("node slot");

  rerender(<HFC nodeSlot={<p>rerendered node slot</p>}></HFC>);
  getByText("rerendered node slot");
});

test("should render comp slots", () => {
  const DemoHFC: HyperFunctionComponent = function (container, initProps) {
    let compSlotContainer: HTMLDivElement | undefined;

    function render({ slots }: HfcProps) {
      if (slots.compSlot) {
        if (!compSlotContainer) {
          compSlotContainer = document.createElement("div");
          container.append(compSlotContainer);
        }

        slots.compSlot(compSlotContainer);
      } else {
        if (compSlotContainer) {
          compSlotContainer.remove();
          compSlotContainer = undefined;
        }
      }
    }

    render(initProps);
    return {
      methods: {},
      changed(props) {
        render(props);
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
    <HFC compSlot={() => <p>comp slot</p>}></HFC>
  );
  getByText("comp slot");

  rerender(<HFC compSlot={() => <p>rerendered comp slot</p>}></HFC>);
  getByText("rerendered comp slot");
});

test("should render children slots", () => {
  const DemoHFC: HyperFunctionComponent = function (container, initProps) {
    let defaultContainer: HTMLDivElement | undefined;

    function render({ slots }: HfcProps) {
      if (slots.default) {
        if (!defaultContainer) {
          defaultContainer = document.createElement("div");
          container.append(defaultContainer);
        }

        slots.default(defaultContainer);
      } else {
        if (defaultContainer) {
          defaultContainer.remove();
          defaultContainer = undefined;
        }
      }
    }

    render(initProps);
    return {
      methods: {},
      changed(props) {
        render(props);
      },
      disconnected() {},
    };
  };

  DemoHFC.hfc = "demo-hfc";
  DemoHFC.ver = "1.0.0";
  DemoHFC.tag = "strong";
  DemoHFC.names = [[], [], ["default"], []];

  const HFC = hfcToReact(DemoHFC);
  const result = render(
    <HFC>
      <p>default slot</p>
    </HFC>
  );
  result.getByText("default slot");

  result.rerender(
    <HFC>
      <p>rerendered defalut slot</p>
    </HFC>
  );
  result.getByText("rerendered defalut slot");

  // chileren array
  const result1 = render(
    <HFC>
      <p>default slot</p>
      <p>default two slot</p>
    </HFC>
  );
  result1.getByText("default slot");
  result1.getByText("default two slot");

  result1.rerender(
    <HFC>
      <p>rerendered one defalut slot</p>
      <p>rerendered two defalut slot</p>
    </HFC>
  );
  result1.getByText("rerendered one defalut slot");
  result1.getByText("rerendered two defalut slot");

  // component children
  const result2 = render(<HFC>{() => <p>default comp slot</p>}</HFC>);
  result2.getByText("default comp slot");

  result2.rerender(<HFC>{() => <p>rerendered comp defalut slot</p>}</HFC>);
  result2.getByText("rerendered comp defalut slot");
});

test("should render comp slot with props", () => {
  const DemoHFC: HyperFunctionComponent = function (container, initProps) {
    let compSlotContainer: HTMLDivElement | undefined;

    let count = 0;
    function render({ slots }: HfcProps) {
      if (slots.compSlot) {
        if (!compSlotContainer) {
          compSlotContainer = document.createElement("div");
          container.append(compSlotContainer);
        }

        slots.compSlot(compSlotContainer, { count: ++count });
      } else {
        if (compSlotContainer) {
          compSlotContainer.remove();
          compSlotContainer = undefined;
        }
      }
    }

    render(initProps);
    return {
      methods: {},
      changed(props) {
        render(props);
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
