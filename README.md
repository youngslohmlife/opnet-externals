# opnet-externals

AssemblyScript transform to enable `@public` decorator for class methods. Class methods decorated with `@public` function similar to public/external functions in Solidity, where they can be called by an external contract or EOA wallet.

Each method decorated with @public in a class will be included in a catch-all `callMethod(selector: Selector, calldata: Calldata): BytesWriter` which is generated for the class.

Inheritance will work properly with classes which are extended from classes which include a @public modifier, via a call to `super.callMethod(selector, calldata)`.

## Installation

```sh
yarn add https://github.com/youngslohmlife/opnet-externals
```

## Usage

```js
import { u256 } from "as-bignum/assembly";
import { public } from "opnet-externals";
import {
  StorageValue,
  StorageLayout
} from "opnet-storage/assembly";

class MyContract extends OP_NET {
  public n: StorageValue<u256>
  constructor() {
    const layout = new StorageLayout();
    this.n = StorageValue.at<u256>(StorageSlot.at(layout.next()));
  }
  @public
  increaseValueBy(value: u256): u256 {
    this.n.set(this.n.load().value + value);
    return this.n.value;
  }
}
```

## Author

FREEJEFFREY

## License

MIT
