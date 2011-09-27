
Drupal.Imagecrop = Drupal.Imagecrop || {};
Drupal.Imagecrop.hasUnsavedChanges = false;

(function($) { 

$(document).ready(function() {
  $("#imagecrop-style-selection-form #edit-styles").change(function() { Drupal.Imagecrop.changeViewedImage($(this).val()); });
});

/**
 * Event listener, go to the view url when user selected a style.
 */
Drupal.Imagecrop.changeViewedImage = function(isid) {
  document.location = $("input[name=imagecrop-url]").val().replace('/isid/', '/' + isid + '/');
}

})(jQuery); 