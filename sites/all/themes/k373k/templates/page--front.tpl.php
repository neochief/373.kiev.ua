  <div class="flectarn"></div>
  <div class="wrapper">
    <div class="logo">
      <a href="/">373 Kompanie</a>
    </div>

    <?php if ($main_menu): ?>
      <?php print theme('links__system_main_menu', array(
        'links' => $main_menu,
        'attributes' => array(
          'id' => 'main-menu-links',
          'class' => array('links', 'clearfix'),
        ),
        'heading' => array(
          'text' => t('Main menu'),
          'level' => 'h2',
          'class' => array('element-invisible'),
        ),
      )); ?>
    <?php endif; ?>
    <div class="photos">
      <ul>
        <li><a href="/blog"><img src="/sites/all/themes/k373k/images/photos/p3.png" /></a></li>
        <li><a href="/blog"><img src="/sites/all/themes/k373k/images/photos/p2.png" /></a></li>
        <li><a href="/blog"><img src="/sites/all/themes/k373k/images/photos/p1.png" /></a></li>
        <li><a href="/blog"><img src="/sites/all/themes/k373k/images/photos/p4.png" /></a></li>
        <li><a href="/blog"><img src="/sites/all/themes/k373k/images/photos/p5.png" /></a></li>
        <li><a href="/blog"><img src="/sites/all/themes/k373k/images/photos/p6.png" /></a></li>
      </ul>
    </div>
    <div class="blog-recent menu">
      <?php print render($page['footer']); ?>
    </div>

    <div class="copy">© 2011, Официальный сайт киевской страйбольной команды 1./373 Kompanie. <a href="/user">Вход</a></div>
  </div>
</body>
</html>
