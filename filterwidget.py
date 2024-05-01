from ipywidgets import Layout, Dropdown, Box, Widget, Textarea, Button, Output
from onyx import OnyxField


class FilterWidget():


    def __init__(self) -> None:
        box_layout = Layout(display='flex',
                        flex_flow='row', 
                        align_items='stretch', 
                        border='none',
                        width='100%')

        self.field_selection = Dropdown(
                        options=[''],
                        value='',
                        description='',
                        disabled=True,
                        )
        self.comparison_selection = Dropdown(
                        options=[''],
                        value='',
                        description='',
                        disabled=True,
                        )
        
        self.value_selection = Textarea(
                            value='Enter value',
                            placeholder='Enter value',
                            description='',
                            disabled=False
                            )
        items = [self.field_selection,self.comparison_selection,self.value_selection]
        self.widget =  Box(children=items, layout=box_layout)

        
        def on_field_selected(b):
            if (b!= "value"): return

            field = self.field_selection.value
            
            comparisons = self.comparisons_for_field(field)

            self.comparison_selection.options = comparisons
    

        self.field_selection.on_trait_change(on_field_selected)

    def comparisons_for_field(self,field_name):
            t = self.fields[field_name]['type']
            matches = [x for x in self.client.types() if x['type']==t]
            return matches[0]['lookups']
    
    def set_fields(self,fields, client):
        self.fields = fields
        self.client = client
        options =['']
        options.extend([f for f in self.fields])
        self.field_selection.options = options
        self.field_selection.disabled = False
        self.comparison_selection.disabled = False
        self.value_selection.disabled = False

    def filter(self):
        field = self.field_selection.value
        comp = self.comparison_selection.value
        value =self.value_selection.value
        if (field==''): return None
        else: return OnyxField(**{f"{field}__{comp}" : value})





class MultiFilterWidget():


    def __init__(self, r=3) -> None:
        box_layout = Layout(display='flex',
                            
                        flex_flow='column', 
                        align_items='stretch', 
                        border='solid',
                        width='100%')

        self.items = [FilterWidget() for i in range(r)]
        self.widget =  Box(children=[i.widget for i in self.items], layout=box_layout)

    def query(self):
        return [x for x in [i.filter() for i in self.items] if x is not None]
    
    
    def set_fields(self,fields, client):
        for i in self.items:
            i.set_fields(fields, client)

