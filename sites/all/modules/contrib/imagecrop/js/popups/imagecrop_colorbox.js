(function($) { 

$(document).ready(function() {
  $('#cancel-crop').click(Drupal.Imagecrop.closePopup);
});

/**
 * Event listener, close the current popup.
 */
Drupal.Imagecrop.closePopup = function() {
  parent.jQuery.colorbox.close();
}

})(jQuery);