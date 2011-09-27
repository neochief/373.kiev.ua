(function ($) {

Drupal.behaviors.textarea = {
  attach: function (context, settings) {
    $('.form-textarea-wrapper.resizable', context).once('textarea', function () {
      var staticOffset = null;
      var textarea = $(this).addClass('resizable-textarea').find('textarea');
      var grippie = $('<div class="grippie"></div>').mousedown(startDrag);

      grippie.insertAfter(textarea);

      function startDrag(e) {
        staticOffset = textarea.height() - e.pageY;
        textarea.css('opacity', 0.25);
        $(document).mousemove(performDrag).mouseup(endDrag);
        return false;
      }

      function performDrag(e) {
        textarea.height(Math.max(32, staticOffset + e.pageY) + 'px');
        return false;
      }

      function endDrag(e) {
        $(document).unbind('mousemove', performDrag).unbind('mouseup', endDrag);
        textarea.css('opacity', 1);
      }
    });
  }
};

})(jQuery);
;
(function($) {

Drupal.wysiwyg.editor.init.ckeditor = function(settings) {
  // Plugins must only be loaded once. Only the settings from the first format
  // will be used but they're identical anyway.
  var registeredPlugins = {};
  for (var format in settings) {
    if (Drupal.settings.wysiwyg.plugins[format]) {
      // Register native external plugins.
      // Array syntax required; 'native' is a predefined token in JavaScript.
      for (var pluginName in Drupal.settings.wysiwyg.plugins[format]['native']) {
        if (!registeredPlugins[pluginName]) {
          var plugin = Drupal.settings.wysiwyg.plugins[format]['native'][pluginName];
          CKEDITOR.plugins.addExternal(pluginName, plugin.path, plugin.fileName);
          registeredPlugins[pluginName] = true;
        }
      }
      // Register Drupal plugins.
      for (var pluginName in Drupal.settings.wysiwyg.plugins[format].drupal) {
        if (!registeredPlugins[pluginName]) {
          Drupal.wysiwyg.editor.instance.ckeditor.addPlugin(pluginName, Drupal.settings.wysiwyg.plugins[format].drupal[pluginName], Drupal.settings.wysiwyg.plugins.drupal[pluginName]);
          registeredPlugins[pluginName] = true;
        }
      }
    }
  }
};


/**
 * Attach this editor to a target element.
 */
Drupal.wysiwyg.editor.attach.ckeditor = function(context, params, settings) {
  // Apply editor instance settings.
  CKEDITOR.config.customConfig = '';

  settings.on = {
    instanceReady: function(ev) {
      var editor = ev.editor;
      // Get a list of block, list and table tags from CKEditor's XHTML DTD.
      // @see http://docs.cksource.com/CKEditor_3.x/Developers_Guide/Output_Formatting.
      var dtd = CKEDITOR.dtd;
      var tags = CKEDITOR.tools.extend({}, dtd.$block, dtd.$listItem, dtd.$tableContent);
      // Set source formatting rules for each listed tag except <pre>.
      // Linebreaks can be inserted before or after opening and closing tags.
      if (settings.apply_source_formatting) {
        // Mimic FCKeditor output, by breaking lines between tags.
        for (var tag in tags) {
          if (tag == 'pre') {
            continue;
          }
          this.dataProcessor.writer.setRules(tag, {
            indent: true,
            breakBeforeOpen: true,
            breakAfterOpen: false,
            breakBeforeClose: false,
            breakAfterClose: true
          });
        }
      }
      else {
        // CKEditor adds default formatting to <br>, so we want to remove that
        // here too.
        tags.br = 1;
        // No indents or linebreaks;
        for (var tag in tags) {
          if (tag == 'pre') {
            continue;
          }
          this.dataProcessor.writer.setRules(tag, {
            indent: false,
            breakBeforeOpen: false,
            breakAfterOpen: false,
            breakBeforeClose: false,
            breakAfterClose: false
          });
        }
      }
    },

    pluginsLoaded: function(ev) {
      // Override the conversion methods to let Drupal plugins modify the data.
      var editor = ev.editor;
      if (editor.dataProcessor && Drupal.settings.wysiwyg.plugins[params.format]) {
        editor.dataProcessor.toHtml = CKEDITOR.tools.override(editor.dataProcessor.toHtml, function(originalToHtml) {
          // Convert raw data for display in WYSIWYG mode.
          return function(data, fixForBody) {
            for (var plugin in Drupal.settings.wysiwyg.plugins[params.format].drupal) {
              if (typeof Drupal.wysiwyg.plugins[plugin].attach == 'function') {
                data = Drupal.wysiwyg.plugins[plugin].attach(data, Drupal.settings.wysiwyg.plugins.drupal[plugin], editor.name);
                data = Drupal.wysiwyg.instances[params.field].prepareContent(data);
              }
            }
            return originalToHtml.call(this, data, fixForBody);
          };
        });
        editor.dataProcessor.toDataFormat = CKEDITOR.tools.override(editor.dataProcessor.toDataFormat, function(originalToDataFormat) {
          // Convert WYSIWYG mode content to raw data.
          return function(data, fixForBody) {
            data = originalToDataFormat.call(this, data, fixForBody);
            for (var plugin in Drupal.settings.wysiwyg.plugins[params.format].drupal) {
              if (typeof Drupal.wysiwyg.plugins[plugin].detach == 'function') {
                data = Drupal.wysiwyg.plugins[plugin].detach(data, Drupal.settings.wysiwyg.plugins.drupal[plugin], editor.name);
              }
            }
            return data;
          };
        });
      }
    },

    selectionChange: function (event) {
      var pluginSettings = Drupal.settings.wysiwyg.plugins[params.format];
      if (pluginSettings && pluginSettings.drupal) {
        $.each(pluginSettings.drupal, function (name) {
          var plugin = Drupal.wysiwyg.plugins[name];
          if ($.isFunction(plugin.isNode)) {
            var node = event.data.selection.getSelectedElement();
            var state = plugin.isNode(node ? node.$ : null) ? CKEDITOR.TRISTATE_ON : CKEDITOR.TRISTATE_OFF;
            event.editor.getCommand(name).setState(state);
          }
        });
      }
    },

    focus: function(ev) {
      Drupal.wysiwyg.activeId = ev.editor.name;
    }
  };

  // Attach editor.
  CKEDITOR.replace(params.field, settings);
};

/**
 * Detach a single or all editors.
 *
 * @todo 3.x: editor.prototype.getInstances() should always return an array
 *   containing all instances or the passed in params.field instance, but
 *   always return an array to simplify all detach functions.
 */
Drupal.wysiwyg.editor.detach.ckeditor = function(context, params) {
  if (typeof params != 'undefined') {
    var instance = CKEDITOR.instances[params.field];
    if (instance) {
      instance.destroy();
    }
  }
  else {
    for (var instanceName in CKEDITOR.instances) {
      CKEDITOR.instances[instanceName].destroy();
    }
  }
};

Drupal.wysiwyg.editor.instance.ckeditor = {
  addPlugin: function(pluginName, settings, pluginSettings) {
    CKEDITOR.plugins.add(pluginName, {
      // Wrap Drupal plugin in a proxy pluygin.
      init: function(editor) {
        if (settings.css) {
          editor.on('mode', function(ev) {
            if (ev.editor.mode == 'wysiwyg') {
              // Inject CSS files directly into the editing area head tag.
              $('head', $('#cke_contents_' + ev.editor.name + ' iframe').eq(0).contents()).append('<link rel="stylesheet" href="' + settings.css + '" type="text/css" >');
            }
          });
        }
        if (typeof Drupal.wysiwyg.plugins[pluginName].invoke == 'function') {
          var pluginCommand = {
            exec: function (editor) {
              var data = { format: 'html', node: null, content: '' };
              var selection = editor.getSelection();
              if (selection) {
                data.node = selection.getSelectedElement();
                if (data.node) {
                  data.node = data.node.$;
                }
                if (selection.getType() == CKEDITOR.SELECTION_TEXT) {
                  if (CKEDITOR.env.ie) {
                    data.content = selection.getNative().createRange().text;
                  }
                  else {
                    data.content = selection.getNative().toString();
                  }
                }
                else if (data.node) {
                  // content is supposed to contain the "outerHTML".
                  data.content = data.node.parentNode.innerHTML;
                }
              }
              Drupal.wysiwyg.plugins[pluginName].invoke(data, pluginSettings, editor.name);
            }
          };
          editor.addCommand(pluginName, pluginCommand);
        }
        editor.ui.addButton(pluginName, {
          label: settings.iconTitle,
          command: pluginName,
          icon: settings.icon
        });

        // @todo Add button state handling.
      }
    });
  },
  prepareContent: function(content) {
    // @todo Don't know if we need this yet.
    return content;
  },
  insert: function(content) {
    content = this.prepareContent(content);
    CKEDITOR.instances[this.field].insertHtml(content);
  }
};

})(jQuery);
;
(function($) {

/**
 * Attach this editor to a target element.
 *
 * @param context
 *   A DOM element, supplied by Drupal.attachBehaviors().
 * @param params
 *   An object containing input format parameters. Default parameters are:
 *   - editor: The internal editor name.
 *   - theme: The name/key of the editor theme/profile to use.
 *   - field: The CSS id of the target element.
 * @param settings
 *   An object containing editor settings for all enabled editor themes.
 */
Drupal.wysiwyg.editor.attach.none = function(context, params, settings) {
  if (params.resizable) {
    var $wrapper = $('#' + params.field).parents('.form-textarea-wrapper:first');
    $wrapper.addClass('resizable');
    if (Drupal.behaviors.textarea.attach) {
      Drupal.behaviors.textarea.attach();
    }
  }
};

/**
 * Detach a single or all editors.
 *
 * @param context
 *   A DOM element, supplied by Drupal.attachBehaviors().
 * @param params
 *   (optional) An object containing input format parameters. If defined,
 *   only the editor instance in params.field should be detached. Otherwise,
 *   all editors should be detached and saved, so they can be submitted in
 *   AJAX/AHAH applications.
 */
Drupal.wysiwyg.editor.detach.none = function(context, params) {
  if (typeof params != 'undefined') {
    var $wrapper = $('#' + params.field).parents('.form-textarea-wrapper:first');
    $wrapper.removeOnce('textarea').removeClass('.resizable-textarea')
      .find('.grippie').remove();
  }
};

/**
 * Instance methods for plain text areas.
 */
Drupal.wysiwyg.editor.instance.none = {
  insert: function(content) {
    var editor = document.getElementById(this.field);

    // IE support.
    if (document.selection) {
      editor.focus();
      var sel = document.selection.createRange();
      sel.text = content;
    }
    // Mozilla/Firefox/Netscape 7+ support.
    else if (editor.selectionStart || editor.selectionStart == '0') {
      var startPos = editor.selectionStart;
      var endPos = editor.selectionEnd;
      editor.value = editor.value.substring(0, startPos) + content + editor.value.substring(endPos, editor.value.length);
    }
    // Fallback, just add to the end of the content.
    else {
      editor.value += content;
    }
  }
};

})(jQuery);
;

