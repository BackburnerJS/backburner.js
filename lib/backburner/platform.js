var GlobalContext;

/* global self */
if (typeof self === 'object') {
  GlobalContext = self;

/* global global */
} else if (typeof global === 'object') {
  GlobalContext = global;

/* global window */
} else if (typeof window === 'object') {
  GlobalContext = window;
} else {
  throw new Error('no global: `self`, `global` nor `window` was found');
}

export default GlobalContext;
