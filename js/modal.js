var Modal = function() {
    if (!$(".popup").length) {
        var popup = [
            '<div class="popup" data-popup="popup-1">',
            '    <div class="popup-inner">',
            '        <div class="popup-scroll">',
            '          <h2 class="popup-title"></h2>',
            '          <p class="popup-content"></p>',
            '        </div>',
            '        <p><a data-popup-close="popup-1" href="#">Close</a></p>',
            '        <a class="popup-close" data-popup-close="popup-1" href="#">x</a>',
            '    </div>',
            '</div>'
        ].join('');
        $("body").append(popup);
    }
    this.popup = $(".popup");
    this.title = $(".popup-title");
    this.content = $(".popup-content");
    var closeScript = "$('[data-popup-close]').on('click', function(e){$('.popup').fadeOut(350); e.preventDefault();});";
    run_script(closeScript);
};

// show modal dialog
Modal.prototype.show = function(title, content) {
    this.title.html(title);
    this.content.html(content);
    this.popup.fadeIn(350);
};