(function($) {
//Global container.
window.imce = {tree: {}, findex: [], fids: {}, selected: {}, selcount: 0, ops: {}, cache: {}, urlId: {},
vars: {previewImages: 1, cache: 1},
hooks: {load: [], list: [], navigate: [], cache: []},

//initiate imce.
initiate: function() {
  imce.conf = Drupal.settings.imce || {};
  if (imce.conf.error != false) return;
  imce.FLW = imce.el('file-list-wrapper'), imce.SBW = imce.el('sub-browse-wrapper');
  imce.NW = imce.el('navigation-wrapper'), imce.BW = imce.el('browse-wrapper');
  imce.PW = imce.el('preview-wrapper'), imce.FW = imce.el('forms-wrapper');
  imce.updateUI();
  imce.prepareMsgs();//process initial status messages
  imce.initiateTree();//build directory tree
  imce.hooks.list.unshift(imce.processRow);//set the default list-hook.
  imce.initiateList();//process file list
  imce.initiateOps();//prepare operation tabs
  imce.refreshOps();
  imce.invoke('load', window);//run functions set by external applications.
},

//process navigation tree
initiateTree: function() {
  $('#navigation-tree li').each(function(i) {
    var a = this.firstChild, txt = a.firstChild;
    txt && (txt.data = imce.decode(txt.data));
    var branch = imce.tree[a.title] = {'a': a, li: this, ul: this.lastChild.tagName == 'UL' ? this.lastChild : null};
    if (a.href) imce.dirClickable(branch);
    imce.dirCollapsible(branch);
  });
},

//Add a dir to the tree under parent
dirAdd: function(dir, parent, clickable) {
  if (imce.tree[dir]) return clickable ? imce.dirClickable(imce.tree[dir]) : imce.tree[dir];
  var parent = parent || imce.tree['.'];
  parent.ul = parent.ul ? parent.ul : parent.li.appendChild(imce.newEl('ul'));
  var branch = imce.dirCreate(dir, imce.decode(dir.substr(dir.lastIndexOf('/')+1)), clickable);
  parent.ul.appendChild(branch.li);
  return branch;
},

//create list item for navigation tree
dirCreate: function(dir, text, clickable) {
  if (imce.tree[dir]) return imce.tree[dir];
  var branch = imce.tree[dir] = {li: imce.newEl('li'), a: imce.newEl('a')};
  $(branch.a).addClass('folder').text(text).attr('title', dir).appendTo(branch.li);
  imce.dirCollapsible(branch);
  return clickable ? imce.dirClickable(branch) : branch;
},

//change currently active directory
dirActivate: function(dir) {
  if (dir != imce.conf.dir) {
    if (imce.tree[imce.conf.dir]){
      $(imce.tree[imce.conf.dir].a).removeClass('active');
    }
    $(imce.tree[dir].a).addClass('active');
    imce.conf.dir = dir;
  }
  return imce.tree[imce.conf.dir];
},

//make a dir accessible
dirClickable: function(branch) {
  if (branch.clkbl) return branch;
  $(branch.a).attr('href', '#').removeClass('disabled').click(function() {imce.navigate(this.title); return false;});
  branch.clkbl = true;
  return branch;
},

//sub-directories expand-collapse ability
dirCollapsible: function (branch) {
  if (branch.clpsbl) return branch;
  $(imce.newEl('span')).addClass('expander').html('&nbsp;').click(function() {
    if (branch.ul) {
      $(branch.ul).toggle();
      $(branch.li).toggleClass('expanded');
      $.browser.msie && $('#navigation-header').css('top', imce.NW.scrollTop);
    }
    else if (branch.clkbl){
      $(branch.a).click();
    }
  }).prependTo(branch.li);
  branch.clpsbl = true;
  return branch;
},

//update navigation tree after getting subdirectories.
dirSubdirs: function(dir, subdirs) {
  var branch = imce.tree[dir];
  if (subdirs && subdirs.length) {
    var prefix = dir == '.' ? '' : dir +'/';
    for (var i in subdirs) {//add subdirectories
      imce.dirAdd(prefix + subdirs[i], branch, true);
    }
    $(branch.li).removeClass('leaf').addClass('expanded');
    $(branch.ul).show();
  }
  else if (!branch.ul){//no subdirs->leaf
    $(branch.li).removeClass('expanded').addClass('leaf');
  }
},

//process file list
initiateList: function(cached) {
  var L = imce.hooks.list, dir = imce.conf.dir, token = {'%dir':  dir == '.' ? $(imce.tree['.'].a).text() : imce.decode(dir)}
  imce.findex = [], imce.fids = {}, imce.selected = {}, imce.selcount = 0, imce.vars.lastfid = null;
  imce.tbody = imce.el('file-list').tBodies[0];
  if (imce.tbody.rows.length) {
    for (var row, i = 0; row = imce.tbody.rows[i]; i++) {
      var fid = row.id;
      imce.findex[i] = imce.fids[fid] = row;
      if (cached) {
        if (imce.hasC(row, 'selected')) {
          imce.selected[imce.vars.lastfid = fid] = row;
          imce.selcount++;
        }
      }
      else {
        for (var func, j = 0; func = L[j]; j++) func(row);//invoke list-hook
      }
    }
  }
  if (!imce.conf.perm.browse) {
    imce.setMessage(Drupal.t('File browsing is disabled in directory %dir.', token), 'error');
  }
},

//add a file to the list. (having properties name,size,formatted size,width,height,date,formatted date)
fileAdd: function(file) {
  var row, fid = file.name, i = imce.findex.length, attr = ['name', 'size', 'width', 'height', 'date'];
  if (!(row = imce.fids[fid])) {
    row = imce.findex[i] = imce.fids[fid] = imce.tbody.insertRow(i);
    for (var i in attr) row.insertCell(i).className = attr[i];
  }
  row.cells[0].innerHTML = row.id = fid;
  row.cells[1].innerHTML = file.fsize; row.cells[1].id = file.size;
  row.cells[2].innerHTML = file.width;
  row.cells[3].innerHTML = file.height;
  row.cells[4].innerHTML = file.fdate; row.cells[4].id = file.date;
  imce.invoke('list', row);
  if (imce.vars.prvfid == fid) imce.setPreview(fid);
  if (file.id) imce.urlId[imce.getURL(fid)] = file.id;
},

//remove a file from the list
fileRemove: function(fid) {
  if (!(row = imce.fids[fid])) return;
  imce.fileDeSelect(fid);
  imce.findex.splice(row.rowIndex, 1);
  $(row).remove();
  delete imce.fids[fid];
  if (imce.vars.prvfid == fid) imce.setPreview();
},

//return a file object containing all properties.
fileGet: function (fid) {
  var row = imce.fids[fid];
  var url = imce.getURL(fid);
  return row ? {
    name: imce.decode(fid),
    url: url,
    size: row.cells[1].innerHTML,
    bytes: row.cells[1].id * 1,
    width: row.cells[2].innerHTML * 1,
    height: row.cells[3].innerHTML * 1,
    date: row.cells[4].innerHTML,
    time: row.cells[4].id * 1,
    id: imce.urlId[url] || 0, //file id for newly uploaded files
    relpath: (imce.conf.dir == '.' ? '' : imce.conf.dir +'/') + fid //rawurlencoded path relative to file directory path.
  } : null;
},

//simulate row click. selection-highlighting
fileClick: function(row, ctrl, shft) {
  if (!row) return;
  var fid = typeof(row) == 'string' ? row : row.id;
  if (ctrl || fid == imce.vars.prvfid) {
    imce.fileToggleSelect(fid);
  }
  else if (shft) {
    var last = imce.lastFid();
    var start = last ? imce.fids[last].rowIndex : -1;
    var end = imce.fids[fid].rowIndex;
    var step = start > end ? -1 : 1;
    while (start != end) {
      start += step;
      imce.fileSelect(imce.findex[start].id);
    }
  }
  else {
    for (var fname in imce.selected) {
      imce.fileDeSelect(fname);
    }
    imce.fileSelect(fid);
  }
  //set preview
  imce.setPreview(imce.selcount == 1 ? imce.lastFid() : null);
},

//file select/deselect functions
fileSelect: function (fid) {
  if (imce.selected[fid] || !imce.fids[fid]) return;
  imce.selected[fid] = imce.fids[imce.vars.lastfid=fid];
  $(imce.selected[fid]).addClass('selected');
  imce.selcount++;
},
fileDeSelect: function (fid) {
  if (!imce.selected[fid] || !imce.fids[fid]) return;
  if (imce.vars.lastfid == fid) imce.vars.lastfid = null;
  $(imce.selected[fid]).removeClass('selected');
  delete imce.selected[fid];
  imce.selcount--;
},
fileToggleSelect: function (fid) {
  imce['file'+ (imce.selected[fid] ? 'De' : '') +'Select'](fid);
},

//process file operation form and create operation tabs.
initiateOps: function() {
  imce.setHtmlOps();
  imce.setUploadOp();//upload
  imce.setFileOps();//thumb, delete, resize
},

//process existing html ops.
setHtmlOps: function () {
  $(imce.el('ops-list')).children('li').each(function() {
    if (!this.firstChild) return $(this).remove();
    var name = this.id.substr(8);
    var Op = imce.ops[name] = {div: imce.el('op-content-'+ name), li: imce.el('op-item-'+ name)};
    Op.a = Op.li.firstChild;
    Op.title = Op.a.innerHTML;
    $(Op.a).click(function() {imce.opClick(name); return false;});
  });
},

//convert upload form to an op.
setUploadOp: function () {
  var form = imce.el('imce-upload-form');
  if (!form) return;
  $(form).ajaxForm(imce.uploadSettings()).find('fieldset').each(function() {//clean up fieldsets
    this.removeChild(this.firstChild);
    $(this).after(this.childNodes);
  }).remove();
  imce.opAdd({name: 'upload', title: Drupal.t('Upload'), content: form});//add op
},

//convert fileop form submit buttons to ops.
setFileOps: function () {
  var form = imce.el('imce-fileop-form');
  if (!form) return;
  $(form.elements.filenames).parent().remove();
  $(form).find('fieldset').each(function() {//remove fieldsets
    var $sbmt = $('input:submit', this);
    if (!$sbmt.size()) return;
    var Op = {name: $sbmt.attr('id').substr(5)};
    var func = function() {imce.fopSubmit(Op.name); return false;};
    $sbmt.click(func);
    Op.title = $(this).children('legend').remove().text() || $sbmt.val();
    Op.name == 'delete' ? (Op.func = func) : (Op.content = this.childNodes);
    imce.opAdd(Op);
  }).remove();
  imce.vars.opform = $(form).serialize();//serialize remaining parts.
},

//refresh ops states. enable/disable
refreshOps: function() {
  for (var p in imce.conf.perm) {
    if (imce.conf.perm[p]) imce.opEnable(p);
    else imce.opDisable(p);
  }
},

//add a new file operation
opAdd: function (op) {
  var oplist = imce.el('ops-list'), opcons = imce.el('op-contents');
  var name = op.name || ('op-'+ $(oplist).children('li').size());
  var title = op.title || 'Untitled';
  var Op = imce.ops[name] = {title: title};
  if (op.content) {
    Op.div = imce.newEl('div');
    $(Op.div).attr({id: 'op-content-'+ name, 'class': 'op-content'}).appendTo(opcons).append(op.content);
  }
  Op.a = imce.newEl('a');
  Op.li = imce.newEl('li');
  $(Op.a).attr({href: '#', name: name, title: title}).html('<span>' + title +'</span>').click(imce.opClickEvent);
  $(Op.li).attr('id', 'op-item-'+ name).append(Op.a).appendTo(oplist);
  Op.func = op.func || imce.opVoid;
  return Op;
},

//click event for file operations
opClickEvent: function(e) {
  imce.opClick(this.name);
  return false;
},

//void operation function
opVoid: function() {},

//perform op click
opClick: function(name) {
  var Op = imce.ops[name], oldop = imce.vars.op;
  if (!Op || Op.disabled) {
    return imce.setMessage(Drupal.t('You can not perform this operation.'), 'error');
  }
  if (Op.div) {
    if (oldop) {
      var toggle = oldop == name;
      imce.opShrink(oldop, toggle ? 'fadeOut' : 'hide');
      if (toggle) return false;
    }
    var left = Op.li.offsetLeft;
    var $opcon = $('#op-contents').css({left: 0});
    $(Op.div).fadeIn('normal', function() {
      setTimeout(function() {
        if (imce.vars.op) {
          var $inputs = $('input', imce.ops[imce.vars.op].div);
          $inputs.eq(0).focus();
          //form inputs become invisible in IE. Solution is as stupid as the behavior.
          $('html').is('.ie') && $inputs.addClass('dummyie').removeClass('dummyie');
       }
      });
    });
    var diff = left + $opcon.width() - $('#imce-content').width();
    $opcon.css({left: diff > 0 ? left - diff - 1 : left});
    $(Op.li).addClass('active');
    $(imce.opCloseLink).fadeIn(300);
    imce.vars.op = name;
  }
  Op.func(true);
  return true;
},

//enable a file operation
opEnable: function(name) {
  var Op = imce.ops[name];
  if (Op && Op.disabled) {
    Op.disabled = false;
    $(Op.li).show();
  }
},

//disable a file operation
opDisable: function(name) {
  var Op = imce.ops[name];
  if (Op && !Op.disabled) {
    Op.div && imce.opShrink(name);
    $(Op.li).hide();
    Op.disabled = true;
  }
},

//hide contents of a file operation
opShrink: function(name, effect) {
  if (imce.vars.op != name) return;
  var Op = imce.ops[name];
  $(Op.div).stop(true, true)[effect || 'hide']();
  $(Op.li).removeClass('active');
  $(imce.opCloseLink).hide();
  Op.func(false);
  imce.vars.op = null;
},

//navigate to dir
navigate: function(dir) {
  if (imce.vars.navbusy || (dir == imce.conf.dir && !confirm(Drupal.t('Do you want to refresh the current directory?')))) return;
  var cache = imce.vars.cache && dir != imce.conf.dir;
  var set = imce.navSet(dir, cache);
  if (cache && imce.cache[dir]) {//load from the cache
    set.success({data: imce.cache[dir]});
    set.complete();
  }
  else $.ajax(set);//live load
},
//ajax navigation settings
navSet: function (dir, cache) {
  $(imce.tree[dir].li).addClass('loading');
  imce.vars.navbusy = dir;
  return {url: imce.ajaxURL('navigate', dir),
  type: 'GET',
  dataType: 'json',
  success: function(response) {
    if (response.data && !response.data.error) {
      if (cache) imce.navCache(imce.conf.dir, dir);//cache the current dir
      imce.navUpdate(response.data, dir);
    }
    imce.processResponse(response);
  },
  complete: function () {
    $(imce.tree[dir].li).removeClass('loading');
    imce.vars.navbusy = null;
  }
  };
},

//update directory using the given data
navUpdate: function(data, dir) {
  var cached = data == imce.cache[dir], olddir = imce.conf.dir;
  if (cached) data.files.id = 'file-list';
  $(imce.FLW).html(data.files);
  imce.dirActivate(dir);
  imce.dirSubdirs(dir, data.subdirectories);
  $.extend(imce.conf.perm, data.perm);
  imce.refreshOps();
  imce.initiateList(cached);
  imce.setPreview(imce.selcount == 1 ? imce.lastFid() : null);
  imce.SBW.scrollTop = 0;
  imce.invoke('navigate', data, olddir, cached);
},

//set cache
navCache: function (dir, newdir) {
  var C = imce.cache[dir] = {'dir': dir, files: imce.el('file-list'), dirsize: imce.el('dir-size').innerHTML, perm: $.extend({}, imce.conf.perm)};
  C.files.id = 'cached-list-'+ dir;
  imce.FW.appendChild(C.files);
  imce.invoke('cache', C, newdir);
},

//validate upload form
uploadValidate: function (data, form, options) {
  var path = data[0].value;
  if (!path) return false;
  if (imce.conf.extensions != '*') {
    var ext = path.substr(path.lastIndexOf('.') + 1);
    if ((' '+ imce.conf.extensions +' ').indexOf(' '+ ext.toLowerCase() +' ') == -1) {
      return imce.setMessage(Drupal.t('Only files with the following extensions are allowed: %files-allowed.', {'%files-allowed': imce.conf.extensions}), 'error');
    }
  }
  var sep = path.indexOf('/') == -1 ? '\\' : '/';
  options.url = imce.ajaxURL('upload');//make url contain current dir.
  imce.fopLoading('upload', true);
  return true;
},

//settings for upload
uploadSettings: function () {
  return {beforeSubmit: imce.uploadValidate, success: function (response) {imce.processResponse($.parseJSON(response));}, complete: function () {imce.fopLoading('upload', false);}, resetForm: true};
},

//validate default ops(delete, thumb, resize)
fopValidate: function(fop) {
  if (!imce.validateSelCount(1, imce.conf.filenum)) return false;
  switch (fop) {
    case 'delete':
      return confirm(Drupal.t('Delete selected files?'));
    case 'thumb':
      if (!$('input:checked', imce.ops['thumb'].div).size()) {
        return imce.setMessage(Drupal.t('Please select a thumbnail.'), 'error');
      }
      return imce.validateImage();
    case 'resize':
      var w = imce.el('edit-width').value, h = imce.el('edit-height').value;
      var maxDim = imce.conf.dimensions.split('x');
      var maxW = maxDim[0]*1, maxH = maxW ? maxDim[1]*1 : 0;
      if (!(/^[1-9][0-9]*$/).test(w) || !(/^[1-9][0-9]*$/).test(h) || (maxW && (maxW < w*1 || maxH < h*1))) {
        return imce.setMessage(Drupal.t('Please specify dimensions within the allowed range that is from 1x1 to @dimensions.', {'@dimensions': maxW ? imce.conf.dimensions : Drupal.t('unlimited')}), 'error');
      }
      return imce.validateImage();
  }

  var func = fop +'OpValidate';
  if (imce[func]) return imce[func](fop);
  return true;
},

//submit wrapper for default ops
fopSubmit: function(fop) {
  switch (fop) {
    case 'thumb': case 'delete': case 'resize':  return imce.commonSubmit(fop);
  }
  var func = fop +'OpSubmit';
  if (imce[func]) return imce[func](fop);
},

//common submit function shared by default ops
commonSubmit: function(fop) {
  if (!imce.fopValidate(fop)) return false;
  imce.fopLoading(fop, true);
  $.ajax(imce.fopSettings(fop));
},

//settings for default file operations
fopSettings: function (fop) {
  return {url: imce.ajaxURL(fop), type: 'POST', dataType: 'json', success: imce.processResponse, complete: function (response) {imce.fopLoading(fop, false);}, data: imce.vars.opform +'&filenames='+ imce.serialNames() +'&jsop='+ fop + (imce.ops[fop].div ? '&'+ $('input, select, textarea', imce.ops[fop].div).serialize() : '')};
},

//toggle loading state
fopLoading: function(fop, state) {
  var el = imce.el('edit-'+ fop), func = state ? 'addClass' : 'removeClass'
  if (el) {
    $(el)[func]('loading').attr('disabled', state);
  }
  else {
    $(imce.ops[fop].li)[func]('loading');
    imce.ops[fop].disabled = state;
  }
},

//preview a file.
setPreview: function (fid) {
  var row, html = '';
  imce.vars.prvfid = fid;
  if (fid && (row = imce.fids[fid])) {
    var width = row.cells[2].innerHTML * 1;
    html = imce.vars.previewImages && width ? imce.imgHtml(fid, width, row.cells[3].innerHTML) : imce.decodePlain(fid);
    html = '<a href="#" onclick="imce.send(\''+ fid +'\'); return false;" title="'+ (imce.vars.prvtitle||'') +'">'+ html +'</a>';
  }
  imce.el('file-preview').innerHTML = html;
},

//default file send function. sends the file to the new window.
send: function (fid) {
  fid && window.open(imce.getURL(fid));
},

//add an operation for an external application to which the files are send.
setSendTo: function (title, func) {
  imce.send = function (fid) { fid && func(imce.fileGet(fid), window);};
  var opFunc = function () {
    if (imce.selcount != 1) return imce.setMessage(Drupal.t('Please select a file.'), 'error');
    imce.send(imce.vars.prvfid);
  };
  imce.vars.prvtitle = title;
  return imce.opAdd({name: 'sendto', title: title, func: opFunc});
},

//move initial page messages into log
prepareMsgs: function () {
  var msgs;
  if (msgs = imce.el('imce-messages')) {
    $('>div', msgs).each(function (){
      var type = this.className.split(' ')[1];
      var li = $('>ul li', this);
      if (li.size()) li.each(function () {imce.setMessage(this.innerHTML, type);});
      else imce.setMessage(this.innerHTML, type);
    });
    $(msgs).remove();
  }
},

//insert log message
setMessage: function (msg, type) {
  var $box = $(imce.msgBox);
  var logs = imce.el('log-messages') || $(imce.newEl('div')).appendTo('#help-box-content').before('<h4>'+ Drupal.t('Log messages') +':</h4>').attr('id', 'log-messages')[0];
  var msg = '<div class="message '+ (type || 'status') +'">'+ msg +'</div>';
  $box.queue(function() {
    $box.css({opacity: 0, display: 'block'}).html(msg);
    $box.dequeue();
  });
  var q = $box.queue().length, t = imce.vars.msgT || 1000;
  q = q < 2 ? 1 : q < 3 ? 0.8 : q < 4 ? 0.7 : 0.4;//adjust speed with respect to queue length
  $box.fadeTo(600 * q, 1).fadeTo(t * q, 1).fadeOut(400 * q);
  $(logs).append(msg);
  return false;
},

//invoke hooks
invoke: function (hook) {
  var i, args, func, funcs;
  if ((funcs = imce.hooks[hook]) && funcs.length) {
    (args = $.makeArray(arguments)).shift();
    for (i = 0; func = funcs[i]; i++) func.apply(this, args);
  }
},

//process response
processResponse: function (response) {
  if (response.data) imce.resData(response.data);
  if (response.messages) imce.resMsgs(response.messages);
},

//process response data
resData: function (data) {
  var i, added, removed;
  if (added = data.added) {
    var cnt = imce.findex.length;
    for (i in added) {//add new files or update existing
      imce.fileAdd(added[i]);
    }
    if (added.length == 1) {//if it is a single file operation
      imce.highlight(added[0].name);//highlight
    }
    if (imce.findex.length != cnt) {//if new files added, scroll to bottom.
      $(imce.SBW).animate({scrollTop: imce.SBW.scrollHeight}).focus();
    }
  }
  if (removed = data.removed) for (i in removed) {
    imce.fileRemove(removed[i]);
  }
  imce.conf.dirsize = data.dirsize;
  imce.updateStat();
},

//set response messages
resMsgs: function (msgs) {
  for (var type in msgs) for (var i in msgs[type]) {
    imce.setMessage(msgs[type][i], type);
  }
},

//return img markup
imgHtml: function (fid, width, height) {
  return '<img src="'+ imce.getURL(fid) +'" width="'+ width +'" height="'+ height +'" alt="'+ imce.decodePlain(fid) +'">';
},

//check if the file is an image
isImage: function (fid) {
  return imce.fids[fid].cells[2].innerHTML * 1;
},

//find the first non-image in the selection
getNonImage: function (selected) {
  for (var fid in selected) {
    if (!imce.isImage(fid)) return fid;
  }
  return false;
},

//validate current selection for images
validateImage: function () {
  var nonImg = imce.getNonImage(imce.selected);
  return nonImg ? imce.setMessage(Drupal.t('%filename is not an image.', {'%filename': imce.decode(nonImg)}), 'error') : true;
},

//validate number of selected files
validateSelCount: function (Min, Max) {
  if (Min && imce.selcount < Min) {
    return imce.setMessage(Min == 1 ? Drupal.t('Please select a file.') : Drupal.t('You must select at least %num files.', {'%num': Min}), 'error');
  }
  if (Max && Max < imce.selcount) {
    return imce.setMessage(Drupal.t('You are not allowed to operate on more than %num files.', {'%num': Max}), 'error');
  }
  return true;
},

//update file count and dir size
updateStat: function () {
  imce.el('file-count').innerHTML = imce.findex.length;
  imce.el('dir-size').innerHTML = imce.conf.dirsize;
},

//serialize selected files. return fids with a colon between them
serialNames: function () {
  var str = '';
  for (var fid in imce.selected) {
    str += ':'+ fid;
  }
  return str.substr(1);
},

//get file url. re-encode & and # for mod rewrite
getURL: function (fid) {
  var path = (imce.conf.dir == '.' ? '' : imce.conf.dir +'/') + fid;
  return imce.conf.furl + (imce.conf.modfix ? path.replace(/%(23|26)/g, '%25$1') : path);
},

//el. by id
el: function (id) {
  return document.getElementById(id);
},

//find the latest selected fid
lastFid: function () {
  if (imce.vars.lastfid) return imce.vars.lastfid;
  for (var fid in imce.selected);
  return fid;
},

//create ajax url
ajaxURL: function (op, dir) {
  return imce.conf.url + (imce.conf.clean ? '?' :'&') +'jsop='+ op +'&dir='+ (dir||imce.conf.dir);
},

//fast class check
hasC: function (el, name) {
  return el.className && (' '+ el.className +' ').indexOf(' '+ name +' ') != -1;
},

//highlight a single file
highlight: function (fid) {
  if (imce.vars.prvfid) imce.fileClick(imce.vars.prvfid);
  imce.fileClick(fid);
},

//process a row
processRow: function (row) {
  row.cells[0].innerHTML = '<span>' + imce.decodePlain(row.id) + '</span>';
  row.onmousedown = function(e) {
    var e = e||window.event;
    imce.fileClick(this, e.ctrlKey, e.shiftKey);
    return !(e.ctrlKey || e.shiftKey);
  };
  row.ondblclick = function(e) {
    imce.send(this.id);
    return false;
  };
},

//decode urls. uses unescape. can be overridden to use decodeURIComponent
decode: function (str) {
  return unescape(str);
},

//decode and convert to plain text
decodePlain: function (str) {
  return Drupal.checkPlain(imce.decode(str));
},

//global ajax error function
ajaxError: function (e, response, settings, thrown) {
  imce.setMessage(Drupal.ajaxError(response, settings.url).replace(/\n/g, '<br />'), 'error');
},

//convert button elements to standard input buttons
convertButtons: function(form) {
  $('button:submit', form).each(function(){
    $(this).replaceWith('<input type="submit" value="'+ $(this).text() +'" name="'+ this.name +'" class="form-submit" id="'+ this.id +'" />');
  });
},

//create element
newEl: function(name) {
  return document.createElement(name);
},

//scroll syncronization for section headers
syncScroll: function(scrlEl, fixEl, bottom) {
  var $fixEl = $(fixEl);
  var prop = bottom ? 'bottom' : 'top';
  var factor = bottom ? -1 : 1;
  var syncScrl = function(el) {
    $fixEl.css(prop, factor * el.scrollTop);
  }
  $(scrlEl).scroll(function() {
    var el = this;
    syncScrl(el);
    setTimeout(function() {
      syncScrl(el);
    });
  });
},

//get UI ready. provide backward compatibility.
updateUI: function() {
  //file urls.
  var furl = imce.conf.furl, isabs = furl.indexOf('://') > -1;
  var absurls = imce.conf.absurls = imce.vars.absurls || imce.conf.absurls;
  var host = location.host;
  var baseurl = location.protocol + '//' + host;
  if (furl.charAt(furl.length - 1) != '/') {
    furl = imce.conf.furl = furl + '/';
  }
  imce.conf.modfix = imce.conf.clean && furl.indexOf(host + '/system/') > -1;
  if (absurls && !isabs) {
    imce.conf.furl = baseurl + furl;
  }
  else if (!absurls && isabs && furl.indexOf(baseurl) == 0) {
    imce.conf.furl = furl.substr(baseurl.length);
  }
  //convert button elements to input elements.
  imce.convertButtons(imce.FW);
  //ops-list
  $('#ops-list').removeClass('tabs secondary').addClass('clear-block clearfix');
  imce.opCloseLink = $(imce.newEl('a')).attr({id: 'op-close-link', href: '#', title: Drupal.t('Close')}).click(function() {
    imce.vars.op && imce.opClick(imce.vars.op);
    return false;
  }).appendTo('#op-contents')[0];
  //navigation-header
  if (!$('#navigation-header').size()) {
    $(imce.NW).children('.navigation-text').attr('id', 'navigation-header').wrapInner('<span></span>');
  }
  //log
  $('#log-prv-wrapper').before($('#log-prv-wrapper > #preview-wrapper')).remove();
  $('#log-clearer').remove();
  //content resizer
  $('#content-resizer').remove();
  //message-box
  imce.msgBox = imce.el('message-box') || $(imce.newEl('div')).attr('id', 'message-box').prependTo('#imce-content')[0];
  //create help tab
  var $hbox = $('#help-box');
  $hbox.is('a') && $hbox.replaceWith($(imce.newEl('div')).attr('id', 'help-box').append($hbox.children()));
  imce.hooks.load.push(function() {
    imce.opAdd({name: 'help', title: $('#help-box-title').remove().text(), content: $('#help-box').show()});
  });
  //add ie classes
  $.browser.msie && $('html').addClass('ie') && parseFloat($.browser.version) < 8 && $('html').addClass('ie-7');
  // enable box view for file list
  imce.vars.boxW && imce.boxView();
  //scrolling file list
  imce.syncScroll(imce.SBW, '#file-header-wrapper');
  imce.syncScroll(imce.SBW, '#dir-stat', true);
  //scrolling directory tree
  imce.syncScroll(imce.NW, '#navigation-header');
}

};

//initiate
$(document).ready(imce.initiate).ajaxError(imce.ajaxError);

})(jQuery);;
/*
 * IMCE Integration by URL
 * Ex-1: http://example.com/imce?app=XEditor|url@urlFieldId|width@widthFieldId|height@heightFieldId
 * Creates "Insert file" operation tab, which fills the specified fields with url, width, height properties
 * of the selected file in the parent window
 * Ex-2: http://example.com/imce?app=XEditor|sendto@functionName
 * "Insert file" operation calls parent window's functionName(file, imceWindow)
 * Ex-3: http://example.com/imce?app=XEditor|imceload@functionName
 * Parent window's functionName(imceWindow) is called as soon as IMCE UI is ready. Send to operation
 * needs to be set manually. See imce.setSendTo() method in imce.js
 */

