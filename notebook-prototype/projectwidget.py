from domainwidget import DomainWidget
from ipywidgets import Layout, Dropdown, Box, Widget, Textarea
from onyx import OnyxClient,OnyxConfig



class ProjetWidget():


    def __init__(self) -> None:
        box_layout = Layout(display='flex',
                        flex_flow='column', 
                        align_items='stretch', 
                        border='solid',
                        width='100%')

        self.domain_widget = DomainWidget()
        self.dropdown = Dropdown(
                        options=[''],
                        value='',
                        description='Project:',
                        disabled=True,
                        )

        items = [self.domain_widget.widget,self.dropdown]
        self.widget =  Box(children=items, layout=box_layout)

        
        def on_button_clicked(b):
            c= OnyxClient(self.domain_widget.config())
            self.dropdown.options = {p['project'] for p in c.projects()}
            self.dropdown.disabled =False


        self.domain_widget.button.on_click(on_button_clicked)

    def project(self)->str:
        return self.dropdown.value

    
