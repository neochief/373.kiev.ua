<div class="<?php print $classes; ?> clearfix"<?php print $attributes; ?>>
  <div class="meta">
    <div class="author"><?php print $author; ?>, <?php print $created; ?></div>
  </div>
  <div class="content">
    <?php
      // We hide the comments and links now so that we can render them later.
      hide($content['links']);
      print render($content);
    ?>
  </div>
  <div class="links">
    <?php print render($content['links']); ?>
  </div>
</div>