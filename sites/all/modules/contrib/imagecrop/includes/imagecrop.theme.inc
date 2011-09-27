<?php
/**
 * @file
 * Theming functions for showing the imagecrop pages.
 *
 * @date
 * Oct 7, 2010
 */

/**
 * Override the page theming for the imagecrop pages.
 */
function imagecrop_page($variables) {

  $output = '';
  if ($variables['messages']) {
    $output .= $variables['messages'];
  }

  $output .= drupal_render($variables['page']['content']);
  return $output;

}

/**
 * Theme the summary from given imagecrop effect.
 */
function theme_imagecrop_effect_summary($variables) {

  $data = $variables['data'];

  $description = t('width') .': '. $data['width'] .', '. t('height') .': '. $data['height'];
  if (!empty($data['xoffset'])) {
    $description .= ', '. t('xoffset') .': '. $data['xoffset'];
  }

  if (!empty($data['yoffset'])) {
    $description .= ', '. t('yoffset') .': '. $data['yoffset'];
  }

  if ($data['resizable']) {
    $description .= ', '. t('resizable');
  }

  if ($data['aspect_ratio']) {
    $description .= ', aspect ratio: '. $data['aspect_ratio'];
  }

  if ($data['disable_if_no_data']) {
    $description .= ', '. t("don't crop if region is not set");
  }

  if ($data['downscaling']) {
    $description .= ', '. t('no downscaling allowed');
  }

  return $description;

}