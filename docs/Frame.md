
# Frame
A frame is a rectangular area on the screen. It can contain other frames, images, text, etc.  

<details>
  <summary>JMESPath Expression</summary>

```jpath
{
  class: 'Frame',
  description: 'A frame is a rectangular area on the screen. It can contain other frames, images, text, etc.',
  mappings: inherit(@, '_node.mappings', {
    type: 'figma-frame',
    style: inherit(@, '_style.mappings'),
    layout: inherit(@, '_layout.mappings'),
    clipsContent: clipsContent,
    children: children[*].export(@)
  })
}
```

</details>


## Mappings
<span style="color:#888888"><b>Inherits:</b> <b>[_node](_node.md)</b>[mappings], <b>[_style](_style.md)</b>[mappings], <b>[_layout](_layout.md)</b>[mappings]</span>

**Figma Node Dependencies**  
[clipsContent](https://www.figma.com/plugin-docs/api/node-properties/#clipscontent)  
[children](https://www.figma.com/plugin-docs/api/node-properties/#children)
    
**Functions Used**  
[inherit](functions/inherit.md)  
[export](functions/export.md)
    

    