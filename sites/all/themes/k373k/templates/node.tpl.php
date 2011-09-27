<div class="node-wrapper">
  <div id="node-<?php print $node->nid; ?>" class="<?php print $classes; ?>"<?php print $attributes; ?>>
    <?php if (!$page): ?>
      <h2<?php print $title_attributes; ?>><a href="<?php print $node_url; ?>"><?php print $title; ?></a></h2>
    <?php endif; ?>
    <?php if ($display_submitted): ?><div class="date"><?php print $date ?></div><?php endif; ?>
    <div class="node-links"><?php if ($display_submitted): ?><span class="author"><?php print $name ?></span><?php endif; ?><?php if (isset($content['field_tags'][0])): ?> / <span class="taxonomy"><?php print render($content['field_tags']); ?></span><?php endif; ?></div>
    <div class="content">
      <?php
        // We hide the comments and links now so that we can render them later.
        hide($content['comments']);
        hide($content['links']);
        hide($content['field_tags']);
        print render($content);
      ?>
    </div>
    <div class="node-comments"><?php print render($content['links']); ?></div>
          
    <?php $comments = render($content['comments']); ?>
    <?php if ($comments): ?>
    <div class="comments-wrapper">
      <div class="comments">
        <?php print($comments); ?>
      </div>
    </div>
    <?php endif; ?>
  </div>
</div>
