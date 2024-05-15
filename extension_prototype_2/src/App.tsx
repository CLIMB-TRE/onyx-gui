import React from 'react'
import { ReactWidget } from '@jupyterlab/apputils'
//import App from '../../react-prototype/src/App'


function MyComponent(domain:string, token:string): React.JSX.Element {
  return <div>
    <h1>Onyx Extension</h1>
    <h2>ONYX_DOMAIN: {domain}</h2>
    <h2>ONYX_TOKEN: {token}</h2>
    </div>;
}

export class ReactAppWidget extends ReactWidget {
  constructor(dom:string, tok:string) {
    super()
    this.domain =dom
    this.token = tok
  }

  domain: string
  token: string

  render(): JSX.Element {
    return (
      MyComponent(this.domain,this.token)
    )
  }
  
}
