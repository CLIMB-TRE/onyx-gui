import React from 'react'
import { ReactWidget } from '@jupyterlab/apputils'
//import App from '../../react-prototype/src/App'
import { EXTENSION_CSS_CLASSNAME } from './enums'


function MyComponent() {
  return <div>Onyx Extension</div>;
}

export class ReactAppWidget extends ReactWidget {
  constructor() {
    super()
    this.addClass(EXTENSION_CSS_CLASSNAME)
  }

  render(): JSX.Element {
    return (
        <MyComponent />
    )
  }
}
