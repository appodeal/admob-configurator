var Modal = function() {
  if (jQuery(".popup").length) {
  } else {
    var popup = [
    '<div class="popup" data-popup="popup-1">',
    '    <div class="popup-inner">',
    '        <h2>Wow! This is Awesome! (Popup #1)</h2>',
    '        <p>Donec in volutpat nisi. In quam lectus, aliquet rhoncus cursus a, congue et arcu. Vestibulum tincidunt neque id nisi pulvinar aliquam. Nulla luctus luctus ipsum at ultricies. Nullam nec velit dui. Nullam sem eros, pulvinar sed pellentesque ac, feugiat et turpis. Donec gravida ipsum cursus massa malesuada tincidunt. Nullam finibus nunc mauris, quis semper neque ultrices in. Ut ac risus eget eros imperdiet posuere nec eu lectus.</p>',
    '        <p><a data-popup-close="popup-1" href="#">Close</a></p>',
    '        <a class="popup-close" data-popup-close="popup-1" href="#">x</a>',
    '    </div>',
    '</div>'
    ].join('');
  }
}

// show modal dialog
Modal.prototype.show = function() {

}