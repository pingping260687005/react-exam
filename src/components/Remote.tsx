import AAA from './AAA'
import React from 'react';
import ReactDOM from 'react-dom/client';
import reactToWebComponent from 'react-to-webcomponent';

const WebRemote = reactToWebComponent(AAA, React, ReactDOM)
customElements.define("web-remote", WebRemote)