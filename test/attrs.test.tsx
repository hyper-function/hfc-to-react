/// <reference types="vitest/globals" />
import React from "react";
import { render } from "@testing-library/react";
import hfcToReact from "../src";

const DemoHFC: HyperFunctionComponent = function (container, initProps) {
  return {
    methods: {},
    changed() {},
    disconnected() {},
  };
};
DemoHFC.hfc = "demo-hfc";
DemoHFC.ver = "1.0.0";
DemoHFC.tag = "strong";
DemoHFC.names = [[], [], [], []];

test("should respect attrs", () => {
  const DemoHFC: HyperFunctionComponent = function (container, initProps) {
    function render(ps: HfcProps) {
      container.innerHTML = `a: ${ps.attrs.a} b: ${ps.attrs.b[0]} c: ${ps.attrs.c.d}`;
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
  DemoHFC.names = [["a", "b", "c"], [], [], []];

  const HFC = hfcToReact(DemoHFC);

  let a = 1;
  let b = [2];
  let c = { d: 3 };
  const result = render(<HFC id="a1" className="a b" style={{color: 'red'}} a={a} b={b} c={c} />);
  expect(result.container.innerHTML).include(`id="a1"`)
  expect(result.container.innerHTML).include(`class="a b"`)
  expect(result.container.innerHTML).include(`hfc="demo-hfc"`)
  expect(result.container.innerHTML).include(`style="color: red;"`)
  result.getByText("a: 1 b: 2 c: 3");

  b[0] = 3;
  c.d = 4;
  result.rerender(<HFC a={a} b={b} c={c} />);
  result.getByText("a: 1 b: 3 c: 4");
});
