
# Image
An image asset to be exported directly from figma  

<details>
  <summary>JMESPath Expression</summary>

```jpath
{
  class: 'Image',
  description: 'An image asset to be exported directly from figma',
  mappings: inherit(@, '_node.mappings', {
    type: 'figma-image',
    data: exportImage(@)
  }),
  properties: {
    format: {
      type: 'select',
      default: 'svg',
      description: 'The image format to use for the export.',
      options: [
        {
          label: 'SVG',
          value: 'svg',
          description: 'Scalable Vector Graphics image format.'
        },
        {
          label: 'PNG',
          value: 'png',
          description: 'Portable Network Graphics image format.'
        },
        {
          label: 'JPEG',
          value: 'jpg',
          description: 'Joint Photographic Experts Group image format.'
        }
      ]
    },
    method: {
      type: 'select',
      default: 'embed',
      description: 'The method to use while saving the image to be used in the export.',
      options: [
        {
          label: 'Upload to server',
          value: 'upload',
          description: 'Upload the asset to the server and use the link in the export.'
        },
        {
          label: 'Link existing image',
          value: 'link',
          description: 'Use an existing asset in the server for the export.'
        },
        {
          label: 'Embed image in export',
          value: 'embed',
          description: 'Embed the asset in the export itself.'
        }
      ]
    },
    scale1x: {
      type: 'boolean',
      label: '1x',
      default: `false`,
      description: 'Export the image at 1x resolution.'
    },
    scale2x: {
      type: 'boolean',
      label: '2x',
      default: `false`,
      description: 'Export the image at 2x resolution.'
    },
    scale3x: {
      type: 'boolean',
      label: '3x',
      default: `true`,
      description: 'Export the image at 3x resolution.'
    }
  },
  layout: [
    { type: 'row', content: [ 'format'] },
    { type: 'row', content: [ 'method'] },
    if (format.value != 'svg', {
      type: 'section', title: 'Export Scales', content: [
        { type: 'row', content: ['scale1x', 'scale2x', 'scale3x'] }
      ]
    })
  ]
}
```

</details>

## Properties
- <span style="font-size: larger"><b>format</b></span> <span style="color:#888888; font-size: smaller">[select]</span>  
<span style="color:#888888; font-size: smaller"><b>default:</b> svg</span>  
The image format to use for the export.  

  - <span style="font-size: larger"><b>SVG</b></span>  
<span style="color:#888888; font-size: smaller"><b>value:</b> svg</span>  
Scalable Vector Graphics image format.  
  
  - <span style="font-size: larger"><b>PNG</b></span>  
<span style="color:#888888; font-size: smaller"><b>value:</b> png</span>  
Portable Network Graphics image format.  
  
  - <span style="font-size: larger"><b>JPEG</b></span>  
<span style="color:#888888; font-size: smaller"><b>value:</b> jpg</span>  
Joint Photographic Experts Group image format.  
  
- <span style="font-size: larger"><b>method</b></span> <span style="color:#888888; font-size: smaller">[select]</span>  
<span style="color:#888888; font-size: smaller"><b>default:</b> embed</span>  
The method to use while saving the image to be used in the export.  

  - <span style="font-size: larger"><b>Upload to server</b></span>  
<span style="color:#888888; font-size: smaller"><b>value:</b> upload</span>  
Upload the asset to the server and use the link in the export.  
  
  - <span style="font-size: larger"><b>Link existing image</b></span>  
<span style="color:#888888; font-size: smaller"><b>value:</b> link</span>  
Use an existing asset in the server for the export.  
  
  - <span style="font-size: larger"><b>Embed image in export</b></span>  
<span style="color:#888888; font-size: smaller"><b>value:</b> embed</span>  
Embed the asset in the export itself.  
  
- <span style="font-size: larger"><b>1x</b></span> <span style="color:#888888; font-size: smaller">[boolean]</span>  
<span style="color:#888888; font-size: smaller"><b>default:</b> false</span>  
Export the image at 1x resolution.  
  
- <span style="font-size: larger"><b>2x</b></span> <span style="color:#888888; font-size: smaller">[boolean]</span>  
<span style="color:#888888; font-size: smaller"><b>default:</b> false</span>  
Export the image at 2x resolution.  
  
- <span style="font-size: larger"><b>3x</b></span> <span style="color:#888888; font-size: smaller">[boolean]</span>  
<span style="color:#888888; font-size: smaller"><b>default:</b> true</span>  
Export the image at 3x resolution.  


## Mappings
<span style="color:#888888"><b>Inherits:</b> <b>[_node](_node.md)</b>[mappings]</span>


    
**Functions Used**  
[inherit](functions/inherit.md)  
[exportImage](functions/exportImage.md)
    

    