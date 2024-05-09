import { JupyterFrontEndPlugin, ILayoutRestorer } from '@jupyterlab/application'
import { ICommandPalette } from '@jupyterlab/apputils'
import { ILauncher } from '@jupyterlab/launcher'
import { activate } from './activate'

const extension: JupyterFrontEndPlugin<void> = {
  id: 'jl-extension-env',
  autoStart: true,
  requires: [ICommandPalette, ILayoutRestorer, ILauncher],
  activate,
}

export default extension
