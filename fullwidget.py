from filterwidget import MultiFilterWidget
from projectwidget import ProjetWidget
from plotwidget import PlotWidget
from ipywidgets import Layout, Dropdown, Box, Widget, Textarea, Button, Output
from onyx import OnyxClient
import functools,operator

class FullWidget():


    def __init__(self) -> None:
        
        items_layout = Layout( width='auto')
        box_layout = Layout(display='flex',
                        flex_flow='column', 
                        align_items='stretch', 
                        border='solid',
                        width='100%')

        self.projectWidget = ProjetWidget()
        self.filterWidget = MultiFilterWidget(3)
        
        self.button=Button(description="Search", layout=items_layout, button_style='primary')

        self.output = Output()
        self.plot_widget = PlotWidget()
        items = [self.projectWidget.widget,self.filterWidget.widget, self.button, self.output, self.plot_widget.widget]
        self.widget =  Box(children=items, layout=box_layout)

        
        def on_project_selected(b):
            if (b!= "value"): return
            c= OnyxClient(self.projectWidget.domain_widget.config())
            fields = c.fields(self.projectWidget.project())['fields']
            self.filterWidget.set_fields(fields, c)
    

        self.projectWidget.dropdown.on_trait_change(on_project_selected)


        def search(button):
            c= OnyxClient(self.projectWidget.domain_widget.config())
            query_list =self.filterWidget.query()
            combined_query= functools.reduce(operator.and_, query_list)
            query = c.query(self.projectWidget.project(), combined_query)
            count = sum(1 for _ in query)
            self.output.clear_output()
            with self.output:
                print(f"This gives {count} records")
        

        self.button.on_click(search)




    
