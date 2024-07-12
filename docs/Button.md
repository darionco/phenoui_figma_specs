
# Button
A button that can be clicked to perform an action.  

<details>
  <summary>JMESPath Expression</summary>

```jpath
{
  class: 'Button',
  description: 'A button that can be clicked to perform an action.',
  mappings: inherit(@, 'Frame.mappings', {
    type: 'figma-button'
  }),
  properties: {
    id: {
      type: 'string',
      default: `null`,
      description: 'The unique identifier of the button.'
    },
    action: {
      type: 'select',
      default: 'notify',
      description: 'The action to perform when the button is clicked.',
      options: [
        { label: 'Notify', value: 'notify', description: 'Trigger a notification event that bubbles up the component hierarchy.' },
        { label: 'Navigate', value: 'navigate', description: 'Navigate to a new location.' },
        { label: 'Submit', value: 'submit', description: 'Submits the first form found in the hierarchy.' }
      ]
    },
    navigation: {
      type: 'select',
      default: 'push',
      description: 'The navigation method to use when the button is clicked.',
      options: [
        { label: 'Push', value: 'push', description: 'Push a new location onto the navigation stack.' },
        { label: 'Replace', value: 'replace', description: 'Replace the current location in the navigation stack.' },
        { label: 'Pop', value: 'pop', description: 'Pop the current location off the navigation stack.'},
        { label: 'Pop to', value: 'pop_to', description: 'Pop to a specific location in the navigation stack.' }
      ]
    },
    destination: {
      type: 'string',
      default: `null`,
      description: 'The destination to navigate to when the button is clicked.'
    },
    popThen: {
      type: 'select',
      label: 'then',
      default: 'none',
      description: 'The action to perform after popping the current location off the navigation stack.',
      options: [
        { label: 'Nothing', value: 'none', description: 'Do nothing after popping the current location.' },
        { label: 'Push', value: 'push', description: 'Push a new location onto the navigation stack.' },
        { label: 'Replace', value: 'replace', description: 'Replace the current location in the navigation stack.' }
      ]
    },
    data: {
      type: 'group',
      default: [],
      description: 'The data to send with the action.'
    }
  },
  layout: [
    { type: 'row', content: ['action'] },
    if (action.value == 'navigate', {
      type: 'row', content: ['navigation']
    }),
    if (action.value == 'navigate' && navigation.value != 'pop', {
      type: 'row', content: ['destination']
    }),
    if (action.value == 'navigate' && (navigation.value == 'pop' || navigation.value == 'pop_to'), {
      type: 'row', content: ['popThen']
    }),
    { type: 'row', content: ['data'] }
  ]
}
```

</details>

## Properties
- <span style="font-size: larger"><b>id</b></span> <span style="color:#888888; font-size: smaller">[string]</span>  
<span style="color:#888888; font-size: smaller"><b>default:</b> null</span>  
The unique identifier of the button.  
  
- <span style="font-size: larger"><b>action</b></span> <span style="color:#888888; font-size: smaller">[select]</span>  
<span style="color:#888888; font-size: smaller"><b>default:</b> notify</span>  
The action to perform when the button is clicked.  

  - <span style="font-size: larger"><b>Notify</b></span>  
<span style="color:#888888; font-size: smaller"><b>value:</b> notify</span>  
Trigger a notification event that bubbles up the component hierarchy.  
  
  - <span style="font-size: larger"><b>Navigate</b></span>  
<span style="color:#888888; font-size: smaller"><b>value:</b> navigate</span>  
Navigate to a new location.  
  
  - <span style="font-size: larger"><b>Submit</b></span>  
<span style="color:#888888; font-size: smaller"><b>value:</b> submit</span>  
Submits the first form found in the hierarchy.  
  
- <span style="font-size: larger"><b>navigation</b></span> <span style="color:#888888; font-size: smaller">[select]</span>  
<span style="color:#888888; font-size: smaller"><b>default:</b> push</span>  
The navigation method to use when the button is clicked.  

  - <span style="font-size: larger"><b>Push</b></span>  
<span style="color:#888888; font-size: smaller"><b>value:</b> push</span>  
Push a new location onto the navigation stack.  
  
  - <span style="font-size: larger"><b>Replace</b></span>  
<span style="color:#888888; font-size: smaller"><b>value:</b> replace</span>  
Replace the current location in the navigation stack.  
  
  - <span style="font-size: larger"><b>Pop</b></span>  
<span style="color:#888888; font-size: smaller"><b>value:</b> pop</span>  
Pop the current location off the navigation stack.  
  
  - <span style="font-size: larger"><b>Pop to</b></span>  
<span style="color:#888888; font-size: smaller"><b>value:</b> pop_to</span>  
Pop to a specific location in the navigation stack.  
  
- <span style="font-size: larger"><b>destination</b></span> <span style="color:#888888; font-size: smaller">[string]</span>  
<span style="color:#888888; font-size: smaller"><b>default:</b> null</span>  
The destination to navigate to when the button is clicked.  
  
- <span style="font-size: larger"><b>then</b></span> <span style="color:#888888; font-size: smaller">[select]</span>  
<span style="color:#888888; font-size: smaller"><b>default:</b> none</span>  
The action to perform after popping the current location off the navigation stack.  

  - <span style="font-size: larger"><b>Nothing</b></span>  
<span style="color:#888888; font-size: smaller"><b>value:</b> none</span>  
Do nothing after popping the current location.  
  
  - <span style="font-size: larger"><b>Push</b></span>  
<span style="color:#888888; font-size: smaller"><b>value:</b> push</span>  
Push a new location onto the navigation stack.  
  
  - <span style="font-size: larger"><b>Replace</b></span>  
<span style="color:#888888; font-size: smaller"><b>value:</b> replace</span>  
Replace the current location in the navigation stack.  
  
- <span style="font-size: larger"><b>data</b></span> <span style="color:#888888; font-size: smaller">[group]</span>  
<span style="color:#888888; font-size: smaller"><b>default:</b> null</span>  
The data to send with the action.  


## Mappings
<span style="color:#888888"><b>Inherits:</b> <b>[Frame](Frame.md)</b>[mappings]</span>


    
**Functions Used**  
[inherit](functions/inherit.md)
    

    