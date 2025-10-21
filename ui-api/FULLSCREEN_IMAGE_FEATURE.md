# Fullscreen Image Viewing Feature

## Overview
Implemented fullscreen modal viewing for all converted images using Nuxt UI v4's `UModal` component with the `fullscreen` prop, allowing users to view HDR comparisons, SDR images, and gain maps in full detail.

## Features Implemented

### 1. Interactive Comparison Slider Fullscreen
- Click on the main HDR comparison slider to view it in fullscreen
- Maintains the interactive slider functionality in fullscreen mode
- Shows Original AVIF vs Final JPG (Instagram) with draggable comparison

### 2. SDR Image Fullscreen
- Click on the SDR extracted image to view it in fullscreen
- Full resolution viewing of the Standard Dynamic Range version

### 3. Gain Map Fullscreen
- Click on the gain map image to view it in fullscreen
- Detailed view of the HDR gain map metadata visualization

## User Experience

### Visual Indicators
- **Hover Effect**: Expand icon (🔍) appears on hover with smooth fade-in animation
- **Cursor Change**: Pointer cursor indicates clickable images
- **Icon Overlay**: Semi-transparent black background with white expand icon
- **Position**: Top-right corner of each image

### Fullscreen Modal Features
- **Black Background**: Pure black background for optimal image viewing
- **Centered Images**: Images centered with proper object-fit contain
- **Close Button**: Standard Nuxt UI close button (X) in modal header
- **ESC Key Support**: Press ESC to exit fullscreen
- **Click Outside**: Click outside image to close modal
- **Title Display**: Shows appropriate title for each view type

## Technical Implementation

### State Management
```typescript
const fullscreenImage = ref<{
  type: 'comparison' | 'sdr' | 'gainmap'
  title: string
  src?: string
  originalSrc?: string
  finalSrc?: string
} | null>(null)

const isFullscreenOpen = computed({
  get: () => !!fullscreenImage.value,
  set: (value) => {
    if (!value) {
      fullscreenImage.value = null
    }
  },
})
```

### Image Types
1. **Comparison**: Uses img-comparison-slider with two sources
2. **SDR**: Single image display
3. **Gain Map**: Single image display

### Click Handlers
```typescript
function openFullscreen(type: 'comparison' | 'sdr' | 'gainmap') {
  switch (type) {
    case 'comparison':
      fullscreenImage.value = {
        type: 'comparison',
        title: 'HDR Comparison',
        originalSrc: props.result.originalImage,
        finalSrc: props.result.finalJpg,
      }
      break
    case 'sdr':
      fullscreenImage.value = {
        type: 'sdr',
        title: 'SDR Image',
        src: props.result.sdrImage,
      }
      break
    case 'gainmap':
      fullscreenImage.value = {
        type: 'gainmap',
        title: 'Gain Map',
        src: props.result.gainMapImage,
      }
      break
  }
}
```

## Nuxt UI Components Used

### UModal with Fullscreen
```vue
<UModal
  v-model="isFullscreenOpen"
  :fullscreen="true"
  :title="fullscreenImage?.title"
  :ui="{ body: { padding: '' } }"
>
  <template #body>
    <!-- Fullscreen content -->
  </template>
</UModal>
```

**Props:**
- `v-model`: Two-way binding for open/close state
- `fullscreen: true`: Expands modal to cover entire viewport
- `title`: Dynamic title based on image type
- `ui`: Custom UI config to remove body padding

### Benefits of UModal Fullscreen
- Built-in animations and transitions
- Accessibility features (ESC key, focus management)
- Responsive design out of the box
- Dark mode support
- Close button automatically styled
- Overlay management handled by Nuxt UI

## CSS Enhancements

### Hover Overlay
```css
.group-hover:opacity-100 transition-opacity bg-black/50 rounded-lg p-2
```

### Image Positioning
- **Normal View**: `object-fit: contain` with max height
- **Fullscreen**: `object-fit: contain` with max width/height
- **Background**: Pure black (#000000) for HDR content viewing

## User Interactions

### Opening Fullscreen
1. Hover over any image (comparison slider, SDR, or gain map)
2. Expand icon appears in top-right corner
3. Click anywhere on the image
4. Fullscreen modal opens with smooth animation

### Closing Fullscreen
1. Click the X button in modal header
2. Press ESC key
3. Click outside the image area
4. Modal closes with smooth animation

## Performance Considerations

- **Lazy Loading**: Images already loaded in thumbnail view
- **No Duplicate Requests**: Uses same blob URLs from initial conversion
- **Efficient Rendering**: Only renders active modal content
- **Memory Management**: Modal unmounts when closed
- **Client-Side Only**: img-comparison-slider only loads in browser

## Accessibility

- ✅ Keyboard navigation (ESC to close)
- ✅ ARIA labels on modal
- ✅ Focus management by Nuxt UI
- ✅ Screen reader friendly titles
- ✅ Proper alt text on all images

## Browser Support

Works on all modern browsers that support:
- ES6+ JavaScript
- CSS Grid and Flexbox
- Web Components (for img-comparison-slider)
- CSS Custom Properties

## Future Enhancements

Potential improvements:
1. Pinch-to-zoom on mobile devices
2. Keyboard shortcuts (arrow keys to switch images)
3. Download button in fullscreen modal
4. Share functionality
5. Image rotation controls
6. Metadata overlay in fullscreen view

## References

- [Nuxt UI Modal Documentation](https://ui.nuxt.com/components/modal)
- [Fullscreen Modal Example](https://ui.nuxt.com/components/modal#fullscreen)
- [img-comparison-slider](https://github.com/sneas/img-comparison-slider)

