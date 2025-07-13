/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import './index.css';

import ReactDOM from 'react-dom/client';
import Home from './Home';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element not found');

const root = ReactDOM.createRoot(rootElement);
root.render(<Home />);