(function($) {

var appFields = {}, appWindow = (top.appiFrm||window).opener || parent;

// Execute when imce loads.
imce.hooks.load.push(function(win) {
  var index = location.href.lastIndexOf('app=');
  if (index == -1) return;
  var data = decodeURIComponent(location.href.substr(index + 4)).split('|');
  var arr, prop, str, func, appName = data.shift();
  // Extract fields
  for (var i = 0, len = data.length; i < len; i++) {
    str = data[i];
    if (!str.length) continue;
    if (str.indexOf('&') != -1) str = str.split('&')[0];
    arr = str.split('@');
    if (arr.length > 1) {
      prop = arr.shift();
      appFields[prop] = arr.join('@');
    }
  }
  // Run custom onload function if available
  if (appFields.imceload && (func = isFunc(appFields.imceload))) {
    func(win);
    delete appFields.imceload;
  }
  // Set custom sendto function. appFinish is the default.
  var sendtoFunc = appFields.url ? appFinish : false;
  //check sendto@funcName syntax in URL
  if (appFields.sendto && (func = isFunc(appFields.sendto))) {
    sendtoFunc = func;
    delete appFields.sendto;
  }
  // Check old method windowname+ImceFinish.
  else if (win.name && (func = isFunc(win.name +'ImceFinish'))) {
    sendtoFunc = func;
  }
  // Highlight file
  if (appFields.url) {
    // Support multiple url fields url@field1,field2..
    if (appFields.url.indexOf(',') > -1) {
      var arr = appFields.url.split(',');
      for (var i in arr) {
        if ($('#'+ arr[i], appWindow.document).size()) {
          appFields.url = arr[i];
          break;
        }
      }
    }
    var filename = $('#'+ appFields.url, appWindow.document).val() || '';
    imce.highlight(filename.substr(filename.lastIndexOf('/')+1));
  }
  // Set send to
  sendtoFunc && imce.setSendTo(Drupal.t('Insert file'), sendtoFunc);
});

// Default sendTo function
var appFinish = function(file, win) {
  var $doc = $(appWindow.document);
  for (var i in appFields) {
    $doc.find('#'+ appFields[i]).val(file[i]);
  }
  if (appFields.url) {
    try{
      $doc.find('#'+ appFields.url).blur().change().focus();
    }catch(e){
      try{
        $doc.find('#'+ appFields.url).trigger('onblur').trigger('onchange').trigger('onfocus');//inline events for IE
      }catch(e){}
    }
  }
  appWindow.focus();
  win.close();
};

// Checks if a string is a function name in the given scope.
// Returns function reference. Supports x.y.z notation.
var isFunc = function(str, scope) {
  var obj = scope || appWindow;
  var parts = str.split('.'), len = parts.length;
  for (var i = 0; i < len && (obj = obj[parts[i]]); i++);
  return obj && i == len && (typeof obj == 'function' || typeof obj != 'string' && !obj.nodeName && obj.constructor != Array && /^[\s[]?function/.test(obj.toString())) ? obj : false;
}

})(jQuery);;

/**
 * Wysiwyg API integration helper function.
 */
function imceImageBrowser(field_name, url, type, win) {
  // TinyMCE.
  if (win !== 'undefined') {
    win.open(Drupal.settings.imce.url + encodeURIComponent(field_name), '', 'width=760,height=560,resizable=1');
  }
}

/**
 * CKeditor integration.
 */
var imceCkeditSendTo = function (file, win) {
  var parts = /\?(?:.*&)?CKEditorFuncNum=(\d+)(?:&|$)/.exec(win.location.href);
  if (parts && parts.length > 1) {
    CKEDITOR.tools.callFunction(parts[1], file.url);
    win.close();
  }
  else {
    throw 'CKEditorFuncNum parameter not found or invalid: ' + win.location.href;
  }
};
;
(function ($) {

/**
 * Automatically display the guidelines of the selected text format.
 */
Drupal.behaviors.filterGuidelines = {
  attach: function (context) {
    $('.filter-guidelines', context).once('filter-guidelines')
      .find(':header').hide()
      .parents('.filter-wrapper').find('select.filter-list')
      .bind('change', function () {
        $(this).parents('.filter-wrapper')
          .find('.filter-guidelines-item').hide()
          .siblings('.filter-guidelines-' + this.value).show();
      })
      .change();
  }
};

})(jQuery);
;
