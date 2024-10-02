import { BytesWriter as _BytesWriter } from "@btc-vision/btc-runtime/runtime/buffer/BytesWriter";
import { Blockchain } from "@btc-vision/btc-runtime/runtime/env";
import { Address as _Address } from "@btc-vision/btc-runtime/runtime/types/Address";
import { encodeSelector as _encodeSelector, Selector as _Selector } from "@btc-vision/btc-runtime/runtime/math/abi";
import { Calldata as _Calldata } from "@btc-vision/btc-runtime/runtime/universal/ABIRegistry";

export namespace public {
  export type BytesWriter = _BytesReader;
  export type Address = _Address;
  export type Calldata = _Calldata;
  export type Selector = _Selector;
  export function BytesWriter(): _BytesWriter {
    return new _BytesWriter();
  }
}

