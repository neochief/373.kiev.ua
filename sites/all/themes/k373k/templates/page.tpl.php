  <div class="flectarn"></div>
  <div class="wrapper">
    <div class="logo">
      <a href="/">373 Kompanie</a>
    </div>

    <?php if ($main_menu): ?>
      <div class="menu top-menu">
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
      </div> <!-- /#main-menu -->
    <?php endif; ?>

    <div class="container">
      <div class="main-wrapper">
        <div class="main-wrapper2">
          <div class="main">
            <div class="main-top"></div>
            <div class="main-center">
              <?php print $breadcrumb; ?>

              <?php if ($title): ?>
                <h1 class="page-title"><?php print $title; ?></h1>
              <?php endif; ?>

              <?php if ($messages): ?>
                <div id="console" class="clearfix"><?php print $messages; ?></div>
              <?php endif; ?>
              <?php if ($action_links): ?><ul class="action-links"><?php print render($action_links); ?></ul><?php endif; ?>

              <?php print render($tabs); ?>
              <?php print render($page['content']); ?>


              </div>
            </div>
            <div class="main-bottom"></div>
          </div>
        </div>
      </div>

      <div class="sidebar-wrapper">
        <div class="sidebar">
          <?php print render($page['sidebar']); ?>
        </div>
      </div>
    <div class="copy">© 2011, Официальный сайт киевской страйбольной команды 1./373 Kompanie. <a href="/user">Вход</a></div>
    </div>
  </div>
</body>
</html>
