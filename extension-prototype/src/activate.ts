import { JupyterFrontEnd, ILayoutRestorer } from '@jupyterlab/application'
import { ICommandPalette, MainAreaWidget, WidgetTracker } from '@jupyterlab/apputils'
import { EXTENSION_ID, EXTENSION_NAME, OPEN_COMMAND } from './enums'
import { ReactAppWidget } from './App'
import { ILauncher } from '@jupyterlab/launcher'

export const activate = (app: JupyterFrontEnd, palette: ICommandPalette, restorer: ILayoutRestorer, launcher: ILauncher): void => {
  console.log(`JupyterLab extension ${EXTENSION_ID} is activated!`)

  // Create a single widget
  let widget: MainAreaWidget<ReactAppWidget>

  // Add an application command
  const command = OPEN_COMMAND
  app.commands.addCommand(command, {
    label: EXTENSION_NAME,
    execute: () => {
      if (!widget) {
        const content = new ReactAppWidget()
        widget = new MainAreaWidget({ content })
        widget.id = EXTENSION_ID
        widget.title.label = EXTENSION_NAME
        widget.title.closable = true
      }
      if (!tracker.has(widget)) {
        tracker.add(widget)
      }
      if (!widget.isAttached) {
        // Attach the widget to the main work area if it's not there
        app.shell.add(widget, 'main')
      }

      // Activate the widget
      app.shell.activateById(widget.id)
    },
  })

  // Add the command to the palette.
  palette.addItem({ command, category: EXTENSION_NAME })

  const launcher_item : ILauncher.IItemOptions = {
    command: command,
    args: {
      newBrowserTab: true,
      title: EXTENSION_NAME,
      id: EXTENSION_ID
    },
    category: 'Other',
    rank: 10
};

launcher_item.kernelIconUrl =  '../style/icons/server.svg'

  launcher.add(launcher_item);

  const tracker = new WidgetTracker<MainAreaWidget<ReactAppWidget>>({
    namespace: EXTENSION_ID,
  })

  restorer.restore(tracker, {
    command: OPEN_COMMAND,
    name: () => EXTENSION_ID,
  })
}
