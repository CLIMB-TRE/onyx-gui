from filterwidget import MultiFilterWidget
from projectwidget import ProjetWidget
from ipywidgets import Layout, Dropdown, Box, Widget, Textarea, Button, Output
from onyx import OnyxClient

class PlotWidget():


    def __init__(self) -> None:
        
        items_layout = Layout( width='auto')
        box_layout = Layout(display='flex',
                        flex_flow='column', 
                        align_items='stretch', 
                        border='solid',
                        width='100%')

        self.button2=Button(description="plot", layout=items_layout, button_style='primary')

        self.output2 = Output()
        items = [self.button2,self.output2]
        self.widget =  Box(children=items, layout=box_layout)
        
        def plot(button):
            import matplotlib.pyplot as plt
            import numpy as np

            plt.style.use('_mpl-gallery')

            # make data
            x = np.linspace(0, 10, 100)
            y = 4 + 2 * np.sin(2 * x)

            # plot
            fig, ax = plt.subplots()

            ax.plot(x, y, linewidth=2.0)

            ax.set(xlim=(0, 8), xticks=np.arange(1, 8),
                    ylim=(0, 8), yticks=np.arange(1, 8))
            self.output2.clear_output()
            with self.output2:
                plt.show()
        
        self.button2.on_click(plot)




    
