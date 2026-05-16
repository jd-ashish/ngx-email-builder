import { BlockPreset } from './email-template-builder.models';

export const EMAIL_BLOCK_LIBRARY: BlockPreset[] = [
  {
    type: 'header',
    label: 'Header',
    icon: 'view_headline',
    description: 'Logo and link',
  },
  {
    type: 'hero',
    label: 'Hero',
    icon: 'image',
    description: 'Image with headline',
  },
  {
    type: 'text',
    label: 'Text',
    icon: 'subject',
    description: 'Heading and copy',
  },
  {
    type: 'paragraph',
    label: 'Paragraph',
    icon: 'short_text',
    description: 'Plain text block',
  },
  {
    type: 'image',
    label: 'Image',
    icon: 'add_photo_alternate',
    description: 'Full width media',
  },

  {
    type: 'quote',
    label: 'Quote',
    icon: 'format_quote',
    description: 'Testimonial callout',
  },
  {
    type: 'button',
    label: 'Button',
    icon: 'smart_button',
    description: 'Call to action',
  },
  {
    type: 'coupon',
    label: 'Coupon',
    icon: 'sell',
    description: 'Promo code block',
  },
  {
    type: 'list',
    label: 'List',
    icon: 'format_list_bulleted',
    description: 'Bullets or steps',
  },
  {
    type: 'badge',
    label: 'Badge',
    icon: 'verified',
    description: 'Small status label',
  },
  {
    type: 'divider',
    label: 'Divider',
    icon: 'horizontal_rule',
    description: 'Visual separator',
  },
  {
    type: 'spacer',
    label: 'Spacer',
    icon: 'height',
    description: 'Vertical spacing',
  },
  {
    type: 'footer',
    label: 'Footer',
    icon: 'notes',
    description: 'Legal footer text',
  },
  {
    type: 'social',
    label: 'Social',
    icon: 'share',
    description: 'Footer links',
  },
  ...Array.from({ length: 3 }, (_, index) => {
    const columnCount = index+1;

    return {
      type: 'columns' as const,
      label: `${columnCount} Column`,
      icon: 'view_column',
      description: `${columnCount} editable content columns`,
      columnCount,
    };
  }),
];
