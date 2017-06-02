var Modal = function() {
  if (!$(".appodeal_popup").length) {
    var popup = [
      '<div class="appodeal_popup" data-popup="appodeal_popup-1">',
      '    <div class="appodeal_popup-inner">',
      '        <div class="appodeal_popup-scroll">',
      '          <h2 class="appodeal_popup-title"></h2>',
      '          <p class="appodeal_popup-content"></p>',
      '        </div>',
      '        <p><a data-popup-close="appodeal_popup-1" href="#">Close</a></p>',
      '        <a class="appodeal_popup-close" data-popup-close="appodeal_popup-1" href="#">x</a>',
      '    </div>',
      '</div>'
    ].join('');
    $("body").append(popup);
  }
  this.popup = $(".appodeal_popup");
  this.title = $(".appodeal_popup-title");
  this.content = $(".appodeal_popup-content");
  var closeScript = "$('[data-popup-close]').on('click', function(e){$('.appodeal_popup').fadeOut(350); e.preventDefault();});";
  run_script(closeScript);
};

// show modal dialog
Modal.prototype.show = function(title, content) {
  this.title.html(title);
  this.content.html(content);
  this.popup.fadeIn(350);
};
