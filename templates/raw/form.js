'use strict';

// Read changes and inject into form
$('#display-html').val(display['html']);
$('#display-js').val(display['js']);

// Write changes to return-json data store
$('#display-html, #display-js').on('change', ()=>{
  $('#selected-display-form').data('return-json', {
    html: $('#display-html').val(),
    js: $('#display-js').val()
  });
}).first().trigger('change');
