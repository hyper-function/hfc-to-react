/// <reference types="vitest/globals" />
import React from "react";
import { render } from "@testing-library/react";
import hfcToReact from "../src";

test("should handle hfc events", () => {
  const DemoHFC: HyperFunctionComponent = function (container, initProps) {
    initProps.events.onClick({ count: 1 });
    return {
      methods: {},
      changed(props) {
        props.events.onClick({ count: 2 });
      },
      disconnected() {},
    };
  };

  DemoHFC.hfc = "demo-hfc";
  DemoHFC.ver = "1.0.0";
  DemoHFC.tag = "strong";
  DemoHFC.names = [[], ["onClick"], [], []];

  const HFC = hfcToReact(DemoHFC);

  let count = 0;
  const { rerender } = render(<HFC onClick={(args) => (count = args.count)} />);
  expect(count).eq(1);

  let count1 = 0;
  rerender(<HFC onClick={(args) => (count1 = args.count)} />);
  expect(count1).eq(2);
});
