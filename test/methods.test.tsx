/// <reference types="vitest/globals" />
import React, { createRef } from "react";
import { render } from "@testing-library/react";
import type { HyperFunctionComponent } from "hyper-function-component";
import hfcToReact from "../src";

test("should call hfc methods", () => {
  const DemoHFC: HyperFunctionComponent = function (initProps) {
    let target: Element;
    return {
      methods: {
        show(args) {
          target.innerHTML = "show: " + args!.duration;
        },
      },
      connected(container) {
        target = container;
      },
      changed() {},
      disconnected() {},
    };
  };

  DemoHFC.hfc = "demo-hfc";
  DemoHFC.ver = "1.0.0";
  DemoHFC.tag = "strong";
  DemoHFC.names = [[], [], [], ["show"]];

  const HFC = hfcToReact(DemoHFC);

  const ref = createRef<any>();
  const { getByText } = render(<HFC ref={ref} />);
  ref.current!.hfc.methods.show({ duration: 6 });
  getByText("show: 6");
});
