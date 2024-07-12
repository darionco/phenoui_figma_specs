
# _node
A node is a basic building block of a Figma document. This is a base class that contains common properties for all nodes.  

<details>
  <summary>JMESPath Expression</summary>

```jpath
{
  class: '_node',
  description: 'A node is a basic building block of a Figma document. This is a base class that contains common properties for all nodes.',
  mappings: {
    info: inherit(@, '_info.mappings'),
    dimensions: inherit(@, '_dimensions.mappings'),
    effects: effects,
    opacity: opacity,
    componentRefs: componentPropertyReferences
  }
}
```

</details>


## Mappings
<span style="color:#888888"><b>Inherits:</b> <b>[_info](_info.md)</b>[mappings], <b>[_dimensions](_dimensions.md)</b>[mappings]</span>

**Figma Node Dependencies**  
[effects](https://www.figma.com/plugin-docs/api/node-properties/#effects)  
[opacity](https://www.figma.com/plugin-docs/api/node-properties/#opacity)  
[componentPropertyReferences](https://www.figma.com/plugin-docs/api/node-properties/#componentpropertyreferences)
    
**Functions Used**  
[inherit](functions/inherit.md)
    

    