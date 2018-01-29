import React from 'react';
import ReactDOM from 'react-dom';
import './vendor/mdl/mdl-theme.css';
import './vendor/mdl/mdl.js';
import App from './scripts/App';
import registerServiceWorker from './registerServiceWorker';

ReactDOM.render(<App />, document.getElementById('root'));
registerServiceWorker();
