from ipywidgets import Layout, Button, Box, Widget, Textarea
from onyx import OnyxConfig


class DomainWidget():


    def __init__(self) -> None:
        box_layout = Layout(display='flex',
                        flex_flow='row', 
                        align_items='stretch', 
                        border='solid',
                        width='100%')
        items_layout = Layout( width='auto')

        self.domain_entry = Textarea(
                            value='https://onyx-test.climb.ac.uk/',
                            placeholder='https://onyx-test.climb.ac.uk/',
                            description='Domain:',
                            disabled=False
                            )
        self.token_entry = Textarea(
                            value='',
                            placeholder='',
                            description='Token:',
                            disabled=False
                            )

        self.button=Button(description="Enter", layout=items_layout, button_style='primary')
        items = [self.domain_entry,self.token_entry,self.button]
        self.widget =  Box(children=items, layout=box_layout)

    def domain(self)->str:
        return self.domain_entry.value
    def token(self)->str:
        return self.token_entry.value
    
    def config(self)->OnyxConfig:
        return OnyxConfig(self.domain(),token=self.token())