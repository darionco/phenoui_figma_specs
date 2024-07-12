
# Animation
Lottie animation container.  

<details>
  <summary>JMESPath Expression</summary>

```jpath
{
  class: 'Animation',
  description: 'Lottie animation container.',
  mappings: inherit(@, '_node.mappings', {
    type: 'figma-lottie-animation'
  }),
  properties: {
    method: inherit(@, 'Image.properties.method', {
      default: 'link',
      description: 'The method used to save and link the animation to the export.'
    }),
    loop: {
      type: 'boolean',
      description: 'Whether the animation should loop or not.',
      default: `true`
    },
    autoplay: {
      type: 'boolean',
      description: 'Whether the animation should start playing automatically.',
      default: `true`
    },
    animation: {
      type: 'union',
      handler: 'lottie',
      description: 'The lottie animation to use in the export.',
      fields: {
        from: {
          type: 'number',
          default: `null`,
          description: 'The frame to start the animation from.'
        },
        to: {
          type: 'number',
          default: `null`,
          description: 'The frame to end the animation at.'
        },
        data: {
          type: 'lottie',
          default: `null`,
          description: 'The lottie animation data.'
        }
      }
    }
  },
  layout: [
    { type: 'row', content: ['method'] },
    { type: 'row', content: ['loop', 'autoplay'] },
    { type: 'row', content: ['animation'] }
  ]
}
```

</details>

## Properties
- <span style="font-size: larger"><b>method</b></span> <span style="color:#888888; font-size: smaller">[select]</span>  
<span style="color:#888888; font-size: smaller"><b>default:</b> link</span>  
The method used to save and link the animation to the export.  

  - <span style="font-size: larger"><b>Upload to server</b></span>  
<span style="color:#888888; font-size: smaller"><b>value:</b> upload</span>  
Upload the asset to the server and use the link in the export.  
  
  - <span style="font-size: larger"><b>Link existing image</b></span>  
<span style="color:#888888; font-size: smaller"><b>value:</b> link</span>  
Use an existing asset in the server for the export.  
  
  - <span style="font-size: larger"><b>Embed image in export</b></span>  
<span style="color:#888888; font-size: smaller"><b>value:</b> embed</span>  
Embed the asset in the export itself.  
  
- <span style="font-size: larger"><b>loop</b></span> <span style="color:#888888; font-size: smaller">[boolean]</span>  
<span style="color:#888888; font-size: smaller"><b>default:</b> true</span>  
Whether the animation should loop or not.  
  
- <span style="font-size: larger"><b>autoplay</b></span> <span style="color:#888888; font-size: smaller">[boolean]</span>  
<span style="color:#888888; font-size: smaller"><b>default:</b> true</span>  
Whether the animation should start playing automatically.  
  
- <span style="font-size: larger"><b>animation</b></span> <span style="color:#888888; font-size: smaller">[union]</span>  
<span style="color:#888888; font-size: smaller"><b>handler:</b> lottie</span>  
The lottie animation to use in the export.  

  - <span style="font-size: larger"><b>from</b></span> <span style="color:#888888; font-size: smaller">[number]</span>  
<span style="color:#888888; font-size: smaller"><b>default:</b> null</span>  
The frame to start the animation from.  
  
  - <span style="font-size: larger"><b>to</b></span> <span style="color:#888888; font-size: smaller">[number]</span>  
<span style="color:#888888; font-size: smaller"><b>default:</b> null</span>  
The frame to end the animation at.  
  
  - <span style="font-size: larger"><b>data</b></span> <span style="color:#888888; font-size: smaller">[lottie]</span>  
<span style="color:#888888; font-size: smaller"><b>default:</b> null</span>  
The lottie animation data.  


## Mappings
<span style="color:#888888"><b>Inherits:</b> <b>[_node](_node.md)</b>[mappings]</span>


    
**Functions Used**  
[inherit](functions/inherit.md)
    

    