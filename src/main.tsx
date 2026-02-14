import * as ReactDOM from 'react-dom/client';
import '@radix-ui/themes/styles.css';
import './index.css';
import App from './App';

// @ts-ignore
Number.prototype.mod = function (n) {
  "use strict";
  // @ts-ignore
  return ((this % n) + n) % n;
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <>
    <App />
  </>,
);
