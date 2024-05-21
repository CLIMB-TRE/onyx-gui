import React from 'react';
import { ReactWidget } from '@jupyterlab/apputils'
//import App from '../../react-prototype/src/App'
import Onyx from "climb-onyx-ui"
import "climb-onyx-ui/dist/style.css";


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
      <Onyx domain={this.domain} token={this.token}/>
    )
  }
  
}
